import { getLocale } from '$lib/i18n/index.svelte';

/** Satu entri `_history`/`_deleted` (F2-12). `snapshot` adalah record JSON. */
export type HistoryEntry = {
	record_id?: string;
	operation: 'create' | 'update' | 'delete';
	version: number;
	changed_fields?: string[];
	snapshot: Record<string, unknown> | null;
	actor_name: string;
	occurred_at: string;
};

export type HistoryChange = { field: string; from: unknown; to: unknown };

export type HistoryDiffEntry = { entry: HistoryEntry; changes: HistoryChange[] };

/**
 * Pasangan lama → baru untuk tiap entri update (F2-13). Snapshot backend adalah
 * keadaan SEBELUM operasi, jadi nilai "baru" sebuah update diambil dari entri
 * yang lebih baru (keadaan sesudahnya); entri terbaru memakai record sekarang.
 */
export function historyDiff(
	entries: HistoryEntry[],
	current: Record<string, unknown> | null
): HistoryDiffEntry[] {
	return entries.map((entry, index) => {
		if (entry.operation !== 'update') return { entry, changes: [] };
		const newer = index > 0 ? entries[index - 1].snapshot : current;
		const changes = (entry.changed_fields ?? []).map((field) => ({
			field,
			from: entry.snapshot?.[field] ?? null,
			to: newer?.[field] ?? null
		}));
		return { entry, changes };
	});
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 31_536_000],
	['month', 2_592_000],
	['week', 604_800],
	['day', 86_400],
	['hour', 3_600],
	['minute', 60],
	['second', 1]
];

/** Waktu relatif lokalisasi ("2 hari yang lalu") untuk timeline (F2-13). */
export function relativeTime(iso: string, now: Date = new Date()): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return '';
	const delta = Math.round((then - now.getTime()) / 1000);
	const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
	for (const [unit, seconds] of RELATIVE_UNITS) {
		if (Math.abs(delta) >= seconds || unit === 'second') {
			return rtf.format(Math.round(delta / seconds), unit);
		}
	}
	return '';
}