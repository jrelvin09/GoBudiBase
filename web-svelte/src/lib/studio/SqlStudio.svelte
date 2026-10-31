<script lang="ts">
	import { executeSqlStudio } from '$lib/api/builderClient';
	import { Play, Database, Terminal, Clock, AlertCircle, RefreshCw } from 'lucide-svelte';

	let sqlQuery = $state("SELECT id, code, name, category, status, value, location FROM app.registry_items LIMIT 25;");
	let resultColumns = $state<string[]>([]);
	let resultRows = $state<any[]>([]);
	let totalRows = $state(0);
	let executionTime = $state<number | null>(null);
	let loading = $state(false);
	let error = $state<string>('');

	async function runQuery() {
		if (!sqlQuery.trim()) return;
		loading = true;
		error = '';
		const start = performance.now();
		try {
			const res = await executeSqlStudio(sqlQuery);
			resultColumns = res.columns || [];
			resultRows = res.rows || [];
			totalRows = res.total || 0;
			executionTime = Math.round((performance.now() - start) * 10) / 10;
		} catch (e: any) {
			error = e.message || 'Eksekusi query SQL gagal';
			resultColumns = [];
			resultRows = [];
		} finally {
			loading = false;
		}
	}

	function loadSnippet(snippet: string) {
		sqlQuery = snippet;
		runQuery();
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Control Bar & Snippets -->
	<div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
		<div class="flex items-center gap-2">
			<Terminal class="h-4 w-4 text-emerald-400" />
			<span class="text-xs font-bold uppercase tracking-wider text-slate-200">PostgreSQL 17 SQL Studio</span>
		</div>

		<div class="flex items-center gap-2 overflow-x-auto text-xs">
			<span class="text-slate-500 text-[11px]">Quick Queries:</span>
			<button
				type="button"
				onclick={() => loadSnippet("SELECT id, code, name, category, status, value FROM app.registry_items LIMIT 25;")}
				class="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
			>
				Top 25 Aset
			</button>
			<button
				type="button"
				onclick={() => loadSnippet("SELECT category, status, COUNT(*), ROUND(AVG(value)::numeric, 2) AS rerata_nilai FROM app.registry_items GROUP BY category, status;")}
				class="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
			>
				Agregasi Kategori
			</button>
			<button
				type="button"
				onclick={() => loadSnippet("SELECT * FROM builder.apps;")}
				class="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
			>
				Metadata Apps
			</button>
		</div>
	</div>

	<!-- SQL Editor Panel -->
	<div class="flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden">
		<div class="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-900/60">
			<span class="text-[11px] font-mono text-slate-400">Editor SQL Query (SELECT Only)</span>
			<button
				type="button"
				onclick={runQuery}
				disabled={loading}
				class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition"
			>
				{#if loading}
					<RefreshCw class="h-3.5 w-3.5 animate-spin" />
					<span>Menjalankan...</span>
				{:else}
					<Play class="h-3.5 w-3.5 fill-white" />
					<span>Jalankan Query (F5)</span>
				{/if}
			</button>
		</div>

		<textarea
			bind:value={sqlQuery}
			rows="4"
			placeholder="Tuliskan query SQL SELECT..."
			class="w-full bg-slate-950 p-4 font-mono text-xs text-emerald-300 placeholder-slate-700 focus:outline-none resize-none leading-relaxed"
		></textarea>
	</div>

	<!-- Query Execution Telemetry & Error Alert -->
	{#if error}
		<div class="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
			<AlertCircle class="h-4 w-4 shrink-0" />
			<span>{error}</span>
		</div>
	{/if}

	{#if executionTime !== null}
		<div class="flex items-center justify-between text-xs text-slate-500 px-1">
			<div class="flex items-center gap-1.5 font-mono">
				<Clock class="h-3.5 w-3.5 text-emerald-400" />
				<span>Waktu Eksekusi: <strong class="text-slate-200">{executionTime} ms</strong></span>
			</div>
			<span class="font-mono">{totalRows} Baris Ditemukan</span>
		</div>
	{/if}

	<!-- Results Table -->
	{#if resultColumns.length > 0}
		<div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur">
			<table class="w-full text-left border-collapse text-xs">
				<thead>
					<tr class="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] text-slate-400">
						{#each resultColumns as col}
							<th class="px-3.5 py-2.5 font-bold uppercase tracking-wider">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
					{#each resultRows as row}
						<tr class="hover:bg-slate-800/40 transition">
							{#each resultColumns as col}
								<td class="px-3.5 py-2 truncate max-w-xs">{row[col] ?? '-'}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
