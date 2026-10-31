<script lang="ts">
	import type { IgColumnMeta } from './types';
	import { Columns, ArrowUp, ArrowDown, X, Lock } from 'lucide-svelte';

	let {
		open = $bindable(false),
		columns = $bindable<IgColumnMeta[]>([]),
		onApply
	}: {
		open: boolean;
		columns: IgColumnMeta[];
		onApply?: () => void;
	} = $props();

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...columns];
		const temp = next[index - 1];
		next[index - 1] = next[index];
		next[index] = temp;
		columns = next;
	}

	function moveDown(index: number) {
		if (index >= columns.length - 1) return;
		const next = [...columns];
		const temp = next[index + 1];
		next[index + 1] = next[index];
		next[index] = temp;
		columns = next;
	}

	function toggleVisible(col: IgColumnMeta) {
		col.visible = !col.visible;
	}

	function toggleFreeze(col: IgColumnMeta) {
		col.frozen = !col.frozen;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 text-slate-800">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2">
					<div class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
						<Columns class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						Pengaturan Kolom (Tampilkan, Sembunyikan & Urutan)
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

			<div class="py-3 text-xs">
				<p class="text-slate-500 mb-3">Centang kolom yang ingin ditampilkan, atau gunakan tombol panah untuk menyusun urutan tampilan tabel:</p>

				<div class="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
					{#each columns as col, index (col.name)}
						<div class="flex items-center justify-between p-2.5 hover:bg-slate-50 transition">
							<div class="flex items-center gap-3">
								<input
									type="checkbox"
									checked={col.visible}
									onchange={() => toggleVisible(col)}
									class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
								/>
								<div>
									<span class="font-bold text-slate-800">{col.label}</span>
									<span class="ml-2 font-mono text-[10px] text-slate-400">({col.name})</span>
								</div>
							</div>

							<div class="flex items-center gap-1">
								<button
									type="button"
									onclick={() => toggleFreeze(col)}
									class="p-1 rounded text-xs border transition cursor-pointer {col.frozen ? 'bg-blue-50 border-blue-300 text-blue-600 font-bold' : 'border-slate-200 text-slate-400 hover:text-slate-600'}"
									title={col.frozen ? 'Kolom Beku (Frozen)' : 'Bekukan Kolom'}
								>
									<Lock class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => moveUp(index)}
									disabled={index === 0}
									class="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
									title="Pindah ke Atas"
								>
									<ArrowUp class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => moveDown(index)}
									disabled={index === columns.length - 1}
									class="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
									title="Pindah ke Bawah"
								>
									<ArrowDown class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex items-center justify-between pt-3 border-t border-slate-100">
				<button
					type="button"
					onclick={() => {
						columns.forEach((c) => { c.visible = true; c.frozen = false; });
					}}
					class="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
				>
					Tampilkan Semua Kolom
				</button>
				<button
					type="button"
					onclick={() => { onApply?.(); open = false; }}
					class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Selesai
				</button>
			</div>
		</div>
	</div>
{/if}
