import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '$lib/i18n/index.svelte';
import {
	addBreak,
	addComputation,
	addFilter,
	availableViews,
	chartPoints,
	computationAliases,
	computationField,
	describeAggregate,
	describeBreak,
	describeFilter,
	describeHighlight,
	hideColumn,
	newId,
	normalizeSettings,
	restrictColumns,
	buildInitialSettings,
	withLockedFilters,
	operatorsFor,
	pivotCellKey,
	removeAggregate,
	removeBreak,
	removeComputation,
	removeFilter,
	removeHighlight,
	reportOptionLabel,
	setGroupBy,
	setPageSize,
	setView,
	singleValueOperatorsFor,
	setSortOnly,
	toggleAggregate,
	toggleBreak,
	toggleFilter,
	toggleHighlight,
	updateComputation,
	updateFilter,
	visibleColumns,
	withLockedFilter
} from './model';
import type { ReportFilter, ReportMeta, ReportSettings, SavedReport } from './types';

afterEach(() => setLocale('en'));

const meta: ReportMeta = {
	fields: [
		{ name: 'code', type: 'text', label: 'Code', required: false, in_table: true },
		{ name: 'name', type: 'text', label: 'Name', required: false, in_table: true },
		{ name: 'email', type: 'email', label: 'Email', required: false, in_table: true },
		{
			name: 'tier',
			type: 'select',
			label: 'Tier',
			required: false,
			in_table: true,
			options: [
				{ value: 'gold', label: 'Gold' },
				{ value: 'platinum', label: 'Platinum' }
			]
		},
		{ name: 'credit_limit', type: 'number', label: 'Credit Limit', required: false, in_table: true },
		{ name: 'active', type: 'toggle', label: 'Active', required: false, in_table: true },
		{ name: 'customer_since', type: 'date', label: 'Customer Since', required: false, in_table: true },
		{ name: 'notes', type: 'textarea', label: 'Notes', required: false, in_table: true }
	]
};

function settings(): ReportSettings {
	return {
		columns: ['code', 'name', 'tier', 'credit_limit'],
		filters: [],
		sort: [],
		breaks: [],
		highlights: [],
		aggregates: [],
		page_size: 15,
		view: 'report',
		group_by: null,
		pivot: null,
		chart: null,
		computations: [],
		widths: {},
		frozen: null
	};
}

function filter(patch: Partial<ReportFilter>): ReportFilter {
	return { id: 'f1', kind: 'column', column: 'name', op: 'eq', value: null, enabled: true, ...patch };
}

describe('operatorsFor', () => {
	it('text: eq..is_null in table order', () => {
		expect(operatorsFor('text')).toEqual([
			'eq', 'neq', 'contains', 'not_contains', 'starts_with', 'in', 'not_in', 'is_null', 'not_null'
		]);
	});

	it('number includes the comparisons and between', () => {
		expect(operatorsFor('number')).toEqual([
			'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'is_null', 'not_null'
		]);
	});

	it('date adds the relative operators', () => {
		expect(operatorsFor('date')).toContain('last');
		expect(operatorsFor('date')).toContain('next');
	});

	it('textarea only supports text-matching and null checks', () => {
		expect(operatorsFor('textarea')).toEqual(['contains', 'not_contains', 'is_null', 'not_null']);
	});

	it('select has no ordering operators', () => {
		expect(operatorsFor('select')).toEqual(['eq', 'neq', 'in', 'not_in', 'is_null', 'not_null']);
	});

	it('toggle is eq plus null checks', () => {
		expect(operatorsFor('toggle')).toEqual(['eq', 'is_null', 'not_null']);
	});

	it('belongs_to allows the relation operators', () => {
		expect(operatorsFor('belongs_to')).toEqual(['eq', 'neq', 'in', 'not_in', 'is_null', 'not_null']);
	});

	it('unknown type has no operators', () => {
		expect(operatorsFor('mystery')).toEqual([]);
	});
});

