import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	MAX_REGIONS,
	previewPlan,
	addRegion,
	effectiveFields,
	moveField,
	addFilter,
	addItem,
	removeItem,
	updateItem,
	updateFilter,
	removeFilter,
	resetFields,
	toggleField,
	draftIssues,
	emptyDraft,
	moveRegion,
	paletteEntries,
	removeRegion,
	sameDefinition,
	updateRegion
} from './builder';
import { REGION_TYPES, validatePageDefinition } from './page-definition';

const known = ['sales.customer', 'sales.order'];

describe('builder (M8)', () => {
	it('palet hanya berisi tipe region dari registry', () => {
		expect(paletteEntries().map((entry) => entry.type).sort()).toEqual([...REGION_TYPES].sort());
		expect(paletteEntries().map((entry) => entry.type)).not.toContain('button');
	});

	it('daftar tipe server sama dengan REGION_TYPES frontend', () => {
		const source = readFileSync(
			fileURLToPath(new URL('../../../../../backend/internal/core/httpserver/page_drafts.go', import.meta.url)),
			'utf8'
		);
		const match = /pageDraftRegionTypes = map\[string\]bool\{([^}]*)\}/.exec(source);
		const serverTypes = [...(match?.[1] ?? '').matchAll(/"([a-z-]+)"/g)].map((m) => m[1]).sort();
		expect(serverTypes).toEqual([...REGION_TYPES].sort());
	});

	it('menambah region dengan id unik, mode hanya untuk form, dan batas jumlah', () => {
		let page = emptyDraft('sales.customer', 'Customers');
		page = addRegion(page, 'resource-list', 'sales.customer');
		page = addRegion(page, 'resource-list', 'sales.customer');
		page = addRegion(page, 'resource-form', 'sales.customer');
		expect(page.regions.map((r) => r.id)).toEqual(['resource-list-1', 'resource-list-2', 'resource-form-1']);
		expect(page.regions[0].mode).toBeUndefined();
		expect(page.regions[2].mode).toBe('create');
		for (let i = 0; i < 50; i++) page = addRegion(page, 'resource-list', 'sales.customer');
		expect(page.regions).toHaveLength(MAX_REGIONS);
	});

	it('memindah, menghapus, dan mengubah tanpa memutasi input', () => {
		const base = addRegion(addRegion(emptyDraft('p', 'P'), 'resource-list', 'sales.customer'), 'ir-report', 'sales.order');
		const snapshot = JSON.stringify(base);
		expect(moveRegion(base, 0, 1).regions.map((r) => r.type)).toEqual(['ir-report', 'resource-list']);
		expect(moveRegion(base, 0, -1)).toBe(base);
		expect(removeRegion(base, 0).regions).toHaveLength(1);
		expect(removeRegion(base, 9)).toBe(base);
		const asForm = updateRegion(base, 0, { type: 'resource-form' });
		expect(asForm.regions[0].mode).toBe('create');
		expect(updateRegion(asForm, 0, { type: 'resource-list' }).regions[0].mode).toBeUndefined();
		expect(JSON.stringify(base)).toBe(snapshot);
	});

	it('draftIssues menandai resource tak dikenal dan draft kosong', () => {
		expect(draftIssues(emptyDraft('p', 'P'), known).map((i) => i.code)).toContain('invalid_regions');
		const page = addRegion(emptyDraft('p', 'P'), 'resource-list', 'nope.thing');
		expect(draftIssues(page, known)).toEqual([{ location: 'resource-list-1', code: 'unknown_resource' }]);
		expect(draftIssues(addRegion(emptyDraft('sales.customer', 'P'), 'resource-list', 'sales.customer'), known)).toEqual([]);
		const cross = addRegion(emptyDraft('sales.customer', 'P'), 'resource-list', 'sales.order');
		expect(draftIssues(cross, known)).toEqual([]); // beberapa resource per halaman diizinkan (blok 4)
	});

	it('sameDefinition membandingkan isi', () => {
		expect(sameDefinition(emptyDraft('p', 'P'), emptyDraft('p', 'P'))).toBe(true);
		expect(sameDefinition(emptyDraft('p', 'P'), emptyDraft('p', 'Q'))).toBe(false);
	});

	it('previewPlan melewati form edit dan mengembalikan page null untuk draft edit-only', () => {
		let page = emptyDraft('sales.customer', 'P');
		page = addRegion(page, 'resource-form', 'sales.customer');
		page = updateRegion(page, 0, { mode: 'edit' });
		expect(previewPlan(page)).toEqual({ page: null, skipped: 1 });
		const mixed = addRegion(page, 'resource-list', 'sales.customer');
		const plan = previewPlan(mixed);
		expect(plan.skipped).toBe(1);
		expect(plan.page?.regions.map((r) => r.type)).toEqual(['resource-list']);
		const create = updateRegion(page, 0, { mode: 'create' });
		expect(previewPlan(create)).toEqual({ page: create, skipped: 0 });
	});
});

