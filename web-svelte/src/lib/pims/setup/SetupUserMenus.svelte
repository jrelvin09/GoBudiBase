<script lang="ts">
	import { onMount } from 'svelte';
	import rawMenus from '$lib/assets/user_menus.json';
	import SetupMenuModal from './SetupMenuModal.svelte';
	import {
		Search,
		Plus,
		Download,
		RotateCcw,
		Edit2,
		Folder,
		FolderTree,
		CheckCircle2,
		XCircle,
		ChevronLeft,
		ChevronRight,
		ExternalLink
	} from 'lucide-svelte';

	interface MenuRecord {
		rowNo: number;
		parentMenu: string | null;
		namaMenu: string;
		menuLink: string | null;
		aktif: string;
		dibuatOleh: string | null;
		tglDibuat: string | null;
		diubahOleh: string | null;
		tglDiubah: string | null;
		rid?: number;
		sortOrder?: number;
		icon?: string;
	}

	let menus = $state<MenuRecord[]>([]);
	let searchQuery = $state('');
	let filterParent = $state('ALL');
	let filterStatus = $state('ALL');

	// Pagination
	let currentPage = $state(1);
	let rowsPerPage = $state(25);

	// Modal state
	let editingMenu = $state<MenuRecord | null>(null);
	let isNewMenu = $state(false);
	let toastMessage = $state('');

	onMount(() => {
		const savedOverrides = localStorage.getItem('gopims_menus_data');
		if (savedOverrides) {
			try {
				menus = JSON.parse(savedOverrides);
			} catch {
				menus = (rawMenus as MenuRecord[]).slice();
			}
		} else {
			menus = (rawMenus as MenuRecord[]).slice();
		}
	});

	function saveMenusToStorage(newList: MenuRecord[]) {
		menus = newList;
		try {
			localStorage.setItem('gopims_menus_data', JSON.stringify(newList));
		} catch (e) {
			console.warn('Storage quota exceeded', e);
		}
	}

	const parentOptions = [
		'Konfigurasi Setup',
		'Master Data',
		'Transaction',
		'Report',
		'Inquiries',
		'Data Integrations',
		'Org Development'
	];

	let filteredMenus = $derived(
		menus.filter((m) => {
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchName = (m.namaMenu || '').toLowerCase().includes(q);
				const matchParent = (m.parentMenu || '').toLowerCase().includes(q);
				const matchLink = (m.menuLink || '').toLowerCase().includes(q);
				if (!matchName && !matchParent && !matchLink) return false;
			}
			if (filterParent !== 'ALL') {
				if (filterParent === 'ROOT' && m.parentMenu !== null) return false;
				if (filterParent !== 'ROOT' && m.parentMenu !== filterParent) return false;
			}
			if (filterStatus !== 'ALL') {
				if (m.aktif !== filterStatus) return false;
			}
			return true;
		})
	);

	let totalRows = $derived(filteredMenus.length);
	let totalPages = $derived(Math.max(1, Math.ceil(totalRows / rowsPerPage)));
	let paginatedMenus = $derived(
		filteredMenus.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
	);

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			if (toastMessage === msg) toastMessage = '';
		}, 4000);
	}

	function handleEditMenu(m: MenuRecord) {
		editingMenu = { ...m };
		isNewMenu = false;
	}

	function handleAddNewMenu() {
		editingMenu = {
			rowNo: menus.length + 1,
			parentMenu: 'Konfigurasi Setup',
			namaMenu: '',
			menuLink: '',
			aktif: 'Ya',
			dibuatOleh: 'IT000002',
			tglDibuat: new Date().toLocaleString('id-ID'),
			diubahOleh: 'IT000002',
			tglDiubah: new Date().toLocaleString('id-ID'),
			rid: menus.length + 100000
		};
		isNewMenu = true;
	}

	function handleSaveMenu(updated: MenuRecord) {
		let updatedList: MenuRecord[];
		if (isNewMenu) {
			updatedList = [updated, ...menus];
			showToast(`Menu "${updated.namaMenu}" berhasil dibuat.`);
		} else {
			updatedList = menus.map((m) => (m.rowNo === updated.rowNo ? updated : m));
			showToast(`Perubahan menu "${updated.namaMenu}" berhasil disimpan.`);
		}
		saveMenusToStorage(updatedList);
		editingMenu = null;
	}

	function handleDeleteMenu(rowNo: number) {
		const target = menus.find((m) => m.rowNo === rowNo);
		const updatedList = menus.filter((m) => m.rowNo !== rowNo);
		saveMenusToStorage(updatedList);
		showToast(`Menu "${target?.namaMenu || rowNo}" telah dihapus.`);
		editingMenu = null;
	}

	function handleExportCsv() {
		const headers = [
			'No',
			'Parent Menu',
			'Nama Menu',
			'Menu Link',
			'Data Aktif',
			'Dibuat Oleh',
			'Tgl Dibuat',
			'Diubah Oleh',
			'Tgl Diubah'
		];
		const rows = filteredMenus.map((m, i) => [
			i + 1,
			`"${m.parentMenu || ''}"`,
			`"${m.namaMenu || ''}"`,
			`"${m.menuLink || ''}"`,
			`"${m.aktif || ''}"`,
			`"${m.dibuatOleh || ''}"`,
			`"${m.tglDibuat || ''}"`,
			`"${m.diubahOleh || ''}"`,
			`"${m.tglDiubah || ''}"`
		]);

		const csvContent =
			'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `PIMS_User_Menus_${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		showToast('Data menu berhasil diexport ke CSV.');
	}

	function resetFilters() {
		searchQuery = '';
		filterParent = 'ALL';
		filterStatus = 'ALL';
		currentPage = 1;
	}
