import { describe, expect, it } from 'vitest';
import { contrastRatio, foregroundFor, isHexColor, relativeLuminance } from './color';

describe('isHexColor (T2-06)', () => {
	it('accepts only #rrggbb', () => {
		expect(isHexColor('#1f6f43')).toBe(true);
		expect(isHexColor('#1F6F43')).toBe(true);
		for (const value of ['1f6f43', '#1f6f4', '#gg6f43', '', null, undefined]) {
			expect(isHexColor(value)).toBe(false);
		}
	});
});

describe('contrast helpers (T2-06, mirrors fw/color.go)', () => {
	it('computes the WCAG extremes', () => {
		expect(relativeLuminance('#000000')).toBe(0);
		expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
		expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
	});

	it('picks the readable foreground', () => {
		expect(foregroundFor('#1f6f43')).toBe('#ffffff');
		expect(foregroundFor('#ffe066')).toBe('#111111');
		expect(foregroundFor('#767676')).toBe('#ffffff');
		expect(foregroundFor('#ffffff')).toBe('#111111');
	});
});
