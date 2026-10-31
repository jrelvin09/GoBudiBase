import type { FieldMeta } from '$lib/kit/fields/types';
import { getLocale } from '$lib/i18n/index.svelte';
import { fromEditText } from '$lib/kit/molecules/number-input';

/** One cell a paste writes (F8-01). `error` is an i18n key the caller translates. */
export type PasteCell = {
	/** Absolute row index in the grid, counted from `startRow`. */
	row: number;
	/** Target field name. */
	column: string;
	/** Parsed value; absent for a cell that could not be parsed at all. */
	value?: unknown;
	/** Translation key when the raw text is not valid for the field type. */
	error?: string;
};

export type PasteResult = {
	/** One entry per non-empty pasted cell, in reading order. */
	cells: PasteCell[];
	/** How many grid rows the pasted block spans, starting at `startRow`. */
	rows: number;
	/** True when at least one cell could not be parsed. */
	hasErrors: boolean;
};

// Field types a paste may write; the rest (belongs_to, file, image) need the
// editor's own control, so a paste must not touch them.
const PASTEABLE = new Set(['text', 'textarea', 'email', 'number', 'select', 'toggle', 'date']);

export function isPasteable(type: string): boolean {
	return PASTEABLE.has(type);
}

/**
 * Fields a paste may write, in visual order (F8-01): in-table columns of a
 * pasteable type, excluding the relation's locked column and any ReadOnly field
 * (F8-02), which the client must not edit.
 */
export function pasteableFields(fields: FieldMeta[], lockedColumn?: string): FieldMeta[] {
	return fields.filter(
		(field) =>
			field.in_table &&
			field.name !== lockedColumn &&
			field.read_only !== true &&
			isPasteable(field.type)
	);
}

const TRUE_WORDS = new Set(['ya', 'yes', 'true', '1']);
const FALSE_WORDS = new Set(['tidak', 'no', 'false', '0']);

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

function isoFromParts(year: number, month: number, day: number): string | null {
	const fullYear = year < 100 ? year + 2000 : year;
	const date = new Date(Date.UTC(fullYear, month - 1, day));
	if (
		date.getUTCFullYear() !== fullYear ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return `${String(fullYear).padStart(4, '0')}-${pad(month)}-${pad(day)}`;
}

/** Order the locale writes a numeric date in (`d`, `m`, or `y`), straight from Intl. */
function dateOrder(locale: string): string[] {
	return new Intl.DateTimeFormat(locale)
		.formatToParts(new Date(Date.UTC(2026, 11, 31)))
		.filter((part) => part.type === 'year' || part.type === 'month' || part.type === 'day')
		.map((part) => part.type[0]);
}

/** ISO (`2026-09-26`) or the active locale's numeric format; null when invalid. */
export function parseDateText(text: string, locale: string = getLocale()): string | null {
	const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
	if (iso) return isoFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
	const numeric = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{1,4})$/.exec(text);
	if (numeric) {
		const parts: Record<string, number> = {};
		dateOrder(locale).forEach((key, index) => {
			parts[key] = Number(numeric[index + 1]);
		});
		return isoFromParts(parts.y, parts.m, parts.d);
	}
	const parsed = new Date(text);
	if (!Number.isNaN(parsed.getTime())) {
		return isoFromParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
	}
	return null;
}

function selectValue(column: FieldMeta, text: string): string | null {
	const options = column.options ?? [];
	if (options.length === 0) return text;
	const byValue = options.find((option) => option.value === text);
	if (byValue) return byValue.value;
	const lower = text.toLowerCase();
	const byLabel = options.find((option) => option.label.toLowerCase() === lower);
	return byLabel ? byLabel.value : null;
}

/** Parses one raw cell for its column type; null means an empty cell (leave it). */
function parseCell(raw: string, column: FieldMeta, row: number): PasteCell | null {
	if (raw.trim() === '') return null;
	switch (column.type) {
		case 'number': {
			const parsed = fromEditText(raw, { min: column.min, max: column.max });
			if (parsed.error === 'invalid') return { row, column: column.name, error: 'kit.item.invalid_number' };
			if (parsed.error === 'min') {
				return { row, column: column.name, value: parsed.value, error: 'kit.item.min_value' };
			}
			if (parsed.error === 'max') {
				return { row, column: column.name, value: parsed.value, error: 'kit.item.max_value' };
			}
			return { row, column: column.name, value: parsed.value };
		}
		case 'toggle': {
			const word = raw.trim().toLowerCase();
			if (TRUE_WORDS.has(word)) return { row, column: column.name, value: true };
			if (FALSE_WORDS.has(word)) return { row, column: column.name, value: false };
			return { row, column: column.name, error: 'kit.item.invalid_toggle' };
		}
		case 'date': {
			const iso = parseDateText(raw.trim());
			if (!iso) return { row, column: column.name, error: 'kit.item.invalid_date' };
			return { row, column: column.name, value: iso };
		}
		case 'select': {
			const value = selectValue(column, raw.trim());
			if (value === null) return { row, column: column.name, error: 'kit.item.invalid_option' };
			return { row, column: column.name, value };
		}
		default:
			return { row, column: column.name, value: raw };
	}
}

/**
 * Parses a clipboard block (rows by `\r?\n`, cells by `\t`) into grid cells,
 * starting at `startRow`/`startCol` and moving right and down. `columns` is the
 * list of editable columns in visual order, so every TSV column lands on an
 * editable one; the surplus beyond the last column is ignored. An invalid value
 * yields a cell with `error` instead of a silent empty value (F8-01).
 */
export function parsePaste(
	text: string,
	columns: FieldMeta[],
	startRow: number,
	startCol: number
): PasteResult {
	if (text === '') return { cells: [], rows: 0, hasErrors: false };
	const lines = text.replace(/\r\n?/g, '\n').split('\n');
	if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
	const cells: PasteCell[] = [];
	let hasErrors = false;
	lines.forEach((line, offset) => {
		const row = startRow + offset;
		line.split('\t').forEach((raw, index) => {
			const column = columns[startCol + index];
			if (!column) return;
			const cell = parseCell(raw, column, row);
			if (!cell) return;
			if (cell.error) hasErrors = true;
			cells.push(cell);
		});
	});
	return { cells, rows: lines.length, hasErrors };
}
