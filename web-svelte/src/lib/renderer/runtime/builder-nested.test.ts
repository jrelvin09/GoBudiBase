import { describe, expect, it } from 'vitest';
import {
	addRegion,
	addTab,
	ancestorsOf,
	childrenOf,
	descendantsOf,
	emptyDraft,
	insertPaletteRegion,
	insertRegionIn,
	moveRegionInto,
	normalizeNesting,
	removeRegion,
	removeRegionDeep,
	removeTab,
	renameTab,
	shiftRegion,
	updateRegion
} from './builder';
import { validatePageDefinition, type PageDefinition } from './page-definition';

const R = 'sales.customer';
const codes = (p: unknown) => {
	const r = validatePageDefinition(p);
	return r.ok ? [] : r.issues.map((i) => i.code);
};

/** tabs-1 (tab1, tab2) com kpi di tab1 dan panel-1 di tab2 berisi daftar. */
function sample(): PageDefinition {
	let p = emptyDraft(R, 'C');
	p = insertRegionIn(p, 'tabs', R);
	p = insertRegionIn(p, 'kpi', R, { parent: 'tabs-1', slot: 'tab1' });
	p = insertRegionIn(p, 'panel', R, { parent: 'tabs-1', slot: 'tab2' });
	p = insertRegionIn(p, 'ir-report', R, { parent: 'panel-1' });
	return p;
}

describe('validasi region bersarang (klien)', () => {
	it('contoh bersarang valid dan menyimpan parent/slot/tabs/title', () => {
		const out = validatePageDefinition(sample());
		expect(out.ok).toBe(true);
		if (out.ok) {
			expect(out.page.regions.find((r) => r.id === 'kpi-1')).toMatchObject({ parent: 'tabs-1', slot: 'tab1' });
			expect(out.page.regions.find((r) => r.id === 'panel-1')).toMatchObject({ parent: 'tabs-1', slot: 'tab2', title: 'Panel' });
		}
	});

	it('parent/slot yang salah ditolak dengan kode yang sama dengan server', () => {
		const base = sample();
		const mut = (id: string, patch: Record<string, unknown>) => ({ ...base, regions: base.regions.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
		expect(codes(mut('kpi-1', { parent: 'ghost' }))).toContain('invalid_parent');
		expect(codes(mut('kpi-1', { parent: 'ir-report-1' }))).toContain('invalid_parent');
		expect(codes(mut('kpi-1', { parent: 'kpi-1' }))).toContain('invalid_parent');
		expect(codes(mut('kpi-1', { slot: undefined }))).toContain('invalid_parent'); // tabs butuh slot
		expect(codes(mut('kpi-1', { slot: 'nope' }))).toContain('invalid_parent');
		expect(codes(mut('ir-report-1', { slot: 'tab1' }))).toContain('invalid_parent'); // panel tanpa slot
		expect(codes(mut('tabs-1', { parent: 'panel-1' }))).toContain('invalid_parent'); // siklus
	});

	it('kedalaman maksimum dua wadah', () => {
		let p = emptyDraft(R, 'C');
		p = insertRegionIn(p, 'panel', R);
		p = insertRegionIn(p, 'panel', R, { parent: 'panel-1' });
		p = insertRegionIn(p, 'text', R, { parent: 'panel-2' });
		expect(validatePageDefinition({ ...p, regions: p.regions.map((r) => (r.type === 'text' ? { ...r, text: { body: 'x' } } : r)) }).ok).toBe(true);
		const deeper = { ...p, regions: [...p.regions, { id: 'p3', type: 'panel', resourceId: R, parent: 'panel-2' }, { id: 'leaf', type: 'kpi', resourceId: R, metric: { fn: 'count' }, parent: 'p3' }] };
		expect(codes(deeper)).toContain('invalid_parent');
	});

	it('wadah dan propertinya', () => {
		const t = (extra: Record<string, unknown>) => ({ id: R, title: 'C', regions: [{ id: 'a', type: 'tabs', resourceId: R, ...extra }] });
		expect(codes(t({}))).toContain('invalid_container');
		expect(codes(t({ tabs: [] }))).toContain('invalid_container');
		expect(codes(t({ tabs: Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, label: 'T' })) }))).toContain('invalid_container');
		expect(codes(t({ tabs: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] }))).toContain('invalid_container');
		expect(codes(t({ tabs: [{ id: 'A b', label: 'A' }] }))).toContain('invalid_container');
		expect(codes(t({ tabs: [{ id: 'a', label: ' ' }] }))).toContain('invalid_container');
		expect(codes(t({ tabs: [{ id: 'a', label: 'A' }], collapsible: true }))).toContain('invalid_container');
		expect(codes({ id: R, title: 'C', regions: [{ id: 'l', type: 'ir-report', resourceId: R, title: 'x' }] })).toContain('invalid_container');
		expect(codes({ id: R, title: 'C', regions: [{ id: 'l', type: 'ir-report', resourceId: R, tabs: [{ id: 'a', label: 'A' }] }] })).toContain('invalid_container');
	});
});

