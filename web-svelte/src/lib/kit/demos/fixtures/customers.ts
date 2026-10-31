import type { ReportAggregates, ReportMeta, ReportSettings } from '../../organisms/ir/types';

/** Demo metadata mirroring sales.customer. */
export const demoMeta: ReportMeta = {
	fields: [
		{ name: 'code', type: 'text', label: 'Code', required: false, in_table: true },
		{ name: 'name', type: 'text', label: 'Name', required: false, in_table: true },
		{
			name: 'tier',
			type: 'select',
			label: 'Tier',
			required: false,
			in_table: true,
			options: [
				{ value: 'gold', label: 'Gold' },
				{ value: 'platinum', label: 'Platinum' },
				{ value: 'regular', label: 'Regular' }
			]
		},
		{ name: 'credit_limit', type: 'number', label: 'Credit Limit', required: false, in_table: true },
		{ name: 'active', type: 'toggle', label: 'Active', required: false, in_table: true },
		{ name: 'customer_since', type: 'date', label: 'Customer Since', required: false, in_table: true }
	]
};

export const demoTiers = ['gold', 'platinum', 'regular'] as const;

// Rows grouped by tier, the way the server returns them when the tier column
// is a control break (break columns sort first), names ascending inside a group.
export const demoRows: Record<string, unknown>[] = demoTiers.flatMap((tier, tierIndex) =>
	Array.from({ length: 10 }, (_, i) => {
		const n = tierIndex * 10 + i + 1;
		return {
			id: `row-${n}`,
			code: `C${String(n).padStart(3, '0')}`,
			name: `Customer ${String(n).padStart(2, '0')}`,
			tier,
			credit_limit: n * 1000,
			active: n % 4 !== 0,
			customer_since: `2026-0${(n % 9) + 1}-15`
		};
	})
);

export const demoSettings: ReportSettings = {
	columns: ['code', 'name', 'tier', 'credit_limit', 'active', 'customer_since'],
	filters: [],
	sort: [{ column: 'name', dir: 'asc', nulls: 'default' }],
	breaks: [{ column: 'tier', enabled: true }],
	highlights: [
		{
			id: 'h1', name: 'Platinum', seq: 10, enabled: true, type: 'row', bg: 3, fg: null,
			column: 'tier', op: 'eq', value: 'platinum'
		},
		{
			id: 'h2', name: 'Big credit', seq: 20, enabled: true, type: 'cell', bg: null, fg: 2,
			column: 'credit_limit', op: 'gte', value: 25000
		}
	],
	aggregates: [{ id: 'a1', fn: 'sum', column: 'credit_limit', enabled: true }],
	page_size: 30,
	view: 'report',
	group_by: null,
	pivot: null,
	chart: null,
	computations: [],
	widths: {},
	frozen: null
};

const groupSums: Record<string, number> = { gold: 0, platinum: 0, regular: 0 };
for (const row of demoRows) {
	groupSums[row.tier as string] += row.credit_limit as number;
}

export const demoAggregates: ReportAggregates = {
	overall: { a1: Object.values(groupSums).reduce((total, sum) => total + sum, 0) },
	breaks: Object.entries(groupSums).map(([tier, sum]) => ({
		key: { tier },
		count: demoRows.filter((row) => row.tier === tier).length,
		values: { a1: sum }
	}))
};
