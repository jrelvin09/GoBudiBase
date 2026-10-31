<script lang="ts">
	import { onMount } from 'svelte';
	import { executeSqlStudio, executeBatch } from '$lib/api/builderClient';
	import {
		Search,
		Download,
		RefreshCw,
		ChevronLeft,
		ChevronRight,
		ArrowUpDown,
		Edit2,
		Trash2,
		Plus,
		Check,
		X,
		AlertCircle,
		TableProperties
	} from 'lucide-svelte';

	let {
		table = 'bmn_items',
		schema = 'app',
		title = 'Data Table',
		pageSize: initialPageSize = 10,
		onRowClick
	}: {
		table?: string;
		schema?: string;
		title?: string;
		pageSize?: number;
		onRowClick?: (row: any) => void;
	} = $props();

	let rows = $state<any[]>([]);
	let columns = $state<string[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Search & Sort & Pagination state
	let searchQuery = $state('');
	let sortColumn = $state<string | null>(null);
	let sortAsc = $state(true);
	let currentPage = $state(1);
	let pageSize = $state(initialPageSize);

	// Edit modal state
	let editingRow = $state<any | null>(null);
	let isNewRow = $state(false);
	let saveLoading = $state(false);

	const fullTableName = $derived(table.includes('.') ? table : `${schema}.${table}`);

	async function loadTableData() {
		loading = true;
		error = null;
		try {
			const query = `SELECT * FROM ${fullTableName} LIMIT 250`;
			const res = await executeSqlStudio(query, 250);
			columns = res.columns || [];
			rows = res.rows || [];
		} catch (e: any) {
			error = e.message || 'Gagal memuat data tabel';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadTableData();
	});

	// Filtered & sorted rows
	const filteredRows = $derived.by(() => {
		let list = [...rows];
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((r) =>
				Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
			);
		}
		if (sortColumn) {
			list.sort((a, b) => {
				const va = a[sortColumn!];
				const vb = b[sortColumn!];
				if (va == null) return 1;
				if (vb == null) return -1;
				if (typeof va === 'number' && typeof vb === 'number') {
					return sortAsc ? va - vb : vb - va;
				}
				return sortAsc
					? String(va).localeCompare(String(vb))
					: String(vb).localeCompare(String(va));
			});
		}
		return list;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
	const paginatedRows = $derived(
		filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	function toggleSort(col: string) {
		if (sortColumn === col) {
			sortAsc = !sortAsc;
		} else {
			sortColumn = col;
			sortAsc = true;
		}
	}

	function exportToCSV() {
		if (rows.length === 0) return;
		const header = columns.join(',');
		const body = rows
			.map((r) =>
				columns
					.map((c) => {
						const val = r[c] ?? '';
						const str = String(val).replace(/"/g, '""');
						return `"${str}"`;
					})
					.join(',')
			)
			.join('\n');
		const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', `${table}_export.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function handleDeleteRow(row: any) {
		if (!row.id) {
			alert('Tabel harus memiliki kolom id untuk menghapus baris.');
			return;
		}
		if (!confirm(`Hapus baris #${row.id}?`)) return;

		try {
			await executeBatch(fullTableName, [{ op: 'delete', id: row.id }]);
			rows = rows.filter((r) => r.id !== row.id);
		} catch (e: any) {
			alert(`Gagal menghapus baris: ${e.message}`);
		}
	}

	function openEditModal(row: any) {
		editingRow = { ...row };
		isNewRow = false;
	}

	function openAddModal() {
		const emptyRow: Record<string, any> = {};
		columns.forEach((c) => {
			if (c !== 'id') emptyRow[c] = '';
		});
		editingRow = emptyRow;
		isNewRow = true;
	}

	async function handleSaveRow() {
		if (!editingRow) return;
		saveLoading = true;
		try {
			if (isNewRow) {
				const res = await executeBatch(fullTableName, [
					{ op: 'create', values: editingRow }
				]);
				const newId = res.results?.[0]?.id;
				rows = [{ ...editingRow, id: newId }, ...rows];
			} else {
				await executeBatch(fullTableName, [
					{ op: 'update', id: editingRow.id, values: editingRow }
				]);
				const idx = rows.findIndex((r) => r.id === editingRow.id);
				if (idx !== -1) {
					rows[idx] = { ...editingRow };
				}
			}
			editingRow = null;
		} catch (e: any) {
			alert(`Gagal menyimpan data: ${e.message}`);
		} finally {
			saveLoading = false;
		}
	}
</script>

<div class="rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur overflow-hidden flex flex-col">
	<!-- Table Header Toolbar -->
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4 bg-slate-950/60">
		<div class="flex items-center gap-2.5">
			<div class="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 border border-emerald-500/30">
				<TableProperties class="h-4 w-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-slate-100">{title}</h3>
				<span class="font-mono text-[11px] text-slate-400">
					{fullTableName} • {filteredRows.length} data
				</span>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- Search Bar -->
			<div class="relative">
				<Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari dalam tabel..."
					class="w-48 rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
				/>
			</div>

			<!-- Add Record Button -->
			<button
				type="button"
				onclick={openAddModal}
				class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
			>
				<Plus class="h-3.5 w-3.5" />
				<span>Tambah</span>
			</button>

			<!-- Export CSV -->
			<button
				type="button"
				onclick={exportToCSV}
				class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
				title="Ekspor CSV"
			>
				<Download class="h-3.5 w-3.5" />
				<span>CSV</span>
			</button>

			<!-- Reload -->
			<button
				type="button"
				onclick={loadTableData}
				disabled={loading}
				class="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white transition disabled:opacity-50"
				title="Muat Ulang"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin text-emerald-400' : ''}" />
			</button>
		</div>
	</div>

	{#if error}
		<div class="m-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
			<AlertCircle class="h-4 w-4 shrink-0" />
			<span>{error}</span>
		</div>
	{:else if loading && rows.length === 0}
		<div class="flex h-40 items-center justify-center text-xs text-slate-400 gap-2">
			<RefreshCw class="h-5 w-5 animate-spin text-emerald-400" />
			<span>Memuat data tabel...</span>
		</div>
	{:else}
		<!-- Scrollable Table -->
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-xs">
				<thead>
					<tr class="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400">
						{#each columns as col}
							<th class="p-3 select-none">
								<button
									type="button"
									onclick={() => toggleSort(col)}
									class="flex items-center gap-1.5 hover:text-slate-200 transition font-mono uppercase tracking-wider text-[10px]"
								>
									<span>{col}</span>
									<ArrowUpDown class="h-3 w-3 {sortColumn === col ? 'text-emerald-400' : 'text-slate-600'}" />
								</button>
							</th>
						{/each}
						<th class="p-3 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/60">
					{#if paginatedRows.length === 0}
						<tr>
							<td colspan={columns.length + 1} class="p-8 text-center text-slate-500 text-xs">
								Tidak ada data yang cocok dengan kriteria pencarian.
							</td>
						</tr>
					{:else}
						{#each paginatedRows as row}
							<tr
								class="hover:bg-slate-800/40 transition group cursor-pointer"
								onclick={() => onRowClick?.(row)}
							>
								{#each columns as col}
									<td class="p-3 text-slate-300 font-mono text-[11px] truncate max-w-xs">
										{row[col] === null ? '-' : String(row[col])}
									</td>
								{/each}
								<td class="p-3 text-right">
									<div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); openEditModal(row); }}
											class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
											title="Edit Baris"
										>
											<Edit2 class="h-3.5 w-3.5" />
										</button>
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); handleDeleteRow(row); }}
											class="rounded p-1 text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 transition"
											title="Hapus Baris"
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer -->
		<div class="flex flex-wrap items-center justify-between border-t border-slate-800 p-3 bg-slate-950/60 text-xs text-slate-400">
			<div class="flex items-center gap-2">
				<span>Baris per halaman:</span>
				<select
					bind:value={pageSize}
					onchange={() => (currentPage = 1)}
					class="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200 focus:outline-none"
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={25}>25</option>
					<option value={50}>50</option>
				</select>
				<span class="font-mono text-[11px]">
					{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length}
				</span>
			</div>

			<div class="flex items-center gap-1.5">
				<button
					type="button"
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage <= 1}
					class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-40"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				<span class="font-mono text-xs text-slate-200 px-2">
					{currentPage} / {totalPages}
				</span>
				<button
					type="button"
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage >= totalPages}
					class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-40"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Modal Edit / Create Row -->
{#if editingRow}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl max-h-[85vh] flex flex-col">
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h4 class="text-sm font-bold text-slate-100 flex items-center gap-2">
					<Edit2 class="h-4 w-4 text-emerald-400" />
					<span>{isNewRow ? 'Tambah Data Baru' : `Edit Baris #${editingRow.id || ''}`}</span>
				</h4>
				<button
					type="button"
					onclick={() => (editingRow = null)}
					class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<form
				onsubmit={(e) => { e.preventDefault(); handleSaveRow(); }}
				class="mt-4 flex flex-col gap-3 overflow-y-auto pr-1 flex-1 text-xs"
			>
				{#each columns as col}
					{#if col !== 'id'}
						<div class="flex flex-col gap-1">
							<label class="font-semibold text-slate-300 font-mono text-[11px] uppercase tracking-wide">
								{col}
							</label>
							{#if col.includes('desc') || col.includes('alamat') || col.includes('catatan')}
								<textarea
									bind:value={editingRow[col]}
									rows="3"
									class="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
								></textarea>
							{:else}
								<input
									type="text"
									bind:value={editingRow[col]}
									class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
								/>
							{/if}
						</div>
					{/if}
				{/each}

				<div class="mt-4 flex justify-end gap-2 border-t border-slate-800 pt-3">
					<button
						type="button"
						onclick={() => (editingRow = null)}
						class="rounded-lg px-3 py-1.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={saveLoading}
						class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50"
					>
						<Check class="h-4 w-4" />
						<span>{saveLoading ? 'Menyimpan...' : 'Simpan Data'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
