<script lang="ts">
	import ReportTable from '$lib/kit/organisms/ir/ReportTable.svelte';
	import {
		demoAggregates,
		demoMeta,
		demoRows,
		demoSettings
	} from '$lib/kit/demos/fixtures/customers';

	function onHeaderClick(column: string, _anchorEl: HTMLElement) {
		console.info('header click', column);
	}
</script>

<div class="flex flex-col gap-2">
	<p class="text-muted-foreground text-sm">
		30 rows, control break on Tier, Sum Credit Limit per break and overall, two highlights
		(Platinum row, Credit Limit ≥ 25,000 cell).
	</p>
	<ReportTable
		meta={demoMeta}
		settings={demoSettings}
		rows={demoRows}
		aggregates={demoAggregates}
		isLastPage={true}
		linkHref={(row: Record<string, unknown>) => `/r/sales.customer/${row.id}`}
		{onHeaderClick}
	/>
</div>
