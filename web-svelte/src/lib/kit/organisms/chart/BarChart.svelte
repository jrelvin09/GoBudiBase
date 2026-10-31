<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import {
		bandWidth,
		barHeight,
		niceScale,
		paletteIndex,
		PALETTE_FILL,
		scaleToY,
		tickLabel,
		type ChartPoint
	} from './chart-scale';

	let {
		data,
		orientation = 'vertical',
		height = 240,
		label
	}: {
		data: ChartPoint[];
		orientation?: 'vertical' | 'horizontal';
		height?: number;
		label: string;
	} = $props();

	const WIDTH = 640;
	const MAX_BAR_WIDTH = 48;
	const PADDING = { top: 12, right: 12, bottom: 32, left: 56 };

	const scale = $derived(niceScale(data.map((point) => point.value)));
	const plotWidth = $derived(WIDTH - PADDING.left - PADDING.right);
	const plotHeight = $derived(height - PADDING.top - PADDING.bottom);
	const count = $derived(Math.max(1, data.length));
	const extent = $derived(orientation === 'vertical' ? plotWidth : plotHeight);
	const slot = $derived(extent / count);
	const band = $derived(Math.min(MAX_BAR_WIDTH, bandWidth(count, extent)));
</script>

<svg viewBox="0 0 {WIDTH} {height}" class="w-full" role="img" aria-label={label}>
	<title>{label}</title>
	<g class="text-muted-foreground">
		{#each scale.ticks as tick (tick)}
			{@const y = scaleToY(tick, scale, PADDING.top, plotHeight)}
			<line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} class="stroke-border" stroke-width="1" />
			<text x={PADDING.left - 6} y={y + 3} text-anchor="end" class="fill-current text-[10px]">
				{tickLabel(tick)}
			</text>
		{/each}
	</g>
	{#each data as point, index (point.label)}
		{@const fill = PALETTE_FILL[paletteIndex(index) - 1]}
		{#if orientation === 'vertical'}
			{@const x = PADDING.left + index * slot + (slot - band) / 2}
			{@const h = barHeight(point.value, scale, plotHeight)}
			{@const y = scaleToY(point.value, scale, PADDING.top, plotHeight)}
			<rect {x} {y} width={band} height={Math.max(0, h)} class={fill} rx="2">
				<title>{point.label}: {tickLabel(point.value)}</title>
			</rect>
			<text
				x={x + band / 2}
				y={height - PADDING.bottom + 14}
				text-anchor="middle"
				class="fill-current text-[10px]"
			>
				{point.label}
			</text>
		{:else}
			{@const y = PADDING.top + index * slot + (slot - band) / 2}
			{@const w = barHeight(point.value, scale, plotWidth)}
			<rect x={PADDING.left} {y} width={Math.max(0, w)} height={band} class={fill} rx="2">
				<title>{point.label}: {tickLabel(point.value)}</title>
			</rect>
			<text x={PADDING.left - 6} y={y + band / 2 + 3} text-anchor="end" class="fill-current text-[10px]">
				{point.label}
			</text>
		{/if}
	{/each}
</svg>

<table class="sr-only">
	<caption>{t('kit.ir.chart.data')}</caption>
	<tbody>
		{#each data as point (point.label)}
			<tr><th scope="row">{point.label}</th><td>{tickLabel(point.value)}</td></tr>
		{/each}
	</tbody>
</table>
