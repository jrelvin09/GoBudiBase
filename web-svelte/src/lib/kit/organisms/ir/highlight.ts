import type { ReportHighlight } from './types';

export type HighlightColor = { bg: number | null; fg: number | null };
export type RowHighlightResult = { row?: HighlightColor; cells: Record<string, HighlightColor> };

function asText(value: unknown): string {
	return value === null || value === undefined ? '' : String(value);
}

function asNumber(value: unknown): number | null {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function isNullish(value: unknown): boolean {
	return value === null || value === undefined || value === '';
}

function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function shift(iso: string, n: number, unit: string): string {
	const date = new Date(`${iso}T00:00:00Z`);
	if (unit === 'months') date.setUTCMonth(date.getUTCMonth() + n);
	else if (unit === 'years') date.setUTCFullYear(date.getUTCFullYear() + n);
	else date.setUTCDate(date.getUTCDate() + n);
	return isoDate(date);
}

function compare(a: string | number, b: string | number): number {
	if (a < b) return -1;
	return a > b ? 1 : 0;
}

/**
 * Evaluates one highlight condition (K3 §2.3 rules, matching the server):
 * eq/neq on text are case-sensitive, contains/starts_with are case-insensitive,
 * dates compare as ISO strings and `last`/`next` are relative to `today`.
 */
export function matches(op: string, cellValue: unknown, value: unknown, type: string, today: Date): boolean {
	switch (op) {
		case 'is_null':
			return isNullish(cellValue);
		case 'not_null':
			return !isNullish(cellValue);
		case 'eq':
		case 'neq': {
			let equal: boolean;
			if (type === 'number') {
				const a = asNumber(cellValue);
				const b = asNumber(value);
				equal = a !== null && b !== null && a === b;
			} else if (type === 'toggle') {
				equal = !isNullish(cellValue) && Boolean(cellValue) === Boolean(value);
			} else {
				equal = asText(cellValue) === asText(value);
			}
			return op === 'eq' ? equal : !equal;
		}
		case 'gt':
		case 'gte':
		case 'lt':
		case 'lte': {
			let cmp: number;
			if (type === 'date') {
				if (isNullish(cellValue) || isNullish(value)) return false;
				cmp = compare(asText(cellValue), asText(value));
			} else {
				const a = asNumber(cellValue);
				const b = asNumber(value);
				if (a === null || b === null) return false;
				cmp = compare(a, b);
			}
			return op === 'gt' ? cmp > 0 : op === 'gte' ? cmp >= 0 : op === 'lt' ? cmp < 0 : cmp <= 0;
		}
		case 'between': {
			const bounds = Array.isArray(value) ? value : [];
			if (bounds.length !== 2 || isNullish(cellValue)) return false;
			const [lo, hi] = bounds.map((bound) => (type === 'date' ? asText(bound) : asNumber(bound)));
			const cell = type === 'date' ? asText(cellValue) : asNumber(cellValue);
			if (cell === null || lo === null || hi === null) return false;
			return compare(cell, lo) >= 0 && compare(cell, hi) <= 0;
		}
		case 'contains':
		case 'not_contains': {
			const hit = asText(cellValue).toLowerCase().includes(asText(value).toLowerCase());
			return op === 'contains' ? hit : !hit;
		}
		case 'starts_with':
			return asText(cellValue).toLowerCase().startsWith(asText(value).toLowerCase());
		case 'in':
		case 'not_in': {
			const list = Array.isArray(value) ? value : [value];
			const hit = list.some((item) =>
				type === 'number' ? asNumber(item) === asNumber(cellValue) : asText(item) === asText(cellValue)
			);
			return op === 'in' ? hit : !hit;
		}
		case 'last':
		case 'not_last':
		case 'next':
		case 'not_next': {
			const range = (value ?? {}) as { n?: number; unit?: string };
			if (isNullish(cellValue)) return false;
			const todayISO = isoDate(today);
			const n = range.n ?? 0;
			const unit = range.unit ?? 'days';
			const forward = op === 'next' || op === 'not_next';
			const start = forward ? todayISO : shift(todayISO, -n, unit);
			const end = forward ? shift(todayISO, n, unit) : todayISO;
			const cell = asText(cellValue);
			const inside = compare(cell, start) >= 0 && compare(cell, end) <= 0;
			return op.startsWith('not_') ? !inside : inside;
		}
	}
	return false;
}

/** Field type implied by the highlight's value, since the row-level API takes
 * no resource metadata. */
function inferType(op: string, value: unknown): string {
	if (op === 'last' || op === 'not_last' || op === 'next' || op === 'not_next') return 'date';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'toggle';
	if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') return 'number';
	return 'text';
}

/**
 * Applies the K3 §1.6 precedence: enabled highlights in ascending `seq`, first
 * match per row/cell wins; `row` colour covers the whole row, `cell` only the
 * condition's column.
 */
export function rowHighlight(
	row: Record<string, unknown>,
	highlights: ReportHighlight[],
	today: Date
): RowHighlightResult {
	const result: RowHighlightResult = { cells: {} };
	const ordered = highlights.filter((h) => h.enabled).sort((a, b) => a.seq - b.seq);
	for (const highlight of ordered) {
		const type = inferType(highlight.op, highlight.value);
		if (!matches(highlight.op, row[highlight.column], highlight.value, type, today)) continue;
		const color: HighlightColor = { bg: highlight.bg, fg: highlight.fg };
		if (highlight.type === 'row') {
			if (!result.row) result.row = color;
		} else if (!result.cells[highlight.column]) {
			result.cells[highlight.column] = color;
		}
	}
	return result;
}
