<script lang="ts">
	import type { IgFilter, IgGroup, IgHighlight } from './types';
	import { Filter, FolderTree, Highlighter, X, CheckSquare, Square } from 'lucide-svelte';

	let {
		filters = $bindable<IgFilter[]>([]),
		group = $bindable<IgGroup | null>(null),
		highlights = $bindable<IgHighlight[]>([]),
		onEditFilter,
		onEditGroup,
		onEditHighlight
	}: {
		filters: IgFilter[];
		group: IgGroup | null;
		highlights: IgHighlight[];
		onEditFilter?: (filter: IgFilter) => void;
		onEditGroup?: () => void;
		onEditHighlight?: (hl: IgHighlight) => void;
	} = $props();

	function toggleFilter(filter: IgFilter) {
		filter.enabled = !filter.enabled;
	}

	function removeFilter(id: string) {
		filters = filters.filter((f) => f.id !== id);
	}

	function toggleGroup() {
		if (group) group.enabled = !group.enabled;
	}

	function removeGroup() {
		group = null;
	}

	function toggleHighlight(hl: IgHighlight) {
		hl.enabled = !hl.enabled;
	}

	function removeHighlight(id: string) {
		highlights = highlights.filter((h) => h.id !== id);
	}

	const hasAnyChips = $derived(
		filters.length > 0 || (group && group.column) || highlights.length > 0
	);
</script>

{#if hasAnyChips}
	<div class="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
		<span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Active Rules:</span>

		<!-- Grouping Chip -->
		{#if group && group.column}
			<div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition {group.enabled ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}">
				<button
					type="button"
					onclick={toggleGroup}
					class="cursor-pointer text-indigo-600 hover:text-indigo-800"
					title="Toggle Grouping"
				>
					{#if group.enabled}
						<CheckSquare class="w-3.5 h-3.5" />
					{:else}
						<Square class="w-3.5 h-3.5" />
					{/if}
				</button>
				<button
					type="button"
					onclick={onEditGroup}
					class="font-semibold cursor-pointer hover:underline flex items-center gap-1"
				>
					<FolderTree class="w-3 h-3 text-indigo-600" />
					<span>Group: {group.column}</span>
				</button>
				<button
					type="button"
					onclick={removeGroup}
					class="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
					title="Hapus Grouping"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		{/if}

		<!-- Filter Chips (1:1 APEX Filter Chips) -->
		{#each filters as filter (filter.id)}
			<div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition {filter.enabled ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}">
				<button
					type="button"
					onclick={() => toggleFilter(filter)}
					class="cursor-pointer text-blue-600 hover:text-blue-800"
					title="Aktifkan / Nonaktifkan Filter"
				>
					{#if filter.enabled}
						<CheckSquare class="w-3.5 h-3.5" />
					{:else}
						<Square class="w-3.5 h-3.5" />
					{/if}
				</button>
				<button
					type="button"
					onclick={() => onEditFilter?.(filter)}
					class="font-medium cursor-pointer hover:underline flex items-center gap-1"
				>
					<Filter class="w-3 h-3 text-blue-600" />
					<strong class="font-bold">{filter.column}</strong>
					<span class="text-slate-500 font-mono text-[10px]">{filter.op}</span>
					<span>"{filter.value}" {#if filter.op === 'between'}.. "{filter.value2}"{/if}</span>
				</button>
				<button
					type="button"
					onclick={() => removeFilter(filter.id)}
					class="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
					title="Hapus Filter"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		{/each}

		<!-- Highlighting Chips -->
		{#each highlights as hl (hl.id)}
			<div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition {hl.enabled ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}">
				<button
					type="button"
					onclick={() => toggleHighlight(hl)}
					class="cursor-pointer text-amber-600 hover:text-amber-800"
					title="Toggle Highlight"
				>
					{#if hl.enabled}
						<CheckSquare class="w-3.5 h-3.5" />
					{:else}
						<Square class="w-3.5 h-3.5" />
					{/if}
				</button>
				<button
					type="button"
					onclick={() => onEditHighlight?.(hl)}
					class="font-medium cursor-pointer hover:underline flex items-center gap-1"
				>
					<Highlighter class="w-3 h-3 text-amber-600" />
					<span class="font-bold">{hl.name || 'Highlight'}:</span>
					<span>{hl.column} {hl.op} "{hl.value}"</span>
					<span class="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style="background-color: {hl.bgColor}"></span>
				</button>
				<button
					type="button"
					onclick={() => removeHighlight(hl.id)}
					class="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
					title="Hapus Highlight"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		{/each}
	</div>
{/if}
