<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import BarChartIcon from '@lucide/svelte/icons/chart-column';
	import LineChartIcon from '@lucide/svelte/icons/chart-line';
	import PieChartIcon from '@lucide/svelte/icons/chart-pie';
	import type { Component } from 'svelte';
	import type { AggregateFn, ChartSort, ChartType, ReportChart, ReportMeta } from './types';

	const TYPES: ChartType[] = ['bar', 'line', 'pie'];
	const SORTS: ChartSort[] = ['label_asc', 'label_desc', 'value_asc', 'value_desc'];
	const FNS: AggregateFn[] = ['sum', 'avg', 'count', 'count_distinct', 'min', 'max'];

	const ICONS: Record<ChartType, Component> = { bar: BarChartIcon, line: LineChartIcon, pie: PieChartIcon };

	let {
		open = $bindable(false),
		meta,
		chart,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		chart: ReportChart | null;
		onapply: (chart: ReportChart | null) => void;
	} = $props();

	const groupableColumns = $derived(meta.fields.filter((field) => field.type !== 'textarea'));
	const numericColumns = $derived(meta.fields.filter((field) => field.type === 'number'));

	let type = $state<ChartType>('bar');
	let labelColumn = $state('');
	let fn = $state<AggregateFn>('sum');
	let valueColumn = $state('');
	let sort = $state<ChartSort>('label_asc');
	let orientation = $state('vertical');

	$effect(() => {
		if (!open) return;
		type = chart?.type ?? 'bar';
		labelColumn = chart?.label_column || (groupableColumns[0]?.name ?? '');
		fn = chart?.fn ?? 'sum';
		valueColumn = chart?.value_column || (numericColumns[0]?.name ?? groupableColumns[0]?.name ?? '');
		sort = chart?.sort ?? 'label_asc';
		orientation = chart?.orientation ?? 'vertical';
	});

	// Sum and Average only make sense on numeric columns (K4 §1.2 validation).
	const valueOptions = $derived(fn === 'sum' || fn === 'avg' ? numericColumns : meta.fields);
	const canApply = $derived(labelColumn !== '' && valueColumn !== '');
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.chart.title')}>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={!canApply} onclick={() => {
				onapply({
					type,
					label_column: labelColumn,
					fn,
					value_column: valueColumn,
					sort,
					orientation: orientation === 'horizontal' ? 'horizontal' : 'vertical'
				});
				open = false;
			}}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.chart.type')}</span>
				<div class="flex items-center gap-1" role="radiogroup" aria-label={t('kit.ir.chart.type')}>
					{#each TYPES as option (option)}
						{@const Icon = ICONS[option]}
						<button
							type="button"
							role="radio"
							aria-checked={type === option}
							aria-label={t(`kit.ir.chart.type_${option}`)}
							title={t(`kit.ir.chart.type_${option}`)}
							class={cn(
								'text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5',
								type === option && 'bg-muted text-foreground'
							)}
							onclick={() => (type = option)}
						>
							<Icon class="size-4" />
						</button>
					{/each}
				</div>
			</div>

			<SelectListItem
				id="chart-label"
				label={t('kit.ir.chart.label_column')}
				options={groupableColumns.map((field) => ({ value: field.name, label: field.label }))}
				bind:value={labelColumn}
				required
			/>
			<SelectListItem
				id="chart-fn"
				label={t('kit.ir.aggregate.fn')}
				options={FNS.map((name) => ({ value: name, label: t(`kit.ir.agg.${name}`) }))}
				bind:value={fn}
				required
			/>
			<SelectListItem
				id="chart-value"
				label={t('kit.ir.chart.value')}
				options={valueOptions.map((field) => ({ value: field.name, label: field.label }))}
				bind:value={valueColumn}
				required
			/>
			{#if type === 'bar'}
				<SelectListItem
					id="chart-orientation"
					label={t('kit.ir.chart.orientation')}
					options={[
						{ value: 'vertical', label: t('kit.ir.chart.orientation_vertical') },
						{ value: 'horizontal', label: t('kit.ir.chart.orientation_horizontal') }
					]}
					bind:value={orientation}
					required
				/>
			{/if}
			<SelectListItem
				id="chart-sort"
				label={t('kit.ir.chart.sort')}
				options={SORTS.map((name) => ({ value: name, label: t(`kit.ir.chart.sort_${name}`) }))}
				bind:value={sort}
				required
			/>
		</div>
	</DialogContent>
</Dialog>
