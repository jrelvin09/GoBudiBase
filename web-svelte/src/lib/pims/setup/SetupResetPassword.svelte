<script lang="ts">
	import { onMount } from 'svelte';
	import rawUsers from '$lib/assets/user_informations.json';
	import {
		KeyRound,
		Eye,
		EyeOff,
		Check,
		Search,
		CheckCircle2,
		AlertCircle,
		Shield,
		User,
		Building2,
		Lock,
		History,
		RotateCcw
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
	}

	interface ResetLog {
		id: string;
		time: string;
		targetUser: string;
		performedBy: string;
		status: string;
	}

	let {
		initialUsername = ''
	}: {
		initialUsername?: string;
	} = $props();

	const usersList = (rawUsers as UserRecord[]).slice();

	// Selected user
	let selectedNik = $state(initialUsername || 'IT000002');
	let searchUserQuery = $state('');
	let showUserPicker = $state(false);

	// Passwords
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let requireChangeNextLogin = $state(true);

	// Feedback
	let successBanner = $state('');
	let errorBanner = $state('');

	// Recent logs
	let recentLogs = $state<ResetLog[]>([
		{
			id: 'LOG-001',
			time: '31-10-2026 23:45',
			targetUser: 'IT000002 (MUKTI ASSARY)',
			performedBy: 'IT000002 (MUKTI ASSARY)',
			status: 'SUCCESS'
		},
		{
			id: 'LOG-002',
			time: '30-10-2026 14:10',
			targetUser: 'SWA000032 (FAJAR PRASETYO)',
			performedBy: 'IT000002 (MUKTI ASSARY)',
			status: 'SUCCESS'
		}
	]);

	onMount(() => {
		const savedLogs = localStorage.getItem('gopims_reset_pwd_logs');
		if (savedLogs) {
			try {
				recentLogs = JSON.parse(savedLogs);
			} catch (e) {
				console.warn(e);
			}
		}
	});

	// Find the currently selected user object
	let selectedUserObj = $derived(usersList.find((u) => u.nik === selectedNik));

	// Search filtered users in the picker
	let filteredPickerUsers = $derived(
		usersList
			.filter((u) => {
				if (!searchUserQuery.trim()) return true;
				const q = searchUserQuery.toLowerCase();
				return u.nik.toLowerCase().includes(q) || u.nama.toLowerCase().includes(q);
			})
			.slice(0, 50)
	);

	function calculateStrength(pwd: string): { label: string; score: number; color: string } {
		if (!pwd) return { label: 'Kosong', score: 0, color: 'bg-slate-200' };
		let score = 0;
		if (pwd.length >= 8) score += 1;
		if (/[A-Z]/.test(pwd)) score += 1;
		if (/[0-9]/.test(pwd)) score += 1;
		if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

		if (score <= 1) return { label: 'Lemah', score: 25, color: 'bg-rose-500' };
		if (score === 2) return { label: 'Cukup', score: 50, color: 'bg-amber-500' };
		if (score === 3) return { label: 'Kuat', score: 75, color: 'bg-sky-500' };
		return { label: 'Sangat Kuat', score: 100, color: 'bg-emerald-500' };
	}

	let strength = $derived(calculateStrength(newPassword));

	function handleResetPassword() {
		errorBanner = '';
		successBanner = '';

		if (!selectedNik) {
			errorBanner = 'Silakan pilih Username terlebih dahulu.';
			return;
		}

		if (!newPassword) {
			errorBanner = 'Password baru wajib diisi.';
			return;
		}

		if (newPassword.length < 6) {
			errorBanner = 'Password minimal harus 6 karakter.';
			return;
		}

		if (newPassword !== confirmPassword) {
			errorBanner = 'Konfirmasi password tidak cocok dengan password baru.';
			return;
		}

		// Success simulation matching Oracle APEX:
		// apex_application.g_print_success_message := 'Password untuk user ' || :P164_USERNAME || ' berhasil di-reset.';
		const userNameStr = selectedUserObj ? `${selectedUserObj.nik} (${selectedUserObj.nama})` : selectedNik;
		successBanner = `Password untuk user ${userNameStr} berhasil di-reset.`;

		// Append to audit log
		const newLog: ResetLog = {
			id: `LOG-${Date.now().toString().slice(-4)}`,
			time: new Date().toLocaleString('id-ID'),
			targetUser: userNameStr,
			performedBy: 'IT000002 (MUKTI ASSARY)',
			status: 'SUCCESS'
		};

		const updatedLogs = [newLog, ...recentLogs];
		recentLogs = updatedLogs;
		try {
			localStorage.setItem('gopims_reset_pwd_logs', JSON.stringify(updatedLogs));
		} catch (e) {
			console.warn(e);
		}

		// Clear passwords
		newPassword = '';
		confirmPassword = '';
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<!-- APEX Redwood Success Notification -->
	{#if successBanner}
		<div
			class="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-xs"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
					<CheckCircle2 class="h-5 w-5" />
				</div>
				<div>
					<div class="font-bold text-sm">Operasi Berhasil</div>
					<div>{successBanner}</div>
				</div>
			</div>
			<button
				type="button"
				onclick={() => (successBanner = '')}
				class="text-emerald-600 hover:text-emerald-900 font-bold text-base cursor-pointer"
			>
				&times;
			</button>
		</div>
	{/if}

	<!-- APEX Error Notification -->
	{#if errorBanner}
		<div
			class="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
					<AlertCircle class="h-5 w-5" />
				</div>
				<div>
					<div class="font-bold text-sm">Validasi Gagal</div>
					<div>{errorBanner}</div>
				</div>
			</div>
			<button
				type="button"
				onclick={() => (errorBanner = '')}
				class="text-rose-600 hover:text-rose-900 font-bold text-base cursor-pointer"
			>
				&times;
			</button>
		</div>
	{/if}

	<!-- Main Password Reset Card (Page 164) -->
	<div class="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
		<!-- Header -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-6 py-4"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#026cb6]/10 text-[#026cb6]"
				>
					<KeyRound class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-base font-bold text-slate-900">Reset Password User</h3>
					<p class="text-xs text-slate-500">
						Page 164 &bull; Alias: <span class="font-mono">end-user-reset-password</span>
					</p>
				</div>
			</div>

			<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-600">
				Process: NATIVE_PLSQL
			</span>
		</div>

		<!-- Card Body -->
		<div class="p-6 space-y-5">
			<!-- P164_USERNAME: Searchable User LOV -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
					<User class="h-3.5 w-3.5 text-slate-500" />
					Pilih User / NIK (P164_USERNAME) <span class="text-red-500">*</span>
				</label>

				<div class="relative">
					<button
						type="button"
						onclick={() => (showUserPicker = !showUserPicker)}
						class="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs transition hover:bg-slate-50 focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20 cursor-pointer"
					>
						{#if selectedUserObj}
							<div class="flex items-center gap-2">
								<span class="font-mono font-bold text-[#026cb6]">{selectedUserObj.nik}</span>
								<span class="font-semibold text-slate-800">{selectedUserObj.nama}</span>
								{#if selectedUserObj.role}
									<span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
										{selectedUserObj.role}
									</span>
								{/if}
							</div>
						{:else}
							<span class="text-slate-400">Pilih user dari daftar...</span>
						{/if}
						<span class="text-slate-400 text-[10px]">Ganti User &darr;</span>
					</button>

					<!-- Dropdown Picker -->
					{#if showUserPicker}
						<div
							class="absolute z-30 mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
						>
							<div class="border-b border-slate-200 p-2 bg-slate-50">
								<div class="relative">
									<Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
									<input
										type="text"
										bind:value={searchUserQuery}
										placeholder="Ketik NIK atau Nama..."
										class="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-[#026cb6] focus:outline-none"
									/>
								</div>
							</div>

							<div class="max-h-48 overflow-y-auto divide-y divide-slate-100">
								{#each filteredPickerUsers as u}
									<button
										type="button"
										onclick={() => {
											selectedNik = u.nik;
											showUserPicker = false;
										}}
										class="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-sky-50 transition cursor-pointer {selectedNik ===
										u.nik
											? 'bg-sky-50/60 font-semibold'
											: ''}"
									>
										<div class="flex items-center gap-2">
											<span class="font-mono font-bold text-slate-700">{u.nik}</span>
											<span class="text-slate-800">{u.nama}</span>
										</div>
										<span class="text-[10px] text-slate-400">{u.role || '-'}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Selected User Context Card -->
			{#if selectedUserObj}
				<div
					class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3"
				>
					<div>
						<div class="text-[10px] text-slate-400 font-semibold uppercase">Subsidiary</div>
						<div class="font-medium text-slate-800 mt-0.5 line-clamp-1" title={selectedUserObj.subsidiary || ''}>
							{selectedUserObj.subsidiary || '-'}
						</div>
					</div>

					<div>
						<div class="text-[10px] text-slate-400 font-semibold uppercase">Jabatan / Role</div>
						<div class="font-medium text-slate-800 mt-0.5">
							{selectedUserObj.role || 'Standard User'}
						</div>
					</div>

					<div>
						<div class="text-[10px] text-slate-400 font-semibold uppercase">Status Akun</div>
						<div class="mt-0.5">
							{#if selectedUserObj.aktif === 'Ya'}
								<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
									Aktif (Ya)
								</span>
							{:else}
								<span class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
									Non-Aktif (Tidak)
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Password Inputs -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- Password Baru -->
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
						<span>Password Baru <span class="text-red-500">*</span></span>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="text-[11px] text-[#026cb6] hover:underline flex items-center gap-1 cursor-pointer"
						>
							{#if showPassword}
								<EyeOff class="h-3 w-3" /> Sembunyikan
							{:else}
								<Eye class="h-3 w-3" /> Tampilkan
							{/if}
						</button>
					</label>

					<div class="relative">
						<Lock class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={newPassword}
							placeholder="Masukkan password baru..."
							class="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
						/>
					</div>

					<!-- Password Strength Indicator -->
					{#if newPassword}
						<div class="mt-2 space-y-1">
							<div class="flex items-center justify-between text-[10px]">
								<span class="text-slate-500">Kekuatan:</span>
								<span class="font-semibold">{strength.label}</span>
							</div>
							<div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
								<div
									class="h-full transition-all duration-300 {strength.color}"
									style="width: {strength.score}%"
								></div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Konfirmasi Password Baru -->
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Konfirmasi Password Baru <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<Lock class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="Ulangi password baru..."
							class="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
						/>
					</div>

					{#if confirmPassword && confirmPassword !== newPassword}
						<span class="text-[10px] text-red-500 mt-1 block">Password tidak cocok!</span>
					{:else if confirmPassword && confirmPassword === newPassword}
						<span class="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
							<Check class="h-3 w-3" /> Password cocok
						</span>
					{/if}
				</div>
			</div>

			<!-- Option: Wajib Ganti Password di Login Pertama -->
			<div class="pt-2">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={requireChangeNextLogin}
						class="h-4 w-4 rounded border-slate-300 text-[#026cb6] focus:ring-[#026cb6]"
					/>
					<span class="text-xs text-slate-700">
						Wajib ubah kata sandi saat login berikutnya (Require password change on next login)
					</span>
				</label>
			</div>
		</div>

		<!-- Card Footer: Hot Action Button (APEX RESET_PASSWORD button) -->
		<div
			class="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4"
		>
			<button
				type="button"
				onclick={() => {
					newPassword = '';
					confirmPassword = '';
					errorBanner = '';
					successBanner = '';
				}}
				class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
			>
				Batal
			</button>

			<button
				type="button"
				onclick={handleResetPassword}
				class="flex items-center gap-2 rounded-lg bg-[#026cb6] px-5 py-2 text-xs font-bold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
			>
				<KeyRound class="h-3.5 w-3.5" />
				<span>RESET PASSWORD</span>
			</button>
		</div>
	</div>

	<!-- Recent Audit Log Table -->
	<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
		<div class="mb-3 flex items-center gap-2">
			<History class="h-4 w-4 text-slate-500" />
			<h4 class="text-xs font-bold text-slate-800">Riwayat Reset Password Terakhir</h4>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-slate-600">
				<thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
					<tr>
						<th class="px-3 py-2 w-28">Waktu Reset</th>
						<th class="px-3 py-2">Target User</th>
						<th class="px-3 py-2">Dilakukan Oleh</th>
						<th class="px-3 py-2 w-24 text-center">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each recentLogs as log}
						<tr class="hover:bg-slate-50 transition">
							<td class="px-3 py-2 font-mono text-[11px] text-slate-500">{log.time}</td>
							<td class="px-3 py-2 font-medium text-slate-800">{log.targetUser}</td>
							<td class="px-3 py-2 text-slate-600">{log.performedBy}</td>
							<td class="px-3 py-2 text-center">
								<span
									class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
								>
									<Check class="h-2.5 w-2.5" />
									{log.status}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
