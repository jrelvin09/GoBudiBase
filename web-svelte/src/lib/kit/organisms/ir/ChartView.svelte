<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import BarChart from '$lib/kit/organisms/chart/BarChart.svelte';
	import LineChart from '$lib/kit/organisms/chart/LineChart.svelte';
	import PieChart from '$lib/kit/organisms/chart/PieChart.svelte';
	import { CATEGORY_MAX, topWithOther, type ChartPoint } from '$lib/kit/organisms/chart/chart-scale';
	import type { ReportChart } from './types';

	let {
		chart,
		data
	}: {
		chart: ReportChart;
		data: ChartPoint[];
	} = $props();

	/** Categories are capped before drawing: the largest 49 stay, the rest is
	 * merged into "Other" (K4 §1.2 / K4-07). */
	const points = $derived(topWithOther(data, CATEGORY_MAX));
</script>

<div class="flex flex-col gap-2">
	{#if points.length === 0}
		<p class="text-muted-foreground text-sm">{t('kit.msg.no_data_found')}</p>
	{:else if chart.type === 'line'}
		<LineChart data={points} label={chart.label_column} />
	{:else if chart.type === 'pie'}
		<PieChart data={points} label={chart.label_column} />
	{:else}
		<BarChart data={points} orientation={chart.orientation} label={chart.label_column} />
	{/if}
</div>
