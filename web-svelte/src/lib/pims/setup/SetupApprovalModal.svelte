<script lang="ts">
	import { X, GitCommit, Building2, MapPin, User, Check, Layers } from 'lucide-svelte';

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

	let {
		item,
		isNew = false,
		onSave,
		onCancel
	}: {
		item: Partial<ApprovalRecord>;
		isNew?: boolean;
		onSave: (record: ApprovalRecord) => void;
		onCancel: () => void;
	} = $props();

	let module = $state(item.module || 'Task Order Result');
	let subsidiary = $state(item.subsidiary || 'PT Sumber Wangi Alam');
	let typeName = $state(item.typeName || 'Afdeling/Block');
	let site = $state(item.site || 'SWA SITE');
	let afdeling = $state(item.afdeling || 'AFDELING 1 (AWS)');
	let approverLevel = $state(item.approverLevel || '1');
	let userName = $state(item.userName || '');
	let isActive = $state(item.isActive !== 'N');

	const moduleOptions = [
		'Task Order',
		'Task Order Result',
		'Special Task Order Result'
	];

	const subsidiaryOptions = [
		'PT Kirana Yudha Amandari',
		'PT Sumber Wangi Alam',
		'PT Treekeasi Margamulia'
	];

	const siteOptions = ['GDJ Site 1', 'KYA Site 1', 'SWA SITE', 'TMM Site 1'];

	const afdelingOptions = [
		'GDJ AFDELING 1',
		'KYA AFDELING 1',
		'AFDELING 1 (AWS)',
		'AFDELING 2 (AWD)',
		'AFDELING 3 (AWT)',
		'AFDELING 4 (AWE)',
		'AFDELING 5 (AWL)',
		'TMM Afdeling 1'
	];

	let errorMsg = $state('');

	function handleSave() {
		if (!userName.trim()) {
			errorMsg = 'Nama Approver wajib diisi.';
			return;
		}

		const rec: ApprovalRecord = {
			id: item.id || Date.now(),
			module,
			subsidiary,
			typeName,
			site: site || null,
			afdeling: typeName === 'Site' ? null : afdeling,
			approverLevel: String(approverLevel),
			userName: userName.trim(),
			isActive: isActive ? 'Y' : 'N'
		};

		onSave(rec);
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
	<div
		class="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
	>
		<!-- Header -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-6 py-4"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#026cb6]/10 text-[#026cb6]"
				>
					<GitCommit class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-base font-bold text-slate-900">
						{isNew ? 'Tambah Approver Hierarchy' : 'Ubah Approver Hierarchy'}
					</h3>
					<p class="text-xs text-slate-500">
						Page 163 &bull; Alias: <span class="font-mono">md-approval-hierarchies-form</span>
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={onCancel}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
			{#if errorMsg}
				<div class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
					{errorMsg}
				</div>
			{/if}

			<!-- Module & Subsidiary -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Module <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={module}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#026cb6] focus:outline-none"
					>
						{#each moduleOptions as m}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Subsidiary <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={subsidiary}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#026cb6] focus:outline-none"
					>
						{#each subsidiaryOptions as s}
							<option value={s}>{s}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Type & Site -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1"> Type </label>
					<select
						bind:value={typeName}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#026cb6] focus:outline-none"
					>
						<option value="Afdeling/Block">Afdeling/Block</option>
						<option value="Site">Site</option>
					</select>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1"> Site </label>
					<select
						bind:value={site}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#026cb6] focus:outline-none"
					>
						{#each siteOptions as so}
							<option value={so}>{so}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Afdeling (if Afdeling/Block) -->
			{#if typeName === 'Afdeling/Block'}
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1"> Afdeling </label>
					<select
						bind:value={afdeling}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#026cb6] focus:outline-none"
					>
						{#each afdelingOptions as a}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Approver Level & User Name -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Level Approver <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={approverLevel}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#026cb6] focus:border-[#026cb6] focus:outline-none"
					>
						<option value="1">Level 1 (Asisten Manager)</option>
						<option value="2">Level 2 (Kepala KTU)</option>
						<option value="3">Level 3 (Kepala Kebun)</option>
						<option value="4">Level 4 (Senior Kebun)</option>
					</select>
				</div>

				<div class="sm:col-span-2">
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Nama Approver & Jabatan <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={userName}
						placeholder="contoh: Asisten Manager - Mukti Alexander"
						class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#026cb6] focus:outline-none"
					/>
				</div>
			</div>

			<!-- Active Status -->
			<div class="flex items-center gap-2 pt-2">
				<label class="relative inline-flex items-center cursor-pointer">
					<input type="checkbox" bind:checked={isActive} class="sr-only peer" />
					<div
						class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
					></div>
					<span class="ml-3 text-xs font-medium {isActive ? 'text-emerald-700' : 'text-slate-500'}">
						{isActive ? 'Approver Aktif (Y)' : 'Non-Aktif (N)'}
					</span>
				</label>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
			<button
				type="button"
				onclick={onCancel}
				class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleSave}
				class="rounded-lg bg-[#026cb6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
			>
				Simpan Approver
			</button>
		</div>
	</div>
</div>
