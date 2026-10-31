<script lang="ts">
	import { PALETTE_STROKE, sparklinePath } from './chart-scale';

	// Tren mini tanpa sumbu untuk kartu KPI. Nilai diregangkan memenuhi kotak,
	// jadi dipakai hanya sebagai isyarat arah, bukan pembacaan nilai.
	let {
		values,
		label,
		width = 96,
		height = 32,
		tone = 1,
		class: className = ''
	}: {
		values: number[];
		label: string;
		width?: number;
		height?: number;
		tone?: number;
		class?: string;
	} = $props();

	const points = $derived(sparklinePath(values, width, height));
	const stroke = $derived(PALETTE_STROKE[(tone - 1) % PALETTE_STROKE.length]);
</script>

<svg viewBox="0 0 {width} {height}" class={className} style="width: {width}px; height: {height}px" role="img" aria-label={label}>
	<title>{label}</title>
	<polyline {points} fill="none" class={stroke} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
