<script lang="ts">
	import { onMount } from 'svelte';
	import { executeSqlStudio } from '$lib/api/builderClient';
	import { LayoutGrid, Search, RefreshCw, ExternalLink, Tag } from 'lucide-svelte';

	let {
		table = 'bmn_items',
		schema = 'app',
		title = 'Cards Repeater',
		limit = 12,
		onCardClick
	}: {
		table?: string;
		schema?: string;
		title?: string;
		limit?: number;
		onCardClick?: (item: any) => void;
	} = $props();

	let items = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	const fullTable = $derived(table.includes('.') ? table : `${schema}.${table}`);

	async function loadCards() {
		loading = true;
		error = null;
		try {
			const query = `SELECT * FROM ${fullTable} LIMIT ${limit}`;
			const res = await executeSqlStudio(query, limit);
			items = res.rows || [];
		} catch (e: any) {
			error = e.message || 'Gagal memuat kartu data';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadCards();
	});

	const filteredItems = $derived.by(() => {
		if (!searchQuery.trim()) return items;
		const q = searchQuery.toLowerCase();
		return items.filter((it) =>
			Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q))
		);
	});
</script>

<div class="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur flex flex-col gap-4">
	<!-- Repeater Header -->
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<LayoutGrid class="h-4 w-4 text-purple-400" />
			<h3 class="text-sm font-bold text-slate-100">{title}</h3>
			<span class="rounded bg-purple-950 px-2 py-0.5 font-mono text-[10px] text-purple-300 border border-purple-800/40">
				{filteredItems.length} Kartu
			</span>
		</div>

		<div class="flex items-center gap-2">
			<div class="relative">
				<Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Filter kartu..."
					class="w-40 rounded-lg border border-slate-800 bg-slate-950 py-1 pl-8 pr-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
				/>
			</div>
			<button
				type="button"
				onclick={loadCards}
				disabled={loading}
				class="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-white transition disabled:opacity-50"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin text-purple-400' : ''}" />
			</button>
		</div>
	</div>

	{#if error}
		<div class="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
			{error}
		</div>
	{:else if loading && items.length === 0}
		<div class="flex h-36 items-center justify-center text-xs text-slate-400 gap-2">
			<RefreshCw class="h-4 w-4 animate-spin text-purple-400" />
			<span>Memuat kartu data...</span>
		</div>
	{:else if filteredItems.length === 0}
		<div class="p-8 text-center text-xs text-slate-500">
			Tidak ada kartu yang cocok dengan pencarian.
		</div>
	{:else}
		<!-- Cards Grid -->
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredItems as it}
				{@const primaryText = it.name || it.title || it.nama_barang || it.item_name || `Item #${it.id || ''}`}
				{@const secondaryText = it.description || it.kategori || it.status || it.code || ''}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onclick={() => onCardClick?.(it)}
					class="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-purple-500/50 hover:bg-slate-900/90 hover:shadow-lg cursor-pointer"
				>
					<div>
						<div class="flex items-start justify-between gap-2 mb-2">
							<span class="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400 group-hover:text-purple-300">
								#{it.id || ''}
							</span>
							{#if it.status || it.kondisi}
								<span class="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
									{it.status || it.kondisi}
								</span>
							{/if}
						</div>
						<h4 class="text-xs font-bold text-slate-100 group-hover:text-purple-200 line-clamp-1">
							{primaryText}
						</h4>
						{#if secondaryText}
							<p class="mt-1 text-[11px] text-slate-400 line-clamp-2">
								{secondaryText}
							</p>
						{/if}
					</div>

					<div class="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-500">
						<span class="font-mono">
							{it.created_at ? new Date(it.created_at).toLocaleDateString('id-ID') : ''}
						</span>
						<span class="flex items-center gap-1 text-purple-400 font-semibold group-hover:translate-x-0.5 transition">
							<span>Detail</span>
							<ExternalLink class="h-3 w-3" />
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
