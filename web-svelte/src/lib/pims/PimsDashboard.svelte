<script lang="ts">
	import {
		Calendar,
		TrendingUp,
		Users,
		Truck,
		CheckCircle2,
		Clock,
		AlertTriangle,
		ArrowUpRight,
		FileSpreadsheet,
		ChevronRight,
		Layers,
		Sparkles
	} from 'lucide-svelte';

	let {
		onSelectMenu
	}: {
		onSelectMenu: (label: string) => void;
	} = $props();

	const kpiData = [
		{
			title: 'Total Produksi Panen',
			value: '184.250 Kg',
			subtext: '+12.4% di atas target harian (164 Ton)',
			icon: TrendingUp,
			color: 'text-emerald-600',
			bg: 'bg-emerald-50',
			border: 'border-emerald-100'
		},
		{
			title: 'Task Order (TO) Aktif',
			value: '38 TO Berjalan',
			subtext: '4 Afdeling (Kebun Palembang)',
			icon: Clock,
			color: 'text-[#026cb6]',
			bg: 'bg-sky-50',
			border: 'border-sky-100'
		},
		{
			title: 'Tenaga Kerja Hadir',
			value: '142 Pemanen',
			subtext: '98.6% tingkat kehadiran mandor & krani',
			icon: Users,
			color: 'text-indigo-600',
			bg: 'bg-indigo-50',
			border: 'border-indigo-100'
		},
		{
			title: 'Balance Restan TPH',
			value: '1.420 Kg',
			subtext: 'Aman (<1% total panen), siap angkut PKS',
			icon: Truck,
			color: 'text-amber-600',
			bg: 'bg-amber-50',
			border: 'border-amber-100'
		}
	];

	const recentTOs = [
		{ id: 'TO-2026-10-0891', afdeling: 'Afdeling I', blok: 'Blok A12', targetKg: '24.000', realisasiKg: '26.450', mandor: 'Hasan Basri', status: 'Selesai' },
		{ id: 'TO-2026-10-0892', afdeling: 'Afdeling I', blok: 'Blok A14', targetKg: '22.000', realisasiKg: '21.800', mandor: 'Supardi', status: 'Selesai' },
		{ id: 'TO-2026-10-0893', afdeling: 'Afdeling II', blok: 'Blok B05', targetKg: '30.000', realisasiKg: '32.100', mandor: 'Ahmad Yani', status: 'Selesai' },
		{ id: 'TO-2026-10-0894', afdeling: 'Afdeling II', blok: 'Blok B08', targetKg: '28.000', realisasiKg: '28.900', mandor: 'Bambang Irawan', status: 'Verifikasi' },
		{ id: 'TO-2026-10-0895', afdeling: 'Afdeling III', blok: 'Blok C02', targetKg: '35.000', realisasiKg: '36.200', mandor: 'Zulkifli', status: 'In Progress' },
		{ id: 'TO-2026-10-0896', afdeling: 'Afdeling IV', blok: 'Blok D11', targetKg: '25.000', realisasiKg: '24.800', mandor: 'Dedi Kurniawan', status: 'In Progress' }
	];
</script>

