<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type MapBuilding } from '$lib/api/client';
	import { MapPin, Building2, Search, RefreshCw, DollarSign, Layers, ExternalLink } from 'lucide-svelte';

	let buildings = $state<MapBuilding[]>([]);
	let loading = $state(false);
	let searchTerm = $state('');
	let selectedBuilding = $state<MapBuilding | null>(null);

	async function loadMapData() {
		loading = true;
		try {
			const res = await postRPC<MapBuilding[]>('/spatial/map');
			buildings = Array.isArray(res) ? res : [];
			if (buildings.length > 0 && !selectedBuilding) {
				selectedBuilding = buildings[0];
			}
		} catch (err) {
			console.error('Gagal mengambil data spasial kampus:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadMapData();
	});

	let filteredBuildings = $derived(
		buildings.filter(
			(b) =>
				b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				b.code.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	function formatRupiah(num: number | null | undefined): string {
		if (!num) return 'Rp 0';
		return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
	}
</script>

<div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
	<!-- Left: Interactive Campus SVG Floorplan / Geospatial Pins -->
	<div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur lg:col-span-2">
		<div class="flex items-center justify-between border-b border-slate-800 pb-3">
			<div class="flex items-center gap-2.5">
				<div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
					<MapPin class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-slate-100 uppercase tracking-wider">Peta GIS Kampus & Gedung Aset</h3>
					<p class="text-xs text-slate-400">Distribusi aset fisik terdaftar pada koordinat spasial</p>
				</div>
			</div>

			<button
				type="button"
				onclick={loadMapData}
				disabled={loading}
				class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>
		</div>

		<!-- SVG Campus Map Schematic -->
		<div class="relative flex h-[480px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950">
			<!-- Subtle Grid pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

			<!-- Campus Layout Roads & Grounds -->
			<svg viewBox="0 0 800 500" class="h-full w-full select-none">
				<!-- Outer Campus Ring Road -->
				<rect x="50" y="50" width="700" height="400" rx="40" fill="none" stroke="#1e293b" stroke-width="2" stroke-dasharray="8 8" />
				<circle cx="400" cy="250" r="120" fill="none" stroke="#1e293b" stroke-width="1.5" />

				<!-- Building Nodes plotted relative to sample campus coordinates -->
				{#each buildings as b, idx}
					{@const cx = 150 + ((idx * 160) % 520)}
					{@const cy = 120 + ((idx * 110) % 280)}
					{@const isSelected = selectedBuilding?.id === b.id}

					<!-- Connecting subtle lines -->
					<line x1="400" y1="250" x2={cx} y2={cy} stroke="#334155" stroke-width="0.8" stroke-dasharray="4 4" />

					<!-- Node circle with pulse if selected -->
					<g class="cursor-pointer transition duration-200" onclick={() => (selectedBuilding = b)}>
						{#if isSelected}
							<circle cx={cx} cy={cy} r="28" fill="#10b981" fill-opacity="0.15" class="animate-ping" />
							<circle cx={cx} cy={cy} r="24" fill="#059669" fill-opacity="0.3" />
						{/if}

						<rect
							x={cx - 45}
							y={cy - 25}
							width="90"
							height="50"
							rx="8"
							fill={isSelected ? '#064e3b' : '#0f172a'}
							stroke={isSelected ? '#10b981' : '#334155'}
							stroke-width={isSelected ? '2' : '1'}
							class="hover:stroke-emerald-400 transition"
						/>

						<text x={cx} y={cy - 5} fill={isSelected ? '#ecfdf5' : '#e2e8f0'} font-size="11" font-weight="bold" text-anchor="middle">
							{b.code}
						</text>
						<text x={cx} y={cy + 12} fill="#94a3b8" font-size="9" text-anchor="middle">
							{b.asset_count} Aset
						</text>
					</g>
				{/each}
			</svg>

			<div class="pointer-events-none absolute bottom-3 left-4 rounded-md bg-slate-900/90 px-3 py-1 text-[11px] font-mono text-slate-400 border border-slate-800">
				Sistem Koordinat WGS84: UTM Zone 48S (Lokal Kampus)
			</div>
		</div>
	</div>

	<!-- Right: Building Directory & Inspector Panel -->
	<div class="flex flex-col gap-4">
		<!-- Search Directory -->
		<div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
			<div class="relative">
				<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Cari gedung / kode..."
					class="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
				/>
			</div>

			<div class="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
				{#each filteredBuildings as b}
					{@const isSelected = selectedBuilding?.id === b.id}
					<button
						type="button"
						onclick={() => (selectedBuilding = b)}
						class="flex items-center justify-between rounded-lg border p-2.5 text-left transition {isSelected ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200' : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:bg-slate-800/50'}"
					>
						<div class="flex items-center gap-2">
							<Building2 class="h-4 w-4 {isSelected ? 'text-emerald-400' : 'text-slate-500'}" />
							<div>
								<p class="text-xs font-semibold">{b.name}</p>
								<span class="font-mono text-[10px] text-slate-500">{b.code}</span>
							</div>
						</div>
						<span class="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
							{b.asset_count}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Building Detail Inspector -->
		{#if selectedBuilding}
			<div class="flex flex-col gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
				<div class="border-b border-slate-800 pb-3">
					<span class="font-mono text-xs font-semibold text-emerald-400">{selectedBuilding.code}</span>
					<h4 class="text-base font-bold text-slate-100">{selectedBuilding.name}</h4>
					<p class="text-xs text-slate-400 mt-0.5">{selectedBuilding.address || 'Kompleks Kampus Utama'}</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
						<span class="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Populasi Aset</span>
						<p class="mt-1 font-mono text-lg font-bold text-slate-100">{selectedBuilding.asset_count}</p>
						<span class="text-[10px] text-slate-500">Unit terdaftar</span>
					</div>

					<div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
						<span class="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Total Nilai Buku</span>
						<p class="mt-1 font-mono text-sm font-bold text-emerald-400 truncate">{formatRupiah(selectedBuilding.total_value)}</p>
						<span class="text-[10px] text-slate-500">Valuasi aset</span>
					</div>
				</div>

				<div class="flex flex-col gap-1.5 text-xs text-slate-400">
					<div class="flex justify-between">
						<span>Koordinat Lintang:</span>
						<span class="font-mono text-slate-200">{selectedBuilding.lat ?? '-6.2088'}</span>
					</div>
					<div class="flex justify-between">
						<span>Koordinat Bujur:</span>
						<span class="font-mono text-slate-200">{selectedBuilding.lng ?? '106.8456'}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
