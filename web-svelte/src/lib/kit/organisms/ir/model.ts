import { displayText } from '$lib/kit/molecules/display';
import { t } from '$lib/i18n/index.svelte';
import type { FieldMeta } from '$lib/kit/fields/types';
import type {
	ChartSort,
	ChartType,
	ReportAggregate,
	ReportBreak,
	ReportChart,
	ReportComputation,
	ReportFilter,
	ReportGroupBy,
	ReportGroupFunction,
	ReportHighlight,
	ReportMeta,
	ReportPivot,
	ReportSettings,
	ReportView,
	SavedReport,
	SortDir
} from './types';

const REPORT_VIEWS: ReportView[] = ['report', 'group_by', 'pivot', 'chart'];
const CHART_TYPES: ChartType[] = ['bar', 'line', 'pie'];
const CHART_SORTS: ChartSort[] = ['label_asc', 'label_desc', 'value_asc', 'value_desc'];

/** K3 §2.3 operator matrix, in the table's own row order. */
const OPERATOR_ORDER = [
	'eq',
	'neq',
	'gt',
	'gte',
	'lt',
	'lte',
	'between',
	'contains',
	'not_contains',
	'starts_with',
	'in',
	'not_in',
	'last',
	'not_last',
	'next',
	'not_next',
	'is_null',
	'not_null'
] as const;

const OPERATORS_BY_TYPE: Record<string, string[]> = {
	text: ['eq', 'neq', 'contains', 'not_contains', 'starts_with', 'in', 'not_in', 'is_null', 'not_null'],
	email: ['eq', 'neq', 'contains', 'not_contains', 'starts_with', 'in', 'not_in', 'is_null', 'not_null'],
	textarea: ['contains', 'not_contains', 'is_null', 'not_null'],
	number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'is_null', 'not_null'],
	date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'last', 'not_last', 'next', 'not_next', 'is_null', 'not_null'],
	select: ['eq', 'neq', 'in', 'not_in', 'is_null', 'not_null'],
	toggle: ['eq', 'is_null', 'not_null'],
	belongs_to: ['eq', 'neq', 'in', 'not_in', 'is_null', 'not_null']
};

/** Allowed operators for a field type, in table order (K3 §2.3). */
export function operatorsFor(type: string): string[] {
	const allowed = new Set(OPERATORS_BY_TYPE[type] ?? []);
	return OPERATOR_ORDER.filter((op) => allowed.has(op));
}

/** Operators that compare a column against exactly one value. A highlight
 *  condition always carries a single value, so the multi-value operators
 *  (`between`, `in`, `not_in`, relative dates) would never match (K3-F17a). */
const SINGLE_VALUE = new Set([
	'eq',
	'neq',
	'gt',
	'gte',
	'lt',
	'lte',
	'contains',
	'not_contains',
	'starts_with',
	'is_null',
	'not_null'
]);

export function singleValueOperatorsFor(type: string): string[] {
	return operatorsFor(type).filter((op) => SINGLE_VALUE.has(op));
}

export function fieldOf(meta: ReportMeta, name: string | null): FieldMeta | undefined {
	if (!name) return undefined;
	return meta.fields.find((field) => field.name === name);
}

/** APEX-style label for the report selector (K3-F16a): the primary report is
 * always "1.", public reports continue the numbering in server order, and a
 * private report is prefixed instead ("Private: <name>"). */
export function reportOptionLabel(report: SavedReport, index: number): string {
	if (report.kind === 'private') return `${t('kit.ir.private_prefix')}: ${report.name}`;
	return `${index + 1}. ${report.name}`;
}

export function columnLabel(meta: ReportMeta, name: string): string {
	return fieldOf(meta, name)?.label ?? name;
}

function formatValue(meta: ReportMeta, column: string | null, value: unknown): string {
	const field = fieldOf(meta, column);
	if (!field) return value === null || value === undefined ? '' : String(value);
	return displayText(field.type, value, field.options);
}

