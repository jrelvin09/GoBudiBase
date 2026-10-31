<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC } from '$lib/api/client';
	import { Filter, Check, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-svelte';

	let {
		selectedFilters = $bindable<Record<string, string[]>>({}),
		onFilterChange
	}: {
		selectedFilters?: Record<string, string[]>;
		onFilterChange?: (filters: Record<string, string[]>) => void;
	} = $props();

	type FacetData = Record<string, Array<{ value: string; count: number }>>;

	let facets = $state<FacetData>({});
	let loading = $state(false);
	let collapsedSections = $state<Record<string, boolean>>({});

	async function loadFacets() {
		loading = true;
		try {
			// Convert array of selected values to API-compatible filter payload
			const filterPayload: Record<string, string> = {};
			Object.entries(selectedFilters).forEach(([k, vals]) => {
				if (vals && vals.length > 0) {
					filterPayload[k] = vals.join(',');
				}
			});

			const res = await postRPC<FacetData>('/facets', { p_filters: filterPayload });
			facets = res || {};
		} catch (err) {
			console.error('Gagal mengambil data facet:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadFacets();
	});

	function toggleFilter(category: string, value: string) {
		if (!selectedFilters[category]) {
			selectedFilters[category] = [];
		}

		const idx = selectedFilters[category].indexOf(value);
		if (idx > -1) {
			selectedFilters[category].splice(idx, 1);
			if (selectedFilters[category].length === 0) {
				delete selectedFilters[category];
			}
		} else {
			selectedFilters[category].push(value);
		}

		selectedFilters = { ...selectedFilters };
		if (onFilterChange) onFilterChange(selectedFilters);
		loadFacets();
	}

	function isSelected(category: string, value: string): boolean {
		return !!selectedFilters[category]?.includes(value);
	}

	function clearAll() {
		selectedFilters = {};
		if (onFilterChange) onFilterChange(selectedFilters);
		loadFacets();
	}

	function toggleCollapse(sec: string) {
		collapsedSections[sec] = !collapsedSections[sec];
	}

	const totalActiveFilters = $derived(
		Object.values(selectedFilters).reduce((acc, curr) => acc + (curr?.length || 0), 0)
	);

	function getFacetLabel(key: string): string {
		switch (key) {
			case 'category':
				return 'Kategori Aset';
			case 'status':
				return 'Status Operasional';
			case 'condition':
				return 'Kondisi Fisik';
			case 'building':
				return 'Gedung / Lokasi';
			default:
				return key.toUpperCase();
		}
	}
</script>

<div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<Filter class="h-4 w-4 text-emerald-400" />
			<span class="text-xs font-bold uppercase tracking-wider text-slate-200">Faceted Search</span>
			{#if totalActiveFilters > 0}
				<span class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
					{totalActiveFilters}
				</span>
			{/if}
		</div>

		{#if totalActiveFilters > 0}
			<button
				type="button"
				onclick={clearAll}
				class="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
			>
				<RotateCcw class="h-3 w-3" />
				Reset
			</button>
		{/if}
	</div>

	<!-- Facet Groups -->
	{#if loading && Object.keys(facets).length === 0}
		<div class="flex h-36 items-center justify-center text-xs text-slate-500">
			Memuat filter facet...
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each Object.entries(facets) as [facetKey, items]}
				{@const isCollapsed = collapsedSections[facetKey]}
				<div class="flex flex-col gap-1.5 border-b border-slate-800/60 pb-3 last:border-b-0">
					<button
						type="button"
						onclick={() => toggleCollapse(facetKey)}
						class="flex items-center justify-between py-1 text-xs font-semibold text-slate-300 hover:text-slate-100"
					>
						<span>{getFacetLabel(facetKey)}</span>
						{#if isCollapsed}
							<ChevronDown class="h-3.5 w-3.5 text-slate-500" />
						{:else}
							<ChevronUp class="h-3.5 w-3.5 text-slate-500" />
						{/if}
					</button>

					{#if !isCollapsed}
						<div class="mt-1 flex flex-col gap-1">
							{#each items as item}
								{@const checked = isSelected(facetKey, item.value)}
								<button
									type="button"
									onclick={() => toggleFilter(facetKey, item.value)}
									class="flex items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition {checked ? 'bg-emerald-950/40 text-emerald-300 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}"
								>
									<div class="flex items-center gap-2">
										<div class="flex h-3.5 w-3.5 items-center justify-center rounded border {checked ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-700 bg-slate-900'}">
											{#if checked}
												<Check class="h-2.5 w-2.5" />
											{/if}
										</div>
										<span class="truncate">{item.value}</span>
									</div>
									<span class="font-mono text-[11px] {checked ? 'text-emerald-400' : 'text-slate-500'}">
										{item.count}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
