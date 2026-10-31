<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { piePath, pieSlices, PALETTE_FILL, tickLabel, type ChartPoint } from './chart-scale';

	let {
		data,
		size = 240,
		label,
		donut = false
	}: {
		data: ChartPoint[];
		size?: number;
		label: string;
		donut?: boolean;
	} = $props();

	const radius = $derived(size / 2 - 8);
	const slices = $derived(pieSlices(data));
</script>

<svg viewBox="0 0 {size} {size}" class="mx-auto" style="max-width: {size}px" role="img" aria-label={label}>
	<title>{label}</title>
	<g transform="translate({size / 2}, {size / 2})">
		{#each slices as slice, index (slice.label)}
			{@const fill = PALETTE_FILL[index % PALETTE_FILL.length]}
			<path d={piePath(slice, radius)} class={fill}>
				<title>{slice.label}: {tickLabel(slice.value)}</title>
			</path>
		{/each}
		{#if donut}
			<circle r={radius * 0.6} class="fill-background" />
		{/if}
	</g>
</svg>

<table class="sr-only">
	<caption>{t('kit.ir.chart.data')}</caption>
	<tbody>
		{#each slices as slice (slice.label)}
			<tr><th scope="row">{slice.label}</th><td>{tickLabel(slice.value)}</td></tr>
		{/each}
	</tbody>
</table>