describe('round-trip (B002)', () => {
	function buildDefinition() {
		let def = emptyDraft('sales.customer', 'Customers');
		def = addRegion(def, 'resource-list', 'sales.customer');
		def = addRegion(def, 'ir-report', 'sales.customer');
		def = addRegion(def, 'resource-list', 'sales.customer');
		def = moveRegion(def, 0, 1);
		def = updateRegion(def, 2, { type: 'resource-form' });
		return def;
	}

	it('serialisasi JSON ↔ objek menghasilkan definisi identik', () => {
		const def = buildDefinition();
		const parsed = JSON.parse(JSON.stringify(def));
		expect(parsed).toEqual(def);
		expect(sameDefinition(def, parsed)).toBe(true);
	});

	it('definisi hasil round-trip lolos validasi dan tidak memiliki issues', () => {
		const def = buildDefinition();
		const parsed = JSON.parse(JSON.stringify(def));
		expect(validatePageDefinition(parsed).ok).toBe(true);
		expect(draftIssues(parsed, ['sales.customer'])).toEqual([]);
	});

	it('dua definisi yang hanya beda urutan region bernilai beda pada sameDefinition', () => {
		const def1 = buildDefinition();
		const def2 = moveRegion(def1, 0, 1);
		expect(sameDefinition(def1, def2)).toBe(false);
	});
});

describe('field picker (B009b)', () => {
	const all = [
		{ name: 'code', in_table: true },
		{ name: 'name', in_table: true },
		{ name: 'note', in_table: false }
	];
	const page = () => addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-list', 'sales.customer');

	it('region tanpa fields = semua field tabel; toggle pertama menulis daftar eksplisit', () => {
		expect(effectiveFields(page().regions[0], all)).toEqual(['code', 'name']);
		const off = toggleField(page(), 0, 'code', all);
		expect(off.regions[0].fields).toEqual(['name']);
		const on = toggleField(off, 0, 'note', all);
		expect(on.regions[0].fields).toEqual(['name', 'note']);
	});

	it('melepas field terakhir menghapus properti fields (kembali ke default)', () => {
		let p = toggleField(page(), 0, 'code', all);
		p = toggleField(p, 0, 'name', all);
		expect('fields' in p.regions[0]).toBe(false);
	});

	it('moveField menggeser urutan dan menolak di luar batas', () => {
		let p = toggleField(page(), 0, 'note', all);
		p = moveField(p, 0, 'note', -1);
		expect(p.regions[0].fields).toEqual(['code', 'note', 'name']);
		expect(moveField(p, 0, 'code', -1)).toBe(p);
	});

	it('resetFields menghapus fields', () => {
		const p = resetFields(toggleField(page(), 0, 'code', all), 0);
		expect('fields' in p.regions[0]).toBe(false);
	});

	it('tidak memutasi input dan mengabaikan field yang tidak ada', () => {
		const p = page();
		const snapshot = JSON.stringify(p);
		toggleField(p, 0, 'code', all);
		expect(JSON.stringify(p)).toBe(snapshot);
		expect(toggleField(p, 0, 'ghost', all)).toBe(p);
	});

	it('region form memakai semua field sebagai default dan batas 50 berlaku', () => {
		const form = addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-form', 'sales.customer');
		expect(effectiveFields(form.regions[0], all)).toEqual(['code', 'name', 'note']);
		expect(toggleField(form, 0, 'note', all).regions[0].fields).toEqual(['code', 'name']);
		const many = Array.from({ length: 51 }, (_, i) => ({ name: `f${i}`, in_table: i < 50 }));
		const p = page();
		expect(toggleField(p, 0, 'f50', many)).toBe(p);
	});
});

