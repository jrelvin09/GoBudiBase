import { describe, expect, it } from 'vitest';
import { addRegion, emptyDraft, updateRegion } from './builder';
import { diffDefinitions } from './definition-diff';
import { validatePageDefinition } from './page-definition';

const page = (layout: unknown, extra: Record<string, unknown> = {}) => ({
	id: 'sales.customer',
	title: 'C',
	regions: [{ id: 'a', type: 'ir-report', resourceId: 'sales.customer', layout, ...extra }]
});

describe('kontrak layout region (grid 12 kolom)', () => {
	it('menerima lebar 1-12 dan newRow; newRow=false tidak disimpan', () => {
		for (const layout of [{ span: 6 }, { span: 1 }, { span: 12 }, { span: 4, newRow: true }, { newRow: true }]) {
			expect(validatePageDefinition(page(layout)).ok, JSON.stringify(layout)).toBe(true);
		}
		const result = validatePageDefinition(page({ span: 6, newRow: false }));
		expect(result.ok && result.page.regions[0].layout).toEqual({ span: 6 });
	});

	it('menolak lebar di luar 1-12, bukan bilangan bulat, kunci asing, dan newRow bukan boolean', () => {
		for (const layout of [{ span: 0 }, { span: 13 }, { span: -2 }, { span: 2.5 }, { span: '6' }, { colspan: 3 }, { newRow: 'yes' }, 7, null, []]) {
			const result = validatePageDefinition(page(layout));
			expect(result.ok, JSON.stringify(layout)).toBe(false);
			expect(!result.ok && result.issues.some((i) => i.code === 'invalid_layout')).toBe(true);
		}
	});

	it('region dialog tidak boleh punya layout', () => {
		const result = validatePageDefinition(page({ span: 6 }, { type: 'resource-form', mode: 'create', dialog: true }));
		expect(!result.ok && result.issues.some((i) => i.code === 'invalid_layout')).toBe(true);
	});

	it('updateRegion menormalkan: lebar penuh, newRow tanpa lebar, dan dialog tidak disimpan', () => {
		let p = addRegion(emptyDraft('sales.customer', 'C'), 'ir-report', 'sales.customer');
		p = updateRegion(p, 0, { layout: { span: 6 } });
		expect(p.regions[0].layout).toEqual({ span: 6 });
		p = updateRegion(p, 0, { layout: { span: 6, newRow: true } });
		expect(p.regions[0].layout).toEqual({ span: 6, newRow: true });
		expect(updateRegion(p, 0, { layout: { span: 12 } }).regions[0].layout).toBeUndefined();
		expect(updateRegion(p, 0, { layout: { newRow: true } }).regions[0].layout).toBeUndefined();
		expect(updateRegion(p, 0, { layout: undefined }).regions[0].layout).toBeUndefined();
		let dialog = addRegion(emptyDraft('sales.customer', 'C'), 'resource-form', 'sales.customer');
		dialog = updateRegion(dialog, 0, { layout: { span: 6 } });
		expect(updateRegion(dialog, 0, { dialog: true } as never).regions[0].layout).toBeUndefined();
	});

	it('diff versi melaporkan perubahan layout', () => {
		const a = validatePageDefinition(page({ span: 6 }));
		const b = validatePageDefinition(page({ span: 4 }));
		expect(a.ok && b.ok).toBe(true);
		if (a.ok && b.ok) {
			expect(diffDefinitions(a.page, b.page).map((c) => `${c.kind}:${c.path}`)).toContain('changed:regions[a].layout');
		}
	});
});
