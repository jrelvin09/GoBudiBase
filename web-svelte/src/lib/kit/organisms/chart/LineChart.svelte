<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import {
		linePoints,
		niceScale,
		PALETTE_FILL,
		PALETTE_STROKE,
		scaleToY,
		tickLabel,
		type ChartPoint
	} from './chart-scale';

	let {
		data,
		height = 240,
		label,
		area = false
	}: {
		data: ChartPoint[];
		height?: number;
		label: string;
		area?: boolean;
	} = $props();

	const WIDTH = 640;
	const PADDING = { top: 12, right: 12, bottom: 32, left: 56 };

	const scale = $derived(niceScale(data.map((point) => point.value)));
	const plotWidth = $derived(WIDTH - PADDING.left - PADDING.right);
	const plotHeight = $derived(height - PADDING.top - PADDING.bottom);
	const points = $derived(linePoints(data.map((point) => point.value), scale, plotWidth, plotHeight));
	const step = $derived(data.length > 1 ? plotWidth / (data.length - 1) : 0);
	const zeroY = $derived(scaleToY(0, scale, 0, plotHeight));
</script>

<svg viewBox="0 0 {WIDTH} {height}" class="w-full" role="img" aria-label={label} preserveAspectRatio="none">
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
	<g transform="translate({PADDING.left}, {PADDING.top})">
		{#if area && data.length > 0}
			<polygon points="{points} {plotWidth},{zeroY} 0,{zeroY}" class={PALETTE_FILL[0]} opacity="0.2" />
		{/if}
		<polyline {points} fill="none" class={PALETTE_STROKE[0]} stroke-width="2" />
		{#each data as point, index (point.label)}
			<circle cx={index * step} cy={scaleToY(point.value, scale, 0, plotHeight)} r="3" class={PALETTE_STROKE[0]}>
				<title>{point.label}: {tickLabel(point.value)}</title>
			</circle>
			<text x={index * step} y={plotHeight + 14} text-anchor="middle" class="fill-current text-[10px]">
				{point.label}
			</text>
		{/each}
	</g>
</svg>

<table class="sr-only">
	<caption>{t('kit.ir.chart.data')}</caption>
	<tbody>
		{#each data as point (point.label)}
			<tr><th scope="row">{point.label}</th><td>{tickLabel(point.value)}</td></tr>
		{/each}
	</tbody>
</table>