describe('updateRegion sort and pageSize (D001)', () => {
	const page = () => addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-list', 'sales.customer');

	it('menyimpan sort dan pageSize lalu menghapusnya saat tipe berubah ke form', () => {
		const set = updateRegion(page(), 0, { sort: { field: 'name', dir: 'asc' }, pageSize: 10 });
		expect(set.regions[0].sort).toEqual({ field: 'name', dir: 'asc' });
		const form = updateRegion(set, 0, { type: 'resource-form' });
		expect('sort' in form.regions[0] || 'pageSize' in form.regions[0]).toBe(false);
	});

	it('menghapus properti saat dipatch undefined', () => {
		const set = updateRegion(page(), 0, { pageSize: 10 });
		const cleared = updateRegion(set, 0, { pageSize: undefined });
		expect(cleared.regions[0].pageSize).toBeUndefined();
	});
});

describe('static filters editor (D007)', () => {
	const page = () => addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-list', 'sales.customer');

	it('menambah, mengubah, dan menghapus filter', () => {
		let p = addFilter(page(), 0, 'tier', 'gold');
		expect(p.regions[0].filters).toEqual([{ field: 'tier', op: 'eq', value: 'gold' }]);
		p = updateFilter(p, 0, 0, { value: 'platinum' });
		expect(p.regions[0].filters?.[0].value).toBe('platinum');
		p = removeFilter(p, 0, 0);
		expect('filters' in p.regions[0]).toBe(false);
	});

	it('batas 5 dan field kosong ditolak; tidak memutasi input', () => {
		let p = page();
		for (let i = 0; i < 5; i++) p = addFilter(p, 0, 'tier', String(i + 1));
		expect(p.regions[0].filters).toHaveLength(5);
		expect(addFilter(p, 0, 'tier', 'x')).toBe(p);
		const q = page();
		expect(addFilter(q, 0, '', 'x')).toBe(q);
		const snap = JSON.stringify(p);
		removeFilter(p, 0, 0);
		expect(JSON.stringify(p)).toBe(snap);
	});

	it('tidak berlaku pada region form dan indeks tak ada', () => {
		const form = addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-form', 'sales.customer');
		expect(addFilter(form, 0, 'tier', 'gold')).toBe(form);
		expect(updateFilter(page(), 0, 3, { value: 'x' }).regions[0].filters).toBeUndefined();
	});
});

describe('page items editor (P4)', () => {
	const page = () => addRegion(emptyDraft('sales.customer', 'Customers'), 'resource-list', 'sales.customer');

	it('menambah item dengan id unik berurutan dan menghapusnya', () => {
		let p = addItem(addItem(page()));
		expect(p.items?.map((i) => i.id)).toEqual(['P1_ITEM', 'P2_ITEM']);
		p = removeItem(p, 0);
		expect(p.items?.map((i) => i.id)).toEqual(['P2_ITEM']);
		p = removeItem(p, 0);
		expect('items' in p).toBe(false);
	});

	it('updateItem menghapus options bila bukan select dan default kosong', () => {
		let p = updateItem(addItem(page()), 0, { type: 'select', options: ['a', 'b'], default: 'a' });
		expect(p.items?.[0].options).toEqual(['a', 'b']);
		p = updateItem(p, 0, { type: 'text', default: '' });
		expect('options' in (p.items?.[0] ?? {})).toBe(false);
		expect('default' in (p.items?.[0] ?? {})).toBe(false);
	});

	it('menghapus item ikut membuang filter yang merujuknya dan hasilnya tetap valid', () => {
		let p = addItem(page());
		p = addFilter(p, 0, 'tier', ':P1_ITEM');
		p = removeItem(p, 0);
		expect('filters' in p.regions[0]).toBe(false);
		expect(validatePageDefinition(p).ok).toBe(true);
	});

	it('tidak memutasi input dan batas 30', () => {
		let p = page();
		for (let i = 0; i < 30; i++) p = addItem(p);
		expect(addItem(p)).toBe(p);
		const snap = JSON.stringify(p);
		removeItem(p, 0);
		expect(JSON.stringify(p)).toBe(snap);
	});
});

