import { describe, expect, it } from 'vitest';
import { addRegion, emptyDraft, insertRegionAt, MAX_REGIONS, moveRegionTo } from './builder';

describe('seret-lepas region (kanvas desain)', () => {
	const three = () => {
		let p = emptyDraft('sales.customer', 'C');
		p = addRegion(p, 'kpi', 'sales.customer');
		p = addRegion(p, 'ir-report', 'sales.customer');
		return addRegion(p, 'resource-form', 'sales.customer');
	};
	const types = (p: ReturnType<typeof three>) => p.regions.map((r) => r.type);

	it('moveRegionTo memakai indeks sisip sebelum pencabutan', () => {
		const p = three(); // kpi, ir-report, resource-form
		expect(types(moveRegionTo(p, 0, 3))).toEqual(['ir-report', 'resource-form', 'kpi']); // ke akhir
		expect(types(moveRegionTo(p, 2, 0))).toEqual(['resource-form', 'kpi', 'ir-report']); // ke awal
		expect(types(moveRegionTo(p, 0, 2))).toEqual(['ir-report', 'kpi', 'resource-form']); // di antara
	});

	it('moveRegionTo: posisi sama, di luar batas, atau indeks buruk = tak berubah', () => {
		const p = three();
		for (const [from, to] of [[1, 1], [1, 2], [-1, 0], [3, 0], [0, 4]]) expect(moveRegionTo(p, from, to)).toBe(p);
	});

	it('insertRegionAt menyisipkan di posisi, di akhir bila di luar batas, dan menjaga id unik', () => {
		const p = three();
		const first = insertRegionAt(p, 'kpi', 'sales.customer', 0);
		expect(types(first)).toEqual(['kpi', 'kpi', 'ir-report', 'resource-form']);
		expect(new Set(first.regions.map((r) => r.id)).size).toBe(4);
		expect(types(insertRegionAt(p, 'chart', 'sales.customer', 99)).at(-1)).toBe('chart');
		expect(types(insertRegionAt(p, 'chart', 'sales.customer', 2))[2]).toBe('chart');
		let full = emptyDraft('sales.customer', 'C');
		for (let i = 0; i < MAX_REGIONS; i++) full = addRegion(full, 'kpi', 'sales.customer');
		expect(insertRegionAt(full, 'kpi', 'sales.customer', 0)).toBe(full);
	});
});