describe('singleValueOperatorsFor (K3-F17a highlight conditions)', () => {
	it('drops the multi-value operators for numbers', () => {
		expect(singleValueOperatorsFor('number')).toEqual([
			'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is_null', 'not_null'
		]);
	});

	it('drops the relative operators for dates', () => {
		expect(singleValueOperatorsFor('date')).not.toContain('last');
		expect(singleValueOperatorsFor('date')).not.toContain('between');
		expect(singleValueOperatorsFor('date')).toContain('gte');
	});

	it('drops in/not_in for text and select', () => {
		expect(singleValueOperatorsFor('text')).not.toContain('in');
		expect(singleValueOperatorsFor('select')).toEqual(['eq', 'neq', 'is_null', 'not_null']);
	});

	it('is a subset of operatorsFor for every type', () => {
		for (const type of ['text', 'email', 'textarea', 'number', 'date', 'select', 'toggle']) {
			for (const op of singleValueOperatorsFor(type)) {
				expect(operatorsFor(type)).toContain(op);
			}
		}
	});
});

describe('normalizeSettings K4 views', () => {
	it('view tidak dikenal jatuh kembali ke report', () => {
		expect(normalizeSettings({ view: 'bogus' } as never).view).toBe('report');
	});

	it('blok view yang tidak ada tetap null', () => {
		const normalized = normalizeSettings(settings() as never);
		expect(normalized.group_by).toBeNull();
		expect(normalized.pivot).toBeNull();
		expect(normalized.chart).toBeNull();
	});

	it('null di dalam group_by/pivot/chart dirapikan', () => {
		const normalized = normalizeSettings({
			...settings(),
			view: 'group_by',
			group_by: { columns: null, functions: null, sort: null },
			pivot: { pivot_columns: ['active'], row_columns: null, functions: null },
			chart: { type: 'bogus', label_column: 'tier', fn: 'sum', value_column: 'credit_limit', sort: 'bogus', orientation: 'bogus' }
		} as never);
		expect(normalized.group_by).toEqual({ columns: [], functions: [], sort: [] });
		expect(normalized.pivot).toEqual({ pivot_columns: ['active'], row_columns: [], functions: [] });
		expect(normalized.chart).toEqual({
			type: 'bar',
			label_column: 'tier',
			fn: 'sum',
			value_column: 'credit_limit',
			sort: 'label_asc',
			orientation: 'vertical'
		});
	});
});

describe('K4 views', () => {
	const groupBy = { columns: ['tier'], functions: [], sort: [] };

	it('hanya view yang terdefinisi yang tersedia (report selalu)', () => {
		expect(availableViews(settings())).toEqual(['report']);
		expect(availableViews({ ...settings(), group_by: groupBy })).toEqual(['report', 'group_by']);
		expect(
			availableViews({
				...settings(),
				group_by: groupBy,
				chart: { type: 'bar', label_column: 'tier', fn: 'sum', value_column: 'credit_limit', sort: 'label_asc', orientation: 'vertical' }
			})
		).toEqual(['report', 'group_by', 'chart']);
	});

	it('setView menolak view yang belum didefinisikan', () => {
		expect(setView(settings(), 'group_by').view).toBe('report');
		expect(setView({ ...settings(), group_by: groupBy }, 'group_by').view).toBe('group_by');
	});

	it('menghapus definisi mengembalikan view ke report', () => {
		const active = setView({ ...settings(), group_by: groupBy }, 'group_by');
		expect(setGroupBy(active, null).view).toBe('report');
		expect(setGroupBy(settings(), groupBy).group_by).toEqual(groupBy);
	});

	it('pivotCellKey mengikuti aturan alias server (id atau f<index>)', () => {
		const withId = { id: 'p1', fn: 'count' as const, column: 'code', label: '' };
		expect(pivotCellKey(0, withId, 0)).toBe('v_0_p1');
		const withoutId = { id: '', fn: 'sum' as const, column: 'credit_limit', label: '' };
		expect(pivotCellKey(2, withoutId, 1)).toBe('v_2_f1');
	});

	it('chartPoints mengambil label dan nilai dari baris _groupby', () => {
		const chart = {
			type: 'bar' as const,
			label_column: 'tier',
			fn: 'sum' as const,
			value_column: 'credit_limit',
			sort: 'label_asc' as const,
			orientation: 'vertical' as const
		};
		const points = chartPoints(meta, chart, [
			{ tier: 'gold', f0: 3000 },
			{ tier: 'platinum', f0: 9000 }
		]);
		expect(points).toEqual([
			{ label: 'Gold', value: 3000 },
			{ label: 'Platinum', value: 9000 }
		]);
	});
});

