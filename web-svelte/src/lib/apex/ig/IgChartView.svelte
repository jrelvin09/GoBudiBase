<script lang="ts">
	import type { ChartConfig, IgColumnMeta, IgRecord } from './types';
	import { BarChart3, PieChart, LineChart, AreaChart, Sliders } from 'lucide-svelte';

	let {
		records = [],
		columns = [],
		config = $bindable<ChartConfig>({
			type: 'bar',
			dimensionCol: 'category',
			metricCol: 'value',
			metricFunc: 'sum'
		})
	}: {
		records: IgRecord[];
		columns: IgColumnMeta[];
		config?: ChartConfig;
	} = $props();

	// Aggregation computation
	const chartData = $derived.by(() => {
		const validRecs = records.filter((r) => r._status !== 'deleted');
		const map = new Map<string, number[]>();

		for (const r of validRecs) {
			const dimVal = String(r[config.dimensionCol] ?? 'Lainnya');
			const metricNum = Number(r[config.metricCol]);
			if (!map.has(dimVal)) map.set(dimVal, []);
			if (!isNaN(metricNum)) map.get(dimVal)!.push(metricNum);
		}

		return Array.from(map.entries()).map(([label, numbers]) => {
			let value = 0;
			if (config.metricFunc === 'count') {
				value = numbers.length;
			} else if (config.metricFunc === 'sum') {
				value = numbers.reduce((a, b) => a + b, 0);
			} else if (config.metricFunc === 'avg') {
				value = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
			}
			return { label, value: Math.round(value) };
		}).sort((a, b) => b.value - a.value);
	});

	const maxValue = $derived(
		Math.max(...chartData.map((d) => d.value), 1)
	);

	const totalSum = $derived(
		chartData.reduce((acc, d) => acc + d.value, 0) || 1
	);

	const linePoints = $derived.by(() => {
		return chartData.map((d, i) => {
			const x = (i / Math.max(chartData.length - 1, 1)) * 500 + 40;
			const y = 200 - (d.value / maxValue) * 160;
			return { x, y, label: d.label, val: d.value };
		});
	});

	const polylinePoints = $derived(linePoints.map((p) => `${p.x},${p.y}`).join(' '));
	const areaPoints = $derived(
		linePoints.length > 0
			? `${linePoints[0].x},200 ${polylinePoints} ${linePoints[linePoints.length - 1].x},200`
			: '40,200 540,200'
	);

	const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
</script>

