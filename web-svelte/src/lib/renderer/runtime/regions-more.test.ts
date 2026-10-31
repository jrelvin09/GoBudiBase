import { describe, expect, it } from 'vitest';
import type { FieldMeta } from '$lib/kit/fields/types';
import { addRegion, effectiveFields, emptyDraft, insertPaletteRegion, updateRegion } from './builder';
import { kanbanColumns } from './kanban';
import { paletteEntries } from './builder';
import { REGION_TYPES, validatePageDefinition, type PageDefinition } from './page-definition';

const page = (...regions: Record<string, unknown>[]) => ({ id: 'sales.customer', title: 'C', regions });
const region = (id: string, type: string, extra: Record<string, unknown> = {}) => ({ id, type, resourceId: 'sales.customer', ...extra });
const codes = (input: unknown) => {
	const r = validatePageDefinition(input);
	return r.ok ? [] : r.issues.map((i) => i.code);
};

const FIELDS = [
	{ name: 'name', type: 'text' },
	{ name: 'tier', type: 'select' },
	{ name: 'since', type: 'date' }
];

describe('region dari UI Kit (cards, calendar, facets, grid, kanban, text)', () => {
	it('semuanya ada di palet dan di daftar tipe yang diizinkan', () => {
		for (const type of ['cards', 'calendar', 'facets', 'grid', 'kanban', 'text']) {
			expect(REGION_TYPES).toContain(type);
			expect(paletteEntries().map((e) => e.type)).toContain(type);
		}
	});

	it('halaman dengan semua tipe baru valid', () => {
		const out = validatePageDefinition(
			page(
				region('c', 'cards', { fields: ['name', 'tier'] }),
				region('cal', 'calendar', { dateField: 'since' }),
				region('f', 'facets'),
				region('g', 'grid'),
				region('k', 'kanban', { groupBy: 'tier', fields: ['name'], filters: [{ field: 'tier', op: 'eq', value: 'gold' }] }),
				region('t', 'text', { text: { heading: 'Hi', body: 'a\nb' } })
			)
		);
		expect(out.ok).toBe(true);
	});

	it('properti hanya milik tipenya', () => {
		expect(codes(page(region('a', 'calendar')))).toContain('invalid_date_field');
		expect(codes(page(region('a', 'ir-report', { dateField: 'since' })))).toContain('invalid_date_field');
		expect(codes(page(region('a', 'kanban')))).toContain('invalid_group_by');
		expect(codes(page(region('a', 'cards', { groupBy: 'tier' })))).toContain('invalid_group_by');
		expect(codes(page(region('a', 'text')))).toContain('invalid_text');
		expect(codes(page(region('a', 'ir-report', { text: { body: 'x' } })))).toContain('invalid_text');
	});

	it('teks: hanya heading/body polos, dibatasi, sedikitnya satu terisi', () => {
		expect(codes(page(region('a', 'text', { text: { heading: ' ', body: '' } })))).toContain('invalid_text');
		expect(codes(page(region('a', 'text', { text: { body: 'x'.repeat(2001) } })))).toContain('invalid_text');
		expect(codes(page(region('a', 'text', { text: { heading: 'x'.repeat(121) } })))).toContain('invalid_text');
		expect(codes(page(region('a', 'text', { text: { body: 'x', html: '<b>' } })))).toContain('invalid_text');
		const ok = validatePageDefinition(page(region('a', 'text', { text: { heading: '', body: '<script>alert(1)</script>' } })));
		expect(ok.ok && ok.page.regions[0].text).toEqual({ body: '<script>alert(1)</script>' }); // disimpan apa adanya; dirender sebagai teks
	});

	it('kartu dan kanban memuat paling banyak 4 field; filter hanya pada kanban', () => {
		expect(codes(page(region('a', 'cards', { fields: ['a', 'b', 'c', 'd', 'e'] })))).toContain('invalid_fields');
		expect(codes(page(region('a', 'cards', { filters: [{ field: 'tier', op: 'eq', value: 'x' }] })))).toContain('invalid_filter');
		expect(codes(page(region('a', 'cards', { sort: { field: 'name', dir: 'asc' } })))).toContain('invalid_binding');
	});
});

describe('builder untuk region baru', () => {
	const base = (): PageDefinition => emptyDraft('sales.customer', 'C');

	it('memberi pengikatan awal dari field resource', () => {
		const k = insertPaletteRegion(base(), 'kanban', 'sales.customer', 0, FIELDS);
		expect(k.regions[0]).toMatchObject({ type: 'kanban', groupBy: 'tier' });
		const c = insertPaletteRegion(base(), 'calendar', 'sales.customer', 0, FIELDS);
		expect(c.regions[0]).toMatchObject({ type: 'calendar', dateField: 'since' });
		const t = insertPaletteRegion(base(), 'text', 'sales.customer', 0, FIELDS);
		expect(t.regions[0].text).toEqual({ heading: 'Text' });
		for (const p of [k, c, t]) expect(validatePageDefinition(p).ok).toBe(true);
	});

	it('mengganti tipe membuang properti yang bukan miliknya', () => {
		let p = insertPaletteRegion(base(), 'calendar', 'sales.customer', 0, FIELDS);
		p = updateRegion(p, 0, { type: 'cards' });
		expect(p.regions[0].dateField).toBeUndefined();
		let k = insertPaletteRegion(base(), 'kanban', 'sales.customer', 0, FIELDS);
		k = updateRegion(k, 0, { type: 'facets' });
		expect(k.regions[0].groupBy).toBeUndefined();
	});

	it('daftar field kartu dipotong ke 4 dan bawaannya kosong (hanya judul)', () => {
		const p = addRegion(base(), 'cards', 'sales.customer');
		expect(effectiveFields(p.regions[0], [{ name: 'a', in_table: true }])).toEqual([]);
		const capped = updateRegion(p, 0, { fields: ['a', 'b', 'c', 'd', 'e', 'f'] });
		expect(capped.regions[0].fields).toEqual(['a', 'b', 'c', 'd']);
	});
});

describe('kolom kanban', () => {
	const field = {
		name: 'tier',
		type: 'select',
		label: 'Tier',
		options: [
			{ value: 'regular', label: 'Regular' },
			{ value: 'gold', label: 'Gold' }
		]
	} as unknown as FieldMeta;

	it('satu kolom per opsi menurut urutan, rekaman dikelompokkan', () => {
		const cols = kanbanColumns(field, [{ id: '1', tier: 'gold' }, { id: '2', tier: 'regular' }, { id: '3', tier: 'gold' }], 'tier');
		expect(cols.map((c) => [c.label, c.rows.length])).toEqual([['Regular', 1], ['Gold', 2]]);
	});

	it('kolom tambahan hanya bila ada rekaman yang tidak cocok dengan opsi mana pun', () => {
		const cols = kanbanColumns(field, [{ id: '1', tier: 'vip' }, { id: '2', tier: null }], 'tier');
		expect(cols.map((c) => [c.value, c.rows.length])).toEqual([['regular', 0], ['gold', 0], ['', 2]]);
	});

	it('bukan field select = tanpa kolom', () => {
		expect(kanbanColumns(undefined, [], 'x')).toEqual([]);
		expect(kanbanColumns({ name: 'n', type: 'text' } as unknown as FieldMeta, [], 'n')).toEqual([]);
	});
});
