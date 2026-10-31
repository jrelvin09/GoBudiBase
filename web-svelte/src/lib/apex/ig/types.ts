export type ViewMode = 'grid' | 'single' | 'icon' | 'chart';

export type FilterOperator =
	| 'equals'
	| 'not_equals'
	| 'contains'
	| 'does_not_contain'
	| 'starts_with'
	| 'ends_with'
	| 'greater_than'
	| 'less_than'
	| 'between'
	| 'in'
	| 'is_null'
	| 'is_not_null';

export interface IgFilter {
	id: string;
	column: string;
	op: FilterOperator;
	value: string;
	value2?: string;
	enabled: boolean;
}

export interface IgSort {
	column: string;
	dir: 'asc' | 'desc';
	nulls?: 'first' | 'last';
}

export interface IgHighlight {
	id: string;
	name: string;
	column: string;
	op: FilterOperator;
	value: string;
	bgColor: string;
	textColor: string;
	target: 'row' | 'cell';
	enabled: boolean;
}

export type AggregateFunc = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface IgAggregate {
	column: string;
	func: AggregateFunc;
}

export interface IgGroup {
	column: string;
	enabled: boolean;
}

export interface IgColumnMeta {
	name: string;
	label: string;
	type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'badge';
	visible: boolean;
	frozen: boolean;
	width: number;
	options?: string[];
	align?: 'left' | 'center' | 'right';
}

export interface ChartConfig {
	type: 'bar' | 'line' | 'pie' | 'area';
	dimensionCol: string;
	metricCol: string;
	metricFunc: 'sum' | 'avg' | 'count';
}

export interface IgSavedReport {
	id: string;
	name: string;
	isDefault?: boolean;
	isPublic?: boolean;
	viewMode: ViewMode;
	filters: IgFilter[];
	sorts: IgSort[];
	groups: IgGroup[];
	highlights: IgHighlight[];
	aggregates: IgAggregate[];
	columns: IgColumnMeta[];
	chartConfig?: ChartConfig;
}

export interface IgRecord {
	id: number;
	code: string;
	name: string;
	value: number;
	status: string;
	category: string;
	location: string;
	acquired_at?: string;
	last_updated?: string;
	_status?: 'normal' | 'inserted' | 'deleted';
	_dirtyCols?: Record<string, boolean>;
	[key: string]: any;
}
