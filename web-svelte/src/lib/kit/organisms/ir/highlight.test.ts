import { describe, expect, it } from 'vitest';
import { matches, rowHighlight } from './highlight';
import type { ReportHighlight } from './types';

const today = new Date('2026-09-27T10:00:00Z');

describe('matches', () => {
	it('eq on text is case-sensitive', () => {
		expect(matches('eq', 'Gold', 'Gold', 'text', today)).toBe(true);
		expect(matches('eq', 'gold', 'Gold', 'text', today)).toBe(false);
	});

	it('neq on text is the inverse', () => {
		expect(matches('neq', 'gold', 'Gold', 'text', today)).toBe(true);
	});

	it('eq on numbers compares numerically', () => {
		expect(matches('eq', 5, 5, 'number', today)).toBe(true);
		expect(matches('eq', '5', 5, 'number', today)).toBe(true);
		expect(matches('eq', 5, 6, 'number', today)).toBe(false);
	});

	it('eq on toggle compares booleans', () => {
		expect(matches('eq', true, true, 'toggle', today)).toBe(true);
		expect(matches('eq', false, true, 'toggle', today)).toBe(false);
	});

	it('gt/gte/lt/lte on numbers', () => {
		expect(matches('gt', 6, 5, 'number', today)).toBe(true);
		expect(matches('gte', 5, 5, 'number', today)).toBe(true);
		expect(matches('lt', 4, 5, 'number', today)).toBe(true);
		expect(matches('lte', 5, 5, 'number', today)).toBe(true);
		expect(matches('gt', null, 5, 'number', today)).toBe(false);
	});

	it('comparisons on dates use ISO string order', () => {
		expect(matches('gte', '2026-01-15', '2026-01-01', 'date', today)).toBe(true);
		expect(matches('lt', '2025-12-31', '2026-01-01', 'date', today)).toBe(true);
	});

	it('between is inclusive', () => {
		expect(matches('between', 5, [1, 5], 'number', today)).toBe(true);
		expect(matches('between', 6, [1, 5], 'number', today)).toBe(false);
		expect(matches('between', '2026-01-01', ['2026-01-01', '2026-01-31'], 'date', today)).toBe(true);
	});

	it('contains is case-insensitive', () => {
		expect(matches('contains', 'Budi Santoso', 'budi', 'text', today)).toBe(true);
		expect(matches('not_contains', 'Budi Santoso', 'andi', 'text', today)).toBe(true);
		expect(matches('not_contains', 'Budi', 'budi', 'text', today)).toBe(false);
	});

	it('starts_with is case-insensitive', () => {
		expect(matches('starts_with', 'Budi', 'BU', 'text', today)).toBe(true);
		expect(matches('starts_with', 'Andi', 'BU', 'text', today)).toBe(false);
	});

	it('in / not_in', () => {
		expect(matches('in', 'gold', ['gold', 'platinum'], 'select', today)).toBe(true);
		expect(matches('in', 'silver', ['gold'], 'select', today)).toBe(false);
		expect(matches('not_in', 'silver', ['gold'], 'select', today)).toBe(true);
	});

	it('is_null / not_null treat empty string as null', () => {
		expect(matches('is_null', null, null, 'text', today)).toBe(true);
		expect(matches('is_null', '', null, 'text', today)).toBe(true);
		expect(matches('not_null', 'x', null, 'text', today)).toBe(true);
		expect(matches('not_null', null, null, 'text', today)).toBe(false);
	});

	it('last N days includes the boundary', () => {
		expect(matches('last', '2026-09-01', { n: 30, unit: 'days' }, 'date', today)).toBe(true);
		expect(matches('last', '2026-08-28', { n: 30, unit: 'days' }, 'date', today)).toBe(true);
		expect(matches('last', '2026-08-27', { n: 30, unit: 'days' }, 'date', today)).toBe(false);
		expect(matches('last', '2026-09-27', { n: 30, unit: 'days' }, 'date', today)).toBe(true);
	});

	it('next N days looks forward', () => {
		expect(matches('next', '2026-10-04', { n: 7, unit: 'days' }, 'date', today)).toBe(true);
		expect(matches('next', '2026-10-05', { n: 7, unit: 'days' }, 'date', today)).toBe(false);
	});

	it('not_last is the inverse', () => {
		expect(matches('not_last', '2026-01-01', { n: 30, unit: 'days' }, 'date', today)).toBe(true);
	});

	it('months and years units', () => {
		expect(matches('last', '2026-08-27', { n: 1, unit: 'months' }, 'date', today)).toBe(true);
		expect(matches('last', '2025-10-27', { n: 1, unit: 'years' }, 'date', today)).toBe(true);
	});

	it('unknown operator never matches', () => {
		expect(matches('mystery', 'x', 'x', 'text', today)).toBe(false);
	});
});

function highlight(patch: Partial<ReportHighlight>): ReportHighlight {
	return {
		id: 'h1',
		name: 'Highlight',
		seq: 10,
		enabled: true,
		type: 'row',
		bg: null,
		fg: null,
		column: 'tier',
		op: 'eq',
		value: 'platinum',
		...patch
	};
}

describe('rowHighlight', () => {
	it('row highlight colours the whole row', () => {
		const result = rowHighlight({ tier: 'platinum' }, [highlight({ bg: 3 })], today);
		expect(result.row).toEqual({ bg: 3, fg: null });
		expect(result.cells).toEqual({});
	});

	it('cell highlight colours only the condition column', () => {
		const result = rowHighlight({ tier: 'platinum', name: 'x' }, [highlight({ type: 'cell', fg: 5 })], today);
		expect(result.row).toBeUndefined();
		expect(result.cells).toEqual({ tier: { bg: null, fg: 5 } });
	});

	it('disabled highlights never apply', () => {
		expect(rowHighlight({ tier: 'platinum' }, [highlight({ enabled: false })], today).row).toBeUndefined();
	});

	it('first match by ascending seq wins', () => {
		const result = rowHighlight(
			{ tier: 'platinum' },
			[highlight({ id: 'late', seq: 20, bg: 9 }), highlight({ id: 'early', seq: 5, bg: 2 })],
			today
		);
		expect(result.row).toEqual({ bg: 2, fg: null });
	});

	it('a non-matching highlight is skipped', () => {
		expect(rowHighlight({ tier: 'gold' }, [highlight({ bg: 3 })], today).row).toBeUndefined();
	});

	it('row and cell highlights combine', () => {
		const result = rowHighlight(
			{ tier: 'platinum', name: 'Budi' },
			[
				highlight({ id: 'r', type: 'row', column: 'tier', op: 'eq', value: 'platinum', bg: 1 }),
				highlight({ id: 'c', type: 'cell', column: 'name', op: 'contains', value: 'bud', fg: 4 })
			],
			today
		);
		expect(result.row).toEqual({ bg: 1, fg: null });
		expect(result.cells.name).toEqual({ bg: null, fg: 4 });
	});

	it('null conditions match with is_null', () => {
		const result = rowHighlight({ email: null }, [highlight({ column: 'email', op: 'is_null', value: null, bg: 6 })], today);
		expect(result.row).toEqual({ bg: 6, fg: null });
	});
});