<div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs text-xs font-sans">
	<!-- Chart Controls Toolbar -->
	<div class="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
		<div class="flex items-center gap-2">
			<!-- Chart Type Selector -->
			<span class="font-bold text-slate-700">Tipe Grafik:</span>
			<div class="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
				<button
					type="button"
					onclick={() => (config.type = 'bar')}
					class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {config.type === 'bar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				>
					<BarChart3 class="w-3.5 h-3.5" />
					<span>Bar</span>
				</button>
				<button
					type="button"
					onclick={() => (config.type = 'pie')}
					class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {config.type === 'pie' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				>
					<PieChart class="w-3.5 h-3.5" />
					<span>Pie</span>
				</button>
				<button
					type="button"
					onclick={() => (config.type = 'line')}
					class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {config.type === 'line' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				>
					<LineChart class="w-3.5 h-3.5" />
					<span>Line</span>
				</button>
				<button
					type="button"
					onclick={() => (config.type = 'area')}
					class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {config.type === 'area' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				>
					<AreaChart class="w-3.5 h-3.5" />
					<span>Area</span>
				</button>
			</div>
		</div>

		<!-- Dimension & Metric Selectors -->
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex items-center gap-1.5">
				<span class="text-slate-500 font-medium">Dimensi (Kategori):</span>
				<select
					bind:value={config.dimensionCol}
					class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold cursor-pointer"
				>
					<option value="category">Kategori (Category)</option>
					<option value="status">Status</option>
					<option value="location">Lokasi (Location)</option>
				</select>
			</div>

			<div class="flex items-center gap-1.5">
				<span class="text-slate-500 font-medium">Metrik:</span>
				<select
					bind:value={config.metricFunc}
					class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-blue-700 cursor-pointer"
				>
					<option value="sum">SUM (Total Nilai)</option>
					<option value="count">COUNT (Jumlah Record)</option>
					<option value="avg">AVG (Rata-rata)</option>
				</select>
				{#if config.metricFunc !== 'count'}
					<select
						bind:value={config.metricCol}
						class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold cursor-pointer"
					>
						<option value="value">Nilai Aset (Rp)</option>
						<option value="id">ID</option>
					</select>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chart Visual Canvas -->
	{#if chartData.length === 0}
		<div class="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
			Tidak ada data untuk divisualisasikan.
		</div>
	{:else if config.type === 'bar'}
		<!-- Bar Chart (SVG + HTML Hybrid) -->
		<div class="space-y-3 py-4 max-w-3xl mx-auto">
			{#each chartData as item, idx}
				{@const pct = (item.value / maxValue) * 100}
				{@const color = PALETTE[idx % PALETTE.length]}
				<div class="space-y-1">
					<div class="flex items-center justify-between text-xs">
						<span class="font-bold text-slate-800">{item.label}</span>
						<span class="font-mono font-bold text-slate-900">
							{config.metricCol === 'value' && config.metricFunc !== 'count' ? `Rp ${item.value.toLocaleString('id-ID')}` : item.value.toLocaleString('id-ID')}
							<span class="text-slate-400 font-normal ml-1">({Math.round((item.value / totalSum) * 100)}%)</span>
						</span>
					</div>
					<div class="w-full h-6 rounded-lg bg-slate-100 overflow-hidden relative">
						<div
							class="h-full rounded-lg transition-all duration-500"
							style="width: {pct}%; background-color: {color};"
						></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if config.type === 'pie'}
		<!-- Pie / Donut Chart (SVG) -->
		<div class="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
			<div class="relative w-56 h-56">
				<svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
					{#each chartData as item, idx}
						{@const prevTotal = chartData.slice(0, idx).reduce((acc, d) => acc + d.value, 0)}
						{@const startPct = prevTotal / totalSum}
						{@const slicePct = item.value / totalSum}
						{@const strokeDash = `${slicePct * 314} 314`}
						{@const strokeOffset = `-${startPct * 314}`}
						{@const color = PALETTE[idx % PALETTE.length]}
						<circle
							cx="50"
							cy="50"
							r="35"
							fill="transparent"
							stroke={color}
							stroke-width="18"
							stroke-dasharray={strokeDash}
							stroke-dashoffset={strokeOffset}
							class="hover:opacity-80 transition cursor-pointer"
						>
							<title>{item.label}: {item.value}</title>
						</circle>
					{/each}
				</svg>
				<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
					<span class="text-[10px] text-slate-400 font-bold uppercase">Total</span>
					<span class="text-sm font-bold font-mono text-slate-800">{chartData.length} Kat</span>
				</div>
			</div>

			<!-- Legend -->
			<div class="space-y-2">
				{#each chartData as item, idx}
					{@const color = PALETTE[idx % PALETTE.length]}
					<div class="flex items-center gap-3">
						<span class="w-3.5 h-3.5 rounded-md shrink-0" style="background-color: {color}"></span>
						<span class="font-medium text-slate-700 w-32 truncate">{item.label}</span>
						<span class="font-mono font-bold text-slate-900">
							{config.metricCol === 'value' && config.metricFunc !== 'count' ? `Rp ${item.value.toLocaleString('id-ID')}` : item.value.toLocaleString('id-ID')}
						</span>
						<span class="text-slate-400 font-mono text-[11px]">({Math.round((item.value / totalSum) * 100)}%)</span>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Line & Area Chart (SVG Polyline) -->
		<div class="max-w-3xl mx-auto py-6 space-y-4">
			<div class="w-full overflow-x-auto">
				<svg viewBox="0 0 600 240" class="w-full h-64 overflow-visible">
					<!-- Grid lines -->
					<line x1="40" y1="40" x2="560" y2="40" stroke="#f1f5f9" stroke-width="1" />
					<line x1="40" y1="120" x2="560" y2="120" stroke="#f1f5f9" stroke-width="1" />
					<line x1="40" y1="200" x2="560" y2="200" stroke="#cbd5e1" stroke-width="1.5" />

					{#if config.type === 'area'}
						<polygon points={areaPoints} fill="rgba(37, 99, 235, 0.15)" />
					{/if}

					<polyline
						points={polylinePoints}
						fill="none"
						stroke="#2563eb"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>

					{#each linePoints as p}
						<circle cx={p.x} cy={p.y} r="5" fill="#2563eb" stroke="#ffffff" stroke-width="2" class="cursor-pointer">
							<title>{p.label}: {p.val}</title>
						</circle>
						<text x={p.x} y="220" font-size="10" text-anchor="middle" fill="#64748b" font-weight="600">{p.label}</text>
						<text x={p.x} y={p.y - 10} font-size="9" text-anchor="middle" fill="#1e293b" font-weight="bold">{p.val.toLocaleString('id-ID')}</text>
					{/each}
				</svg>
			</div>
		</div>
	{/if}
</div>
