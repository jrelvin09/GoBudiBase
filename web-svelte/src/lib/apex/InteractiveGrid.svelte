<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type RegistryItem } from '$lib/api/client';
	import { exportRegistryReport } from '$lib/utils/pdfExport';
	import * as XLSX from 'xlsx';
	import {
		TableProperties,
		RefreshCw,
		Save,
		Download,
		FileSpreadsheet,
		FileText,
		ChevronLeft,
		ChevronRight,
		Search
	} from 'lucide-svelte';

	let {
		title = 'Interactive Grid (Svelte 5 Runes + Go Native)'
	}: {
		title?: string;
	} = $props();

	let rows = $state<RegistryItem[]>([]);
	let total = $state(0);
	let limit = $state(50);
	let offset = $state(0);
	let sortCol = $state('id');
	let sortDir = $state<'asc' | 'desc'>('asc');
	let loading = $state(false);
	let saving = $state(false);
	let dirtyCells = $state<Record<number, Record<string, string>>>({});
	let searchTerm = $state('');

	async function loadData() {
		loading = true;
		try {
			const filters: Record<string, string> = {};
			if (searchTerm) {
				filters['name'] = `%${searchTerm}%`;
			}
			const [data, count] = await Promise.all([
				postRPC<RegistryItem[]>('/registry/list', {
					p_limit: limit,
					p_offset: offset,
					p_sort_col: sortCol,
					p_sort_dir: sortDir,
					p_filters: filters
				}),
				postRPC<number>('/registry/count', { p_filters: filters })
			]);
			rows = data;
			total = count;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	function handleCellChange(id: number, col: string, val: string) {
		if (!dirtyCells[id]) dirtyCells[id] = {};
		dirtyCells[id][col] = val;
		// Update optimistic row
		const row = rows.find((r) => r.id === id);
		if (row) {
			// @ts-ignore
			row[col] = val;
		}
	}

	async function saveChanges() {
		saving = true;
		try {
			const changes: Array<{ id: number; column: string; value: string }> = [];
			Object.entries(dirtyCells).forEach(([idStr, cols]) => {
				const id = Number(idStr);
				Object.entries(cols).forEach(([column, value]) => {
					changes.push({ id, column, value });
				});
			});

			if (changes.length > 0) {
				await postRPC('/registry/batch', {
					p_changes: changes,
					p_actor: 'admin@gobudibase.local'
				});
				dirtyCells = {};
				await loadData();
			}
		} catch (e) {
			console.error('Batch save failed', e);
		} finally {
			saving = false;
		}
	}

	function exportExcel() {
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Registry Items');
		XLSX.writeFile(wb, `GoBudiBase_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
	}

	function exportPDF() {
		exportRegistryReport(rows, {
			title: 'DAFTAR AUDIT ASET RESMI (GOBUDIBASE NATIVE)',
			filterSummary: searchTerm ? `Pencarian: ${searchTerm}` : 'Semua Aset'
		});
	}

	const hasDirty = $derived(Object.keys(dirtyCells).length > 0);
	const currentPage = $derived(Math.floor(offset / limit) + 1);
	const totalPages = $derived(Math.ceil(total / limit) || 1);
</script>

<div class="p-6 space-y-4 max-w-7xl mx-auto">
	<!-- Toolbar -->
	<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
				<TableProperties class="w-5 h-5" />
			</div>
			<div>
				<h2 class="font-bold text-base text-slate-800">{title}</h2>
				<p class="text-xs text-slate-500">Virtual dataset 100k baris dengan single-cell edit & batch update atomik</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center gap-2">
			<div class="relative">
				<Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
				<input
					type="text"
					placeholder="Cari aset (pg_trgm)..."
					bind:value={searchTerm}
					oninput={loadData}
					class="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg w-44 focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<button
				onclick={saveChanges}
				disabled={!hasDirty || saving}
				class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs"
			>
				<Save class="w-3.5 h-3.5" />
				<span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
			</button>

			<button
				onclick={loadData}
				disabled={loading}
				class="p-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600"
			>
				<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
			</button>

			<button
				onclick={exportExcel}
				class="flex items-center gap-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-emerald-700"
			>
				<FileSpreadsheet class="w-3.5 h-3.5" />
				<span>Excel</span>
			</button>

			<button
				onclick={exportPDF}
				class="flex items-center gap-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-red-600"
			>
				<FileText class="w-3.5 h-3.5" />
				<span>PDF</span>
			</button>
		</div>
	</div>

	<!-- Main Data Grid Table -->
	<div class="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
		<table class="w-full text-xs text-left border-collapse">
			<thead class="bg-slate-100 font-bold uppercase text-slate-700 border-b border-slate-200">
				<tr>
					<th class="p-3 w-16 text-center">ID</th>
					<th class="p-3 w-32">Kode Aset</th>
					<th class="p-3">Nama Inventaris (Double click to edit)</th>
					<th class="p-3 w-36">Kategori</th>
					<th class="p-3 w-40">Lokasi Gedung</th>
					<th class="p-3 w-28 text-center">Status</th>
					<th class="p-3 w-36 text-right">Nilai Aset (Rp)</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100 font-mono">
				{#each rows as item (item.id)}
					<tr class="hover:bg-blue-50/30 transition-colors">
						<td class="p-3 text-center text-slate-400">#{item.id}</td>
						<td class="p-3 font-bold text-blue-600">{item.code}</td>
						<td class="p-2 font-sans font-medium text-slate-800">
							<input
								type="text"
								value={item.name}
								oninput={(e) => handleCellChange(item.id, 'name', e.currentTarget.value)}
								class="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white rounded border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-hidden"
							/>
						</td>
						<td class="p-3 font-sans text-slate-600">{item.category}</td>
						<td class="p-3 font-sans text-slate-500">{item.location || '-'}</td>
						<td class="p-3 font-sans text-center">
							<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
								{item.status}
							</span>
						</td>
						<td class="p-3 text-right font-bold text-slate-900">
							Rp {(item.value || 0).toLocaleString('id-ID')}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Pagination Footer -->
		<div class="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
			<span>Menampilkan <strong>{rows.length}</strong> dari <strong>{total.toLocaleString()}</strong> aset</span>
			<div class="flex items-center gap-2">
				<button
					onclick={() => { offset = Math.max(0, offset - limit); loadData(); }}
					disabled={offset === 0}
					class="p-1 rounded border border-slate-300 disabled:opacity-30"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				<span>Halaman {currentPage} / {totalPages}</span>
				<button
					onclick={() => { offset += limit; loadData(); }}
					disabled={currentPage >= totalPages}
					class="p-1 rounded border border-slate-300 disabled:opacity-30"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
</div>