describe('multi-resource dan master-detail (Blok 4)', () => {
	it('ganti resource membuang field/sort/filter lama; rowItem hanya untuk select', () => {
		let p = addRegion(emptyDraft('sales.customer', 'C'), 'ir-report', 'sales.customer');
		p = updateRegion(p, 0, { fields: ['name'], sort: { field: 'name', dir: 'asc' } });
		p = updateRegion(p, 0, { resourceId: 'sales.order' });
		expect(p.regions[0]).toMatchObject({ resourceId: 'sales.order' });
		expect(p.regions[0].fields).toBeUndefined();
		expect(p.regions[0].sort).toBeUndefined();
		p = addItem(p);
		p = updateRegion(p, 0, { rowAction: 'select', rowItem: 'P1_ITEM' });
		expect(validatePageDefinition(p).ok).toBe(true);
		p = updateRegion(p, 0, { rowAction: 'none' });
		expect(p.regions[0].rowItem).toBeUndefined();
	});

	it('select tanpa item terdeklarasi atau pada resource-list ditolak', () => {
		const base = addItem(addRegion(emptyDraft('sales.customer', 'C'), 'ir-report', 'sales.customer'));
		expect(validatePageDefinition({ ...base, regions: [{ ...base.regions[0], rowAction: 'select', rowItem: 'P9_NOPE' }] }).ok).toBe(false);
		expect(validatePageDefinition({ ...base, regions: [{ ...base.regions[0], type: 'resource-list', rowAction: 'select', rowItem: 'P1_ITEM' }] }).ok).toBe(false);
	});
});

describe('template bersama (P7)', () => {
	it('applyTemplate mengganti isi tetapi mempertahankan id dan judul, dan hasilnya valid', async () => {
		const { applyTemplate } = await import('./builder');
		const base = emptyDraft('sales.customer', 'Customers');
		const tpl = {
			regions: [{ id: 'list', type: 'ir-report', resourceId: 'sales.customer' }],
			items: [{ id: 'P1_TIER', type: 'select' as const, label: 'Tier', lov: 'tiers' }]
		};
		const next = applyTemplate(base, tpl as never);
		expect(next).toMatchObject({ id: 'sales.customer', title: 'Customers' });
		expect(next.regions).toHaveLength(1);
		expect(validatePageDefinition(next).ok).toBe(true);
		expect(applyTemplate(base, { regions: [] }).items).toBeUndefined();
	});

	it('updateItem: LOV menggantikan opsi dan default; updateRegion membuang datasource di luar list/report', () => {
		let p = addItem(addRegion(emptyDraft('sales.customer', 'C'), 'ir-report', 'sales.customer'));
		p = updateItem(p, 0, { type: 'select', options: ['a'], default: 'a' });
		p = updateItem(p, 0, { lov: 'tiers' });
		expect(p.items?.[0]).toMatchObject({ lov: 'tiers' });
		expect(p.items?.[0].options).toBeUndefined();
		expect(p.items?.[0].default).toBeUndefined();
		p = updateRegion(p, 0, { datasource: 'gold', auth: 'can_view' });
		expect(p.regions[0]).toMatchObject({ datasource: 'gold', auth: 'can_view' });
		p = updateRegion(p, 0, { type: 'resource-form' });
		expect(p.regions[0].datasource).toBeUndefined();
		expect(p.regions[0].auth).toBe('can_view');
	});
});

describe('region chart', () => {
	it('chart valid dengan groupBy + metrik; groupBy ditolak/ wajib sesuai tipe', () => {
		const base = emptyDraft('sales.customer', 'C');
		const chart = { id: 'c', type: 'chart', resourceId: 'sales.customer', groupBy: 'tier', metric: { fn: 'count' } };
		expect(validatePageDefinition({ ...base, regions: [chart] }).ok).toBe(true);
		expect(validatePageDefinition({ ...base, regions: [{ ...chart, groupBy: undefined }] }).ok).toBe(false);
		expect(validatePageDefinition({ ...base, regions: [{ ...chart, type: 'kpi' }] }).ok).toBe(false);
		expect(validatePageDefinition({ ...base, regions: [{ ...chart, filters: [{ field: 'tier', op: 'eq', value: 'gold' }] }] }).ok).toBe(true);
	});

	it('updateRegion: groupBy hanya untuk chart dan reset saat resource berganti', () => {
		let p = addRegion(emptyDraft('sales.customer', 'C'), 'chart', 'sales.customer');
		expect(p.regions[0].metric).toEqual({ fn: 'count' });
		p = updateRegion(p, 0, { groupBy: 'tier' });
		expect(p.regions[0].groupBy).toBe('tier');
		expect(updateRegion(p, 0, { resourceId: 'sales.order' }).regions[0].groupBy).toBeUndefined();
		expect(updateRegion(p, 0, { type: 'kpi' }).regions[0].groupBy).toBeUndefined();
	});
});
