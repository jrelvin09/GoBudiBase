import { describe, expect, it } from 'vitest';
import { navKey, nextCell, type CellBounds } from './keyboard';

const bounds: CellBounds = { rows: 3, columns: 4 };
const at = (row: number, column: number) => ({ row, column });

describe('nextCell (K5-04, tabel §1.3)', () => {
	it('moves right and left', () => {
		expect(nextCell(at(1, 1), 'ArrowRight', bounds)).toEqual(at(1, 2));
		expect(nextCell(at(1, 1), 'ArrowLeft', bounds)).toEqual(at(1, 0));
	});

	it('moves down and up', () => {
		expect(nextCell(at(0, 2), 'ArrowDown', bounds)).toEqual(at(1, 2));
		expect(nextCell(at(2, 2), 'ArrowUp', bounds)).toEqual(at(1, 2));
	});

	it('stops at the left and right edge', () => {
		expect(nextCell(at(1, 0), 'ArrowLeft', bounds)).toEqual(at(1, 0));
		expect(nextCell(at(1, 3), 'ArrowRight', bounds)).toEqual(at(1, 3));
	});

	it('stops at the first and last row', () => {
		expect(nextCell(at(0, 0), 'ArrowUp', bounds)).toEqual(at(0, 0));
		expect(nextCell(at(2, 0), 'ArrowDown', bounds)).toEqual(at(2, 0));
	});

	it('Home and End go to the first and last cell of the row', () => {
		expect(nextCell(at(2, 2), 'Home', bounds)).toEqual(at(2, 0));
		expect(nextCell(at(0, 1), 'End', bounds)).toEqual(at(0, 3));
	});

	it('Tab and Shift+Tab move one column without leaving the row', () => {
		expect(nextCell(at(1, 0), 'Tab', bounds)).toEqual(at(1, 1));
		expect(nextCell(at(1, 3), 'Tab', bounds)).toEqual(at(1, 3));
		expect(nextCell(at(1, 2), 'ShiftTab', bounds)).toEqual(at(1, 1));
		expect(nextCell(at(1, 0), 'ShiftTab', bounds)).toEqual(at(1, 0));
	});

	it('leaves editing keys and unknown keys to the grid', () => {
		for (const key of ['Enter', 'F2', 'Escape', ' ', 'a', 'PageDown']) {
			expect(nextCell(at(1, 1), key, bounds)).toBeNull();
		}
	});

	it('returns null for an empty grid', () => {
		expect(nextCell(at(0, 0), 'ArrowRight', { rows: 0, columns: 0 })).toBeNull();
		expect(nextCell(at(0, 0), 'ArrowRight', { rows: 3, columns: 0 })).toBeNull();
	});

	it('does not mutate the position it was given', () => {
		const pos = at(1, 1);
		nextCell(pos, 'ArrowDown', bounds);
		expect(pos).toEqual(at(1, 1));
	});
});

describe('navKey (K5-04)', () => {
	it('folds Shift+Tab into one name', () => {
		expect(navKey('Tab', true)).toBe('ShiftTab');
		expect(navKey('Tab', false)).toBe('Tab');
		expect(navKey('Enter', true)).toBe('Enter');
	});
});
