import { describe, expect, it } from 'vitest';
import { kanbanHasMore, mergeKanbanRows } from './kanban';

const row = (id: string) => ({ id });

describe('mergeKanbanRows', () => {
	it('menambahkan halaman berikutnya di belakang baris yang sudah dimuat', () => {
		const merged = mergeKanbanRows([row('1'), row('2')], [row('3')]);
		expect(merged.map((r) => r.id)).toEqual(['1', '2', '3']);
	});

	it('tidak menggandakan baris yang id-nya sudah ada (offset bisa bergeser)', () => {
		const merged = mergeKanbanRows([row('1'), row('2')], [row('2'), row('3')]);
		expect(merged.map((r) => r.id)).toEqual(['1', '2', '3']);
	});
});

describe('kanbanHasMore', () => {
	it('mengikuti has_next dari meta server', () => {
		expect(kanbanHasMore([row('1')], 100, true)).toBe(true);
		expect(kanbanHasMore([row('1')], 100, false)).toBe(false);
	});

	it('tanpa meta: halaman penuh menandakan masih ada sisa, halaman pendek tidak', () => {
		expect(kanbanHasMore(Array.from({ length: 100 }, (_, i) => row(String(i))), 100)).toBe(true);
		expect(kanbanHasMore([row('1')], 100)).toBe(false);
	});
});