describe('K4-09 computed columns', () => {
	const computation = { id: 'c1', label: 'Credit (juta)', expr: 'E / 1000000', format: 'number' as const };

	it('huruf alias mengikuti urutan field resource', () => {
		const aliases = computationAliases(meta);
		expect(aliases[0]).toEqual({ letter: 'A', field: meta.fields[0] });
		expect(aliases[1].letter).toBe('B');
		expect(aliases[1].field.name).toBe('name');
	});

	it('computationField memetakan format ke tipe kolom', () => {
		expect(computationField(computation).type).toBe('number');
		expect(computationField({ ...computation, format: 'date' }).type).toBe('date');
		expect(computationField({ ...computation, format: 'text' }).type).toBe('text');
		expect(computationField(computation).label).toBe('Credit (juta)');
	});

	it('addComputation menambahkan kolomnya ke columns', () => {
		const next = addComputation(settings(), computation);
		expect(next.computations).toHaveLength(1);
		expect(next.columns).toContain('c1');
	});

	it('updateComputation mengganti di tempat', () => {
		const base = addComputation(settings(), computation);
		const next = updateComputation(base, { ...computation, label: 'Lain' });
		expect(next.computations).toEqual([{ ...computation, label: 'Lain' }]);
	});

	it('removeComputation membuang kolom dan definisinya', () => {
		const base = addComputation(settings(), computation);
		const next = removeComputation(base, 'c1');
		expect(next.computations).toEqual([]);
		expect(next.columns).not.toContain('c1');
	});
});

describe('reportOptionLabel (K3-F16a)', () => {
	const settings: ReportSettings = {
		columns: ['code'],
		filters: [],
		sort: [],
		breaks: [],
		highlights: [],
		aggregates: [],
		page_size: 15,
		view: 'report',
		group_by: null,
		pivot: null,
		chart: null,
		computations: [],
		widths: {},
		frozen: null
	};
	const report = (kind: SavedReport['kind'], name: string): SavedReport => ({
		id: `${kind}-${name}`,
		kind,
		name,
		settings,
		version: 1,
		can_edit: true
	});

	it('primary diberi nomor 1', () => {
		expect(reportOptionLabel(report('primary', 'Customers'), 0)).toBe('1. Customers');
	});

	it('public melanjutkan nomor sesuai urutan daftar', () => {
		expect(reportOptionLabel(report('public', 'Shared'), 1)).toBe('2. Shared');
		expect(reportOptionLabel(report('public', 'Another'), 2)).toBe('3. Another');
	});

	it('private memakai awalan, tanpa nomor', () => {
		expect(reportOptionLabel(report('private', 'Mine'), 3)).toBe('Private: Mine');
	});

	it('awalan private mengikuti locale aktif', () => {
		setLocale('id');
		expect(reportOptionLabel(report('private', 'Punya saya'), 0)).toBe('Pribadi: Punya saya');
	});
});

