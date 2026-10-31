<script lang="ts">
	import {
		Users,
		FolderTree,
		ShieldCheck,
		GitCommit,
		KeyRound,
		ArrowRight,
		Sliders,
		CheckCircle2,
		Sparkles
	} from 'lucide-svelte';

	let {
		onSelectSubmenu
	}: {
		onSelectSubmenu: (label: string) => void;
	} = $props();

	const modules = [
		{
			title: 'SETUP Informasi User',
			desc: 'Pengelolaan data master akun pengguna, employee NIK, subsidiary assignments, peran sistem, dan status aktif.',
			page: 'Page 160 &bull; Page 432',
			stat: '761 Pengguna',
			icon: Users,
			color: 'text-blue-600 bg-blue-50 border-blue-200',
			badge: 'Master User'
		},
		{
			title: 'SETUP Menu User',
			desc: 'Konfigurasi struktur navigasi menu bertingkat, penamaan menu, mapping link halaman APEX, nomor urutan, dan ikon.',
			page: 'Page 161 &bull; Page 453',
			stat: '269 Menu Item',
			icon: FolderTree,
			color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
			badge: 'Navigation'
		},
		{
			title: 'SETUP Akses Halaman',
			desc: 'Manajemen hak akses role (C02) dan matriks izin per modul (Lihat, Tambah, Ubah, Hapus, dan Approval).',
			page: 'Page 162',
			stat: '26 Role Terdaftar',
			icon: ShieldCheck,
			color: 'text-purple-600 bg-purple-50 border-purple-200',
			badge: 'Role Management'
		},
		{
			title: 'SETUP Approval Hierarchy',
			desc: 'Hierarki alur persetujuan bertingkat (Level 1 hingga Level 4) untuk Task Order Result, Special TO, dan Afdeling.',
			page: 'Page 163',
			stat: '48 Routing Rules',
			icon: GitCommit,
			color: 'text-amber-600 bg-amber-50 border-amber-200',
			badge: 'Sequential Flow'
		},
		{
			title: 'Reset Password',
			desc: 'Fasilitas pengaturan ulang kata sandi pengguna secara terpusat dengan opsi wajib ubah saat login berikutnya.',
			page: 'Page 164',
			stat: 'Security Core',
			icon: KeyRound,
			color: 'text-rose-600 bg-rose-50 border-rose-200',
			badge: 'Security'
		}
	];
</script>

<div class="space-y-6">
	<!-- Hero Overview Banner -->
	<div
		class="relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-[#026cb6]/10 via-white to-sky-50 p-6 shadow-2xs"
	>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<Sliders class="h-5 w-5 text-[#026cb6]" />
					<h2 class="text-lg font-bold text-slate-900">Modul Konfigurasi Setup</h2>
					<span class="rounded-full bg-[#026cb6] px-2.5 py-0.5 text-[10px] font-bold text-white">
						Oracle APEX Clone
					</span>
				</div>
				<p class="text-xs text-slate-600 max-w-2xl">
					Pusat administrasi konfigurasi sistem Harvest Cloud PIMS: hak akses pengguna, pemetaan menu hierarkis, matriks izin peran, struktur persetujuan bertingkat, dan kredensial keamanan.
				</p>
			</div>

			<div class="flex items-center gap-2">
				<span
					class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs"
				>
					<CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" />
					<span>5 Sub-Modul Aktif</span>
				</span>
			</div>
		</div>
	</div>

	<!-- 5 Modules Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each modules as m}
			{@const Icon = m.icon}
			<div
				class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:shadow-md hover:border-slate-300"
			>
				<div>
					<div class="flex items-start justify-between mb-3">
						<div
							class="flex h-11 w-11 items-center justify-center rounded-xl border {m.color}"
						>
							<Icon class="h-5 w-5" />
						</div>

						<span
							class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700"
						>
							{m.badge}
						</span>
					</div>

					<h3 class="text-sm font-bold text-slate-900 mb-1">{m.title}</h3>
					<p class="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
						{m.desc}
					</p>
				</div>

				<div class="border-t border-slate-100 pt-3">
					<div class="flex items-center justify-between mb-3">
						<span class="text-[11px] font-mono text-slate-400">{@html m.page}</span>
						<span class="text-xs font-bold text-slate-700">{m.stat}</span>
					</div>

					<button
						type="button"
						onclick={() => onSelectSubmenu(m.title)}
						class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#026cb6]/10 px-3 py-2 text-xs font-bold text-[#026cb6] hover:bg-[#026cb6] hover:text-white transition cursor-pointer"
					>
						<span>Buka Modul</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
