<script lang="ts">
	import { X, User, Mail, Shield, Building, Clock, Monitor, Key } from 'lucide-svelte';
	import type { PimsUser } from './types';

	let {
		user,
		onClose
	}: {
		user: PimsUser;
		onClose: () => void;
	} = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
	<div class="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
		<!-- Modal Header (APEX Redwood Theme) -->
		<div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#026cb6]/10 text-[#026cb6]">
					<User class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-base font-bold text-slate-900">Profil Saya</h3>
					<p class="text-xs text-slate-500 font-mono">Page 9998 • Harvest Cloud PIMS</p>
				</div>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Modal Body -->
		<div class="p-6 space-y-5 text-sm">
			<!-- User Avatar & Identity Banner -->
			<div class="flex items-center gap-4 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 p-4">
				<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#026cb6] font-bold text-white text-xl shadow-md shadow-[#026cb6]/20">
					{user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
				</div>
				<div>
					<h4 class="text-base font-bold text-slate-900">{user.fullName}</h4>
					<p class="font-mono text-xs text-[#026cb6] font-semibold">@{user.username}</p>
					<span class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
						Akun Aktif
					</span>
				</div>
			</div>

			<!-- User Attributes Grid -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
					<Mail class="h-4 w-4 text-slate-500 mt-0.5" />
					<div>
						<div class="text-[11px] font-medium text-slate-400">Email</div>
						<div class="font-semibold text-slate-800">{user.email}</div>
					</div>
				</div>

				<div class="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
					<Shield class="h-4 w-4 text-slate-500 mt-0.5" />
					<div>
						<div class="text-[11px] font-medium text-slate-400">Hak Akses / Peran</div>
						<div class="font-semibold text-slate-800">{user.role}</div>
					</div>
				</div>

				<div class="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
					<Building class="h-4 w-4 text-slate-500 mt-0.5" />
					<div>
						<div class="text-[11px] font-medium text-slate-400">Subsidiary / Kebun</div>
						<div class="font-semibold text-slate-800">{user.subsidiaryCode} - {user.subsidiaryName}</div>
					</div>
				</div>

				<div class="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
					<Monitor class="h-4 w-4 text-slate-500 mt-0.5" />
					<div>
						<div class="text-[11px] font-medium text-slate-400">IP Host Login</div>
						<div class="font-mono font-semibold text-slate-800">{user.ipAddress}</div>
					</div>
				</div>
			</div>

			<!-- Timestamp Info -->
			<div class="flex items-center gap-2 rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 text-xs text-amber-900">
				<Clock class="h-4 w-4 shrink-0 text-amber-600" />
				<span>Sesi aktif terdaftar sejak <strong>{user.lastLogin}</strong></span>
			</div>
		</div>

		<!-- Modal Footer -->
		<div class="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
			<button
				type="button"
				onclick={onClose}
				class="rounded-lg bg-[#026cb6] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#025691] cursor-pointer"
			>
				Tutup
			</button>
		</div>
	</div>
</div>
