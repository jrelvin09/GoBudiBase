import { describe, expect, it } from 'vitest';
import { validatePageDefinition } from './page-definition';
import {
	PUBLISHED_PAGES_FLAG_NAME,
	RUNTIME_RESOURCE_FLAGS,
	isPublishedPagesEnabled,
	isRuntimeEnabled,
	isRuntimeFormEnabled,
	runtimeFormPageFor,
	runtimePageFor
} from './runtime-flag';
import { RUNTIME_PAGES, SALES_CUSTOMER_PAGE } from './runtime-pages';

describe('isRuntimeEnabled', () => {
	it('ON secara default saat flag tidak diset', () => {
		expect(isRuntimeEnabled(undefined)).toBe(true);
	});

	it('string persis "true" tetap ON', () => {
		expect(isRuntimeEnabled('true')).toBe(true);
	});

	it.each([
		['false (rollback)', 'false'],
		['huruf besar', 'TRUE'],
		['True', 'True'],
		['string kosong', ''],
		['boolean true', true],
		['angka 1', 1]
	])('OFF untuk nilai %s', (_name, value) => {
		expect(isRuntimeEnabled(value)).toBe(false);
	});
});

describe('runtimePageFor', () => {
	it('default ON: definisi Customers dipakai saat flag absen', () => {
		expect(runtimePageFor('sales.customer', undefined)).toEqual(SALES_CUSTOMER_PAGE);
	});

	it('OFF eksplisit berarti resource apa pun tetap di jalur sekarang', () => {
		expect(runtimePageFor('sales.customer', 'false')).toBeUndefined();
	});

	it('resource tanpa PageDefinition tetap di jalur sekarang walau flag ON', () => {
		expect(runtimePageFor('theme.settings', 'true')).toBeUndefined();
		expect(runtimePageFor('sales.unknown', 'true')).toBeUndefined();
		expect(runtimePageFor('', undefined)).toBeUndefined();
	});
});

describe('flag per resource (M9, default ON)', () => {
	const others = Object.keys(RUNTIME_PAGES).filter((id) => id !== 'sales.customer');

	it('semua resource default ON; hanya absen atau string true = ON, false dan salah ketik = jalur lama', () => {
		for (const id of Object.keys(RUNTIME_PAGES)) {
			expect(runtimePageFor(id, undefined), id).toEqual(RUNTIME_PAGES[id]);
			expect(runtimePageFor(id, 'true'), id).toEqual(RUNTIME_PAGES[id]);
			expect(runtimePageFor(id, 'false'), id).toBeUndefined();
			expect(runtimePageFor(id, 'TRUE'), id).toBeUndefined();
		}
		expect(others).toHaveLength(8);
	});

	it('tiap resource punya flag statis sendiri dan flag satu resource tidak memengaruhi yang lain', () => {
		expect(Object.keys(RUNTIME_RESOURCE_FLAGS).sort()).toEqual(Object.keys(RUNTIME_PAGES).sort());
		expect(runtimePageFor('sales.order', 'false')).toBeUndefined();
		expect(runtimePageFor('sales.order_line', undefined)?.id).toBe('sales.order_line');
	});

	it('setiap PageDefinition valid dengan satu region resource-list ke resource-nya sendiri', () => {
		for (const [id, page] of Object.entries(RUNTIME_PAGES)) {
			expect(validatePageDefinition(page).ok, id).toBe(true);
			expect(page.id).toBe(id);
			expect(page.regions).toEqual([expect.objectContaining({ type: 'resource-list', resourceId: id })]);
		}
	});
});

describe('form runtime flag (M7)', () => {
	it('default ON; false dan salah ketik = jalur lama', () => {
		expect(isRuntimeFormEnabled(undefined)).toBe(true);
		expect(isRuntimeFormEnabled('true')).toBe(true);
		expect(isRuntimeFormEnabled('false')).toBe(false);
		expect(isRuntimeFormEnabled('TRUE')).toBe(false);
	});

	it('hanya Customers, dan bentuk mode mengikuti route', () => {
		expect(runtimeFormPageFor('sales.customer', 'create', 'false')).toBeUndefined();
		expect(runtimeFormPageFor('sales.order', 'create', 'true')).toBeUndefined();
		expect(runtimeFormPageFor('sales.customer', 'create', 'true')?.regions[0]).toMatchObject({ type: 'resource-form', mode: 'create' });
		expect(runtimeFormPageFor('sales.customer', 'edit', 'true')?.regions[0]).toMatchObject({ mode: 'edit' });
	});
});

describe('isPublishedPagesEnabled (B014)', () => {
	it('nama flag build adalah VITE_PUBLISHED_PAGES', () => {
		expect(PUBLISHED_PAGES_FLAG_NAME).toBe('VITE_PUBLISHED_PAGES');
	});

	it('default ON bila flag tidak diset', () => {
		expect(isPublishedPagesEnabled(undefined)).toBe(true);
	});

	it('string persis "true" adalah ON', () => {
		expect(isPublishedPagesEnabled('true')).toBe(true);
	});

	it.each([
		['false', 'false'],
		['huruf besar', 'TRUE'],
		['True', 'True'],
		['string kosong', ''],
		['boolean true', true],
		['angka 1', 1],
		['null', null]
	])('OFF untuk nilai %s', (_name, value) => {
		expect(isPublishedPagesEnabled(value)).toBe(false);
	});
});
