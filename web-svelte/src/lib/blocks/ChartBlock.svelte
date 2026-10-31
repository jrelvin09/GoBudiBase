<script lang="ts">
	import { onMount } from 'svelte';
	import { executeSqlStudio } from '$lib/api/builderClient';
	import { BarChart3, PieChart, LineChart, RefreshCw } from 'lucide-svelte';

	let {
		table = 'bmn_items',
		schema = 'app',
		title = 'Chart Analytics',
		chartType = 'bar', // 'bar' | 'donut' | 'line'
		groupBy = 'status',
		aggregate = 'count'
	}: {
		table?: string;
		schema?: string;
		title?: string;
		chartType?: 'bar' | 'donut' | 'line';
		groupBy?: string;
		aggregate?: 'count' | 'sum';
	} = $props();

	let data = $state<{ label: string; value: number }[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const fullTable = $derived(table.includes('.') ? table : `${schema}.${table}`);

	async function loadChartData() {
		loading = true;
		error = null;
		try {
			// Query grouping
			const query = `
				SELECT COALESCE(${groupBy}::text, 'Tidak Diketahui') AS label, COUNT(*) AS value
				FROM ${fullTable}
				GROUP BY 1
				ORDER BY value DESC
				LIMIT 8
			`;
			const res = await executeSqlStudio(query, 10);
			data = (res.rows || []).map((r) => ({
				label: String(r.label || 'N/A'),
				value: Number(r.value || 0)
			}));
		} catch (e: any) {
			error = e.message || 'Gagal menghitung analitika';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadChartData();
	});

	const maxValue = $derived(Math.max(1, ...data.map((d) => d.value)));
	const totalSum = $derived(data.reduce((acc, d) => acc + d.value, 0));

	const colors = [
		'#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#3b82f6', '#f43f5e'
	];
</script>

<div class="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur flex flex-col gap-4">
	<!-- Chart Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
		<div class="flex items-center gap-2">
			{#if chartType === 'donut'}
				<PieChart class="h-4 w-4 text-purple-400" />
			{:else if chartType === 'line'}
				<LineChart class="h-4 w-4 text-emerald-400" />
			{:else}
				<BarChart3 class="h-4 w-4 text-purple-400" />
			{/if}
			<div>
				<h3 class="text-xs font-bold text-slate-100">{title}</h3>
				<span class="font-mono text-[10px] text-slate-400">
					Agregasi: {groupBy} ({totalSum} total)
				</span>
			</div>
		</div>

		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => (chartType = 'bar')}
				class="rounded p-1 text-xs {chartType === 'bar' ? 'bg-purple-900/60 text-purple-300 font-bold' : 'text-slate-500 hover:text-slate-300'}"
				title="Bar Chart"
			>
				Bar
			</button>
			<button
				type="button"
				onclick={() => (chartType = 'donut')}
				class="rounded p-1 text-xs {chartType === 'donut' ? 'bg-purple-900/60 text-purple-300 font-bold' : 'text-slate-500 hover:text-slate-300'}"
				title="Donut Chart"
			>
				Donut
			</button>
			<button
				type="button"
				onclick={loadChartData}
				disabled={loading}
				class="rounded p-1 text-slate-400 hover:text-white transition disabled:opacity-50 ml-1"
			>
				<RefreshCw class="h-3 w-3 {loading ? 'animate-spin text-purple-400' : ''}" />
			</button>
		</div>
	</div>

	{#if error}
		<div class="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
			{error}
		</div>
	{:else if loading && data.length === 0}
		<div class="flex h-36 items-center justify-center text-xs text-slate-400 gap-2">
			<RefreshCw class="h-4 w-4 animate-spin text-purple-400" />
			<span>Menghitung statistik grafik...</span>
		</div>
	{:else if data.length === 0}
		<div class="p-8 text-center text-xs text-slate-500">
			Tidak ada data agregasi yang ditemukan.
		</div>
	{:else}
		{#if chartType === 'bar'}
			<!-- Horizontal Bar Chart -->
			<div class="flex flex-col gap-2.5 py-1">
				{#each data as item, i}
					{@const pct = Math.round((item.value / maxValue) * 100)}
					{@const color = colors[i % colors.length]}
					<div class="flex flex-col gap-1">
						<div class="flex justify-between text-[11px]">
							<span class="text-slate-300 font-medium truncate max-w-xs">{item.label}</span>
							<span class="font-mono text-slate-400 font-bold">{item.value}</span>
						</div>
						<div class="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width: {pct}%; background-color: {color};"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if chartType === 'donut'}
			<!-- Donut Representation -->
			<div class="flex flex-wrap items-center justify-around gap-4 py-2">
				<div class="flex flex-col gap-1.5 flex-1">
					{#each data as item, i}
						{@const color = colors[i % colors.length]}
						{@const pct = Math.round((item.value / totalSum) * 100)}
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<div class="h-2.5 w-2.5 rounded-full" style="background-color: {color};"></div>
								<span class="text-slate-300 truncate max-w-xs">{item.label}</span>
							</div>
							<div class="font-mono text-slate-400 font-semibold">
								{item.value} <span class="text-[10px] text-slate-500">({pct}%)</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
