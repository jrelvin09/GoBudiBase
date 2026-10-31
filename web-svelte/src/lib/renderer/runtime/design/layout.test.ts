import { describe, expect, it } from 'vitest';
import { layoutWithSpan, spanFromPointer, spanOf, stepSpan } from './layout';

describe('layout grid kanvas', () => {
	it('spanOf: tanpa layout = lebar penuh', () => {
		expect(spanOf({})).toBe(12);
		expect(spanOf({ layout: { span: 4 } })).toBe(4);
		expect(spanOf({ layout: { newRow: true } })).toBe(12);
	});

	it('layoutWithSpan membulatkan, membatasi 1-12, dan tidak menyimpan lebar penuh', () => {
		expect(layoutWithSpan(undefined, 6)).toEqual({ span: 6 });
		expect(layoutWithSpan(undefined, 5.6)).toEqual({ span: 6 });
		expect(layoutWithSpan(undefined, 0)).toEqual({ span: 1 });
		expect(layoutWithSpan(undefined, 12)).toBeUndefined();
		expect(layoutWithSpan(undefined, 99)).toBeUndefined();
		expect(layoutWithSpan({ span: 4, newRow: true }, 8)).toEqual({ span: 8, newRow: true });
	});

	it('stepSpan melangkah antar preset dan berhenti di ujung', () => {
		expect(stepSpan(12, 1)).toBe(12);
		expect(stepSpan(6, 1)).toBe(8);
		expect(stepSpan(5, 1)).toBe(6);
		expect(stepSpan(6, -1)).toBe(4);
		expect(stepSpan(5, -1)).toBe(4);
		expect(stepSpan(3, -1)).toBe(3);
		expect(stepSpan(1, -1)).toBe(3);
		expect(stepSpan(12, -1)).toBe(9);
	});

	it('spanFromPointer: lebar n kolom = n*pitch - gap, dibatasi sisa baris', () => {
		const base = { frameLeft: 100, pitch: 80, gap: 16, startColumn: 0 };
		expect(spanFromPointer({ ...base, x: 100 + 3 * 80 - 16 })).toBe(3);
		expect(spanFromPointer({ ...base, x: 100 + 3 * 80 - 16 + 20 })).toBe(3); // pembulatan
		expect(spanFromPointer({ ...base, x: 100 + 3 * 80 - 16 + 50 })).toBe(4);
		expect(spanFromPointer({ ...base, x: 0 })).toBe(1); // ke kiri sekali
		expect(spanFromPointer({ ...base, x: 99999 })).toBe(12);
		expect(spanFromPointer({ ...base, startColumn: 8, x: 99999 })).toBe(4); // hanya 4 kolom tersisa
		expect(spanFromPointer({ ...base, startColumn: 12, x: 99999 })).toBe(1);
	});
});
