<script lang="ts">
	import type { IgRecord } from './types';
	import {
		Box,
		MapPin,
		Tag,
		ExternalLink,
		Copy,
		Trash2,
		RotateCcw,
		MoreVertical
	} from 'lucide-svelte';

	let {
		records = [],
		onOpenSingleRow,
		onRowAction
	}: {
		records: IgRecord[];
		onOpenSingleRow: (id: number) => void;
		onRowAction: (action: 'duplicate' | 'delete' | 'revert', id: number) => void;
	} = $props();

	let openMenuId = $state<number | null>(null);

	function closeMenu() {
		openMenuId = null;
	}
</script>

<svelte:window onclick={closeMenu} />

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-sans">
	{#each records as item (item.id)}
		{@const isDeleted = item._status === 'deleted'}
		{@const isInserted = item._status === 'inserted'}

		<div
			class="relative rounded-2xl border p-4 bg-white shadow-xs hover:shadow-md transition cursor-pointer select-none {isDeleted ? 'border-rose-200 bg-rose-50/30 opacity-60' : isInserted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-blue-400'}"
			ondblclick={() => onOpenSingleRow(item.id)}
		>
			<!-- Card Header -->
			<div class="flex items-start justify-between gap-2 mb-3">
				<div class="flex items-center gap-2.5">
					<div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs {item.category === 'Vehicle' ? 'bg-amber-100 text-amber-700' : item.category === 'Electronic' ? 'bg-blue-100 text-blue-700' : item.category === 'Building' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}">
						<Box class="w-4 h-4" />
					</div>
					<div>
						<span class="font-mono text-[10px] text-blue-600 font-bold block">{item.code}</span>
						<span class="font-bold text-slate-900 line-clamp-1 text-sm">{item.name || 'Tanpa Nama'}</span>
					</div>
				</div>

				<!-- Action Dropdown Trigger -->
				<div class="relative" onclick={(e) => e.stopPropagation()}>
					<button
						type="button"
						onclick={() => (openMenuId = openMenuId === item.id ? null : item.id)}
						class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
					>
						<MoreVertical class="w-3.5 h-3.5" />
					</button>

					{#if openMenuId === item.id}
						<div class="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl z-50 text-left text-slate-800">
							<button
								type="button"
								onclick={() => { onOpenSingleRow(item.id); closeMenu(); }}
								class="w-full flex items-center gap-2 px-3 py-1.5 text-blue-600 font-semibold hover:bg-blue-50 transition cursor-pointer"
							>
								<ExternalLink class="w-3.5 h-3.5" />
								<span>Single Row View</span>
							</button>
							<button
								type="button"
								onclick={() => { onRowAction('duplicate', item.id); closeMenu(); }}
								class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition cursor-pointer"
							>
								<Copy class="w-3.5 h-3.5 text-slate-500" />
								<span>Duplicate Card</span>
							</button>
							{#if isDeleted}
								<button
									type="button"
									onclick={() => { onRowAction('revert', item.id); closeMenu(); }}
									class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-emerald-600 font-semibold transition cursor-pointer"
								>
									<RotateCcw class="w-3.5 h-3.5" />
									<span>Batal Hapus</span>
								</button>
							{:else}
								<button
									type="button"
									onclick={() => { onRowAction('delete', item.id); closeMenu(); }}
									class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
								>
									<Trash2 class="w-3.5 h-3.5" />
									<span>Delete Card</span>
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Meta details -->
			<div class="space-y-1.5 py-2 border-t border-slate-100 text-[11px] text-slate-500">
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-1.5">
						<Tag class="w-3 h-3 text-slate-400" />
						<span>{item.category}</span>
					</span>
					<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider {item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : item.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
						{item.status}
					</span>
				</div>

				<div class="flex items-center gap-1.5 text-slate-400">
					<MapPin class="w-3 h-3 text-slate-400" />
					<span class="truncate">{item.location || '-'}</span>
				</div>
			</div>

			<!-- Card Footer (Value) -->
			<div class="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
				<span class="text-[10px] text-slate-400 font-semibold uppercase">Nilai Aset</span>
				<span class="font-bold font-mono text-xs text-slate-900">
					Rp {(item.value || 0).toLocaleString('id-ID')}
				</span>
			</div>
		</div>
	{/each}
</div>