</script>

<div class="space-y-4">
	<!-- Toast Notification -->
	{#if toastMessage}
		<div
			class="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs transition"
		>
			<div class="flex items-center gap-2">
				<CheckCircle2 class="h-4 w-4 text-emerald-600" />
				<span>{toastMessage}</span>
			</div>
			<button
				type="button"
				onclick={() => (toastMessage = '')}
				class="text-emerald-500 hover:text-emerald-800 text-xs font-bold cursor-pointer"
			>
				&times;
			</button>
		</div>
	{/if}

	<!-- Top Toolbar -->
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<!-- Search Bar -->
			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					oninput={() => (currentPage = 1)}
					placeholder="Cari nama menu, parent menu, atau link halaman..."
					class="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs transition focus:border-[#026cb6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
				/>
			</div>

			<!-- Filter Controls -->
			<div class="flex flex-wrap items-center gap-2">
				<!-- Parent Menu Filter -->
				<select
					bind:value={filterParent}
					onchange={() => (currentPage = 1)}
					class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-[#026cb6] focus:outline-none"
				>
					<option value="ALL">Semua Parent Menu</option>
					<option value="ROOT">-- Menu Utama (Root) --</option>
					{#each parentOptions as p}
						<option value={p}>{p}</option>
					{/each}
				</select>

				<!-- Status Filter -->
				<select
					bind:value={filterStatus}
					onchange={() => (currentPage = 1)}
					class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-[#026cb6] focus:outline-none"
				>
					<option value="ALL">Semua Status</option>
					<option value="Ya">Aktif (Ya)</option>
					<option value="Tidak">Non-Aktif (Tidak)</option>
				</select>

				<!-- Reset Filter -->
				<button
					type="button"
					onclick={resetFilters}
					class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
					title="Reset Filter"
				>
					<RotateCcw class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Reset</span>
				</button>

				<!-- Export CSV -->
				<button
					type="button"
					onclick={handleExportCsv}
					class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
					title="Download Data CSV"
				>
					<Download class="h-3.5 w-3.5 text-slate-500" />
					<span>CSV</span>
				</button>

				<!-- Buat Menu User Button (Page 161 Hot Button) -->
				<button
					type="button"
					onclick={handleAddNewMenu}
					class="flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
				>
					<Plus class="h-3.5 w-3.5" />
					<span>Buat Menu User</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Interactive Report Grid -->
	<div class="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
		<!-- Header Info Bar -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs"
		>
			<div class="flex items-center gap-2">
				<FolderTree class="h-4 w-4 text-[#026cb6]" />
				<span class="font-bold text-slate-800">SETUP Menu User</span>
				<span class="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
					{totalRows} Menu
				</span>
			</div>

			<div class="text-slate-500 text-[11px]">
				Menampilkan <strong>{totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</strong> -
				<strong>{Math.min(currentPage * rowsPerPage, totalRows)}</strong> dari
				<strong>{totalRows}</strong>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-slate-600">
				<thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
					<tr>
						<th class="px-3 py-3 w-12 text-center">Aksi</th>
						<th class="px-4 py-3 min-w-[170px]">Nama Parent Menu</th>
						<th class="px-4 py-3 min-w-[200px]">Nama Menu</th>
						<th class="px-4 py-3 min-w-[240px]">Menu Link</th>
						<th class="px-3 py-3 w-24 text-center">Data Aktif</th>
						<th class="px-3 py-3 min-w-[120px]">Dibuat Oleh</th>
						<th class="px-3 py-3 min-w-[130px]">Tgl Dibuat</th>
						<th class="px-3 py-3 min-w-[120px]">Diubah Oleh</th>
						<th class="px-3 py-3 min-w-[130px]">Tgl Diubah</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if paginatedMenus.length === 0}
						<tr>
							<td colspan="9" class="py-12 text-center text-slate-400">
								Tidak ada data menu yang sesuai dengan filter.
							</td>
						</tr>
					{:else}
						{#each paginatedMenus as m}
							{@const isKonfig = m.parentMenu === 'Konfigurasi Setup'}
							<tr class="transition hover:bg-slate-50/80 {isKonfig ? 'bg-sky-50/20' : ''}">
								<!-- Aksi (Page 453) -->
								<td class="px-3 py-2 text-center">
									<button
										type="button"
										onclick={() => handleEditMenu(m)}
										class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-[#026cb6] hover:bg-[#026cb6] hover:text-white transition cursor-pointer shadow-2xs"
										title="Ubah Menu (Page 453)"
									>
										<Edit2 class="h-3.5 w-3.5" />
									</button>
								</td>

								<!-- Parent Menu -->
								<td class="px-4 py-2">
									{#if m.parentMenu}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
										>
											<Folder class="h-3 w-3 text-slate-400" />
											{m.parentMenu}
										</span>
									{:else}
										<span class="text-slate-400 italic">Root Category</span>
									{/if}
								</td>

								<!-- Nama Menu -->
								<td class="px-4 py-2 font-semibold text-slate-800">
									{m.namaMenu}
								</td>

								<!-- Menu Link -->
								<td class="px-4 py-2">
									{#if m.menuLink}
										<span class="font-mono text-[11px] text-slate-600 truncate block max-w-xs" title={m.menuLink}>
											{m.menuLink}
										</span>
									{:else}
										<span class="text-slate-400">-</span>
									{/if}
								</td>

								<!-- Data Aktif -->
								<td class="px-3 py-2 text-center">
									{#if m.aktif === 'Ya'}
										<span
											class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
										>
											<CheckCircle2 class="h-2.5 w-2.5" />
											Ya
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600"
										>
											<XCircle class="h-2.5 w-2.5" />
											Tidak
										</span>
									{/if}
								</td>

								<!-- Dibuat Oleh -->
								<td class="px-3 py-2 text-slate-500">
									{m.dibuatOleh || '-'}
								</td>

								<!-- Tgl Dibuat -->
								<td class="px-3 py-2 text-slate-400 font-mono text-[11px]">
									{m.tglDibuat || '-'}
								</td>

								<!-- Diubah Oleh -->
								<td class="px-3 py-2 text-slate-500">
									{m.diubahOleh || '-'}
								</td>

								<!-- Tgl Diubah -->
								<td class="px-3 py-2 text-slate-400 font-mono text-[11px]">
									{m.tglDiubah || '-'}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer -->
		<div
			class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-xs gap-3"
		>
			<div class="flex items-center gap-2 text-slate-600">
				<span>Baris per halaman:</span>
				<select
					bind:value={rowsPerPage}
					onchange={() => (currentPage = 1)}
					class="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
				>
					<option value={10}>10</option>
					<option value={25}>25</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>

			<div class="flex items-center gap-1 self-center sm:self-auto">
				<button
					type="button"
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage <= 1}
					class="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
					title="Halaman Sebelumnya"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>

				<span class="px-3 text-slate-700 font-medium">
					Hal <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
				</span>

				<button
					type="button"
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage >= totalPages}
					class="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
					title="Halaman Berikutnya"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- Modal Create/Edit (Page 453) -->
	{#if editingMenu}
		<SetupMenuModal
			menu={editingMenu}
			isNew={isNewMenu}
			onSave={handleSaveMenu}
			onDelete={handleDeleteMenu}
			onCancel={() => (editingMenu = null)}
		/>
	{/if}
</div>
