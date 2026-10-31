<script lang="ts">
	import { onMount, setContext, type Snippet } from 'svelte';
	import { executeSqlStudio } from '$lib/api/builderClient';
	import { RefreshCw, Database, AlertCircle } from 'lucide-svelte';

	let {
		table = '',
		sql = '',
		limit = 50,
		title = 'Data Provider',
		children
	}: {
		table?: string;
		sql?: string;
		limit?: number;
		title?: string;
		children?: Snippet<[{ data: any[]; columns: string[]; loading: boolean; error: string | null; refresh: () => void }]>;
	} = $props();

	let data = $state<any[]>([]);
	let columns = $state<string[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchData() {
		loading = true;
		error = null;
		try {
			let query = sql;
			if (!query && table) {
				const fullTable = table.includes('.') ? table : `app.${table}`;
				query = `SELECT * FROM ${fullTable} LIMIT ${limit}`;
			}
			if (!query) {
				query = 'SELECT * FROM app.bmn_items LIMIT 50';
			}

			const res = await executeSqlStudio(query, limit);
			columns = res.columns || [];
			data = res.rows || [];
		} catch (e: any) {
			error = e.message || 'Gagal memuat data';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchData();
	});

	// Expose to context
	setContext('dataProvider', {
		getData: () => data,
		getColumns: () => columns,
		isLoading: () => loading,
		refresh: fetchData
	});
</script>

<div class="rounded-xl border border-purple-900/40 bg-slate-900/70 p-4 shadow-lg backdrop-blur">
	<div class="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
		<div class="flex items-center gap-2">
			<Database class="h-4 w-4 text-purple-400" />
			<span class="text-xs font-bold text-slate-200">{title}</span>
			{#if table}
				<span class="rounded bg-purple-950 px-2 py-0.5 font-mono text-[10px] text-purple-300 border border-purple-800/50">
					{table}
				</span>
			{/if}
			{#if data.length > 0}
				<span class="text-[10px] text-slate-500 font-mono">({data.length} baris)</span>
			{/if}
		</div>
		<button
			type="button"
			onclick={fetchData}
			disabled={loading}
			class="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
		>
			<RefreshCw class="h-3 w-3 {loading ? 'animate-spin text-purple-400' : ''}" />
			<span>Refresh</span>
		</button>
	</div>

	{#if error}
		<div class="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
			<AlertCircle class="h-4 w-4 shrink-0" />
			<span>{error}</span>
		</div>
	{:else if loading && data.length === 0}
		<div class="flex h-20 items-center justify-center text-xs text-slate-400 gap-2">
			<RefreshCw class="h-4 w-4 animate-spin text-purple-400" />
			<span>Mengambil data dari PostgreSQL...</span>
		</div>
	{:else}
		{#if children}
			{@render children({ data, columns, loading, error, refresh: fetchData })}
		{:else}
			<div class="rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-slate-400 overflow-x-auto max-h-40">
				<div class="text-slate-500 mb-1">Kolom: {columns.join(', ')}</div>
				<div class="text-purple-300">Data tersedia ({data.length} records) untuk child blocks.</div>
			</div>
		{/if}
	{/if}
</div>
