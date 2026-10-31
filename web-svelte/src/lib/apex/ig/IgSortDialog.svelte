<script lang="ts">
	import type { IgColumnMeta, IgSort } from './types';
	import { ArrowUpDown, X, Plus, Trash2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		columns = [],
		sorts = $bindable<IgSort[]>([]),
		onApply
	}: {
		open: boolean;
		columns: IgColumnMeta[];
		sorts: IgSort[];
		onApply?: () => void;
	} = $props();

	function addSortLevel() {
		if (sorts.length >= 4) return;
		const unusedCol = columns.find((c) => !sorts.some((s) => s.column === c.name))?.name || columns[0]?.name || 'id';
		sorts = [...sorts, { column: unusedCol, dir: 'asc' }];
	}

	function removeSortLevel(index: number) {
		sorts = sorts.filter((_, i) => i !== index);
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 text-slate-800">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2">
					<div class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
						<ArrowUpDown class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						Multi-Column Sorting (Pengurutan Bertingkat)
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

			<div class="py-4 space-y-3 text-xs">
				<p class="text-slate-500">Tentukan kolom dan urutan (Ascending A-Z / Descending Z-A):</p>

				{#if sorts.length === 0}
					<div class="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400">
						Belum ada pengurutan aktif. Klik tombol di bawah untuk menambah pengurutan.
					</div>
				{:else}
					<div class="space-y-2">
						{#each sorts as sort, index}
							<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
								<span class="w-6 text-center font-bold text-slate-400">#{index + 1}</span>
								<select
									bind:value={sort.column}
									class="flex-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium cursor-pointer"
								>
									{#each columns as col}
										<option value={col.name}>{col.label}</option>
									{/each}
								</select>
								<select
									bind:value={sort.dir}
									class="w-32 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium cursor-pointer"
								>
									<option value="asc">Ascending (▲)</option>
									<option value="desc">Descending (▼)</option>
								</select>
								<button
									type="button"
									onclick={() => removeSortLevel(index)}
									class="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
									title="Hapus level pengurutan"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				{#if sorts.length < 4}
					<button
						type="button"
						onclick={addSortLevel}
						class="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer pt-1"
					>
						<Plus class="w-3.5 h-3.5" />
						<span>Tambah Kolom Pengurutan</span>
					</button>
				{/if}
			</div>

			<div class="flex items-center justify-between pt-3 border-t border-slate-100">
				<button
					type="button"
					onclick={() => (sorts = [])}
					class="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
				>
					Reset Semua Sort
				</button>
				<button
					type="button"
					onclick={() => { onApply?.(); open = false; }}
					class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Terapkan Urutan
				</button>
			</div>
		</div>
	</div>
{/if}
