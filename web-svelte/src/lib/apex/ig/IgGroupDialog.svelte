<script lang="ts">
	import type { IgColumnMeta, IgGroup } from './types';
	import { FolderTree, X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		columns = [],
		group = $bindable<IgGroup | null>(null),
		onApply
	}: {
		open: boolean;
		columns: IgColumnMeta[];
		group: IgGroup | null;
		onApply?: () => void;
	} = $props();

	let selectedCol = $state('category');
	let isEnabled = $state(true);

	$effect(() => {
		if (open) {
			if (group) {
				selectedCol = group.column;
				isEnabled = group.enabled;
			} else {
				selectedCol = columns.find((c) => c.name === 'category')?.name || columns[0]?.name || 'category';
				isEnabled = true;
			}
		}
	});

	function handleSave() {
		if (selectedCol) {
			group = {
				column: selectedCol,
				enabled: isEnabled
			};
		} else {
			group = null;
		}
		onApply?.();
		open = false;
	}

	function handleRemove() {
		group = null;
		onApply?.();
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 text-slate-800">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2">
					<div class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
						<FolderTree class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						Control Break (Pengelompokan / Grouping)
					</h3>
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<div class="py-4 space-y-4 text-xs">
				<p class="text-slate-500">
					Mengelompokkan baris berdasarkan nilai kolom yang sama dengan header grup yang dapat dilipat (collapsible):
				</p>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Pilih Kolom Pengelompokan</label>
					<select
						bind:value={selectedCol}
						class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
					>
						{#each columns as col}
							<option value={col.name}>{col.label} ({col.name})</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<input
						type="checkbox"
						id="enable-group"
						bind:checked={isEnabled}
						class="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
					/>
					<label for="enable-group" class="font-semibold text-slate-700 cursor-pointer">
						Aktifkan pengelompokan saat ini
					</label>
				</div>
			</div>

			<div class="flex items-center justify-between pt-3 border-t border-slate-100">
				<button
					type="button"
					onclick={handleRemove}
					class="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
				>
					Nonaktifkan Grouping
				</button>
				<button
					type="button"
					onclick={handleSave}
					class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Terapkan Grouping
				</button>
			</div>
		</div>
	</div>
{/if}
