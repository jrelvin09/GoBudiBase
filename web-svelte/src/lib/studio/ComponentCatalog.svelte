<script lang="ts">
	import { onMount } from 'svelte';
	import { catalog, type CatalogEntry } from '$lib/kit/catalog';
	import { catalogTitle } from '$lib/kit/catalog-title';
	import { getLocale, setLocale, t } from '$lib/i18n/index.svelte';
	import { getDensity, getMode, isDensity, isMode, setDensity, setMode } from '$lib/theme/theme.svelte';
	import {
		Search,
		Layers,
		Box,
		Puzzle,
		Grid3X3,
		Compass,
		ExternalLink,
		CheckCircle2,
		Sparkles,
		Eye
	} from 'lucide-svelte';

	const TIERS = ['all', 'atom', 'molecule', 'organism', 'region'] as const;
	type SelectedTier = typeof TIERS[number];

	let selectedTier = $state<SelectedTier>('all');
	let searchQuery = $state('');
	let selectedId = $state<string>('button');

	const tierLabels: Record<string, { label: string; count: number }> = $derived({
		all: { label: 'Semua Komponen', count: catalog.length },
		atom: { label: 'Atoms', count: catalog.filter((c) => c.tier === 'atom').length },
		molecule: { label: 'Molecules', count: catalog.filter((c) => c.tier === 'molecule').length },
		organism: { label: 'Organisms', count: catalog.filter((c) => c.tier === 'organism').length },
		region: { label: 'Regions', count: catalog.filter((c) => c.tier === 'region').length }
	});

	const filteredEntries = $derived(
		catalog.filter((entry) => {
			const matchesTier = selectedTier === 'all' || entry.tier === selectedTier;
			if (!matchesTier) return false;
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			const title = catalogTitle(entry).toLowerCase();
			return title.includes(q) || entry.id.toLowerCase().includes(q);
		})
	);

	const activeEntry = $derived(catalog.find((c) => c.id === selectedId) || catalog[0]);
</script>

<div class="flex flex-col gap-5">
	<!-- Catalog Header -->
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
		<div class="flex items-center gap-3">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 font-bold text-white shadow-lg shadow-indigo-500/20">
				<Puzzle class="h-6 w-6" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-base font-bold text-slate-100 uppercase tracking-wider">
						Katalog Komponen GoBudiBase Parity
					</h2>
					<span class="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-300 border border-indigo-500/30">
						TOTAL {catalog.length} KOMPONEN
					</span>
				</div>
				<p class="text-xs text-slate-400 mt-0.5">
					Pustaka komponen lengkap dari atom, molekul kontrol form APEX, organisme data grid, hingga region runtime.
				</p>
			</div>
		</div>

		<!-- Theme & Density Controls -->
		<div class="flex items-center gap-3 text-xs">
			<div class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-slate-400">
				<span>Mode:</span>
				<select
					class="bg-transparent font-semibold text-slate-200 outline-none cursor-pointer"
					value={getMode()}
					onchange={(e) => { if (isMode(e.currentTarget.value)) setMode(e.currentTarget.value); }}
				>
					<option value="dark" class="bg-slate-900">Dark</option>
					<option value="light" class="bg-slate-900">Light</option>
				</select>
			</div>

			<div class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-slate-400">
				<span>Density:</span>
				<select
					class="bg-transparent font-semibold text-slate-200 outline-none cursor-pointer"
					value={getDensity()}
					onchange={(e) => { if (isDensity(e.currentTarget.value)) setDensity(e.currentTarget.value); }}
				>
					<option value="compact" class="bg-slate-900">Compact</option>
					<option value="comfortable" class="bg-slate-900">Comfortable</option>
				</select>
			</div>
		</div>
	</div>

	<!-- 2-Pane Showcase: Left Explorer + Right Live Preview -->
	<div class="grid grid-cols-12 gap-5 min-h-[680px]">
		<!-- Left Pane: Component Directory (4 cols) -->
		<div class="col-span-12 lg:col-span-4 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
			<!-- Search Bar -->
			<div class="relative mb-3">
				<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari dari {catalog.length} komponen..."
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
				/>
			</div>

			<!-- Tier Filter Tabs -->
			<div class="flex flex-wrap gap-1 border-b border-slate-800 pb-2.5 mb-3 text-[11px] font-semibold">
				{#each TIERS as tKey}
					{@const info = tierLabels[tKey]}
					<button
						type="button"
						onclick={() => (selectedTier = tKey)}
						class="rounded-lg px-2.5 py-1 transition {selectedTier === tKey ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950/50 text-slate-400 hover:text-slate-200'}"
					>
						{info.label} ({info.count})
					</button>
				{/each}
			</div>

			<!-- Component List Scrollable -->
			<div class="flex flex-col gap-1.5 overflow-y-auto max-h-[560px] pr-1">
				{#each filteredEntries as entry (entry.id)}
					{@const isSelected = selectedId === entry.id}
					<button
						type="button"
						onclick={() => (selectedId = entry.id)}
						class="flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition {isSelected ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 font-semibold shadow-md' : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'}"
					>
						<div class="flex items-center gap-2 truncate">
							<span class="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider {entry.tier === 'atom' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : entry.tier === 'molecule' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : entry.tier === 'organism' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
								{entry.tier}
							</span>
							<span class="truncate">{catalogTitle(entry)}</span>
						</div>

						<span class="font-mono text-[10px] text-slate-500 shrink-0 ml-2">{entry.id}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Right Pane: Live Interactive Demo (8 cols) -->
		<div class="col-span-12 lg:col-span-8 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
			{#if activeEntry}
				<!-- Demo Header -->
				<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
					<div>
						<div class="flex items-center gap-2.5">
							<h3 class="text-base font-bold text-slate-100">{catalogTitle(activeEntry)}</h3>
							<span class="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
								Tier: {activeEntry.tier}
							</span>
							{#if activeEntry.runtime?.capabilities.runtimeRegion}
								<span class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
									Runtime Region
								</span>
							{/if}
						</div>
						<p class="text-xs text-slate-400 mt-1">
							ID: <code class="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-indigo-300">{activeEntry.id}</code>
						</p>
					</div>

					<span class="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
						<Eye class="h-3.5 w-3.5" />
						<span>Live Preview</span>
					</span>
				</div>

				<!-- Demo Interactive Canvas -->
				<div class="flex-1 rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 overflow-y-auto">
					{#if activeEntry.load}
						{#await activeEntry.load()}
							<div class="flex h-64 flex-col items-center justify-center gap-2 text-xs text-slate-500">
								<div class="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
								<span>Memuat demo komponen...</span>
							</div>
						{:then loaded}
							{@const Demo = loaded.default}
							<div class="kit-demo-container">
								<Demo />
							</div>
						{:catch err}
							<div class="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300">
								Gagal memuat demo: {err.message}
							</div>
						{/await}
					{:else}
						<div class="flex h-64 flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
							<Box class="h-10 w-10 text-slate-600" />
							<span class="font-semibold text-slate-400">Komponen Metadata Region</span>
							<p class="max-w-md text-slate-500">
								Komponen ini adalah tipe container/region deklaratif di runtime GoBudiBase yang diatur melalui Page Designer Studio.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>