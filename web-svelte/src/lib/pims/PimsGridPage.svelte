<script lang="ts">
	import {
		Search,
		Filter,
		Download,
		Plus,
		RefreshCw,
		SlidersHorizontal,
		ChevronLeft,
		ChevronRight,
		FileSpreadsheet,
		CheckCircle2,
		Clock,
		ArrowUpDown
	} from 'lucide-svelte';
	import type { PimsNavNode } from './types';

	let {
		node
	}: {
		node: PimsNavNode;
	} = $props();

	let searchQuery = $state('');
	let currentPage = $state(1);
	let pageSize = $state(10);
	let isRefreshing = $state(false);

	// Generate contextual mock rows based on the menu title
	const generatedRows = $derived.by(() => {
		const title = node.label;
		const rows = [];
		for (let i = 1; i <= 25; i++) {
			const num = String(i).padStart(3, '0');
			rows.push({
				id: `${node.pageId || 'REC'}-${num}`,
				kode: `${title.slice(0, 3).toUpperCase()}-${100 + i}`,
				nama: `${title} Item #${i}`,
				kategori: i % 2 === 0 ? 'Operasional' : 'Administrasi',
				nilai: (1500000 + i * 275000).toLocaleString('id-ID'),
				petugas: ['Mukti Assary', 'Hasan Basri', 'Supardi', 'Ahmad Yani'][i % 4],
				tanggal: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
				status: i % 3 === 0 ? 'Pending' : 'Approved'
			});
		}
		return rows;
	});

	const filteredRows = $derived(
		generatedRows.filter((r) =>
			searchQuery.trim() === ''
				? true
				: r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
					r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
					r.petugas.toLowerCase().includes(searchQuery.toLowerCase()) ||
					r.kode.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const paginatedRows = $derived(
		filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	const totalPages = $derived(Math.ceil(filteredRows.length / pageSize) || 1);

	function handleRefresh() {
		isRefreshing = true;
		setTimeout(() => {
			isRefreshing = false;
		}, 300);
	}

	function exportCsv() {
		const headers = ['ID', 'Kode', 'Nama', 'Kategori', 'Nilai (IDR)', 'Petugas', 'Tanggal', 'Status'];
		const csvLines = [headers.join(',')];
		for (const r of filteredRows) {
			csvLines.push(`"${r.id}","${r.kode}","${r.nama}","${r.kategori}","${r.nilai}","${r.petugas}","${r.tanggal}","${r.status}"`);
		}
		const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${node.label.replace(/\s+/g, '_')}_export.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="space-y-4">
	<!-- APEX Interactive Grid Toolbar Shell -->
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<!-- Left: Search & Filter Controls -->
			<div class="flex flex-1 items-center gap-2 max-w-md">
				<div class="relative flex-1">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
						<Search class="h-3.5 w-3.5" />
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search in {node.label}..."
						class="w-full rounded-lg border border-slate-300 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#026cb6] focus:bg-white focus:ring-1 focus:ring-[#026cb6]"
					/>
				</div>

				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
				>
					<Filter class="h-3.5 w-3.5 text-slate-500" />
					<span>Filter</span>
				</button>
			</div>

			<!-- Right: Actions & Toolbar Options -->
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handleRefresh}
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
					title="Refresh data"
				>
					<RefreshCw class="h-3.5 w-3.5 text-slate-500 {isRefreshing ? 'animate-spin' : ''}" />
					<span class="hidden sm:inline">Refresh</span>
				</button>

				<button
					type="button"
					onclick={exportCsv}
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
				>
					<Download class="h-3.5 w-3.5 text-slate-500" />
					<span>Export CSV</span>
				</button>

				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#025691] transition cursor-pointer"
				>
					<Plus class="h-3.5 w-3.5" />
					<span>Add Row</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Interactive Grid Table -->
	<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="border-b border-slate-200 bg-slate-100/80 font-semibold text-slate-700">
					<tr>
						<th class="px-5 py-3 font-mono">ID</th>
						<th class="px-5 py-3">Kode Entitas</th>
						<th class="px-5 py-3">Nama Deskripsi</th>
						<th class="px-5 py-3">Kategori</th>
						<th class="px-5 py-3 text-right">Nilai Transaksi (Rp)</th>
						<th class="px-5 py-3">Petugas PIC</th>
						<th class="px-5 py-3 font-mono">Tanggal</th>
						<th class="px-5 py-3 text-center">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#if paginatedRows.length === 0}
						<tr>
							<td colspan="8" class="px-6 py-8 text-center text-slate-400">
								Tidak ada data yang cocok dengan pencarian "{searchQuery}"
							</td>
						</tr>
					{:else}
						{#each paginatedRows as row}
							<tr class="hover:bg-sky-50/40 transition">
								<td class="px-5 py-3 font-mono font-semibold text-[#026cb6]">{row.id}</td>
								<td class="px-5 py-3 font-mono text-slate-600">{row.kode}</td>
								<td class="px-5 py-3 font-medium text-slate-900">{row.nama}</td>
								<td class="px-5 py-3">
									<span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
										{row.kategori}
									</span>
								</td>
								<td class="px-5 py-3 text-right font-mono font-semibold text-slate-900">{row.nilai}</td>
								<td class="px-5 py-3">{row.petugas}</td>
								<td class="px-5 py-3 font-mono text-slate-500">{row.tanggal}</td>
								<td class="px-5 py-3 text-center">
									{#if row.status === 'Approved'}
										<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
											<CheckCircle2 class="h-3 w-3" />
											Approved
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
											<Clock class="h-3 w-3" />
											Pending
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer -->
		<div class="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-3 text-xs text-slate-500">
			<div class="flex items-center gap-2">
				<span>Showing <strong>{filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong> records</span>
			</div>

			<div class="flex items-center gap-1">
				<button
					type="button"
					disabled={currentPage <= 1}
					onclick={() => currentPage--}
					class="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				<span class="px-2 font-mono text-xs">Page {currentPage} of {totalPages}</span>
				<button
					type="button"
					disabled={currentPage >= totalPages}
					onclick={() => currentPage++}
					class="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>
</div>