describe('operasi bersarang di builder', () => {
	it('menyisipkan di dalam wadah dengan tab bawaan dan menolak tempat yang tidak sah', () => {
		const p = sample();
		expect(childrenOf(p, 'tabs-1', 'tab1').map((r) => r.id)).toEqual(['kpi-1']);
		expect(childrenOf(p, 'tabs-1', 'tab2').map((r) => r.id)).toEqual(['panel-1']);
		// tab tanpa slot yang sah -> tab pertama
		const q = insertRegionIn(p, 'kpi', R, { parent: 'tabs-1', slot: 'nope' });
		expect(q.regions.find((r) => r.id === 'kpi-2')).toMatchObject({ parent: 'tabs-1', slot: 'tab1' });
		// bukan wadah / tidak ada / terlalu dalam
		expect(insertRegionIn(p, 'kpi', R, { parent: 'ir-report-1' })).toBe(p);
		expect(insertRegionIn(p, 'kpi', R, { parent: 'ghost' })).toBe(p);
		expect(insertRegionIn(p, 'panel', R, { parent: 'panel-1' })).not.toBe(p); // dua tingkat masih boleh
		const deep = insertRegionIn(insertRegionIn(p, 'panel', R, { parent: 'panel-1' }), 'kpi', R, { parent: 'panel-2' });
		expect(deep.regions.some((r) => r.parent === 'panel-2')).toBe(false);
	});

	it('urutan sisip: di depan saudara tertentu atau di akhir', () => {
		let p = sample();
		p = insertRegionIn(p, 'text', R, { parent: 'tabs-1', slot: 'tab1', before: 'kpi-1' });
		expect(childrenOf(p, 'tabs-1', 'tab1').map((r) => r.id)).toEqual(['text-1', 'kpi-1']);
		p = insertRegionIn(p, 'chart', R, { parent: 'tabs-1', slot: 'tab1' });
		expect(childrenOf(p, 'tabs-1', 'tab1').map((r) => r.id)).toEqual(['text-1', 'kpi-1', 'chart-1']);
	});

	it('insertPaletteRegion memberi pengikatan awal di dalam wadah', () => {
		const p = insertPaletteRegion(sample(), 'kanban', R, { parent: 'panel-1' }, [{ name: 'tier', type: 'select' }]);
		expect(p.regions.find((r) => r.type === 'kanban')).toMatchObject({ parent: 'panel-1', groupBy: 'tier' });
	});

	it('memindahkan region ke wadah lain, ke tingkat atas, dan menolak ke dalam dirinya sendiri', () => {
		const p = sample();
		const moved = moveRegionInto(p, 'kpi-1', { parent: 'panel-1' });
		expect(moved.regions.find((r) => r.id === 'kpi-1')).toMatchObject({ parent: 'panel-1' });
		expect(moved.regions.find((r) => r.id === 'kpi-1')?.slot).toBeUndefined();
		const out = moveRegionInto(p, 'ir-report-1', {});
		expect(out.regions.find((r) => r.id === 'ir-report-1')?.parent).toBeUndefined();
		expect(moveRegionInto(p, 'tabs-1', { parent: 'panel-1' })).toBe(p); // ke dalam isinya
		expect(moveRegionInto(p, 'tabs-1', { parent: 'tabs-1', slot: 'tab1' })).toBe(p); // ke dalam dirinya
		expect(moveRegionInto(p, 'kpi-1', { parent: 'tabs-1', slot: 'tab1' })).toBe(p); // tidak berubah
		// subpohon ikut dihitung: tabs-1 (berisi panel berisi daftar) tidak muat di bawah wadah lain
		const host = insertRegionIn(p, 'panel', R);
		expect(moveRegionInto(host, 'tabs-1', { parent: 'panel-2' })).toBe(host);
	});

	it('shiftRegion hanya menukar saudara, dan menghapus wadah ikut menghapus isinya', () => {
		let p = sample();
		p = insertRegionIn(p, 'chart', R, { parent: 'tabs-1', slot: 'tab1' });
		expect(shiftRegion(p, 'chart-1', -1).regions.map((r) => r.id).indexOf('chart-1')).toBeLessThan(p.regions.map((r) => r.id).indexOf('chart-1'));
		expect(childrenOf(shiftRegion(p, 'chart-1', -1), 'tabs-1', 'tab1').map((r) => r.id)).toEqual(['chart-1', 'kpi-1']);
		expect(shiftRegion(p, 'kpi-1', -1)).toBe(p); // sudah pertama di tab
		const gone = removeRegion(p, p.regions.findIndex((r) => r.id === 'tabs-1'));
		expect(gone.regions).toEqual([]);
		const partial = removeRegionDeep(p, 'panel-1');
		expect(partial.regions.map((r) => r.id).sort()).toEqual(['chart-1', 'kpi-1', 'tabs-1']);
		expect(descendantsOf(p, 'tabs-1').map((r) => r.id).sort()).toEqual(['chart-1', 'ir-report-1', 'kpi-1', 'panel-1']);
		expect(ancestorsOf(p, 'ir-report-1').map((r) => r.id)).toEqual(['panel-1', 'tabs-1']);
	});

	it('hapus wadah ikut membuang aksi yang merujuk isinya', () => {
		const p = { ...sample(), items: [{ id: 'P1_B', type: 'button' as const, label: 'Go' }], actions: [{ id: 'A001', on: 'P1_B', do: [{ type: 'refresh_region' as const, region: 'kpi-1' }] }] };
		const out = removeRegionDeep(p, 'tabs-1');
		expect(out.actions).toBeUndefined();
	});

	it('tab: tambah, ganti nama, hapus (isinya pindah ke tab pertama)', () => {
		let p = sample();
		p = addTab(p, 'tabs-1', 'Third');
		expect(p.regions[0].tabs?.map((t) => t.id)).toEqual(['tab1', 'tab2', 'tab3']);
		p = renameTab(p, 'tabs-1', 'tab3', 'C');
		expect(p.regions[0].tabs?.[2].label).toBe('C');
		p = removeTab(p, 'tabs-1', 'tab2');
		expect(p.regions.find((r) => r.id === 'panel-1')?.slot).toBe('tab1');
		expect(validatePageDefinition(p).ok).toBe(true);
		let one = removeTab(p, 'tabs-1', 'tab3');
		expect(removeTab(one, 'tabs-1', 'tab1')).toBe(one); // minimal satu tab
		one = addTab(one, 'tabs-1', 'x');
		for (let i = 0; i < 10; i++) one = addTab(one, 'tabs-1', 'x');
		expect(one.regions[0].tabs).toHaveLength(8);
	});

	it('mengganti tipe: wadah berisi tidak boleh jadi komponen biasa; jenis wadah menyesuaikan slot', () => {
		const p = sample();
		expect(updateRegion(p, 0, { type: 'cards' })).toBe(p);
		const asPanel = updateRegion(p, 0, { type: 'panel' });
		expect(asPanel.regions.find((r) => r.id === 'kpi-1')?.slot).toBeUndefined();
		expect(validatePageDefinition(asPanel).ok).toBe(true);
		const back = updateRegion(asPanel, 0, { type: 'tabs' });
		expect(back.regions.find((r) => r.id === 'kpi-1')?.slot).toBe('tab1');
		expect(validatePageDefinition(back).ok).toBe(true);
	});

	it('normalizeNesting melepas parent yang hilang atau bukan wadah', () => {
		const p = { ...sample(), regions: sample().regions.filter((r) => r.id !== 'panel-1') };
		const fixed = normalizeNesting(p);
		expect(fixed.regions.find((r) => r.id === 'ir-report-1')?.parent).toBeUndefined();
		expect(normalizeNesting(fixed)).toBe(fixed);
	});

	it('addRegion untuk wadah memberi isi bawaan yang valid', () => {
		const t = addRegion(emptyDraft(R, 'C'), 'tabs', R);
		expect(t.regions[0].tabs).toHaveLength(2);
		expect(validatePageDefinition(t).ok).toBe(true);
	});
});
