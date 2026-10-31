<script lang="ts">
	import DateRangePicker from '$lib/kit/molecules/DateRangePicker.svelte';

	let start = $state<string | null>('2026-10-01');
	let end = $state<string | null>('2026-10-31');
</script>

<div class="flex flex-col gap-4 max-w-lg">
	<DateRangePicker
		label="Rentang Tanggal Pelaporan"
		bind:startDate={start}
		bind:endDate={end}
	/>

	{#if start && end}
		<div class="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300 font-mono flex items-center justify-between">
			<span class="text-slate-500">Rentang Terpilih:</span>
			<span class="text-emerald-400 font-bold">{start} &nbsp;s/d&nbsp; {end}</span>
		</div>
	{/if}
</div>
