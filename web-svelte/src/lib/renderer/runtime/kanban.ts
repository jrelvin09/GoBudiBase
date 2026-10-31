import type { FieldMeta } from '$lib/kit/fields/types';

export interface KanbanColumn {
	value: string;
	label: string;
	rows: Record<string, unknown>[];
}

/**
 * Kolom papan kanban: satu kolom per opsi field select (urutan opsi), ditambah satu
 * kolom "tanpa nilai/tidak dikenal" hanya bila ada rekaman yang tidak cocok dengan
 * opsi mana pun (mis. nilai kosong atau opsi yang sudah dihapus).
 */
export function kanbanColumns(field: FieldMeta | undefined, rows: readonly Record<string, unknown>[], groupBy: string): KanbanColumn[] {
	if (!field || field.type !== 'select') return [];
	const columns: KanbanColumn[] = (field.options ?? []).map((o) => ({ value: String(o.value), label: o.label, rows: [] }));
	const index = new Map(columns.map((c, i) => [c.value, i]));
	const other: KanbanColumn = { value: '', label: '—', rows: [] };
	for (const row of rows) {
		const at = index.get(String(row[groupBy] ?? ''));
		(at === undefined ? other : columns[at]).rows.push(row);
	}
	return other.rows.length > 0 ? [...columns, other] : columns;
}

/** Gabungkan halaman kanban berikutnya ke baris yang sudah dimuat; baris
 * dengan id yang sudah ada tidak digandakan (offset bisa bergeser antar permintaan). */
export function mergeKanbanRows(current: readonly Record<string, unknown>[], next: readonly Record<string, unknown>[]): Record<string, unknown>[] {
	const seen = new Set(current.map((row) => String(row.id)));
	return [...current, ...next.filter((row) => !seen.has(String(row.id)))];
}

/** Masih ada sisa rekaman setelah halaman terakhir? `hasNext` dari meta server
 * yang menentukan; tanpa meta, halaman penuh menandakan kemungkinan sisa. */
export function kanbanHasMore(lastPage: readonly Record<string, unknown>[], pageSize: number, hasNext?: boolean): boolean {
	return hasNext ?? lastPage.length === pageSize;
}