describe('describeFilter (K3 §1.4 chip text)', () => {
	it('all-columns search', () => {
		expect(describeFilter(filter({ kind: 'search', column: null, value: 'budi' }), meta)).toBe(
			"Row text contains 'budi'"
		);
	});

	it('single-column search', () => {
		expect(describeFilter(filter({ kind: 'search', column: 'name', value: 'budi' }), meta)).toBe(
			"Name contains 'budi'"
		);
	});

	it('in', () => {
		expect(describeFilter(filter({ column: 'tier', op: 'in', value: ['gold', 'platinum'] }), meta)).toBe(
			"Tier in 'gold, platinum'"
		);
	});

	it('row filter shows its name', () => {
		expect(describeFilter(filter({ kind: 'row', column: null, name: 'Big', expr: 'F > 15' }), meta)).toBe(
			'Big'
		);
	});

	it('row filter without a name shows the expression', () => {
		expect(describeFilter(filter({ kind: 'row', column: null, expr: 'F > 15' }), meta)).toBe('F > 15');
	});

	it('greater than, number formatted for the locale', () => {
		expect(describeFilter(filter({ column: 'credit_limit', op: 'gt', value: 1000 }), meta)).toBe(
			'Credit Limit > 1,000'
		);
	});

	it('in the last N days', () => {
		expect(
			describeFilter(filter({ column: 'customer_since', op: 'last', value: { n: 30, unit: 'days' } }), meta)
		).toBe('Customer Since in the last 30 days');
	});

	it('is null', () => {
		expect(describeFilter(filter({ column: 'email', op: 'is_null', value: null }), meta)).toBe('Email is null');
	});

	it('is not null', () => {
		expect(describeFilter(filter({ column: 'email', op: 'not_null', value: null }), meta)).toBe(
			'Email is not null'
		);
	});

	it('contains', () => {
		expect(describeFilter(filter({ column: 'name', op: 'contains', value: 'budi' }), meta)).toBe(
			"Name contains 'budi'"
		);
	});

	it('starts with', () => {
		expect(describeFilter(filter({ column: 'name', op: 'starts_with', value: 'bu' }), meta)).toBe(
			"Name starts with 'bu'"
		);
	});

	it('between', () => {
		expect(describeFilter(filter({ column: 'credit_limit', op: 'between', value: [100, 200] }), meta)).toBe(
			'Credit Limit between 100 and 200'
		);
	});

	it('select equality uses the option label', () => {
		expect(describeFilter(filter({ column: 'tier', op: 'eq', value: 'gold' }), meta)).toBe('Tier = Gold');
	});

	it('toggle equality is translated', () => {
		expect(describeFilter(filter({ column: 'active', op: 'eq', value: true }), meta)).toBe('Active = Yes');
	});
});

describe('describeBreak / describeHighlight / describeAggregate', () => {
	it('break text is the column label', () => {
		expect(describeBreak({ column: 'tier', enabled: true }, meta)).toBe('Tier');
	});

	it('highlight text is its name', () => {
		expect(
			describeHighlight({
				id: 'h1', name: 'VIP', seq: 10, enabled: true, type: 'row', bg: 3, fg: null, column: 'tier', op: 'eq', value: 'platinum'
			})
		).toBe('VIP');
	});

	it('aggregate text is Function + Column', () => {
		expect(describeAggregate({ id: 'a1', fn: 'sum', column: 'credit_limit', enabled: true }, meta)).toBe(
			'Sum Credit Limit'
		);
	});
});

describe('visibleColumns', () => {
	it('drops enabled break columns only', () => {
		const s = settings();
		s.breaks = [
			{ column: 'tier', enabled: true },
			{ column: 'name', enabled: false }
		];
		expect(visibleColumns(s)).toEqual(['code', 'name', 'credit_limit']);
	});
});

