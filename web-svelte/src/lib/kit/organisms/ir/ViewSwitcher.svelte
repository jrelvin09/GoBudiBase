<script lang="ts">
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import ChartPieIcon from '@lucide/svelte/icons/chart-pie';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import TableIcon from '@lucide/svelte/icons/table';
	import type { Component } from 'svelte';
	import type { ReportView } from './types';

	let {
		views,
		value,
		onchange
	}: {
		views: ReportView[];
		value: ReportView;
		onchange: (view: ReportView) => void;
	} = $props();

	const ICONS: Record<ReportView, Component> = {
		report: TableIcon,
		group_by: LayoutGridIcon,
		pivot: BarChart3Icon,
		chart: ChartPieIcon
	};

	function keydown(event: KeyboardEvent) {
		const index = views.indexOf(value);
		if (index === -1) return;
		if (event.key === 'ArrowRight') onchange(views[(index + 1) % views.length]);
		else if (event.key === 'ArrowLeft') onchange(views[(index - 1 + views.length) % views.length]);
		else return;
		event.preventDefault();
	}
</script>

<div
	class="flex items-center gap-1"
	role="radiogroup"
	tabindex={0}
	aria-label={t('kit.ir.view.report')}
	onkeydown={keydown}
>
	{#each views as view (view)}
		{@const Icon = ICONS[view]}
		<button
			type="button"
			role="radio"
			aria-checked={value === view}
			aria-label={t(`kit.ir.view.${view}`)}
			title={t(`kit.ir.view.${view}`)}
			class={cn(
				'text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5',
				value === view && 'bg-muted text-foreground'
			)}
			onclick={() => onchange(view)}
		>
			<Icon class="size-4" />
		</button>
	{/each}
</div>
