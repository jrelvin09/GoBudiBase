<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type PivotResult } from '$lib/api/client';
	import { Table, RefreshCw, Layers, SlidersHorizontal, Filter, FileSpreadsheet } from 'lucide-svelte';
	import * as XLSX from 'xlsx';

	let {
		title = 'Dynamic Pivot Matrix (Go + Svelte 5 Parity)'
	}: {
		title?: string;
	} = $props();

	let rowDim = $state('category');
	let colDim = $state('status');
	let metric = $state('sum_value');
	let loading = $state(false);
	let pivotData = $state<PivotResult | null>(null);

	async function loadPivot() {
		loading = true;
		try {
			pivotData = await postRPC<PivotResult>('/pivot', {
				p_row_dim: rowDim,
				p_col_dim: colDim,
				p_metric: metric
			});
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadPivot();
	});

	function formatVal(val: number | undefined) {
		if (val === undefined || val === null) return '-';
		if (metric === 'count_rows') return val.toLocaleString('id-ID');
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
	}

	function exportExcel() {
		if (!pivotData) return;
		const header = [rowDim.toUpperCase(), ...pivotData.columns, 'TOTAL BARIS'];
		const dataRows = pivotData.rows.map((r) => {
			const row = [r.row_key];
			pivotData?.columns.forEach((col) => {
				row.push((r.cells[col] || 0).toString());
			});
			row.push(r.row_total.toString());
			return row;
		});

		const footer = ['TOTAL KOLOM'];
		pivotData.columns.forEach((col) => {
			footer.push((pivotData?.col_totals[col] || 0).toString());
		});
		footer.push(pivotData.grand_total.toString());
		dataRows.push(footer);

		const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Pivot Matrix');
		XLSX.writeFile(wb, `GoBudiBase_Pivot_${rowDim}_vs_${colDim}.xlsx`);
	}
</script>

<div class="p-6 space-y-4 max-w-7xl mx-auto">
	<div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
		<div class="flex items-center gap-3">
			<div class="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
				<Table class="w-5 h-5" />
			</div>
			<div>
				<h2 class="font-bold text-base text-slate-800">{title}</h2>
				<p class="text-xs text-slate-500">Kalkulasi 2D cross-tab dihitung dalam sub-5ms oleh Go native daemon</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button onclick={loadPivot} disabled={loading} class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50">
				<RefreshCw class="w-3.5 h-3.5 {loading ? 'animate-spin' : ''}" />
				<span>Hitung Ulang</span>
			</button>
			<button onclick={exportExcel} disabled={!pivotData} class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
				<FileSpreadsheet class="w-3.5 h-3.5" />
				<span>Export Excel</span>
			</button>
		</div>
	</div>

	<!-- Controls Bar -->
	<div class="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap gap-6 text-xs font-semibold">
		<div class="flex items-center gap-2">
			<SlidersHorizontal class="w-4 h-4 text-blue-400" />
			<span>Baris:</span>
			<select bind:value={rowDim} onchange={loadPivot} class="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded">
				<option value="category">Kategori</option>
				<option value="status">Status</option>
				<option value="location">Gedung Kampus</option>
			</select>
		</div>

		<div class="flex items-center gap-2">
			<Layers class="w-4 h-4 text-emerald-400" />
			<span>Kolom:</span>
			<select bind:value={colDim} onchange={loadPivot} class="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded">
				<option value="status">Status</option>
				<option value="category">Kategori</option>
				<option value="location">Gedung Kampus</option>
			</select>
		</div>

		<div class="flex items-center gap-2">
			<Filter class="w-4 h-4 text-amber-400" />
			<span>Metrik:</span>
			<select bind:value={metric} onchange={loadPivot} class="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded">
				<option value="sum_value">SUM(Nilai Rp)</option>
				<option value="count_rows">COUNT(*)</option>
				<option value="avg_value">AVG(Nilai Rp)</option>
			</select>
		</div>
	</div>

	<!-- Matrix Table -->
	{#if pivotData}
		<div class="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
			<table class="w-full text-xs text-left border-collapse">
				<thead class="bg-slate-100 font-bold uppercase text-slate-700 border-b border-slate-200">
					<tr>
						<th class="p-3 border-r border-slate-300 w-48">{rowDim} \ {colDim}</th>
						{#each pivotData.columns as col}
							<th class="p-3 text-right border-r border-slate-200">{col}</th>
						{/each}
						<th class="p-3 text-right bg-slate-200 font-bold text-slate-900 w-44">TOTAL BARIS</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200">
					{#each pivotData.rows as row}
						<tr class="hover:bg-blue-50/40">
							<td class="p-3 font-bold text-slate-800 bg-slate-50/50 border-r border-slate-200">{row.row_key}</td>
							{#each pivotData.columns as col}
								<td class="p-3 text-right font-mono border-r border-slate-200">{formatVal(row.cells[col])}</td>
							{/each}
							<td class="p-3 text-right font-mono font-bold text-slate-900 bg-slate-100/50">{formatVal(row.row_total)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot class="bg-slate-200 font-bold text-slate-900">
					<tr>
						<td class="p-3 border-r border-slate-300">TOTAL KOLOM</td>
						{#each pivotData.columns as col}
							<td class="p-3 text-right font-mono border-r border-slate-300">{formatVal(pivotData.col_totals[col])}</td>
						{/each}
						<td class="p-3 text-right font-mono font-extrabold text-blue-700 bg-blue-50">{formatVal(pivotData.grand_total)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</div>