<div class="space-y-6">
	<!-- Banner Sambutan Harvest Cloud -->
	<div class="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-amber-50/40 p-6 shadow-sm">
		<div class="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full bg-[#026cb6]/10 px-3 py-1 text-xs font-semibold text-[#026cb6]">
					<Sparkles class="h-3.5 w-3.5" />
					<span>Plantation Operational Command Dashboard</span>
				</div>
				<h2 class="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
					Selamat Datang di Harvest Cloud PIMS
				</h2>
				<p class="mt-1 text-xs text-slate-500 max-w-2xl">
					Monitoring operasional harian panen kelapa sawit, task order, kalkulasi insentif mandor, dan sinkronisasi data master kebun secara real-time.
				</p>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => onSelectMenu('TO Plan')}
					class="inline-flex items-center gap-2 rounded-lg bg-[#026cb6] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#025691] cursor-pointer"
				>
					<Calendar class="h-3.5 w-3.5" />
					<span>Buka TO Plan</span>
				</button>
				<button
					type="button"
					onclick={() => onSelectMenu('Generate Insentif Panen')}
					class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
				>
					<FileSpreadsheet class="h-3.5 w-3.5 text-emerald-600" />
					<span>Insentif Panen</span>
				</button>
			</div>
		</div>
	</div>

	<!-- KPI Metric Cards Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each kpiData as kpi}
			{@const KpiIcon = kpi.icon}
			<div class="rounded-xl border {kpi.border} bg-white p-5 shadow-xs transition hover:shadow-md">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-slate-500">{kpi.title}</span>
					<div class="flex h-9 w-9 items-center justify-center rounded-lg {kpi.bg} {kpi.color}">
						<KpiIcon class="h-5 w-5" />
					</div>
				</div>
				<div class="mt-3">
					<div class="text-2xl font-bold tracking-tight text-slate-900">{kpi.value}</div>
					<div class="mt-1 text-[11px] text-slate-500 font-medium">{kpi.subtext}</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Quick Launchpad Shortcut Modules -->
	<div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h3 class="text-sm font-bold text-slate-900">Modul Operasional Unggulan PIMS</h3>
				<p class="text-xs text-slate-400">Pintasan cepat navigasi ke form dan laporan paling sering digunakan</p>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
			{#each [
				{ label: 'TO Plan', desc: 'Perencanaan Harian', icon: 'fa fa-calendar-month' },
				{ label: 'TO Result', desc: 'Realisasi & Timbang', icon: 'fa fa-calendar-month' },
				{ label: 'Daily Check', desc: 'Pemeriksaan Alat', icon: 'fa fa-gears' },
				{ label: 'BJR (Berat Janjang Rata-rata)', desc: 'Kalkulasi BJR', icon: 'fa fa-folders' },
				{ label: 'Generate Insentif Panen', desc: 'Premi Mandor/Pemanen', icon: 'fa fa-folders' },
				{ label: 'Activity per Block', desc: 'Laporan per Blok', icon: 'fa fa-list-alt' }
			] as item}
				<button
					type="button"
					onclick={() => onSelectMenu(item.label)}
					class="group flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-center transition hover:border-[#026cb6]/40 hover:bg-sky-50/50 hover:shadow-xs cursor-pointer"
				>
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#026cb6] shadow-xs group-hover:scale-110 transition">
						<Layers class="h-5 w-5" />
					</div>
					<span class="mt-2 text-xs font-bold text-slate-800 group-hover:text-[#026cb6] transition">{item.label}</span>
					<span class="mt-0.5 text-[10px] text-slate-400">{item.desc}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Real-Time Task Order (TO) Monitoring Table -->
	<div class="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
		<div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
			<div>
				<h3 class="text-sm font-bold text-slate-900">Monitoring Realisasi Task Order (TO) Terkini</h3>
				<p class="text-xs text-slate-500 font-mono">Status operasional Afdeling I - IV per 31 Oktober 2026</p>
			</div>
			<button
				type="button"
				onclick={() => onSelectMenu('TO Result')}
				class="inline-flex items-center gap-1 text-xs font-semibold text-[#026cb6] hover:underline cursor-pointer"
			>
				<span>Lihat Semua Realisasi</span>
				<ChevronRight class="h-3.5 w-3.5" />
			</button>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="border-b border-slate-200 bg-slate-100/70 font-semibold text-slate-600">
					<tr>
						<th class="px-6 py-3">No. Task Order</th>
						<th class="px-6 py-3">Afdeling</th>
						<th class="px-6 py-3">Blok</th>
						<th class="px-6 py-3 text-right">Target (Kg)</th>
						<th class="px-6 py-3 text-right">Realisasi (Kg)</th>
						<th class="px-6 py-3">Mandor Lapangan</th>
						<th class="px-6 py-3 text-center">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-700">
					{#each recentTOs as row}
						<tr class="hover:bg-slate-50/80 transition">
							<td class="px-6 py-3 font-mono font-semibold text-[#026cb6]">{row.id}</td>
							<td class="px-6 py-3 font-medium">{row.afdeling}</td>
							<td class="px-6 py-3 font-mono">{row.blok}</td>
							<td class="px-6 py-3 text-right font-mono">{row.targetKg}</td>
							<td class="px-6 py-3 text-right font-mono font-bold text-slate-900">{row.realisasiKg}</td>
							<td class="px-6 py-3">{row.mandor}</td>
							<td class="px-6 py-3 text-center">
								{#if row.status === 'Selesai'}
									<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
										<CheckCircle2 class="h-3 w-3" />
										Selesai
									</span>
								{:else if row.status === 'Verifikasi'}
									<span class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#026cb6] border border-sky-200">
										<Clock class="h-3 w-3" />
										Verifikasi
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
										<Clock class="h-3 w-3" />
										In Progress
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
