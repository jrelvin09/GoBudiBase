<script lang="ts">
	import { onMount } from 'svelte';
	import rawUsers from '$lib/assets/user_informations.json';
	import SetupUserEditModal from './SetupUserEditModal.svelte';
	import {
		Search,
		Plus,
		Download,
		Filter,
		RotateCcw,
		Edit2,
		Users,
		Shield,
		Building2,
		CheckCircle2,
		XCircle,
		ChevronLeft,
		ChevronRight,
		KeyRound
	} from 'lucide-svelte';

	interface UserRecord {
		rowNo: number;
		nik: string;
		nama: string;
		manager: string | null;
		subsidiary: string | null;
		role: string | null;
		aktif: string;
		dibuatOleh: string | null;
		tglDibuat: string | null;
		diubahOleh: string | null;
		tglDiubah: string | null;
		rid?: number;
		email?: string;
	}

	let {
		onNavigateResetPassword
	}: {
		onNavigateResetPassword?: (nik: string) => void;
	} = $props();

	// Reactive user dataset loaded from assets + localStorage overrides
	let users = $state<UserRecord[]>([]);
	let searchQuery = $state('');
	let filterSubsidiary = $state('ALL');
	let filterStatus = $state('ALL');
	let filterRole = $state('ALL');

	// Pagination
	let currentPage = $state(1);
	let rowsPerPage = $state(25);

	// Modal state
	let editingUser = $state<UserRecord | null>(null);
	let isNewUser = $state(false);
	let toastMessage = $state('');

	onMount(() => {
		// Check if local modifications exist in localStorage
		const savedOverrides = localStorage.getItem('gopims_users_data');
		if (savedOverrides) {
			try {
				users = JSON.parse(savedOverrides);
			} catch {
				users = (rawUsers as UserRecord[]).slice();
			}
		} else {
			users = (rawUsers as UserRecord[]).slice();
		}
	});

	function saveUsersToStorage(newList: UserRecord[]) {
		users = newList;
		try {
			localStorage.setItem('gopims_users_data', JSON.stringify(newList));
		} catch (e) {
			console.warn('Storage quota exceeded', e);
		}
	}

	// Unique subsidiaries & roles for filter dropdowns
	const subsidiariesList = [
		'PT Kirana Yudha Amandari',
		'PT Sumber Wangi Alam',
		'PT Cahaya Putih Energi Alam (ASJ)',
		'PT Treekeasi Margamulia'
	];

	// Filtered users
	let filteredUsers = $derived(
		users.filter((u) => {
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchNik = (u.nik || '').toLowerCase().includes(q);
				const matchNama = (u.nama || '').toLowerCase().includes(q);
				const matchRole = (u.role || '').toLowerCase().includes(q);
				const matchSub = (u.subsidiary || '').toLowerCase().includes(q);
				if (!matchNik && !matchNama && !matchRole && !matchSub) return false;
			}
			if (filterSubsidiary !== 'ALL') {
				if (!(u.subsidiary || '').includes(filterSubsidiary)) return false;
			}
			if (filterStatus !== 'ALL') {
				if (u.aktif !== filterStatus) return false;
			}
			if (filterRole !== 'ALL') {
				if (u.role !== filterRole) return false;
			}
			return true;
		})
	);

	// Pagination calculations
	let totalRows = $derived(filteredUsers.length);
	let totalPages = $derived(Math.max(1, Math.ceil(totalRows / rowsPerPage)));
	let paginatedUsers = $derived(
		filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
	);

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			if (toastMessage === msg) toastMessage = '';
		}, 4000);
	}

	function handleEditUser(u: UserRecord) {
		editingUser = { ...u };
		isNewUser = false;
	}

	function handleAddNewUser() {
		editingUser = {
			rowNo: users.length + 1,
			nik: '',
			nama: '',
			manager: null,
			subsidiary: 'PT Sumber Wangi Alam',
			role: 'Viewer',
			aktif: 'Ya',
			dibuatOleh: 'IT000002',
			tglDibuat: new Date().toLocaleString('id-ID'),
			diubahOleh: 'IT000002',
			tglDiubah: new Date().toLocaleString('id-ID'),
			rid: users.length + 100000
		};
		isNewUser = true;
	}

	function handleSaveUser(updated: UserRecord) {
		let updatedList: UserRecord[];
		if (isNewUser) {
			updatedList = [updated, ...users];
			showToast(`User ${updated.nik} (${updated.nama}) berhasil ditambahkan.`);
		} else {
			updatedList = users.map((u) => (u.nik === updated.nik ? updated : u));
			showToast(`Perubahan untuk user ${updated.nik} berhasil disimpan.`);
		}
		saveUsersToStorage(updatedList);
		editingUser = null;
	}

	function handleExportCsv() {
		const headers = [
			'No',
			'NIK',
			'Nama User',
			'Nama Manager',
			'Subsidiary',
			'Role',
			'Aktif',
			'Dibuat Oleh',
			'Tgl Dibuat',
			'Diubah Oleh',
			'Tgl Diubah'
		];
		const rows = filteredUsers.map((u, i) => [
			i + 1,
			`"${u.nik || ''}"`,
			`"${u.nama || ''}"`,
			`"${u.manager || ''}"`,
			`"${u.subsidiary || ''}"`,
			`"${u.role || ''}"`,
			`"${u.aktif || ''}"`,
			`"${u.dibuatOleh || ''}"`,
			`"${u.tglDibuat || ''}"`,
			`"${u.diubahOleh || ''}"`,
			`"${u.tglDiubah || ''}"`
		]);

		const csvContent =
			'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `PIMS_User_Informations_${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		showToast('Data berhasil diexport ke CSV.');
	}

	function resetFilters() {
		searchQuery = '';
		filterSubsidiary = 'ALL';
		filterStatus = 'ALL';
		filterRole = 'ALL';
		currentPage = 1;
	}
