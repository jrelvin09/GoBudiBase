import { describe, expect, it } from 'vitest';
import { eventsByDay, monthGrid, visibleRange, weekStartFor } from './month';

describe('weekStartFor', () => {
	it('Senin untuk id, Minggu untuk en', () => {
		expect(weekStartFor('id')).toBe(1);
		expect(weekStartFor('id-ID')).toBe(1);
		expect(weekStartFor('en')).toBe(0);
		expect(weekStartFor('en-US')).toBe(0);
	});
});

describe('monthGrid', () => {
	it('selalu 6 baris × 7 kolom', () => {
		const grid = monthGrid(2026, 9, 1);
		expect(grid).toHaveLength(6);
		for (const row of grid) expect(row).toHaveLength(7);
	});

	it('minggu dimulai Senin: September 2026 mulai 31 Agustus', () => {
		const grid = monthGrid(2026, 9, 1);
		expect(grid[0][0]).toBe('2026-08-31');
		expect(grid[5][6]).toBe('2026-10-11');
	});

	it('minggu dimulai Minggu: September 2026 mulai 30 Agustus', () => {
		const grid = monthGrid(2026, 9, 0);
		expect(grid[0][0]).toBe('2026-08-30');
	});

	it('memuat semua tanggal bulan itu', () => {
		const flat = monthGrid(2026, 9, 1).flat();
		expect(flat).toContain('2026-09-01');
		expect(flat).toContain('2026-09-30');
	});	it('tanggal berurutan tanpa celah', () => {
		const flat = monthGrid(2026, 9, 1).flat();
		for (let i = 1; i < flat.length; i++) {
			const prev = new Date(flat[i - 1]);
			const next = new Date(flat[i]);
			prev.setDate(prev.getDate() + 1);
			expect(next.getTime()).toBe(prev.getTime());
		}
	});
});

describe('visibleRange', () => {
	it('tanggal pertama dan terakhir grid', () => {
		expect(visibleRange(monthGrid(2026, 9, 1))).toEqual(['2026-08-31', '2026-10-11']);
	});

	it('mengikuti bulan lain', () => {
		expect(visibleRange(monthGrid(2026, 2, 0))).toEqual(['2026-02-01', '2026-03-14']);
	});
});

describe('eventsByDay', () => {
	const rows = [
		{ id: '1', customer_since: '2024-03-11' },
		{ id: '2', customer_since: '2024-03-11' },
		{ id: '3', customer_since: '2023-07-01' }
	];

	it('mengelompokkan baris per tanggal', () => {
		const groups = eventsByDay(rows, 'customer_since');
		expect(Object.keys(groups).sort()).toEqual(['2023-07-01', '2024-03-11']);
		expect(groups['2024-03-11'].map((row) => row.id)).toEqual(['1', '2']);
	});

	it('mengabaikan nilai kosong', () => {
		const groups = eventsByDay(
			[{ id: '1', customer_since: null }, { id: '2', customer_since: '' }, { id: '3' }],
			'customer_since'
		);
		expect(groups).toEqual({});
	});

	it('mengambil bagian tanggal dari timestamp', () => {
		const groups = eventsByDay([{ id: '1', customer_since: '2024-03-11T09:30:00Z' }], 'customer_since');
		expect(Object.keys(groups)).toEqual(['2024-03-11']);
	});
});