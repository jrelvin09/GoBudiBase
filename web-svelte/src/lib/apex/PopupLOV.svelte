<script lang="ts">
	import { postRPC, type RegistryItem } from '$lib/api/client';
	import { Search, ExternalLink, X, Check } from 'lucide-svelte';

	let { onSelect }: { onSelect: (item: RegistryItem) => void } = $props();

	let isOpen = $state(false);
	let query = $state('');
	let items = $state<RegistryItem[]>([]);
	let loading = $state(false);

	async function searchItems() {
		loading = true;
		try {
			const res = await postRPC<RegistryItem[]>('/registry/list', {
				p_limit: 25,
				p_offset: 0,
				p_sort_col: 'id',
				p_sort_dir: 'asc',
				p_filters: query ? { name: `%${query}%` } : {}
			});
			items = res;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function openModal() {
		isOpen = true;
		searchItems();
	}

	function selectItem(item: RegistryItem) {
		onSelect(item);
		isOpen = false;
	}
</script>

<div>
	<button
		type="button"
		onclick={openModal}
		class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 shadow-xs"
	>
		<Search class="w-3.5 h-3.5" />
		<span>Buka Popup LOV (Cari 100k Aset)</span>
	</button>

	{#if isOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
			<div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 space-y-4">
				<div class="flex items-center justify-between border-b border-slate-100 pb-3">
					<div>
						<h3 class="font-bold text-sm text-slate-800">Popup LOV (Multi-Column Relational Search)</h3>
						<p class="text-xs text-slate-500">Pencarian relasional instan dari database 100k baris</p>
					</div>
					<button onclick={() => (isOpen = false)} class="p-1 rounded text-slate-400 hover:text-slate-700">
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="relative">
					<Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
					<input
						type="text"
						placeholder="Ketik kode atau nama aset..."
						bind:value={query}
						oninput={searchItems}
						class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div class="max-h-64 overflow-y-auto border border-slate-100 rounded-lg">
					<table class="w-full text-xs text-left">
						<thead class="bg-slate-50 text-slate-600 font-semibold sticky top-0">
							<tr>
								<th class="p-2">Kode</th>
								<th class="p-2">Nama Aset</th>
								<th class="p-2">Kategori</th>
								<th class="p-2 text-right">Nilai</th>
								<th class="p-2 text-center w-16">Pilih</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each items as it (it.id)}
								<tr class="hover:bg-blue-50/50 cursor-pointer" onclick={() => selectItem(it)}>
									<td class="p-2 font-mono font-bold text-blue-600">{it.code}</td>
									<td class="p-2 text-slate-800">{it.name}</td>
									<td class="p-2 text-slate-500">{it.category}</td>
									<td class="p-2 text-right font-mono font-semibold">Rp {(it.value || 0).toLocaleString('id-ID')}</td>
									<td class="p-2 text-center">
										<button class="p-1 text-blue-600 hover:bg-blue-100 rounded">
											<Check class="w-3.5 h-3.5" />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>
