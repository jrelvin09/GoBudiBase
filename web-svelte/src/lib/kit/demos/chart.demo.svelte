<script lang="ts">
	import BarChart from '$lib/kit/organisms/chart/BarChart.svelte';
	import LineChart from '$lib/kit/organisms/chart/LineChart.svelte';
	import PieChart from '$lib/kit/organisms/chart/PieChart.svelte';
	import Sparkline from '$lib/kit/organisms/chart/Sparkline.svelte';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import type { ChartPoint } from '$lib/kit/organisms/chart/chart-scale';

	let data: ChartPoint[] = $derived([
		{ label: t('kit.demo.tier_gold'), value: 25000 },
		{ label: t('kit.demo.tier_platinum'), value: 12000 },
		{ label: t('kit.demo.tier_regular'), value: 8000 },
		{ label: t('kit.demo.tier_new'), value: 1500 }
	]);

	const trend: ChartPoint[] = [
		{ label: '1', value: 12 },
		{ label: '2', value: 18 },
		{ label: '3', value: 15 },
		{ label: '4', value: 22 },
		{ label: '5', value: 26 },
		{ label: '6', value: 31 }
	];
	const mixed: ChartPoint[] = [
		{ label: '1', value: -10 },
		{ label: '2', value: 15 },
		{ label: '3', value: -5 },
		{ label: '4', value: 20 }
	];

	const series = [12, 18, 15, 22, 26, 24, 31, 29];
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.ir.chart.type_bar')} ({t('kit.ir.chart.orientation_vertical')})</span>
		<BarChart {data} label={t('kit.demo.credit_by_tier')} />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.ir.chart.type_bar')} ({t('kit.ir.chart.orientation_horizontal')})</span>
		<BarChart {data} orientation="horizontal" label={t('kit.demo.credit_by_tier')} />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.ir.chart.type_line')}</span>
		<LineChart {data} label={t('kit.demo.credit_by_tier')} />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.demo.area')}</span>
		<LineChart data={trend} area label="{t('kit.summary.chart')} ({t('kit.demo.area')})" />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.demo.area_mixed')}</span>
		<LineChart data={mixed} area label={t('kit.demo.area_mixed')} />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.ir.chart.type_pie')}</span>
		<PieChart {data} label={t('kit.demo.credit_by_tier')} />
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.demo.donut')}</span>
		<PieChart {data} donut label="{t('kit.demo.credit_by_tier')} ({t('kit.demo.donut')})" />
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-sm font-medium">{t('kit.demo.sparkline_in_table')}</span>
		<table class="w-full max-w-md text-left text-sm">
			<caption class="sr-only">{t('kit.summary.chart')}</caption>
			<thead>
				<tr class="text-muted-foreground border-b">
					<th class="py-1 pr-4 font-medium">{t('kit.ir.filter.name')}</th>
					<th class="py-1 pr-4 font-medium">{t('kit.demo.trend')}</th>
					<th class="py-1 font-medium">{t('kit.demo.col_amount')}</th>
				</tr>
			</thead>
			<tbody>
				<tr class="border-b last:border-0">
					<td class="py-2 pr-4">{t('kit.demo.plan_growth')}</td>
					<td class="py-2 pr-4"><Sparkline values={series} label="{t('kit.demo.plan_growth')} — {t('kit.demo.trend')}" tone={1} width={80} height={24} /></td>
					<td class="py-2 tabular-nums">{formatNumber(1284)}</td>
				</tr>
				<tr>
					<td class="py-2 pr-4">{t('kit.demo.plan_scale')}</td>
					<td class="py-2 pr-4"><Sparkline values={[...series].reverse()} label="{t('kit.demo.plan_scale')} — {t('kit.demo.trend')}" tone={5} width={80} height={24} /></td>
					<td class="py-2 tabular-nums">{formatNumber(842)}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
