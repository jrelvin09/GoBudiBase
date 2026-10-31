import { describe, expect, it } from 'vitest';
import { isVisible } from './visibility';

describe('isVisible', () => {
	it('tanpa visible_when selalu tampil', () => {
		expect(isVisible({}, { kind: 'individual' })).toBe(true);
		expect(isVisible({ visible_when: undefined }, {})).toBe(true);
	});

	it('tampil bila nilai acuan salah satu dari values', () => {
		expect(isVisible({ visible_when: { field: 'kind', values: ['business'] } }, { kind: 'business' })).toBe(true);
		expect(
			isVisible({ visible_when: { field: 'kind', values: ['business', 'government'] } }, { kind: 'government' })
		).toBe(true);
	});

	it('sembunyi bila nilai acuan lain atau belum diisi', () => {
		const field = { visible_when: { field: 'kind', values: ['business'] } };
		expect(isVisible(field, { kind: 'individual' })).toBe(false);
		expect(isVisible(field, {})).toBe(false);
		expect(isVisible(field, { kind: null })).toBe(false);
	});

	it('membandingkan toggle sebagai teks', () => {
		const field = { visible_when: { field: 'blocked', values: [true] } };
		expect(isVisible(field, { blocked: true })).toBe(true);
		expect(isVisible(field, { blocked: false })).toBe(false);
	});
});