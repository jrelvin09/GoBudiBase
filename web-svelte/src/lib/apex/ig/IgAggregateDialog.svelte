<script lang="ts">
	import type { AggregateFunc, IgAggregate, IgColumnMeta } from './types';
	import { PieChart, X, Plus, Trash2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		columns = [],
		aggregates = $bindable<IgAggregate[]>([]),
		onApply
	}: {
		open: boolean;
		columns: IgColumnMeta[];
		aggregates: IgAggregate[];
		onApply?: () => void;
	} = $props();

	const numericColumns = $derived(
		columns.filter((c) => c.type === 'number' || c.type === 'currency' || c.name === 'value' || c.name === 'id')
	);

	function addAggregate() {
		const targetCol = numericColumns[0]?.name || columns[0]?.name || 'value';
		aggregates = [...aggregates, { column: targetCol, func: 'sum' }];
	}

	function removeAggregate(index: number) {
		aggregates = aggregates.filter((_, i) => i !== index);
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 text-slate-800">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2">
					<div class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
						<PieChart class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						Agregasi Data (SUM, AVG, COUNT, MIN, MAX)
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
				<p class="text-slate-500">Hasil agregasi akan ditampilkan pada baris ringkasan di bawah tabel (Footer Summary Row):</p>

				{#if aggregates.length === 0}
					<div class="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400">
						Belum ada fungsi agregasi yang dipilih.
					</div>
				{:else}
					<div class="space-y-2">
						{#each aggregates as agg, index}
							<div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
								<select
									bind:value={agg.func}
									class="w-28 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-bold uppercase text-blue-700 cursor-pointer"
								>
									<option value="sum">SUM (Total)</option>
									<option value="avg">AVG (Rata-rata)</option>
									<option value="count">COUNT (Jumlah)</option>
									<option value="min">MIN (Terkecil)</option>
									<option value="max">MAX (Terbesar)</option>
								</select>
								<span class="text-slate-400 font-semibold">dari</span>
								<select
									bind:value={agg.column}
									class="flex-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium cursor-pointer"
								>
									{#each columns as col}
										<option value={col.name}>{col.label} ({col.type})</option>
									{/each}
								</select>
								<button
									type="button"
									onclick={() => removeAggregate(index)}
									class="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
									title="Hapus agregasi"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<button
					type="button"
					onclick={addAggregate}
					class="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer pt-1"
				>
					<Plus class="w-3.5 h-3.5" />
					<span>Tambah Agregasi Kolom</span>
				</button>
			</div>

			<div class="flex items-center justify-between pt-3 border-t border-slate-100">
				<button
					type="button"
					onclick={() => (aggregates = [])}
					class="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
				>
					Hapus Semua
				</button>
				<button
					type="button"
					onclick={() => { onApply?.(); open = false; }}
					class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Terapkan Agregasi
				</button>
			</div>
		</div>
	</div>
{/if}
