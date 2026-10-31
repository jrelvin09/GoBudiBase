<script lang="ts">
	import { X, Check, KeyRound, Building, Shield, User, Mail, Calendar, Info } from 'lucide-svelte';

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
		user,
		isNew = false,
		onSave,
		onCancel,
		onResetPassword
	}: {
		user: Partial<UserRecord>;
		isNew?: boolean;
		onSave: (updated: UserRecord) => void;
		onCancel: () => void;
		onResetPassword?: (nik: string) => void;
	} = $props();

	// Split full name into first, middle, last
	const nameParts = (user.nama || '').trim().split(/\s+/);
	let firstName = $state(nameParts[0] || '');
	let middleName = $state(nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '');
	let lastName = $state(nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');

	let nik = $state(user.nik || '');
	let email = $state(user.email || (user.nik ? `${user.nik.toLowerCase()}@harvestcloud.co.id` : ''));
	let selectedRole = $state(user.role || 'Viewer');
	let isActive = $state(user.aktif === 'Ya');

	// Subsidiary multi-select options
	const availableSubsidiaries = [
		'PT Kirana Yudha Amandari',
		'PT Sumber Wangi Alam',
		'PT Cahaya Putih Energi Alam (ASJ)',
		'PT Treekeasi Margamulia'
	];

	// Parse initial subsidiaries
	const initialSubs = (user.subsidiary || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	let selectedSubsidiaries = $state<string[]>(
		initialSubs.length > 0 ? initialSubs : ['PT Sumber Wangi Alam']
	);

	function toggleSubsidiary(sub: string) {
		if (selectedSubsidiaries.includes(sub)) {
			selectedSubsidiaries = selectedSubsidiaries.filter((s) => s !== sub);
		} else {
			selectedSubsidiaries = [...selectedSubsidiaries, sub];
		}
	}

	const roleOptions = [
		'Accounting HO',
		'Accounting RO',
		'Admin Divisi',
		'Admin HO',
		'Admin KTU',
		'Asisten Manager',
		'Budget Officer RO',
		'DataAdmin',
		'Finance HO',
		'Finance RO',
		'HR',
		'IT RO',
		'Mandor',
		'Operation HO',
		'Purchasing HO',
		'Super Administrator',
		'Viewer'
	];

	let errorMsg = $state('');

	function handleSave() {
		if (!nik.trim()) {
			errorMsg = 'NIK / Username wajib diisi.';
			return;
		}
		if (!firstName.trim()) {
			errorMsg = 'Nama Depan wajib diisi.';
			return;
		}
		if (selectedSubsidiaries.length === 0) {
			errorMsg = 'Pilih minimal satu Subsidiary.';
			return;
		}

		const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

		const updatedRecord: UserRecord = {
			rowNo: user.rowNo || 9999,
			nik: nik.trim().toUpperCase(),
			nama: fullName.toUpperCase(),
			manager: user.manager || null,
			subsidiary: selectedSubsidiaries.join(', '),
			role: selectedRole,
			aktif: isActive ? 'Ya' : 'Tidak',
			dibuatOleh: user.dibuatOleh || 'IT000002',
			tglDibuat: user.tglDibuat || new Date().toLocaleString('id-ID'),
			diubahOleh: 'IT000002 (MUKTI ASSARY)',
			tglDiubah: new Date().toLocaleString('id-ID'),
			rid: user.rid || user.rowNo || 9999,
			email: email.trim()
		};

		onSave(updatedRecord);
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
	<div
		class="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
	>
		<!-- Modal Header: Oracle APEX Redwood style -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-6 py-4"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#026cb6]/10 text-[#026cb6]"
				>
					<User class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-base font-bold text-slate-900">
						{isNew ? 'Tambah User Baru' : 'SETUP Informasi User - Ubah Data'}
					</h3>
					<p class="text-xs text-slate-500">
						Page 432 &bull; Alias: <span class="font-mono">setup-user-informations-detail</span>
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={onCancel}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
				title="Tutup Modal"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- Modal Body -->
		<div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
			{#if errorMsg}
				<div class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
					{errorMsg}
				</div>
			{/if}

			<!-- Username / NIK & Email -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Username / NIK <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={nik}
						disabled={!isNew}
						placeholder="contoh: IT000002"
						class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20 disabled:bg-slate-100 disabled:text-slate-500"
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Alamat Email <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
						<input
							type="email"
							bind:value={email}
							placeholder="nama@harvestcloud.co.id"
							class="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
						/>
					</div>
				</div>
			</div>

			<!-- Names (Depan, Tengah, Belakang) -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1"> Nama Lengkap </label>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div>
						<input
							type="text"
							bind:value={firstName}
							placeholder="Nama Depan *"
							class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
						/>
						<span class="text-[10px] text-slate-400 mt-0.5 block">Nama Depan *</span>
					</div>
					<div>
						<input
							type="text"
							bind:value={middleName}
							placeholder="Nama Tengah"
							class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
						/>
						<span class="text-[10px] text-slate-400 mt-0.5 block">Nama Tengah (Opsional)</span>
					</div>
					<div>
						<input
							type="text"
							bind:value={lastName}
							placeholder="Nama Belakang"
							class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
						/>
						<span class="text-[10px] text-slate-400 mt-0.5 block">Nama Belakang</span>
					</div>
				</div>
			</div>

			<!-- Subsidiary Multi-Select -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
					<Building class="h-3.5 w-3.5 text-slate-500" />
					Subsidiary (Multi-select LOV) <span class="text-red-500">*</span>
				</label>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{#each availableSubsidiaries as sub}
						{@const checked = selectedSubsidiaries.includes(sub)}
						<button
							type="button"
							onclick={() => toggleSubsidiary(sub)}
							class="flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs transition cursor-pointer {checked
								? 'border-[#026cb6] bg-[#026cb6]/5 text-[#026cb6] font-medium'
								: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}"
						>
							<div
								class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition {checked
									? 'border-[#026cb6] bg-[#026cb6] text-white'
									: 'border-slate-300 bg-white'}"
							>
								{#if checked}
									<Check class="h-3 w-3 stroke-[3]" />
								{/if}
							</div>
							<span>{sub}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Role & Status Aktif -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
						<Shield class="h-3.5 w-3.5 text-slate-500" />
						Roles (Hak Akses)
					</label>
					<select
						bind:value={selectedRole}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
					>
						{#each roleOptions as ro}
							<option value={ro}>{ro}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1"> Data Status </label>
					<div class="flex items-center gap-2 pt-2">
						<label class="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" bind:checked={isActive} class="sr-only peer" />
							<div
								class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
							></div>
							<span class="ml-3 text-xs font-medium {isActive ? 'text-emerald-700' : 'text-slate-500'}">
								{isActive ? 'Data Aktif (Ya)' : 'Non-Aktif (Tidak)'}
							</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Audit Trail Section -->
			{#if !isNew}
				<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600">
					<div class="mb-2 font-semibold text-slate-700 flex items-center gap-1.5">
						<Info class="h-3.5 w-3.5 text-slate-400" />
						Informasi Audit Pembuatan & Perubahan
					</div>
					<div class="grid grid-cols-2 gap-2 text-[11px]">
						<div>
							<span class="text-slate-400">Dibuat Oleh:</span>
							<strong class="text-slate-700 ml-1">{user.dibuatOleh || '-'}</strong>
						</div>
						<div>
							<span class="text-slate-400">Tgl Dibuat:</span>
							<span class="text-slate-700 ml-1 font-mono">{user.tglDibuat || '-'}</span>
						</div>
						<div>
							<span class="text-slate-400">Diubah Oleh:</span>
							<strong class="text-slate-700 ml-1">{user.diubahOleh || '-'}</strong>
						</div>
						<div>
							<span class="text-slate-400">Tgl Diubah:</span>
							<span class="text-slate-700 ml-1 font-mono">{user.tglDiubah || '-'}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Modal Footer -->
		<div
			class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5 gap-2"
		>
			<!-- Left side action: Reset Password (APEX RUBAH_KATA_SANDI button) -->
			<div>
				{#if !isNew && onResetPassword}
					<button
						type="button"
						onclick={() => onResetPassword(nik)}
						class="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
					>
						<KeyRound class="h-3.5 w-3.5 text-amber-600" />
						Rubah Kata Sandi
					</button>
				{/if}
			</div>

			<!-- Right side actions: Cancel and Save -->
			<div class="flex items-center justify-end gap-2">
				<button
					type="button"
					onclick={onCancel}
					class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSave}
					class="rounded-lg bg-[#026cb6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
				>
					Apply Changes
				</button>
			</div>
		</div>
	</div>
</div>
