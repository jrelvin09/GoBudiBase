import { describe, expect, it } from 'vitest';
import { addRegion, boxOf, clampBox, emptyDraft, insertPaletteRegion, insertRegionIn, moveRegionInto, placeRegion, setFreeMode } from './builder';
import { validatePageDefinition, type PageDefinition } from './page-definition';

const base = (): PageDefinition => {
	let p = emptyDraft('sales.customer', 'Customers');
	p = addRegion(p, 'resource-list', 'sales.customer');
	p = addRegion(p, 'kpi', 'sales.customer');
	return p;
};
const withLayout = (p: PageDefinition, id: string, layout: NonNullable<PageDefinition['regions'][0]['layout']>): PageDefinition => ({
	...p,
	regions: p.regions.map((r) => (r.id === id ? { ...r, layout } : r))
});
const codes = (p: unknown) => {
	const r = validatePageDefinition(p);
	return r.ok ? [] : r.issues.map((i) => i.code);
};

describe('free layout contract', () => {
	it('free page needs a full box on every top-level region', () => {
		const p = { ...base(), mode: 'free' as const };
		expect(codes(p)).toContain('invalid_layout');
		expect(codes(setFreeMode(base(), true))).toEqual([]);
	});

	it('rejects out-of-bounds boxes, newRow and coordinates on flow pages or nested regions', () => {
		const free = setFreeMode(base(), true);
		const id = free.regions[0].id;
		const bad = (layout: object) => codes(withLayout(free, id, layout as never));
		expect(bad({ x: 8, y: 0, span: 6, h: 2 })).toContain('invalid_layout');
		expect(bad({ x: -1, y: 0, span: 3, h: 2 })).toContain('invalid_layout');
		expect(bad({ x: 0, y: 200, span: 3, h: 2 })).toContain('invalid_layout');
		expect(bad({ x: 0, y: 0, span: 3, h: 61 })).toContain('invalid_layout');
		expect(bad({ x: 0, y: 0, span: 3, h: 2, newRow: true })).toContain('invalid_layout');
		expect(codes(withLayout(base(), base().regions[0].id, { x: 0, y: 0, span: 3, h: 2 }))).toContain('invalid_layout');
		expect(codes({ ...free, mode: 'grid' })).toContain('invalid_mode');
	});

	it('allows overlap', () => {
		let p = setFreeMode(base(), true);
		p = placeRegion(p, p.regions[0].id, { x: 0, y: 0, span: 6, h: 4 });
		p = placeRegion(p, p.regions[1].id, { x: 3, y: 2, span: 9, h: 4 });
		expect(codes(p)).toEqual([]);
	});
});

describe('free layout operations', () => {
	it('flow -> free derives positions row by row, and back keeps order and bands', () => {
		let p = base();
		p = withLayout(p, p.regions[0].id, { span: 6 });
		p = withLayout(p, p.regions[1].id, { span: 6 });
		p = insertPaletteRegion(p, 'text', 'sales.customer', {}, []);
		const free = setFreeMode(p, true);
		const [a, b, c] = free.regions.map((r) => boxOf(r)!);
		expect([a.x, a.y, a.span]).toEqual([0, 0, 6]);
		expect([b.x, b.y, b.span]).toEqual([6, 0, 6]);
		expect(c.x).toBe(0);
		expect(c.y).toBeGreaterThanOrEqual(Math.max(a.h, b.h));

		const back = setFreeMode(free, false);
		expect(back.mode).toBeUndefined();
		expect(back.regions.map((r) => r.id)).toEqual(p.regions.map((r) => r.id));
		expect(back.regions.map((r) => r.layout?.newRow ?? false)).toEqual([false, false, true]);
		expect(back.regions.every((r) => r.layout?.x === undefined && r.layout?.h === undefined)).toBe(true);
		expect(codes(back)).toEqual([]);
		expect(setFreeMode(back, false)).toBe(back);
	});

	it('clamps boxes into the canvas and reports no change for the same box', () => {
		expect(clampBox({ x: 10, y: -3, span: 5, h: 99 })).toEqual({ x: 7, y: 0, span: 5, h: 60 });
		const p = setFreeMode(base(), true);
		const id = p.regions[0].id;
		const moved = placeRegion(p, id, { x: 99, y: 5, span: 4, h: 3 });
		expect(boxOf(moved.regions[0])).toEqual({ x: 8, y: 5, span: 4, h: 3 });
		expect(placeRegion(moved, id, { x: 8, y: 5, span: 4, h: 3 })).toBe(moved);
		expect(placeRegion(base(), id, { x: 0, y: 0, span: 4, h: 3 }).regions[0].layout?.x).toBeUndefined();
	});

	it('new and moved regions on a free page get a box below the rest; nested ones lose it', () => {
		let p = setFreeMode(base(), true);
		const bottom = Math.max(...p.regions.map((r) => boxOf(r)!.y + boxOf(r)!.h));
		p = insertPaletteRegion(p, 'text', 'sales.customer', {}, []);
		const added = p.regions[p.regions.length - 1];
		expect(boxOf(added)?.y).toBe(bottom);
		expect(codes(p)).toEqual([]);

		p = insertRegionIn(p, 'panel', 'sales.customer');
		const panel = p.regions[p.regions.length - 1];
		expect(boxOf(panel)).not.toBeNull();
		const inside = moveRegionInto(p, added.id, { parent: panel.id });
		const nested = inside.regions.find((r) => r.id === added.id)!;
		expect(nested.parent).toBe(panel.id);
		expect(nested.layout?.x).toBeUndefined();
		expect(codes(inside)).toEqual([]);

		const out = moveRegionInto(inside, added.id, {});
		expect(boxOf(out.regions.find((r) => r.id === added.id)!)).not.toBeNull();
		expect(codes(out)).toEqual([]);
	});
});