describe('immutable helpers', () => {
	it('addFilter returns a new settings object', () => {
		const s = settings();
		const next = addFilter(s, filter({ id: 'f9' }));
		expect(s.filters).toHaveLength(0);
		expect(next.filters).toHaveLength(1);
		expect(next).not.toBe(s);
	});

	it('updateFilter patches one entry', () => {
		const s = addFilter(settings(), filter({ id: 'f1', value: 'a' }));
		const next = updateFilter(s, 'f1', { value: 'b' });
		expect(next.filters[0].value).toBe('b');
		expect(s.filters[0].value).toBe('a');
	});

	it('removeFilter drops it', () => {
		expect(removeFilter(addFilter(settings(), filter({ id: 'f1' })), 'f1').filters).toHaveLength(0);
	});

	it('toggleFilter flips enabled', () => {
		const s = addFilter(settings(), filter({ id: 'f1', enabled: true }));
		expect(toggleFilter(s, 'f1').filters[0].enabled).toBe(false);
	});

	it('setSortOnly replaces the whole sort', () => {
		const s = settings();
		s.sort = [
			{ column: 'name', dir: 'asc', nulls: 'default' },
			{ column: 'code', dir: 'desc', nulls: 'default' }
		];
		const next = setSortOnly(s, 'tier', 'desc');
		expect(next.sort).toEqual([{ column: 'tier', dir: 'desc', nulls: 'default' }]);
	});

	it('hideColumn removes one column', () => {
		expect(hideColumn(settings(), 'name').columns).toEqual(['code', 'tier', 'credit_limit']);
	});

	it('addBreak appends an enabled break', () => {
		expect(addBreak(settings(), 'tier').breaks).toEqual([{ column: 'tier', enabled: true }]);
	});

	it('toggleBreak flips enabled', () => {
		const s = addBreak(settings(), 'tier');
		expect(toggleBreak(s, 'tier').breaks[0].enabled).toBe(false);
	});

	it('removeBreak drops it', () => {
		expect(removeBreak(addBreak(settings(), 'tier'), 'tier').breaks).toHaveLength(0);
	});

	it('setPageSize', () => {
		expect(setPageSize(settings(), 50).page_size).toBe(50);
	});

	it('toggleAggregate and removeAggregate', () => {
		const s = settings();
		s.aggregates = [{ id: 'a1', fn: 'sum', column: 'credit_limit', enabled: true }];
		expect(toggleAggregate(s, 'a1').aggregates[0].enabled).toBe(false);
		expect(removeAggregate(s, 'a1').aggregates).toHaveLength(0);
	});

	it('toggleHighlight and removeHighlight', () => {
		const s = settings();
		s.highlights = [
			{ id: 'h1', name: 'VIP', seq: 10, enabled: true, type: 'row', bg: null, fg: null, column: 'tier', op: 'eq', value: 'gold' }
		];
		expect(toggleHighlight(s, 'h1').highlights[0].enabled).toBe(false);
		expect(removeHighlight(s, 'h1').highlights).toHaveLength(0);
	});

	it('newId prefixes and stays unique', () => {
		const a = newId('f');
		const b = newId('f');
		expect(a.startsWith('f')).toBe(true);
		expect(a).not.toBe(b);
	});

	it('normalizeSettings fills null arrays (Go marshals nil slices as null)', () => {
		const normalized = normalizeSettings({
			columns: ['code'],
			filters: null,
			breaks: null,
			highlights: null,
			aggregates: null,
			sort: null,
			page_size: 0,
			view: null,
			group_by: null,
			pivot: null,
			chart: null,
			computations: null
		} as never);
		expect(normalized).toEqual({
			columns: ['code'],
			filters: [],
			sort: [],
			breaks: [],
			highlights: [],
			aggregates: [],
			page_size: 15,
			view: 'report',
			group_by: null,
			pivot: null,
			chart: null,
			computations: [],
			widths: {},
			frozen: null
		});
	});
});

describe('withLockedFilter (F3-02)', () => {
	const locked = { column: 'customer_id', value: 'C1' };

	it('menambahkan filter eq yang terkunci', () => {
		const next = withLockedFilter(settings(), locked);
		expect(next.filters).toHaveLength(1);
		expect(next.filters[0]).toMatchObject({ kind: 'column', column: 'customer_id', op: 'eq', value: 'C1', enabled: true });
	});

	it('tidak menggandakan filter yang sudah ada', () => {
		const once = withLockedFilter(settings(), locked);
		const twice = withLockedFilter(once, locked);
		expect(twice.filters).toHaveLength(1);
	});

	it('tidak masuk ke settings yang disimpan (input tidak berubah)', () => {
		const saved = settings();
		withLockedFilter(saved, locked);
		expect(saved.filters).toHaveLength(0);
	});

	it('menyertakan filter terkunci pada settings ekspor', () => {
		const exported = withLockedFilter(settings(), locked);
		expect(exported.filters).toEqual([
			expect.objectContaining({ kind: 'column', column: 'customer_id', op: 'eq', value: 'C1', enabled: true })
		]);
	});
});

