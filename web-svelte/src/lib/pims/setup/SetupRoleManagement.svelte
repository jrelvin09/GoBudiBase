<script lang="ts">
	import { onMount } from 'svelte';
	import rolesDataRaw from '$lib/assets/roles.json';
	import {
		Shield,
		Plus,
		Search,
		Check,
		X,
		Lock,
		CheckCircle2,
		RotateCcw,
		Edit2,
		Save,
		KeyRound,
		Layers
	} from 'lucide-svelte';

	interface RoleItem {
		roleId: string;
		roleName: string;
		roleStatus?: string;
		descr?: string;
	}

	interface RolePermission {
		roleName: string;
		canView: boolean;
		canCreate: boolean;
		canEdit: boolean;
		canDelete: boolean;
		canApprove: boolean;
	}

	const rawData = rolesDataRaw as {
		hcmRoles: RoleItem[];
		managementRoles: { rowNo: number; roleName: string }[];
	};

	let activeTab = $state<'list' | 'matrix'>('matrix');
	let searchQuery = $state('');
	let toastMessage = $state('');

	// Combine unique roles
	const allRoleNames = Array.from(
		new Set([
			...rawData.managementRoles.map((r) => r.roleName),
			...rawData.hcmRoles.map((r) => r.roleName)
		])
	).filter(Boolean);

	// Initial matrix data
	let permissions = $state<Record<string, RolePermission>>({});

	const modulesList = [
		'Konfigurasi Setup',
		'Master Data',
		'Transaction (TO & Hasil)',
		'Inquiries & Tracking',
		'Reports & Analytics',
		'Data Integrations',
		'Org Development'
	];

	let selectedModule = $state(modulesList[0]);

	onMount(() => {
		const saved = localStorage.getItem('gopims_role_permissions');
		if (saved) {
			try {
				permissions = JSON.parse(saved);
			} catch {
				initDefaultPermissions();
			}
		} else {
			initDefaultPermissions();
		}
	});

	function initDefaultPermissions() {
		const initial: Record<string, RolePermission> = {};
		allRoleNames.forEach((role) => {
			const isSuper = role.includes('Super') || role.includes('IT');
			const isManager = role.includes('Manager') || role.includes('KTU');
			const isViewer = role.includes('Viewer');

			initial[role] = {
				roleName: role,
				canView: true,
				canCreate: isSuper || isManager,
				canEdit: isSuper || isManager,
				canDelete: isSuper,
				canApprove: isSuper || isManager
			};
		});
		permissions = initial;
	}

	function savePermissions() {
		try {
			localStorage.setItem('gopims_role_permissions', JSON.stringify(permissions));
			showToast('Hak akses role berhasil disimpan.');
		} catch (e) {
			console.warn(e);
		}
	}

	function togglePerm(role: string, field: keyof RolePermission) {
		if (!permissions[role]) {
			permissions[role] = {
				roleName: role,
				canView: true,
				canCreate: false,
				canEdit: false,
				canDelete: false,
				canApprove: false
			};
		}
		(permissions[role] as any)[field] = !(permissions[role] as any)[field];
	}

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			if (toastMessage === msg) toastMessage = '';
		}, 4000);
	}

	// Filtered roles for table
	let filteredRoleNames = $derived(
		allRoleNames.filter((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
	);
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

	<!-- Top Toolbar & Tabs -->
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<!-- Sub Tabs -->
			<div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
				<button
					type="button"
					onclick={() => (activeTab = 'matrix')}
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer {activeTab ===
					'matrix'
						? 'bg-white text-[#026cb6] shadow-2xs'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					<Layers class="h-3.5 w-3.5" />
					<span>Matrix Hak Akses Halaman</span>
				</button>

				<button
					type="button"
					onclick={() => (activeTab = 'list')}
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer {activeTab ===
					'list'
						? 'bg-white text-[#026cb6] shadow-2xs'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					<Shield class="h-3.5 w-3.5" />
					<span>Daftar Roles ({allRoleNames.length})</span>
				</button>
			</div>

			<!-- Save Button in Matrix tab -->
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={savePermissions}
					class="inline-flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
				>
					<Save class="h-3.5 w-3.5" />
					<span>Simpan Perubahan</span>
				</button>
			</div>
		</div>
	</div>

	{#if activeTab === 'matrix'}
		<!-- Matrix Hak Akses Halaman -->
		<div class="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
			<!-- Sub-header -->
			<div
				class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs"
			>
				<div class="flex items-center gap-2">
					<Lock class="h-4 w-4 text-[#026cb6]" />
					<span class="font-bold text-slate-800">SETUP Akses Halaman (Role Permissions)</span>
				</div>

				<div class="flex items-center gap-2">
					<span class="text-slate-500 font-medium">Modul Target:</span>
					<select
						bind:value={selectedModule}
						class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
					>
						{#each modulesList as m}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Permissions Matrix Table -->
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs text-slate-600">
					<thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
						<tr>
							<th class="px-4 py-3 min-w-[220px]">Nama Role (Hak Akses)</th>
							<th class="px-3 py-3 w-28 text-center">Lihat (View)</th>
							<th class="px-3 py-3 w-28 text-center">Tambah (Create)</th>
							<th class="px-3 py-3 w-28 text-center">Ubah (Edit)</th>
							<th class="px-3 py-3 w-28 text-center">Hapus (Delete)</th>
							<th class="px-3 py-3 w-28 text-center">Approval</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each allRoleNames as role}
							{@const perm = permissions[role] || {
								canView: true,
								canCreate: false,
								canEdit: false,
								canDelete: false,
								canApprove: false
							}}
							{@const isIT = role === 'IT RO' || role.includes('Super')}
							<tr class="transition hover:bg-slate-50/80 {isIT ? 'bg-sky-50/20' : ''}">
								<!-- Role Name -->
								<td class="px-4 py-2.5">
									<div class="flex items-center gap-2">
										<Shield class="h-3.5 w-3.5 text-[#026cb6]" />
										<span class="font-semibold text-slate-800">{role}</span>
										{#if isIT}
											<span
												class="rounded bg-sky-100 px-1.5 py-0.2 text-[9px] font-bold text-sky-800"
											>
												ADMIN
											</span>
										{/if}
									</div>
								</td>

								<!-- View -->
								<td class="px-3 py-2.5 text-center">
									<button
										type="button"
										onclick={() => togglePerm(role, 'canView')}
										class="inline-flex h-6 w-6 items-center justify-center rounded border transition cursor-pointer {perm.canView
											? 'border-emerald-500 bg-emerald-500 text-white'
											: 'border-slate-300 bg-white text-slate-300'}"
									>
										{#if perm.canView}<Check class="h-3.5 w-3.5 stroke-[3]" />{/if}
									</button>
								</td>

								<!-- Create -->
								<td class="px-3 py-2.5 text-center">
									<button
										type="button"
										onclick={() => togglePerm(role, 'canCreate')}
										class="inline-flex h-6 w-6 items-center justify-center rounded border transition cursor-pointer {perm.canCreate
											? 'border-emerald-500 bg-emerald-500 text-white'
											: 'border-slate-300 bg-white text-slate-300'}"
									>
										{#if perm.canCreate}<Check class="h-3.5 w-3.5 stroke-[3]" />{/if}
									</button>
								</td>

								<!-- Edit -->
								<td class="px-3 py-2.5 text-center">
									<button
										type="button"
										onclick={() => togglePerm(role, 'canEdit')}
										class="inline-flex h-6 w-6 items-center justify-center rounded border transition cursor-pointer {perm.canEdit
											? 'border-emerald-500 bg-emerald-500 text-white'
											: 'border-slate-300 bg-white text-slate-300'}"
									>
										{#if perm.canEdit}<Check class="h-3.5 w-3.5 stroke-[3]" />{/if}
									</button>
								</td>

								<!-- Delete -->
								<td class="px-3 py-2.5 text-center">
									<button
										type="button"
										onclick={() => togglePerm(role, 'canDelete')}
										class="inline-flex h-6 w-6 items-center justify-center rounded border transition cursor-pointer {perm.canDelete
											? 'border-red-500 bg-red-500 text-white'
											: 'border-slate-300 bg-white text-slate-300'}"
									>
										{#if perm.canDelete}<Check class="h-3.5 w-3.5 stroke-[3]" />{/if}
									</button>
								</td>

								<!-- Approve -->
								<td class="px-3 py-2.5 text-center">
									<button
										type="button"
										onclick={() => togglePerm(role, 'canApprove')}
										class="inline-flex h-6 w-6 items-center justify-center rounded border transition cursor-pointer {perm.canApprove
											? 'border-[#026cb6] bg-[#026cb6] text-white'
											: 'border-slate-300 bg-white text-slate-300'}"
									>
										{#if perm.canApprove}<Check class="h-3.5 w-3.5 stroke-[3]" />{/if}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<!-- Daftar Roles Tab -->
		<div class="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
			<!-- Header with Search -->
			<div
				class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 gap-2"
			>
				<div class="relative flex-1 max-w-sm">
					<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari role..."
						class="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs focus:border-[#026cb6] focus:outline-none"
					/>
				</div>

				<span class="text-xs text-slate-500 font-medium">
					Menampilkan {filteredRoleNames.length} Role
				</span>
			</div>

			<!-- Role List Table -->
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs text-slate-600">
					<thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
						<tr>
							<th class="px-4 py-3 w-12 text-center">No</th>
							<th class="px-4 py-3 min-w-[220px]">Role Name (C02)</th>
							<th class="px-4 py-3 min-w-[240px]">Deskripsi</th>
							<th class="px-4 py-3 w-28 text-center">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each filteredRoleNames as roleName, idx}
							{@const hcm = rawData.hcmRoles.find((h) => h.roleName === roleName)}
							<tr class="hover:bg-slate-50/80 transition">
								<td class="px-4 py-2.5 text-center text-slate-400 font-mono text-[11px]">
									{idx + 1}
								</td>
								<td class="px-4 py-2.5 font-semibold text-slate-800">
									{roleName}
								</td>
								<td class="px-4 py-2.5 text-slate-500">
									{hcm?.descr || 'Standard system user role'}
								</td>
								<td class="px-4 py-2.5 text-center">
									<span
										class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
									>
										<CheckCircle2 class="h-2.5 w-2.5" />
										Aktif
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
