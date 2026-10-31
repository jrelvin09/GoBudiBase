import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, emptyHistory, HISTORY_LIMIT, record, redo, undo } from './history';

describe('undo/redo murni', () => {
	it('undo dan redo menukar nilai sekarang dengan snapshot terdekat', () => {
		let h = emptyHistory<string>();
		h = record(h, 'a'); // sekarang b
		h = record(h, 'b'); // sekarang c
		const u1 = undo(h, 'c')!;
		expect(u1.value).toBe('b');
		const u2 = undo(u1.history, u1.value)!;
		expect(u2.value).toBe('a');
		expect(undo(u2.history, u2.value)).toBeNull();
		const r1 = redo(u2.history, u2.value)!;
		expect(r1.value).toBe('b');
		expect(redo(r1.history, r1.value)!.value).toBe('c');
	});

	it('perubahan baru menghapus jalur redo', () => {
		let h = record(emptyHistory<string>(), 'a');
		const u = undo(h, 'b')!;
		expect(canRedo(u.history)).toBe(true);
		h = record(u.history, 'a');
		expect(canRedo(h)).toBe(false);
	});

	it('kosong tak bisa undo/redo dan batas tumpukan dijaga', () => {
		const h = emptyHistory<number>();
		expect([canUndo(h), canRedo(h), undo(h, 1), redo(h, 1)]).toEqual([false, false, null, null]);
		let big = emptyHistory<number>();
		for (let i = 0; i < HISTORY_LIMIT + 20; i++) big = record(big, i);
		expect(big.past).toHaveLength(HISTORY_LIMIT);
		expect(big.past[0]).toBe(20);
	});

	it('tidak memutasi masukan', () => {
		const h = record(emptyHistory<string>(), 'a');
		const snapshot = JSON.stringify(h);
		undo(h, 'b');
		redo(h, 'b');
		expect(JSON.stringify(h)).toBe(snapshot);
	});
});