</script>

<div class="space-y-4">
	<!-- Toast Banner -->
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

	<!-- Top Controls Card (APEX Filter Bar) -->
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<!-- Search Bar -->
			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					oninput={() => (currentPage = 1)}
					placeholder="Cari berdasarkan NIK, Nama, Role, atau Subsidiary..."
					class="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs transition focus:border-[#026cb6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
				/>
			</div>

			<!-- Filters and Action Buttons -->
			<div class="flex flex-wrap items-center gap-2">
				<!-- Subsidiary Filter -->
				<select
					bind:value={filterSubsidiary}
					onchange={() => (currentPage = 1)}
					class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-[#026cb6] focus:outline-none"
				>
					<option value="ALL">Semua Subsidiary</option>
					{#each subsidiariesList as sub}
						<option value={sub}>{sub}</option>
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

				<!-- Reset Filter Button -->
				<button
					type="button"
					onclick={resetFilters}
					class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
					title="Reset Filter"
				>
					<RotateCcw class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Reset</span>
				</button>

				<!-- Export CSV Button -->
				<button
					type="button"
					onclick={handleExportCsv}
					class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
					title="Download Data CSV"
				>
					<Download class="h-3.5 w-3.5 text-slate-500" />
					<span>CSV</span>
				</button>

				<!-- Tambah User Button (Hot Button) -->
				<button
					type="button"
					onclick={handleAddNewUser}
					class="flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
				>
					<Plus class="h-3.5 w-3.5" />
					<span>Tambah User</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Interactive Report Grid -->
	<div class="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
		<!-- Grid Header Info Bar -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs"
		>
			<div class="flex items-center gap-2">
				<Users class="h-4 w-4 text-[#026cb6]" />
				<span class="font-bold text-slate-800">SETUP Informasi User</span>
				<span class="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
					{totalRows} User
				</span>
			</div>

			<div class="flex items-center gap-3 text-slate-500 text-[11px]">
				<span>
					Menampilkan <strong>{totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</strong> -
					<strong>{Math.min(currentPage * rowsPerPage, totalRows)}</strong> dari
					<strong>{totalRows}</strong>
				</span>
			</div>
		</div>

		<!-- Table Container -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-slate-600">
				<thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
					<tr>
						<th class="px-3 py-3 w-12 text-center">Aksi</th>
						<th class="px-3 py-3 w-28">EMPLOYEE NIK</th>
						<th class="px-4 py-3 min-w-[180px]">Nama User</th>
						<th class="px-4 py-3 min-w-[150px]">Nama Manager</th>
						<th class="px-4 py-3 min-w-[220px]">Subsidiary</th>
						<th class="px-3 py-3 min-w-[120px]">Roles</th>
						<th class="px-3 py-3 w-24 text-center">User Aktif</th>
						<th class="px-3 py-3 min-w-[130px]">Dibuat Oleh</th>
						<th class="px-3 py-3 min-w-[130px]">Tgl Dibuat</th>
						<th class="px-3 py-3 min-w-[130px]">Diubah Oleh</th>
						<th class="px-3 py-3 min-w-[130px]">Tgl Diubah</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if paginatedUsers.length === 0}
						<tr>
							<td colspan="11" class="py-12 text-center text-slate-400">
								Tidak ada data user yang sesuai dengan filter.
							</td>
						</tr>
					{:else}
						{#each paginatedUsers as u, idx}
							{@const isMukti = u.nik === 'IT000002'}
							<tr
								class="transition hover:bg-slate-50/80 {isMukti
									? 'bg-amber-50/40 font-medium ring-1 ring-amber-200/50'
									: ''}"
							>
								<!-- Action: Edit Button (Page 432) -->
								<td class="px-3 py-2 text-center">
									<button
										type="button"
										onclick={() => handleEditUser(u)}
										class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-[#026cb6] hover:bg-[#026cb6] hover:text-white transition cursor-pointer shadow-2xs"
										title="Ubah Data User (Page 432)"
									>
										<Edit2 class="h-3.5 w-3.5" />
									</button>
								</td>

								<!-- NIK -->
								<td class="px-3 py-2">
									<div class="flex items-center gap-1.5">
										<span class="font-mono font-semibold {isMukti ? 'text-amber-800' : 'text-slate-800'}">
											{u.nik}
										</span>
										{#if isMukti}
											<span
												class="rounded bg-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-900"
											>
												YOU
											</span>
										{/if}
									</div>
								</td>

								<!-- Nama User -->
								<td class="px-4 py-2 font-medium text-slate-800">
									{u.nama}
								</td>

								<!-- Manager -->
								<td class="px-4 py-2 text-slate-500">
									{u.manager || '-'}
								</td>

								<!-- Subsidiary -->
								<td class="px-4 py-2 text-slate-600">
									<span class="line-clamp-1" title={u.subsidiary || ''}>
										{u.subsidiary || '-'}
									</span>
								</td>

								<!-- Role -->
								<td class="px-3 py-2">
									{#if u.role}
										<span
											class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
										>
											<Shield class="h-2.5 w-2.5" />
											{u.role}
										</span>
									{:else}
										<span class="text-slate-400">-</span>
									{/if}
								</td>

								<!-- Aktif Status -->
								<td class="px-3 py-2 text-center">
									{#if u.aktif === 'Ya'}
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
									{u.dibuatOleh || '-'}
								</td>

								<!-- Tgl Dibuat -->
								<td class="px-3 py-2 text-slate-400 font-mono text-[11px]">
									{u.tglDibuat || '-'}
								</td>

								<!-- Diubah Oleh -->
								<td class="px-3 py-2 text-slate-500">
									{u.diubahOleh || '-'}
								</td>

								<!-- Tgl Diubah -->
								<td class="px-3 py-2 text-slate-400 font-mono text-[11px]">
									{u.tglDiubah || '-'}
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

	<!-- Edit / Create User Modal (Page 432) -->
	{#if editingUser}
		<SetupUserEditModal
			user={editingUser}
			isNew={isNewUser}
			onSave={handleSaveUser}
			onCancel={() => (editingUser = null)}
			onResetPassword={(nik) => {
				editingUser = null;
				if (onNavigateResetPassword) onNavigateResetPassword(nik);
			}}
		/>
	{/if}
</div>
