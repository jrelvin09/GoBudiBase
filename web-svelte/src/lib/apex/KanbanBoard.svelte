<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type RegistryItem } from '$lib/api/client';
	import { Layers, CheckCircle2, AlertTriangle, AlertOctagon, Wrench, RefreshCw, Plus } from 'lucide-svelte';

	interface KanbanLane {
		status: string;
		label: string;
		color: string;
		borderColor: string;
		icon: any;
	}

	const lanes: KanbanLane[] = [
		{ status: 'Baik', label: 'Siap Pakai (Baik)', color: 'bg-emerald-500/10 text-emerald-400', borderColor: 'border-emerald-500/30', icon: CheckCircle2 },
		{ status: 'Rusak Ringan', label: 'Perlu Servis (Ringan)', color: 'bg-amber-500/10 text-amber-400', borderColor: 'border-amber-500/30', icon: AlertTriangle },
		{ status: 'Dalam Perbaikan', label: 'Sedang Diperbaiki', color: 'bg-blue-500/10 text-blue-400', borderColor: 'border-blue-500/30', icon: Wrench },
		{ status: 'Rusak Berat', label: 'Afkir / Rusak Berat', color: 'bg-rose-500/10 text-rose-400', borderColor: 'border-rose-500/30', icon: AlertOctagon }
	];

	let {
		title = 'Enterprise Kanban Workflow'
	}: {
		title?: string;
	} = $props();

	let items = $state<RegistryItem[]>([]);
	let loading = $state(false);
	let updatingId = $state<number | null>(null);

	async function loadData() {
		loading = true;
		try {
			const res = await postRPC<{ rows: RegistryItem[] }>('/registry/list', { limit: 100 });
			items = res.rows || [];
		} catch (e) {
			console.error('Failed to load kanban items:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	function getItemsByStatus(status: string) {
		return items.filter((item) => {
			if (status === 'Baik') return item.status === 'Baik' || !item.status;
			return item.status === status;
		});
	}

	async function moveStatus(itemId: number, newStatus: string) {
		updatingId = itemId;
		try {
			await postRPC('/registry/update', { id: itemId, field: 'status', value: newStatus });
			items = items.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it));
		} catch (e) {
			console.error('Failed to update status:', e);
		} finally {
			updatingId = null;
		}
	}
</script>

<div class="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
	<!-- Header -->
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
				<Layers class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
					<span>{title}</span>
					<span class="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
						LIVE SYNC
					</span>
				</h3>
				<p class="text-xs text-slate-400">Manajemen status aset dan siklus pemeliharaan fisik antar divisi</p>
			</div>
		</div>

		<button
			type="button"
			onclick={loadData}
			class="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
		>
			<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
			<span>Refresh</span>
		</button>
	</div>

	<!-- Kanban Board Lanes -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each lanes as lane}
			{@const laneItems = getItemsByStatus(lane.status)}
			<div class="flex flex-col rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
				<!-- Lane Title -->
				<div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
					<div class="flex items-center gap-2">
						<span class="flex h-5 w-5 items-center justify-center rounded-md {lane.color}">
							<lane.icon class="h-3.5 w-3.5" />
						</span>
						<h4 class="text-xs font-bold text-slate-200">{lane.label}</h4>
					</div>
					<span class="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
						{laneItems.length}
					</span>
				</div>

				<!-- Cards List -->
				<div class="flex flex-col gap-2.5 overflow-y-auto max-h-[540px] pr-1">
					{#if laneItems.length === 0}
						<div class="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-800/60 text-[11px] text-slate-600">
							Tidak ada aset
						</div>
					{:else}
						{#each laneItems as item (item.id)}
							<div class="group relative rounded-lg border border-slate-800 bg-slate-900/90 p-3 shadow transition hover:border-slate-700 hover:shadow-md">
								<div class="flex items-start justify-between gap-2">
									<span class="font-mono text-[10px] font-semibold text-emerald-400">
										{item.code}
									</span>
									<span class="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
										{item.category}
									</span>
								</div>

								<h5 class="mt-1 text-xs font-semibold text-slate-200 line-clamp-2">
									{item.name}
								</h5>

								<div class="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
									<span>{item.location || 'Gedung Pusat'}</span>
									<span class="font-mono font-bold text-slate-300">
										Rp {(item.value || 0).toLocaleString('id-ID')}
									</span>
								</div>

								<!-- Quick Move Actions Menu on Hover -->
								<div class="mt-2 flex items-center gap-1 border-t border-slate-800/40 pt-2 opacity-80 group-hover:opacity-100 transition">
									<span class="text-[9px] text-slate-500 mr-1">Ubah ke:</span>
									{#each lanes as targetLane}
										{#if targetLane.status !== lane.status}
											<button
												type="button"
												onclick={() => moveStatus(item.id, targetLane.status)}
												disabled={updatingId === item.id}
												title="Pindahkan ke {targetLane.label}"
												class="rounded border border-slate-800 bg-slate-850 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 hover:border-slate-600 hover:text-slate-200"
											>
												{targetLane.status.split(' ')[0]}
											</button>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>