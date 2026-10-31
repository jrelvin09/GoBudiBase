import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from '$lib/i18n/index.svelte';
import type { FieldMeta } from '$lib/kit/fields/types';
import { isPasteable, parseDateText, parsePaste, pasteableFields } from './paste';

function field(name: string, type: FieldMeta['type'], extra: Partial<FieldMeta> = {}): FieldMeta {
	return { name, type, label: name, required: false, in_table: true, ...extra };
}

const columns = [field('code', 'text'), field('qty', 'number'), field('active', 'toggle')];

describe('parsePaste (F8-01)', () => {
	beforeEach(() => setLocale('id'));

	it('lays a TSV block out from the active cell to the right and down', () => {
		const result = parsePaste('A\t1\tya\nB\t2\ttidak', columns, 0, 0);
		expect(result.rows).toBe(2);
		expect(result.hasErrors).toBe(false);
		expect(result.cells).toEqual([
			{ row: 0, column: 'code', value: 'A' },
			{ row: 0, column: 'qty', value: 1 },
			{ row: 0, column: 'active', value: true },
			{ row: 1, column: 'code', value: 'B' },
			{ row: 1, column: 'qty', value: 2 },
			{ row: 1, column: 'active', value: false }
		]);
	});

	it('starts at the given row and column offsets', () => {
		const result = parsePaste('7\tya', columns, 3, 1);
		expect(result.cells).toEqual([
			{ row: 3, column: 'qty', value: 7 },
			{ row: 3, column: 'active', value: true }
		]);
	});

	it('reads numbers with the active locale separators', () => {
		expect(parsePaste('1.234,5', [field('qty', 'number')], 0, 0).cells[0].value).toBe(1234.5);
		setLocale('en-US');
		expect(parsePaste('1,234.5', [field('qty', 'number')], 0, 0).cells[0].value).toBe(1234.5);
	});

	it('marks an unparseable value as an error instead of an empty value', () => {
		const result = parsePaste('abc', [field('qty', 'number')], 0, 0);
		expect(result.hasErrors).toBe(true);
		expect(result.cells[0]).toEqual({ row: 0, column: 'qty', error: 'kit.item.invalid_number' });
		expect('value' in result.cells[0]).toBe(false);
	});

	it('keeps an out-of-range number but flags it', () => {
		const result = parsePaste('5', [field('qty', 'number', { min: 10 })], 0, 0);
		expect(result.cells[0]).toEqual({ row: 0, column: 'qty', value: 5, error: 'kit.item.min_value' });
	});

	it('accepts the documented toggle words and rejects the rest', () => {
		const toggle = [field('active', 'toggle')];
		for (const word of ['ya', 'yes', 'TRUE', '1']) {
			expect(parsePaste(word, toggle, 0, 0).cells[0].value).toBe(true);
		}
		for (const word of ['tidak', 'no', 'false', '0']) {
			expect(parsePaste(word, toggle, 0, 0).cells[0].value).toBe(false);
		}
		expect(parsePaste('mungkin', toggle, 0, 0).cells[0].error).toBe('kit.item.invalid_toggle');
	});

	it('reads ISO and locale dates, rejecting a bad one', () => {
		const date = [field('counted_on', 'date')];
		expect(parsePaste('2026-09-26', date, 0, 0).cells[0].value).toBe('2026-09-26');
		expect(parsePaste('26/09/2026', date, 0, 0).cells[0].value).toBe('2026-09-26');
		setLocale('en-US');
		expect(parsePaste('09/26/2026', date, 0, 0).cells[0].value).toBe('2026-09-26');
		expect(parsePaste('2026-02-30', date, 0, 0).cells[0].error).toBe('kit.item.invalid_date');
	});

	it('matches a select value or label and rejects something else', () => {
		const select = [field('status', 'select', { options: [{ value: 'open', label: 'Open' }] })];
		expect(parsePaste('open', select, 0, 0).cells[0].value).toBe('open');
		expect(parsePaste('Open', select, 0, 0).cells[0].value).toBe('open');
		expect(parsePaste('closed', select, 0, 0).cells[0].error).toBe('kit.item.invalid_option');
	});

	it('skips empty cells, empty lines, the trailing newline, and surplus columns', () => {
		const result = parsePaste('A\t\tB\textra\n', [field('a', 'text'), field('b', 'text')], 0, 0);
		expect(result.rows).toBe(1);
		expect(result.cells).toEqual([{ row: 0, column: 'a', value: 'A' }]);
	});

	it('leaves non-editable field types out of a paste', () => {
		expect(isPasteable('text')).toBe(true);
		expect(isPasteable('number')).toBe(true);
		expect(isPasteable('belongs_to')).toBe(false);
		expect(isPasteable('file')).toBe(false);
		expect(isPasteable('image')).toBe(false);
	});

	it('targets only writable, in-table, unlocked columns (F8-02)', () => {
		const fields = [
			field('code', 'text'),
			field('on_hand', 'number', { read_only: true }),
			field('locked', 'text'),
			field('hidden', 'text', { in_table: false }),
			field('link', 'belongs_to')
		];
		expect(pasteableFields(fields, 'locked').map((f) => f.name)).toEqual(['code']);
	});
});

describe('parseDateText (F8-01)', () => {
	it('returns null for an unrecognized date', () => {
		expect(parseDateText('not a date', 'id')).toBeNull();
	});
});
