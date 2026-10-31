import { describe, expect, it } from 'vitest';
import { historyDiff, relativeTime, type HistoryEntry } from './history';

function entry(
	operation: HistoryEntry['operation'],
	version: number,
	snapshot: Record<string, unknown>,
	changed?: string[]
): HistoryEntry {
	return { operation, version, snapshot, changed_fields: changed, actor_name: 'A', occurred_at: '2026-01-01T00:00:00Z' };
}

describe('historyDiff', () => {
	it('entri update terbaru memakai record sekarang sebagai nilai baru', () => {
		const diff = historyDiff([entry('update', 2, { name: 'A' }, ['name'])], { name: 'B' });
		expect(diff[0].changes).toEqual([{ field: 'name', from: 'A', to: 'B' }]);
	});

	it('entri update lama memakai snapshot entri yang lebih baru', () => {
		const entries = [entry('update', 3, { name: 'B' }, ['name']), entry('update', 2, { name: 'A' }, ['name'])];
		const diff = historyDiff(entries, { name: 'C' });
		expect(diff[1].changes).toEqual([{ field: 'name', from: 'A', to: 'B' }]);
	});

	it('create dan delete tidak punya daftar perubahan', () => {
		const diff = historyDiff([entry('create', 1, { name: 'A' }), entry('delete', 1, { name: 'A' })], null);
		expect(diff.every((row) => row.changes.length === 0)).toBe(true);
	});
	it('record sekarang null membuat nilai baru null', () => {
		const diff = historyDiff([entry('update', 2, { name: 'A' }, ['name'])], null);
		expect(diff[0].changes).toEqual([{ field: 'name', from: 'A', to: null }]);
	});

	it('beberapa field mengikuti urutan changed_fields', () => {
		const diff = historyDiff(
			[entry('update', 2, { a: 1, b: 2 }, ['b', 'a'])],
			{ a: 3, b: 4 }
		);
		expect(diff[0].changes).toEqual([
			{ field: 'b', from: 2, to: 4 },
			{ field: 'a', from: 1, to: 3 }
		]);
	});

	it('update tanpa changed_fields tidak menampilkan perubahan', () => {
		expect(historyDiff([entry('update', 2, { a: 1 })], { a: 2 })[0].changes).toEqual([]);
	});

	it('field yang hilang di snapshot baru menjadi null', () => {
		expect(historyDiff([entry('update', 2, { a: 1 }, ['a'])], {})[0].changes).toEqual([
			{ field: 'a', from: 1, to: null }
		]);
	});
});

describe('relativeTime', () => {
	it('menghasilkan waktu relatif dan kosong untuk tanggal tidak valid', () => {
		const now = new Date('2026-01-10T12:00:00Z');
		const recent = relativeTime('2026-01-10T11:59:00Z', now);
		expect(recent).not.toBe('');
		expect(relativeTime('2026-01-08T12:00:00Z', now)).not.toBe(recent);
		expect(relativeTime('bukan tanggal', now)).toBe('');
	});
});