describe('restrictColumns (B011)', () => {
	const base = normalizeSettings({ columns: ['code', 'name', 'tier'] });

	it('tanpa allowed mengembalikan settings apa adanya (perilaku lama)', () => {
		expect(restrictColumns(base)).toBe(base);
		expect(restrictColumns(base, [])).toBe(base);
	});

	it('irisan mengikuti urutan allowed', () => {
		expect(restrictColumns(base, ['name', 'code']).columns).toEqual(['name', 'code']);
		expect(restrictColumns(base, ['tier', 'ghost']).columns).toEqual(['tier']);
	});

	it('bila irisan kosong memakai allowed penuh dan tidak memutasi input', () => {
		const snapshot = JSON.stringify(base);
		expect(restrictColumns(base, ['ghost']).columns).toEqual(['ghost']);
		expect(JSON.stringify(base)).toBe(snapshot);
	});
});

describe('buildInitialSettings (D004)', () => {
	const base = normalizeSettings({ columns: ['code'], page_size: 15 });

	it('tanpa init mengembalikan dasar apa adanya', () => {
		expect(buildInitialSettings(base, {})).toBe(base);
	});

	it('sort awal menggantikan sort dasar', () => {
		const s = buildInitialSettings(base, { sort: { field: 'name', dir: 'desc' } });
		expect(s.sort).toEqual([{ column: 'name', dir: 'desc', nulls: 'default' }]);
		expect(s.page_size).toBe(15);
	});

	it('pageSize awal menimpa ukuran dasar; nilai tidak valid diabaikan', () => {
		expect(buildInitialSettings(base, { pageSize: 10 }).page_size).toBe(10);
		expect(buildInitialSettings(base, { pageSize: 0 })).toBe(base);
	});

	it('keduanya sekaligus dan tidak memutasi dasar', () => {
		const snapshot = JSON.stringify(base);
		const s = buildInitialSettings(base, { sort: { field: 'code', dir: 'asc' }, pageSize: 50 });
		expect(s.page_size).toBe(50);
		expect(s.sort[0].column).toBe('code');
		expect(JSON.stringify(base)).toBe(snapshot);
	});
});

describe('withLockedFilters (D008)', () => {
	const base = normalizeSettings({ columns: ['code'] });

	it('daftar kosong mengembalikan settings apa adanya', () => {
		expect(withLockedFilters(base, [])).toBe(base);
	});

	it('menambah satu dan dua filter terkunci berurutan tanpa memutasi input', () => {
		const snap = JSON.stringify(base);
		const one = withLockedFilters(base, [{ column: 'tier', value: 'gold' }]);
		expect(one.filters.map((f) => f.column)).toEqual(['tier']);
		const two = withLockedFilters(base, [
			{ column: 'tier', value: 'gold' },
			{ column: 'active', value: true }
		]);
		expect(two.filters.map((f) => f.column)).toEqual(['tier', 'active']);
		expect(JSON.stringify(base)).toBe(snap);
	});

	it('tidak menggandakan yang sudah ada dan menjaga id unik untuk kolom sama', () => {
		const once = withLockedFilters(base, [{ column: 'tier', value: 'gold' }]);
		expect(withLockedFilters(once, [{ column: 'tier', value: 'gold' }])).toBe(once);
		const same = withLockedFilters(base, [
			{ column: 'tier', value: 'gold' },
			{ column: 'tier', value: 'platinum' }
		]);
		const ids = same.filters.map((f) => f.id);
		expect(new Set(ids).size).toBe(2);
	});
});
