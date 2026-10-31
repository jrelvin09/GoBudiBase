<script lang="ts">
	import { onMount } from 'svelte';
	import rawHier from '$lib/assets/approval_hier.json';
	import SetupApprovalModal from './SetupApprovalModal.svelte';
	import {
		GitCommit,
		Plus,
		Search,
		Download,
		Filter,
		RotateCcw,
		Edit2,
		CheckCircle2,
		XCircle,
		ArrowRight,
		ShieldCheck,
		Building2,
		MapPin,
		Layers
	} from 'lucide-svelte';

	interface ApprovalRecord {
		id: number;
		module: string;
		subsidiary: string;
		typeName: string;
		site: string | null;
		afdeling: string | null;
		approverLevel: string;
		userName: string;
		isActive: string;
	}

	let hierarchies = $state<ApprovalRecord[]>([]);
	let activeTab = $state<'TO Result' | 'Special TO Result' | 'Task Order'>('TO Result');

	// Filters
	let filterSubsidiary = $state('ALL');
	let filterType = $state('ALL');
	let filterSite = $state('ALL');
	let searchQuery = $state('');

	// Modal
	let editingItem = $state<ApprovalRecord | null>(null);
	let isNewItem = $state(false);
	let toastMessage = $state('');

	onMount(() => {
		const saved = localStorage.getItem('gopims_approval_hier');
		if (saved) {
			try {
				hierarchies = JSON.parse(saved);
			} catch {
				hierarchies = (rawHier as ApprovalRecord[]).slice();
			}
		} else {
			hierarchies = (rawHier as ApprovalRecord[]).slice();
		}
	});

	function saveToStorage(newList: ApprovalRecord[]) {
		hierarchies = newList;
		try {
			localStorage.setItem('gopims_approval_hier', JSON.stringify(newList));
		} catch (e) {
			console.warn(e);
		}
	}

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			if (toastMessage === msg) toastMessage = '';
		}, 4000);
	}

	// Filtered by Tab & Controls
	let tabModule = $derived(
		activeTab === 'TO Result'
			? 'Task Order Result'
			: activeTab === 'Special TO Result'
				? 'Special Task Order Result'
				: 'Task Order'
	);

	let filteredHierarchies = $derived(
		hierarchies.filter((h) => {
			if (h.module !== tabModule) return false;
			if (filterSubsidiary !== 'ALL' && h.subsidiary !== filterSubsidiary) return false;
			if (filterType !== 'ALL' && h.typeName !== filterType) return false;
			if (filterSite !== 'ALL' && h.site !== filterSite) return false;
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchUser = (h.userName || '').toLowerCase().includes(q);
				const matchAfd = (h.afdeling || '').toLowerCase().includes(q);
				if (!matchUser && !matchAfd) return false;
			}
			return true;
		})
	);

	function handleAddNew() {
		editingItem = {
			id: Date.now(),
			module: tabModule,
			subsidiary: 'PT Sumber Wangi Alam',
			typeName: 'Afdeling/Block',
			site: 'SWA SITE',
			afdeling: 'AFDELING 1 (AWS)',
			approverLevel: '1',
			userName: '',
			isActive: 'Y'
		};
		isNewItem = true;
	}

	function handleEdit(item: ApprovalRecord) {
		editingItem = { ...item };
		isNewItem = false;
	}

	function handleSave(updated: ApprovalRecord) {
		let updatedList: ApprovalRecord[];
		if (isNewItem) {
			updatedList = [updated, ...hierarchies];
			showToast(`Approval hierarchy level ${updated.approverLevel} berhasil ditambahkan.`);
		} else {
			updatedList = hierarchies.map((h) => (h.id === updated.id ? updated : h));
			showToast(`Approval level ${updated.approverLevel} berhasil diperbarui.`);
		}
		saveToStorage(updatedList);
		editingItem = null;
	}

	function toggleActive(item: ApprovalRecord) {
		const newStatus = item.isActive === 'Y' ? 'N' : 'Y';
		const updatedList = hierarchies.map((h) =>
			h.id === item.id ? { ...h, isActive: newStatus } : h
		);
		saveToStorage(updatedList);
		showToast(`Status approver ${item.userName} diubah ke ${newStatus === 'Y' ? 'Aktif' : 'Non-Aktif'}.`);
	}

	function resetFilters() {
		filterSubsidiary = 'ALL';
		filterType = 'ALL';
		filterSite = 'ALL';
		searchQuery = '';
	}

	function handleExportCsv() {
		const headers = [
			'ID',
			'Module',
			'Subsidiary',
			'Type',
			'Site',
			'Afdeling',
			'Level',
			'Approver Name',
			'Status Aktif'
		];
		const rows = filteredHierarchies.map((h) => [
			h.id,
			`"${h.module}"`,
			`"${h.subsidiary}"`,
			`"${h.typeName}"`,
			`"${h.site || ''}"`,
			`"${h.afdeling || ''}"`,
			h.approverLevel,
			`"${h.userName}"`,
			h.isActive
		]);

		const csvContent =
			'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `PIMS_Approval_Hierarchy_${activeTab.replace(/\s+/g, '_')}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		showToast('Data approval hierarchy berhasil diexport.');
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

	<!-- Visual Approval Ladder (Redwood Flow Banner) -->
	<div
		class="rounded-xl border border-slate-200 bg-linear-to-r from-sky-50 via-white to-indigo-50/40 p-4 shadow-2xs"
	>
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 text-[#026cb6]" />
				<span class="text-xs font-bold text-slate-800">Alur Jenjang Persetujuan (Approval Ladder)</span>
			</div>
			<span class="text-[11px] font-medium text-slate-500">Multi-tier Sequential Routing</span>
		</div>

		<div class="grid grid-cols-1 gap-2 sm:grid-cols-4">
			<div class="flex items-center gap-2 rounded-lg border border-blue-200 bg-white p-2.5 shadow-2xs">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
					1
				</span>
				<div>
					<div class="text-[10px] uppercase font-bold text-blue-700">Level 1</div>
					<div class="text-xs font-semibold text-slate-800">Asisten Manager</div>
				</div>
			</div>

			<div class="flex items-center gap-2 rounded-lg border border-purple-200 bg-white p-2.5 shadow-2xs">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
					2
				</span>
				<div>
					<div class="text-[10px] uppercase font-bold text-purple-700">Level 2</div>
					<div class="text-xs font-semibold text-slate-800">Kepala KTU</div>
				</div>
			</div>

			<div class="flex items-center gap-2 rounded-lg border border-amber-200 bg-white p-2.5 shadow-2xs">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
					3
				</span>
				<div>
					<div class="text-[10px] uppercase font-bold text-amber-700">Level 3</div>
					<div class="text-xs font-semibold text-slate-800">Kepala Kebun</div>
				</div>
			</div>

			<div class="flex items-center gap-2 rounded-lg border border-rose-200 bg-white p-2.5 shadow-2xs">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
					4
				</span>
				<div>
					<div class="text-[10px] uppercase font-bold text-rose-700">Level 4</div>
					<div class="text-xs font-semibold text-slate-800">Senior Kebun</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Tabs Bar (Matching Oracle APEX NATIVE_DISPLAY_SELECTOR) -->
	<div class="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<!-- Tab Buttons -->
			<div class="flex flex-wrap items-center gap-1">
				<button
					type="button"
					onclick={() => (activeTab = 'TO Result')}
					class="rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer {activeTab ===
					'TO Result'
						? 'bg-[#026cb6] text-white shadow-xs'
						: 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
				>
					TO Result Approval Hierarchy
				</button>

				<button
					type="button"
					onclick={() => (activeTab = 'Special TO Result')}
					class="rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer {activeTab ===
					'Special TO Result'
						? 'bg-[#026cb6] text-white shadow-xs'
						: 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
				>
					Special Task Order Result
				</button>

				<button
					type="button"
					onclick={() => (activeTab = 'Task Order')}
					class="rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer {activeTab ===
					'Task Order'
						? 'bg-[#026cb6] text-white shadow-xs'
						: 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
				>
					Task Order Approval
				</button>
			</div>

			<!-- Hot Button: Create TO Result Approval -->
			<button
				type="button"
				onclick={handleAddNew}
				class="flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs self-start sm:self-auto"
			>
				<Plus class="h-3.5 w-3.5" />
				<span>Create Approval</span>
			</button>
		</div>
	</div>

	<!-- Filters Toolbar -->
	<div class="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
		<div class="flex flex-wrap items-center gap-2">
			<!-- Search Approver -->
			<div class="relative flex-1 min-w-[200px] max-w-xs">
				<Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari approver atau afdeling..."
					class="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-[#026cb6] focus:bg-white focus:outline-none"
				/>
			</div>

			<!-- Subsidiary Filter -->
			<select
				bind:value={filterSubsidiary}
				class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
			>
				<option value="ALL">Semua Subsidiary</option>
				<option value="PT Kirana Yudha Amandari">PT Kirana Yudha Amandari</option>
				<option value="PT Sumber Wangi Alam">PT Sumber Wangi Alam</option>
				<option value="PT Treekeasi Margamulia">PT Treekeasi Margamulia</option>
			</select>

			<!-- Type Filter -->
			<select
				bind:value={filterType}
				class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
			>
				<option value="ALL">Semua Type</option>
				<option value="Afdeling/Block">Afdeling/Block</option>
				<option value="Site">Site</option>
			</select>

			<!-- Site Filter -->
			<select
				bind:value={filterSite}
				class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
			>
				<option value="ALL">Semua Site</option>
				<option value="GDJ Site 1">GDJ Site 1</option>
				<option value="KYA Site 1">KYA Site 1</option>
				<option value="SWA SITE">SWA SITE</option>
				<option value="TMM Site 1">TMM Site 1</option>
			</select>

			<!-- Reset Filter -->
			<button
				type="button"
				onclick={resetFilters}
				class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
				title="Reset Filter"
			>
				<RotateCcw class="h-3.5 w-3.5" />
			</button>

			<!-- CSV Export -->
			<button
				type="button"
				onclick={handleExportCsv}
				class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
			>
				<Download class="h-3.5 w-3.5 text-slate-500" />
				<span>CSV</span>
			</button>
		</div>
	</div>

	<!-- Interactive Grid Table -->
	<div class="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
		<!-- Header -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs"
		>
			<div class="flex items-center gap-2">
				<GitCommit class="h-4 w-4 text-[#026cb6]" />
				<span class="font-bold text-slate-800">{tabModule} Approval Hierarchy</span>
				<span class="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
					{filteredHierarchies.length} Routing Rules
				</span>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-slate-600">
				<thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
					<tr>
						<th class="px-3 py-3 w-12 text-center">Aksi</th>
						<th class="px-3 py-3 w-16 text-center">Level</th>
						<th class="px-4 py-3 min-w-[200px]">Approver Name & Title</th>
						<th class="px-4 py-3 min-w-[180px]">Subsidiary</th>
						<th class="px-3 py-3 w-28">Type</th>
						<th class="px-3 py-3 min-w-[120px]">Site</th>
						<th class="px-3 py-3 min-w-[140px]">Afdeling</th>
						<th class="px-3 py-3 w-24 text-center">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if filteredHierarchies.length === 0}
						<tr>
							<td colspan="8" class="py-12 text-center text-slate-400">
								Tidak ada data approval hierarchy untuk kategori ini.
							</td>
						</tr>
					{:else}
						{#each filteredHierarchies as h}
							{@const isLvl1 = h.approverLevel === '1'}
							{@const isLvl2 = h.approverLevel === '2'}
							{@const isLvl3 = h.approverLevel === '3'}
							{@const isLvl4 = h.approverLevel === '4'}
							<tr class="hover:bg-slate-50/80 transition">
								<!-- Aksi -->
								<td class="px-3 py-2 text-center">
									<button
										type="button"
										onclick={() => handleEdit(h)}
										class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-[#026cb6] hover:bg-[#026cb6] hover:text-white transition cursor-pointer shadow-2xs"
										title="Ubah Approver"
									>
										<Edit2 class="h-3.5 w-3.5" />
									</button>
								</td>

								<!-- Approver Level Badge -->
								<td class="px-3 py-2 text-center">
									{#if isLvl1}
										<span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
											Level 1
										</span>
									{:else if isLvl2}
										<span class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
											Level 2
										</span>
									{:else if isLvl3}
										<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
											Level 3
										</span>
									{:else}
										<span class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
											Level 4
										</span>
									{/if}
								</td>

								<!-- Approver User Name -->
								<td class="px-4 py-2 font-semibold text-slate-800">
									{h.userName}
								</td>

								<!-- Subsidiary -->
								<td class="px-4 py-2 text-slate-600">
									{h.subsidiary}
								</td>

								<!-- Type -->
								<td class="px-3 py-2">
									<span class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
										{h.typeName}
									</span>
								</td>

								<!-- Site -->
								<td class="px-3 py-2 text-slate-600">
									{h.site || '-'}
								</td>

								<!-- Afdeling -->
								<td class="px-3 py-2 text-slate-600">
									{h.afdeling || '-'}
								</td>

								<!-- Status Aktif Toggle -->
								<td class="px-3 py-2 text-center">
									<button
										type="button"
										onclick={() => toggleActive(h)}
										class="cursor-pointer transition"
										title="Klik untuk toggle status"
									>
										{#if h.isActive === 'Y'}
											<span
												class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
											>
												<CheckCircle2 class="h-2.5 w-2.5" />
												Aktif (Y)
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-100"
											>
												<XCircle class="h-2.5 w-2.5" />
												Non-Aktif (N)
											</span>
										{/if}
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Form -->
	{#if editingItem}
		<SetupApprovalModal
			item={editingItem}
			isNew={isNewItem}
			onSave={handleSave}
			onCancel={() => (editingItem = null)}
		/>
	{/if}
</div>
