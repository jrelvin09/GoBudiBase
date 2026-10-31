<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type RegistryItem } from '$lib/api/client';
	import { Search, X, Check, Building2, ExternalLink } from 'lucide-svelte';

	let openModal = $state(false);
	let selectedItem = $state<RegistryItem | null>(null);
	let searchQuery = $state('');
	let items = $state<RegistryItem[]>([]);
	let loading = $state(false);

	async function loadItems() {
		loading = true;
		try {
			const res = await postRPC<{ rows: RegistryItem[] }>('/registry/list', { limit: 100 });
			items = res.rows || [];
		} catch (e) {
			console.error('Failed to load LOV items:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadItems();
	});

	const filteredItems = $derived(
		items.filter((it) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q) || (it.category || '').toLowerCase().includes(q);
		})
	);

	function selectItem(it: RegistryItem) {
		selectedItem = it;
		openModal = false;
	}
</script>

<div class="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
	<!-- Header -->
	<div class="flex items-center gap-3 border-b border-slate-800 pb-4">
		<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
			<Search class="h-5 w-5" />
		</div>
		<div>
			<h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
				<span>Oracle APEX Popup LOV (List of Values)</span>
				<span class="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
					MODAL LOOKUP
				</span>
			</h3>
			<p class="text-xs text-slate-400">Pencarian entitas master dengan filter real-time dan pemilihan relasi data</p>
		</div>
	</div>

	<!-- Form Field -->
	<div class="flex flex-col gap-2 max-w-xl">
		<label class="text-xs font-semibold text-slate-300">Pilih Aset Terkait (Foreign Key Reference):</label>
		<div class="flex items-center gap-2">
			<div class="flex-1 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
				{#if selectedItem}
					<div class="flex items-center gap-2 truncate">
						<span class="font-mono text-emerald-400 font-bold">{selectedItem.code}</span>
						<span class="truncate">{selectedItem.name}</span>
						<span class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{selectedItem.category}</span>
					</div>
				{:else}
					<span class="text-slate-500 italic">Klik tombol cari untuk memilih aset...</span>
				{/if}
			</div>

			<button
				type="button"
				onclick={() => (openModal = true)}
				class="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition"
			>
				<Search class="h-3.5 w-3.5" />
				<span>Cari LOV</span>
			</button>

			{#if selectedItem}
				<button
					type="button"
					onclick={() => (selectedItem = null)}
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400"
					title="Hapus Pilihan"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Modal Popup LOV Dialog -->
	{#if openModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
			<div class="flex flex-col w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
				<!-- Modal Header -->
				<div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
					<div class="flex items-center gap-2">
						<Search class="h-4 w-4 text-indigo-400" />
						<h4 class="text-sm font-bold text-slate-100">Daftar Nilai Aset (Popup LOV)</h4>
					</div>
					<button
						type="button"
						onclick={() => (openModal = false)}
						class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<!-- Search Input -->
				<div class="p-4 border-b border-slate-800 bg-slate-950/40">
					<div class="relative">
						<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Ketik kode, nama aset, atau kategori..."
							class="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Items Table -->
				<div class="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
					{#if filteredItems.length === 0}
						<div class="p-8 text-center text-xs text-slate-500">Tidak ada aset yang cocok.</div>
					{:else}
						{#each filteredItems as it (it.id)}
							<button
								type="button"
								onclick={() => selectItem(it)}
								class="flex w-full items-center justify-between p-3 text-left transition hover:bg-slate-800/60 {selectedItem?.id === it.id ? 'bg-indigo-950/30' : ''}"
							>
								<div class="flex flex-col">
									<div class="flex items-center gap-2">
										<span class="font-mono text-xs font-bold text-indigo-300">{it.code}</span>
										<span class="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">{it.category}</span>
									</div>
									<span class="text-xs font-medium text-slate-200 mt-0.5">{it.name}</span>
								</div>

								<div class="flex items-center gap-3">
									<span class="font-mono text-xs font-semibold text-slate-300">
										Rp {(it.value || 0).toLocaleString('id-ID')}
									</span>
									{#if selectedItem?.id === it.id}
										<Check class="h-4 w-4 text-emerald-400" />
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-5 py-3 text-xs text-slate-400">
					<span>Total {filteredItems.length} record ditemukan</span>
					<button
						type="button"
						onclick={() => (openModal = false)}
						class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-semibold text-slate-200 hover:bg-slate-700"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>