/** Chip text for one filter or search (K3 §1.4). */
export function describeFilter(filter: ReportFilter, meta: ReportMeta): string {
	if (filter.kind === 'row') {
		// A row filter shows its name, or the expression when it has none (K4-10).
		return filter.name?.trim() ? filter.name : (filter.expr ?? '');
	}
	if (filter.kind === 'search') {
		const text = filter.value === null || filter.value === undefined ? '' : String(filter.value);
		if (!filter.column) return t('kit.ir.chip.search_all', { text });
		return t('kit.ir.chip.search_column', { column: columnLabel(meta, filter.column), text });
	}
	const column = filter.column ? columnLabel(meta, filter.column) : '';
	const op = t(`kit.ir.op.${filter.op}`);
	switch (filter.op) {
		case 'is_null':
		case 'not_null':
			return t('kit.ir.chip.null', { column, op });
		case 'in':
		case 'not_in': {
			const values = Array.isArray(filter.value) ? filter.value.map(String).join(', ') : String(filter.value ?? '');
			return t('kit.ir.chip.in', { column, op, values });
		}
		case 'between': {
			const bounds = Array.isArray(filter.value) ? filter.value : [null, null];
			return t('kit.ir.chip.between', {
				column,
				from: formatValue(meta, filter.column, bounds[0]),
				to: formatValue(meta, filter.column, bounds[1])
			});
		}
		case 'last':
		case 'not_last':
		case 'next':
		case 'not_next': {
			const range = (filter.value ?? {}) as { n?: number; unit?: string };
			return t('kit.ir.chip.relative', {
				column,
				op,
				n: range.n ?? 0,
				unit: t(`kit.ir.unit.${range.unit ?? 'days'}`)
			});
		}
		default: {
			const value = formatValue(meta, filter.column, filter.value);
			if (filter.op === 'contains' || filter.op === 'not_contains' || filter.op === 'starts_with') {
				return t('kit.ir.chip.match', { column, op, value });
			}
			return t('kit.ir.chip.cmp', { column, op, value });
		}
	}
}

export function describeBreak(entry: ReportBreak, meta: ReportMeta): string {
	return columnLabel(meta, entry.column);
}

export function describeHighlight(entry: ReportHighlight): string {
	return entry.name;
}

export function describeAggregate(entry: ReportAggregate, meta: ReportMeta): string {
	return t('kit.ir.chip.aggregate', {
		fn: t(`kit.ir.agg.${entry.fn}`),
		column: columnLabel(meta, entry.column)
	});
}

/** Columns actually shown: `columns` minus the enabled control-break columns. */
export function visibleColumns(settings: ReportSettings): string[] {
	const breaks = new Set(settings.breaks.filter((entry) => entry.enabled).map((entry) => entry.column));
	return settings.columns.filter((column) => !breaks.has(column));
}

