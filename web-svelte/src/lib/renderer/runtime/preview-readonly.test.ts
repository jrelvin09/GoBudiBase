import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import * as resources from '$lib/api/resources';
import { isMutationBlocked, setReadOnlyApi } from '$lib/api/client';
import type { ResourceMeta } from '$lib/api/resource-types';
import { setLocale } from '$lib/i18n/index.svelte';
import { readOnlyPreviewMeta } from './builder';
import PageRuntime from './PageRuntime.svelte';

// `$app/state` hanya ada di konteks request SvelteKit.
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/builder-preview/sales.customer'), params: {} }
}));

const meta: ResourceMeta = {
	id: 'sales.customer',
	label: 'Customer',
	plural: 'Customers',
	nav_order: 10,
	title_field: 'name',
	list_view: 'grid',
	form_mode: 'drawer',
	fields: [],
	actions: [{ name: 'block', label: 'Block', row: true, bulk: true, confirm: true, danger: true, form: [] }] as never,
	capabilities: { view: true, create: true, update: true, delete: true, export: true, import: true, publish_report: true }
};

const listPage = {
	id: 'sales.customer',
	title: 'Customers',
	regions: [{ id: 'list', type: 'resource-list', resourceId: 'sales.customer' }]
};

beforeEach(() => setLocale('en'));
afterEach(() => {
	setReadOnlyApi(false);
	vi.unstubAllGlobals();
});

describe('readOnlyPreviewMeta (M8-05)', () => {
	it('hanya menyisakan izin lihat, tanpa aksi, dan tampilan report/page', () => {
		const ro = readOnlyPreviewMeta(meta);
		expect(ro.capabilities).toEqual({ view: true, read_only: true });
		expect(ro.actions).toBeUndefined();
		expect(ro.list_view).toBe('report');
		expect(ro.form_mode).toBe('page');
		expect(ro.id).toBe(meta.id);
		expect(meta.capabilities.create).toBe(true); // input tidak diubah
	});

	it('tanpa izin lihat tetap tanpa izin lihat', () => {
		expect(readOnlyPreviewMeta({ ...meta, capabilities: { create: true } }).capabilities).toEqual({ view: false, read_only: true });
	});
});

describe('akses konten dan retry', () => {
	it('konten list tampil dan tidak ada tombol Create/aksi mutasi dengan meta baca-saja', () => {
		const { body } = render(PageRuntime, { props: { page: listPage, meta: readOnlyPreviewMeta(meta), status: 'ready' } });
		expect(body).toContain('Customers');
		expect(body).not.toMatch(/>\s*Create\s*</);
		expect(body).not.toContain('Block');
		// pembanding: meta penuh menampilkan Create
		const full = render(PageRuntime, { props: { page: listPage, meta: { ...meta, list_view: 'report' }, status: 'ready' } }).body;
		expect(full).toMatch(/>\s*Create\s*</);
	});

	it('konten tidak disembunyikan dari pembaca layar dan tombol retry aktif saat metadata gagal', () => {
		const { body } = render(PageRuntime, { props: { page: listPage, meta: undefined, status: 'error', onretry: () => {} } });
		const dom = new JSDOM(`<!DOCTYPE html><body><main>${body}</main></body>`);
		const doc = dom.window.document;
		expect(doc.querySelector('[role="alert"]')).not.toBeNull();
		const retry = [...doc.querySelectorAll('button')].find((b) => /reload/i.test(b.textContent ?? ''));
		expect(retry).toBeTruthy();
		expect(retry?.hasAttribute('disabled')).toBe(false);
		expect(doc.querySelector('[inert], [aria-hidden="true"]')).toBeNull();
	});

	it('route preview tidak memakai inert atau aria-hidden, memasang guard API, dan memberi retry', () => {
		const source = readFileSync(
			fileURLToPath(new URL('../../../routes/(app)/builder-preview/[resource]/+page.svelte', import.meta.url)),
			'utf8'
		);
		expect(source).not.toMatch(/<[a-z]+[^>]*\binert\b/);
		expect(source).not.toContain('aria-hidden');
		expect(source).toContain('setReadOnlyApi(true)');
		expect(source).toContain('readOnlyPreviewMeta');
		expect(source).toContain('onretry');
	});
});

describe('tidak ada request mutasi selama mode baca-saja', () => {
	const ctx = { companyId: 'c', locationId: null, contextVersion: 1 };

	it('isMutationBlocked: GET dan POST baca lolos, sisanya diblokir', () => {
		setReadOnlyApi(true);
		expect(isMutationBlocked('GET', '/r/sales.customer')).toBe(false);
		for (const read of ['_query', '_groupby', '_pivot', '_distinct']) {
			expect(isMutationBlocked('POST', `/r/sales.customer/${read}`)).toBe(false);
		}
		for (const [method, path] of [
			['POST', '/r/sales.customer'],
			['PATCH', '/r/sales.customer/1'],
			['DELETE', '/r/sales.customer/1'],
			['POST', '/r/sales.customer/_batch'],
			['POST', '/r/sales.customer/1/actions/block'],
			['POST', '/r/sales.customer/_query/../x']
		]) {
			expect(isMutationBlocked(method, path), `${method} ${path}`).toBe(true);
		}
		setReadOnlyApi(false);
		expect(isMutationBlocked('POST', '/r/sales.customer')).toBe(false);
	});

	it('fungsi API mutasi ditolak sebelum fetch, query baca tetap terkirim', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { rows: [], total: '0' } }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		setReadOnlyApi(true);
		await expect(resources.createRecord(ctx, 'sales.customer', { name: 'x' }, 'csrf')).rejects.toMatchObject({ code: 'PREVIEW_READ_ONLY' });
		await expect(resources.updateRecord(ctx, 'sales.customer', 'id', 1, { name: 'x' }, 'csrf')).rejects.toMatchObject({ code: 'PREVIEW_READ_ONLY' });
		await expect(resources.deleteRecord(ctx, 'sales.customer', 'id', 1, 'csrf')).rejects.toMatchObject({ code: 'PREVIEW_READ_ONLY' });
		expect(fetchMock).not.toHaveBeenCalled();

		await resources.queryReport(ctx, 'sales.customer', { columns: [], filters: [], sort: [] } as never, 1, 'csrf').catch(() => undefined);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toContain('/_query');
		expect(init.method).toBe('POST');
	});
});
