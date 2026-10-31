import type { FieldMeta, OptionMeta } from '$lib/kit/fields/types';

export type { FieldMeta, OptionMeta };

/** The slice of resource metadata the IR needs (structurally a ResourceMeta);
 * declared here so this tier never imports `$lib/api`. */
export type ReportMeta = { fields: FieldMeta[] };

export type FilterKind = 'column' | 'search' | 'row';
export type SortDir = 'asc' | 'desc';
export type NullSorting = 'default' | 'last' | 'first';
export type HighlightType = 'row' | 'cell';
export type AggregateFn = 'sum' | 'avg' | 'count' | 'count_distinct' | 'min' | 'max';
export type ReportKind = 'primary' | 'public' | 'private';

export type ReportFilter = {
	id: string;
	kind: FilterKind;
	column: string | null;
	op: string;
	value: unknown;
	/** Row filters only (K4-10). */
	name?: string;
	expr?: string;
	enabled: boolean;
};

export type ReportSort = { column: string; dir: SortDir; nulls: NullSorting };

export type ReportBreak = { column: string; enabled: boolean };

export type ReportHighlight = {
	id: string;
	name: string;
	seq: number;
	enabled: boolean;
	type: HighlightType;
	bg: number | null;
	fg: number | null;
	column: string;
	op: string;
	value: unknown;
};

export type ReportAggregate = { id: string; fn: AggregateFn; column: string; enabled: boolean };

/** K4 §1.1 — the active view of the report. */
export type ReportView = 'report' | 'group_by' | 'pivot' | 'chart';
export type ChartType = 'bar' | 'line' | 'pie';
export type ChartSort = 'label_asc' | 'label_desc' | 'value_asc' | 'value_desc';
export type ChartOrientation = 'vertical' | 'horizontal';
export type ComputationFormat = 'number' | 'text' | 'date';

/** One aggregated column of a Group By or Pivot view (K4 §1.2). */
export type ReportGroupFunction = {
	id: string;
	fn: AggregateFn;
	column: string;
	label: string;
};

export type ReportGroupBy = {
	columns: string[];
	functions: ReportGroupFunction[];
	sort: ReportSort[];
};

export type ReportPivot = {
	pivot_columns: string[];
	row_columns: string[];
	functions: ReportGroupFunction[];
};

export type ReportChart = {
	type: ChartType;
	label_column: string;
	fn: AggregateFn;
	value_column: string;
	sort: ChartSort;
	orientation: ChartOrientation;
};

export type ReportComputation = {
	id: string;
	label: string;
	expr: string;
	format: ComputationFormat;
};

/** K3 §2.1 / K4 §1.2 — the same JSON shape the Go `fw.ReportSettings` marshals. */
export type ReportSettings = {
	columns: string[];
	filters: ReportFilter[];
	sort: ReportSort[];
	breaks: ReportBreak[];
	highlights: ReportHighlight[];
	aggregates: ReportAggregate[];
	page_size: number;
	view: ReportView;
	group_by: ReportGroupBy | null;
	pivot: ReportPivot | null;
	chart: ReportChart | null;
	computations: ReportComputation[];
	/** Interactive Grid column layout (K5 §1.5). */
	widths: Record<string, number>;
	frozen: string | null;
};

export type ReportBreakAggregate = {
	key: Record<string, unknown>;
	count: number;
	values: Record<string, unknown>;
};

export type ReportAggregates = {
	overall: Record<string, unknown>;
	breaks: ReportBreakAggregate[];
};

/** K3 §2.2 — `POST /r/{res}/_query` response data. */
export type ReportPage = {
	rows: Record<string, unknown>[];
	total: number;
	page: number;
	page_size: number;
	aggregates: ReportAggregates;
};

/** K4-02 — `POST /r/{res}/_groupby` response data: one row per group, keyed by
 * the group columns plus one key per function id. */
export type ReportGroupPage = {
	rows: Record<string, unknown>[];
	total: number;
	page: number;
	page_size: number;
};

/** K4-04 — `POST /r/{res}/_pivot` response data. */
export type ReportPivotValue = { key: Record<string, unknown>; label: string };

export type ReportPivotPage = {
	pivot_values: ReportPivotValue[];
	rows: Record<string, unknown>[];
	total: number;
	page: number;
	page_size: number;
};

export type DistinctValue = { value: unknown; label: string; count: number };

export type DistinctResponse = { values: DistinctValue[]; truncated: boolean };

/** K3 §2.2 — one row of `_reports`. */
export type SavedReport = {
	id: string;
	kind: ReportKind;
	name: string;
	description?: string;
	settings: ReportSettings;
	version: number;
	can_edit: boolean;
};

export type ReportCreateRequest = {
	kind: ReportKind;
	name: string;
	description?: string;
	settings: ReportSettings;
};

export type ReportUpdateRequest = {
	expected_version: number;
	name?: string;
	description?: string;
	settings?: ReportSettings;
};