export function newId(prefix: string): string {
	return `${prefix}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Go marshals a nil slice as `null`, so settings arriving from the server (or
 * from older sessionStorage) can have null where an array is expected. Every
 * consumer normalizes through here first.
 */
export function normalizeSettings(raw: Partial<ReportSettings> | null | undefined): ReportSettings {
	const list = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
	return {
		columns: list(raw?.columns),
		filters: list(raw?.filters),
		sort: list(raw?.sort),
		breaks: list(raw?.breaks),
		highlights: list(raw?.highlights),
		aggregates: list(raw?.aggregates),
		page_size: typeof raw?.page_size === 'number' && raw.page_size > 0 ? raw.page_size : 15,
		// Go mengirim null untuk view yang belum didefinisikan (K4 §1.2).
		view: REPORT_VIEWS.includes(raw?.view as ReportView) ? (raw!.view as ReportView) : 'report',
		group_by: raw?.group_by ? normalizeGroupBy(raw.group_by) : null,
		pivot: raw?.pivot ? normalizePivot(raw.pivot) : null,
		chart: raw?.chart ? normalizeChart(raw.chart) : null,
		computations: list(raw?.computations),
		widths: raw?.widths && typeof raw.widths === 'object' ? { ...raw.widths } : {},
		frozen: typeof raw?.frozen === 'string' ? raw.frozen : null
	};
}

function normalizeGroupBy(raw: ReportGroupBy): ReportGroupBy {
	const list = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
	return {
		columns: list(raw.columns),
		functions: list(raw.functions).map(normalizeGroupFunction),
		sort: list(raw.sort)
	};
}

function normalizeGroupFunction(raw: ReportGroupFunction): ReportGroupFunction {
	return { id: raw.id, fn: raw.fn, column: raw.column, label: raw.label ?? '' };
}

function normalizePivot(raw: ReportPivot): ReportPivot {
	const list = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
	return {
		pivot_columns: list(raw.pivot_columns),
		row_columns: list(raw.row_columns),
		functions: list(raw.functions).map(normalizeGroupFunction)
	};
}

function normalizeChart(raw: ReportChart): ReportChart {
	return {
		type: CHART_TYPES.includes(raw.type) ? raw.type : 'bar',
		label_column: raw.label_column ?? '',
		fn: raw.fn ?? 'sum',
		value_column: raw.value_column ?? '',
		sort: CHART_SORTS.includes(raw.sort) ? raw.sort : 'label_asc',
		orientation: raw.orientation === 'horizontal' ? 'horizontal' : 'vertical'
	};
}

// ---- K4 views --------------------------------------------------------------

/** Views whose definition exists: Report always, the others only once they
 * have been defined (K4 §1.1 — only defined views get an icon). */
export function availableViews(settings: ReportSettings): ReportView[] {
	const views: ReportView[] = ['report'];
	if (settings.group_by) views.push('group_by');
	if (settings.pivot) views.push('pivot');
	if (settings.chart) views.push('chart');
	return views;
}

/** Switching to a view that is not defined falls back to report. */
export function setView(settings: ReportSettings, view: ReportView): ReportSettings {
	if (!availableViews(settings).includes(view)) return { ...settings, view: 'report' };
	return { ...settings, view };
}

export function setGroupBy(settings: ReportSettings, groupBy: ReportGroupBy | null): ReportSettings {
	const next: ReportSettings = { ...settings, group_by: groupBy };
	// A removed definition can no longer be the active view.
	return groupBy === null ? setView(next, 'report') : next;
}

export function setPivot(settings: ReportSettings, pivot: ReportPivot | null): ReportSettings {
	const next: ReportSettings = { ...settings, pivot };
	return pivot === null ? setView(next, 'report') : next;
}

export function setChart(settings: ReportSettings, chart: ReportChart | null): ReportSettings {
	const next: ReportSettings = { ...settings, chart };
	return chart === null ? setView(next, 'report') : next;
}

/** JSON key of one pivot cell, mirroring the server's alias rule (K4-04): the
 * function's own id, or its positional fallback when the client sent none. */
export function groupFunctionKey(fn: ReportGroupFunction, index: number): string {
	return fn.id ? fn.id : `f${index}`;
}

export function pivotCellKey(pivotIndex: number, fn: ReportGroupFunction, fnIndex: number): string {
	return `v_${pivotIndex}_${groupFunctionKey(fn, fnIndex)}`;
}

/** Alias letters follow the resource's field order (K4-09): A = the first field
 * of the Go definition, so a stored expression keeps its meaning when the
 * displayed columns are reordered. */
export function computationAliases(meta: ReportMeta): { letter: string; field: FieldMeta }[] {
	return meta.fields.slice(0, 26).map((field, index) => ({ letter: String.fromCharCode(65 + index), field }));
}

/** A computed column behaves like a normal column for headings and sorting, so
 * the table gets synthetic field metadata for it (K4-09). */
export function computationField(computation: ReportComputation): FieldMeta {
	const type: FieldMeta['type'] =
		computation.format === 'number' ? 'number' : computation.format === 'date' ? 'date' : 'text';
	return { name: computation.id, type, label: computation.label, required: false, in_table: false };
}

export function addComputation(settings: ReportSettings, computation: ReportComputation): ReportSettings {
	return {
		...settings,
		computations: [...settings.computations, computation],
		columns: [...settings.columns, computation.id]
	};
}

export function updateComputation(settings: ReportSettings, computation: ReportComputation): ReportSettings {
	return {
		...settings,
		computations: settings.computations.map((entry) => (entry.id === computation.id ? computation : entry))
	};
}

export function removeComputation(settings: ReportSettings, id: string): ReportSettings {
	return {
		...settings,
		computations: settings.computations.filter((entry) => entry.id !== id),
		columns: settings.columns.filter((column) => column !== id)
	};
}

/** Label of one aggregated column: the client's label, or "Fn Column". */
export function groupFunctionLabel(meta: ReportMeta, fn: ReportGroupFunction): string {
	if (fn.label) return fn.label;
	return `${t(`kit.ir.agg.${fn.fn}`)} ${columnLabel(meta, fn.column)}`;
}

/** Chart data for one `_groupby` result (K4-07): the label column becomes the
 * category and the single function column its value. */
export function chartPoints(
	meta: ReportMeta,
	chart: ReportChart,
	rows: Record<string, unknown>[]
): { label: string; value: number }[] {
	const fn: ReportGroupFunction = { id: '', fn: chart.fn, column: chart.value_column, label: '' };
	const key = groupFunctionKey(fn, 0);
	const field = fieldOf(meta, chart.label_column);
	return rows.map((row) => {
		const rawLabel = row[chart.label_column];
		const label = field ? displayText(field.type, rawLabel, field.options) : String(rawLabel ?? '');
		const value = row[key];
		return { label, value: typeof value === 'number' ? value : Number(value ?? 0) };
	});
}

// ---- immutable setting helpers ---------------------------------------------

export function addFilter(settings: ReportSettings, filter: ReportFilter): ReportSettings {
	return { ...settings, filters: [...settings.filters, filter] };
}

export function updateFilter(settings: ReportSettings, id: string, patch: Partial<ReportFilter>): ReportSettings {
	return { ...settings, filters: settings.filters.map((f) => (f.id === id ? { ...f, ...patch } : f)) };
}

export function removeFilter(settings: ReportSettings, id: string): ReportSettings {
	return { ...settings, filters: settings.filters.filter((f) => f.id !== id) };
}

export function toggleFilter(settings: ReportSettings, id: string): ReportSettings {
	return {
		...settings,
		filters: settings.filters.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
	};
}

/** APEX: sorting from the column header replaces the whole sort. */
export function setSortOnly(settings: ReportSettings, column: string, dir: SortDir): ReportSettings {
	return { ...settings, sort: [{ column, dir, nulls: 'default' }] };
}

export function hideColumn(settings: ReportSettings, column: string): ReportSettings {
	return { ...settings, columns: settings.columns.filter((c) => c !== column) };
}

export function addBreak(settings: ReportSettings, column: string): ReportSettings {
	return { ...settings, breaks: [...settings.breaks, { column, enabled: true }] };
}

export function toggleBreak(settings: ReportSettings, column: string): ReportSettings {
	return {
		...settings,
		breaks: settings.breaks.map((b) => (b.column === column ? { ...b, enabled: !b.enabled } : b))
	};
}

export function removeBreak(settings: ReportSettings, column: string): ReportSettings {
	return { ...settings, breaks: settings.breaks.filter((b) => b.column !== column) };
}

export function setPageSize(settings: ReportSettings, size: number): ReportSettings {
	return { ...settings, page_size: size };
}

/** A relation tab's locked foreign-key filter (F3-02): the parent id a child
 *  list is scoped to. It is merged into the settings a request sends, never
 *  into the settings shown as chips or saved in a saved report. */
export type LockedFilter = { column: string; value: unknown };

/** Returns settings with the locked eq filter appended unless it is already
 *  present. The input is never mutated, so what gets saved stays clean. */
export function withLockedFilter(settings: ReportSettings, locked?: LockedFilter | null): ReportSettings {
	if (!locked) return settings;
	const present = settings.filters.some(
		(candidate) => candidate.column === locked.column && candidate.op === 'eq' && candidate.value === locked.value
	);
	if (present) return settings;
	return {
		...settings,
		filters: [
			...settings.filters,
			{ id: 'locked_' + locked.column, kind: 'column', column: locked.column, op: 'eq', value: locked.value, enabled: true }
		]
	};
}

export function toggleAggregate(settings: ReportSettings, id: string): ReportSettings {
	return {
		...settings,
		aggregates: settings.aggregates.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
	};
}

export function removeAggregate(settings: ReportSettings, id: string): ReportSettings {
	return { ...settings, aggregates: settings.aggregates.filter((a) => a.id !== id) };
}

export function toggleHighlight(settings: ReportSettings, id: string): ReportSettings {
	return {
		...settings,
		highlights: settings.highlights.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
	};
}

export function removeHighlight(settings: ReportSettings, id: string): ReportSettings {
	return { ...settings, highlights: settings.highlights.filter((h) => h.id !== id) };
}

/**
 * Batasi kolom laporan ke daftar yang diizinkan halaman (B011). Hasil = irisan
 * menurut urutan `allowed`; bila kosong, pakai `allowed` penuh. Tanpa `allowed`
 * settings dikembalikan apa adanya. Ini presentasi (LC-D7), bukan otorisasi.
 */
export function restrictColumns(settings: ReportSettings, allowed?: readonly string[]): ReportSettings {
	if (!allowed || allowed.length === 0) return settings;
	const wanted = new Set(settings.columns);
	const picked = allowed.filter((name) => wanted.has(name));
	return { ...settings, columns: picked.length > 0 ? picked : [...allowed] };
}

/**
 * Pengaturan awal laporan dari default halaman terbit (D004): sort dan ukuran
 * halaman menimpa dasar; tanpa `init` dasar dikembalikan apa adanya. Dipakai
 * hanya saat tidak ada pengaturan tersimpan milik pengguna.
 */
export function buildInitialSettings(
	base: ReportSettings,
	init: { sort?: { field: string; dir: SortDir }; pageSize?: number }
): ReportSettings {
	let next = base;
	if (init.sort) next = { ...next, sort: [{ column: init.sort.field, dir: init.sort.dir, nulls: 'default' }] };
	if (init.pageSize && init.pageSize > 0) next = { ...next, page_size: init.pageSize };
	return next;
}

/**
 * Seperti `withLockedFilter` untuk banyak filter terkunci (D008). Tiap filter
 * memakai logika yang sama; yang sudah ada tidak digandakan dan id tetap unik
 * walau kolom sama dipakai dua kali. Input tidak dimutasi.
 */
export function withLockedFilters(settings: ReportSettings, locked: readonly LockedFilter[]): ReportSettings {
	let next = settings;
	const used = new Map<string, number>();
	for (const filter of locked) {
		const before = next;
		next = withLockedFilter(next, filter);
		if (next !== before) {
			const count = used.get(filter.column) ?? 0;
			used.set(filter.column, count + 1);
			if (count > 0) {
				const added = next.filters[next.filters.length - 1];
				next = {
					...next,
					filters: [...next.filters.slice(0, -1), { ...added, id: `${added.id}_${count + 1}` }]
				};
			}
		}
	}
	return next;
}
