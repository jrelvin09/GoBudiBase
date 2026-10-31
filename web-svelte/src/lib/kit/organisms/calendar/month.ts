/** Model murni tampilan bulan Calendar (K6-04). */

/** 0 = Minggu, 1 = Senin. */
export type WeekStart = 0 | 1;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Senin untuk locale id, Minggu untuk locale lain (K6-04). */
export function weekStartFor(locale: string): WeekStart {
	return locale.startsWith('id') ? 1 : 0;
}

/** 6×7 tanggal ISO yang menutupi bulan `month` (1–12). */
export function monthGrid(year: number, month: number, weekStart: WeekStart): string[][] {
	const first = new Date(year, month - 1, 1);
	const offset = (first.getDay() - weekStart + 7) % 7;
	const grid: string[][] = [];
	for (let row = 0; row < 6; row++) {
		const days: string[] = [];
		for (let col = 0; col < 7; col++) {
			const date = new Date(year, month - 1, 1 - offset + row * 7 + col);
			days.push(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
		}
		grid.push(days);
	}
	return grid;
}

/** Tanggal pertama dan terakhir yang terlihat di grid. */
export function visibleRange(grid: string[][]): [string, string] {
	const flat = grid.flat();
	return [flat[0], flat[flat.length - 1]];
}

/** Baris dikelompokkan per tanggal (bagian `YYYY-MM-DD` dari field). */
export function eventsByDay(
	rows: Record<string, unknown>[],
	field: string
): Record<string, Record<string, unknown>[]> {
	const out: Record<string, Record<string, unknown>[]> = {};
	for (const row of rows) {
		const raw = row[field];
		if (raw === null || raw === undefined || raw === '') continue;
		const key = String(raw).slice(0, 10);
		(out[key] ??= []).push(row);
	}
	return out;
}