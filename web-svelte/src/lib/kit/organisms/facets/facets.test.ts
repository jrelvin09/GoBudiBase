import { describe, expect, it } from 'vitest';
import type { ReportMeta } from '$lib/kit/organisms/ir/types';
import { emptyFacetState, facetFields, facetFilters, settingsForCounts, type FacetState } from './facets';

const meta: ReportMeta = {
	fields: [
		{ name: 'name', type: 'text', label: 'Name', required: false, in_table: true },
		{
			name: 'tier',
			type: 'select',
			label: 'Tier',
			required: false,
			in_table: true,
			facet: true,
			options: [{ value: 'gold', label: 'Gold' }]
		},
		{ name: 'active', type: 'toggle', label: 'Active', required: false, in_table: true, facet: true },
		{ name: 'credit_limit', type: 'number', label: 'Credit', required: false, in_table: true, facet: true },
		{ name: 'since', type: 'date', label: 'Since', required: false, in_table: true, facet: true }
	]
};

function state(patch: Partial<FacetState>): FacetState {
	return { ...emptyFacetState(), ...patch };
}

describe('facetFields', () => {
	it('hanya field bertanda facet', () => {
		expect(facetFields(meta).map((f) => f.name)).toEqual(['tier', 'active', 'credit_limit', 'since']);
	});
});

describe('facetFilters', () => {
	it('state kosong tidak menghasilkan filter', () => {
		expect(facetFilters(emptyFacetState(), meta)).toEqual([]);
	});

	it('kotak cari menghasilkan filter search dengan teks yang di-trim', () => {
		const filters = facetFilters(state({ search: '  acme ' }), meta);
		expect(filters).toEqual([
			{ id: 'facet_search', kind: 'search', column: null, op: 'contains', value: 'acme', enabled: true }
		]);
	});

	it('select menghasilkan in dengan nilai terpilih', () => {
		const filters = facetFilters(state({ selected: { tier: ['gold', 'platinum'] } }), meta);
		expect(filters).toHaveLength(1);
		expect(filters[0]).toMatchObject({ column: 'tier', op: 'in', value: ['gold', 'platinum'] });
	});

	it('pilihan kosong tidak menghasilkan filter', () => {
		expect(facetFilters(state({ selected: { tier: [] } }), meta)).toEqual([]);
	});

	it('toggle satu nilai menghasilkan eq boolean, dua nilai tanpa filter', () => {
		const filters = facetFilters(state({ selected: { active: ['false'] } }), meta);
		expect(filters[0]).toMatchObject({ column: 'active', op: 'eq', value: false });
		expect(facetFilters(state({ selected: { active: ['true', 'false'] } }), meta)).toEqual([]);
	});

	it('number dua sisi menghasilkan between', () => {
		const filters = facetFilters(state({ ranges: { credit_limit: [100, 500] } }), meta);
		expect(filters[0]).toMatchObject({ column: 'credit_limit', op: 'between', value: [100, 500] });
	});

	it('number hanya batas bawah menghasilkan gte', () => {
		const filters = facetFilters(state({ ranges: { credit_limit: [100, null] } }), meta);
		expect(filters[0]).toMatchObject({ column: 'credit_limit', op: 'gte', value: 100 });
	});

	it('number hanya batas atas menghasilkan lte', () => {
		const filters = facetFilters(state({ ranges: { credit_limit: [null, 500] } }), meta);
		expect(filters[0]).toMatchObject({ column: 'credit_limit', op: 'lte', value: 500 });
	});

	it('number tanpa batas tidak menghasilkan filter', () => {
		expect(facetFilters(state({ ranges: { credit_limit: [null, null] } }), meta)).toEqual([]);
	});

	it('date dua sisi menghasilkan between', () => {
		const filters = facetFilters(state({ ranges: { since: ['2026-01-01', '2026-12-31'] } }), meta);
		expect(filters[0]).toMatchObject({ column: 'since', op: 'between', value: ['2026-01-01', '2026-12-31'] });
	});
});

describe('settingsForCounts', () => {
	it('menghapus filter facet itu sendiri', () => {
		const settings = settingsForCounts(state({ selected: { tier: ['gold'], active: ['true'] } }), meta, 'tier');
		expect(settings.filters.map((f) => f.column)).toEqual(['active']);
	});

	it('mempertahankan kotak cari', () => {
		const settings = settingsForCounts(state({ search: 'acme', selected: { tier: ['gold'] } }), meta, 'tier');
		expect(settings.filters.map((f) => f.kind)).toEqual(['search']);
	});

	it('kolom dari field in_table', () => {
		const settings = settingsForCounts(emptyFacetState(), meta, 'tier');
		expect(settings.columns).toEqual(['name', 'tier', 'active', 'credit_limit', 'since']);
	});
});
