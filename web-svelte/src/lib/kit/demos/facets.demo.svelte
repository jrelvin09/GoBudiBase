<script lang="ts">
	import FacetPanel from '$lib/kit/organisms/facets/FacetPanel.svelte';
	import {
		emptyFacetState,
		facetFilters,
		type FacetCounts,
		type FacetState
	} from '$lib/kit/organisms/facets/facets';
	import type { ReportFilter, ReportMeta } from '$lib/kit/organisms/ir/types';

	const meta: ReportMeta = {
		fields: [
			{ name: 'name', type: 'text', label: 'Name', required: false, in_table: true },
			{
				name: 'tier',
				type: 'select',
				label: 'Tier',
				required: false,
				in_table: true,
				facet: true,
				options: [
					{ value: 'gold', label: 'Gold' },
					{ value: 'platinum', label: 'Platinum' },
					{ value: 'regular', label: 'Regular' }
				]
			},
			{ name: 'active', type: 'toggle', label: 'Active', required: false, in_table: true, facet: true },
			{ name: 'credit_limit', type: 'number', label: 'Credit Limit', required: false, in_table: true, facet: true },
			{ name: 'customer_since', type: 'date', label: 'Customer Since', required: false, in_table: true, facet: true }
		]
	};
	const rows: Record<string, unknown>[] = [
		{ id: 'r1', name: 'Acme Corp', tier: 'gold', active: true, credit_limit: 50000, customer_since: '2024-03-11' },
		{ id: 'r2', name: 'Bumi Retail', tier: 'platinum', active: true, credit_limit: 80000, customer_since: '2023-07-01' },
		{ id: 'r3', name: 'Cahaya Niaga', tier: 'regular', active: true, credit_limit: 12000, customer_since: '2026-02-20' },
		{ id: 'r4', name: 'Delta Karya', tier: 'gold', active: false, credit_limit: 30000, customer_since: '2025-01-15' },
		{ id: 'r5', name: 'Eka Jaya', tier: 'regular', active: true, credit_limit: 8000, customer_since: '2026-05-30' },
		{ id: 'r6', name: 'Fajar Sentosa', tier: 'platinum', active: true, credit_limit: 95000, customer_since: '2022-11-05' },
		{ id: 'r7', name: 'Gita Mandiri', tier: 'gold', active: true, credit_limit: 45000, customer_since: '2024-09-09' },
		{ id: 'r8', name: 'Hana Abadi', tier: 'regular', active: false, credit_limit: 15000, customer_since: '2025-12-24' }
	];
	const counts: FacetCounts = {
		tier: [
			{ value: 'gold', label: 'Gold', count: 3 },
			{ value: 'platinum', label: 'Platinum', count: 2 },
			{ value: 'regular', label: 'Regular', count: 3 }
		],
		active: [
			{ value: 'true', label: 'Yes', count: 6 },
			{ value: 'false', label: 'No', count: 2 }
		]
	};

	let facetState = $state<FacetState>(emptyFacetState());
	const filters = $derived(facetFilters(facetState, meta));
	const matched = $derived(rows.filter((row) => matches(row, filters)));

	function compare(a: unknown, b: unknown, numeric: boolean): number {
		return numeric ? Number(a) - Number(b) : String(a).localeCompare(String(b));
	}

	// Demo only: filter the fixture rows client-side, as the server would.
	function matches(row: Record<string, unknown>, active: ReportFilter[]): boolean {
		return active.every((filter) => {
			if (filter.kind === 'search') {
				return String(row.name ?? '').toLowerCase().includes(String(filter.value).toLowerCase());
			}
			const field = meta.fields.find((entry) => entry.name === filter.column);
			const numeric = field?.type === 'number';
			const raw = row[filter.column ?? ''];
			if (filter.op === 'in') return (filter.value as unknown[]).map(String).includes(String(raw));
			if (filter.op === 'between') {
				const bounds = filter.value as [unknown, unknown];
				return compare(raw, bounds[0], numeric) >= 0 && compare(raw, bounds[1], numeric) <= 0;
			}
			if (filter.op === 'gte') return compare(raw, filter.value, numeric) >= 0;
			if (filter.op === 'lte') return compare(raw, filter.value, numeric) <= 0;
			return true;
		});
	}
</script>
<div class="flex flex-col gap-4 lg:flex-row">
	<FacetPanel {meta} state={facetState} {counts} onchange={(next) => (facetState = next)} />
	<div class="flex min-w-0 flex-1 flex-col gap-2">
		<p class="text-muted-foreground text-sm">{filters.length} filter(s) · {matched.length} result(s)</p>
		<ul class="flex flex-col gap-1">
			{#each matched as row (row.id)}
				<li class="bg-card border-border rounded-md border p-2 text-sm">
					{row.name} · {row.tier} · {row.active ? 'Yes' : 'No'} · {row.credit_limit} · {row.customer_since}
				</li>
			{/each}
		</ul>
		{#if matched.length === 0}
			<p class="text-muted-foreground text-sm">No data found.</p>
		{/if}
	</div>
</div>
