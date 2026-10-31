import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { ResourceMeta } from '$lib/api/resource-types';
import { setLocale } from '$lib/i18n/index.svelte';
import type { RegionDefinition } from './page-definition';
import PageRuntime from './PageRuntime.svelte';
import RegionRuntime from './RegionRuntime.svelte';

// `$app/state` hanya punya nilai di dalam konteks request SvelteKit; render
// murni di tes ini tidak punya konteks itu, jadi URL halaman diganti.
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/r/sales.customer'), params: {} }
}));

beforeEach(() => setLocale('en'));

const meta: ResourceMeta = {
	id: 'sales.customer',
	label: 'Customer',
	plural: 'Customers',
	nav_order: 10,
	title_field: 'name',
	list_view: 'report',
	form_mode: 'page',
	fields: [],
	capabilities: { view: true }
};

const page = {
	id: 'sales.customer',
	title: 'Customers',
	regions: [{ id: 'customer-list', type: 'resource-list', resourceId: 'sales.customer' }]
};

describe('PageRuntime', () => {
	it('merender region valid dengan ResourceListPage yang ada', () => {
		const { body } = render(PageRuntime, { props: { page, meta, status: 'ready' } });
		// Judul H1 tetap milik ResourceListPage (tanpa judul dobel dari runtime).
		expect(body).toContain('Customers');
		expect(body).toContain('aria-label="Breadcrumb"');
	});

	it('menampilkan error yang bisa dibedakan untuk page tidak valid', () => {
		const { body } = render(PageRuntime, {
			props: { page: { id: 'x', title: '', regions: [] }, meta, status: 'ready' }
		});
		expect(body).toContain('The runtime page is not valid.');
		expect(body).toContain('page: The page title is required.');
		expect(body).not.toContain('Customers');
	});

	it('menampilkan loading, tidak ditemukan, dan gagal sebagai tiga keadaan berbeda', () => {
		const loading = render(PageRuntime, { props: { page, meta: undefined, status: 'loading' } });
		expect(loading.body).toContain('Loading…');

		const missing = render(PageRuntime, { props: { page, meta: undefined, status: 'ready' } });
		expect(missing.body).toContain('The requested record was not found.');
		expect(missing.body).not.toContain('Loading…');

		// MR-R01: kegagalan metadata tidak boleh tampil sebagai loading.
		const failed = render(PageRuntime, {
			props: { page, meta: undefined, status: 'error', onretry: () => {} }
		});
		expect(failed.body).toContain('The request failed.');
		expect(failed.body).toContain('Reload');
		expect(failed.body).not.toContain('Loading…');
		expect(failed.body).not.toContain('The requested record was not found.');
	});

	it('memberi tombol coba ulang hanya bila retry tersedia', () => {
		const withRetry = render(PageRuntime, { props: { page, meta: undefined, status: 'error', onretry: () => {} } });
		expect(withRetry.body).toContain('Reload');

		const withoutRetry = render(PageRuntime, { props: { page, meta: undefined, status: 'error' } });
		expect(withoutRetry.body).toContain('The request failed.');
		expect(withoutRetry.body).not.toContain('Reload');
	});

	it('tidak memakai metadata resource lain', () => {
		const { body } = render(PageRuntime, {
			props: { page, meta: { ...meta, id: 'sales.order', plural: 'Orders' }, status: 'ready' }
		});
		expect(body).toContain('The requested record was not found.');
		expect(body).not.toContain('Orders');
	});
});

describe('RegionRuntime', () => {
	const region: RegionDefinition = {
		id: 'customer-list',
		type: 'resource-list',
		resourceId: 'sales.customer'
	};

	it('menampilkan pesan sendiri untuk key yang tidak ada di registry', () => {
		const unknown = { ...region, type: 'chart-widget' } as unknown as RegionDefinition;
		const { body } = render(RegionRuntime, { props: { region: unknown, meta, phase: 'unknown_region' } });
		expect(body).toContain('Unknown runtime region.');
		expect(body).not.toContain('Customers');
	});

	it('menampilkan loading, tidak ditemukan, dan gagal tanpa menjatuhkan halaman', () => {
		expect(render(RegionRuntime, { props: { region, meta: undefined, phase: 'loading' } }).body).toContain(
			'Loading…'
		);
		expect(render(RegionRuntime, { props: { region, meta: undefined, phase: 'not_found' } }).body).toContain(
			'The requested record was not found.'
		);
		const failed = render(RegionRuntime, {
			props: { region, meta: undefined, phase: 'error', onretry: () => {} }
		});
		expect(failed.body).toContain('The request failed.');
		expect(failed.body).toContain('Reload');
	});
});
