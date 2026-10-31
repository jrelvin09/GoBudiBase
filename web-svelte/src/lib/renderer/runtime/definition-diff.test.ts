import { describe, expect, it } from 'vitest';
import { diffDefinitions } from './definition-diff';
import type { PageDefinition, RegionDefinition } from './page-definition';

const region = (id: string, extra: Partial<RegionDefinition> = {}): RegionDefinition => ({
	id,
	type: 'resource-list',
	resourceId: 'sales.customer',
	...extra
});
const page = (regions: RegionDefinition[], title = 'Customers'): PageDefinition => ({
	id: 'sales.customer',
	title,
	regions
});
const paths = (a: PageDefinition, b: PageDefinition) => diffDefinitions(a, b).map((c) => `${c.kind}:${c.path}`);

describe('diffDefinitions (D011b)', () => {
	it('identik menghasilkan daftar kosong', () => {
		expect(diffDefinitions(page([region('a')]), page([region('a')]))).toEqual([]);
	});

	it('mendeteksi perubahan judul', () => {
		expect(paths(page([region('a')]), page([region('a')], 'Klien'))).toEqual(['changed:title']);
	});

	it('mendeteksi region ditambah dan dihapus (cocok berdasar id)', () => {
		expect(paths(page([region('a')]), page([region('a'), region('b')]))).toEqual(['added:regions[b]']);
		expect(paths(page([region('a'), region('b')]), page([region('a')]))).toEqual(['removed:regions[b]']);
	});

	it('mendeteksi perubahan resource, fields, filters, dan sort', () => {
		const a = page([region('a', { fields: ['code'], sort: { field: 'code', dir: 'asc' } })]);
		const b = page([
			region('a', {
				resourceId: 'sales.order',
				fields: ['code', 'name'],
				sort: { field: 'code', dir: 'desc' },
				filters: [{ field: 'tier', op: 'eq', value: 'gold' }]
			})
		]);
		expect(paths(a, b)).toEqual([
			'changed:regions[a].resourceId',
			'changed:regions[a].fields',
			'changed:regions[a].sort',
			'added:regions[a].filters'
		]);
	});

	it('mendeteksi perubahan urutan saja sebagai reordered', () => {
		expect(paths(page([region('a'), region('b')]), page([region('b'), region('a')]))).toEqual(['reordered:regions']);
	});

	it('tidak memutasi masukan', () => {
		const a = page([region('a')]);
		const snapshot = JSON.stringify(a);
		diffDefinitions(a, page([region('b')]));
		expect(JSON.stringify(a)).toBe(snapshot);
	});
});
