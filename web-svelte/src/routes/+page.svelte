<script lang="ts">
	import InteractiveGrid from '$lib/apex/InteractiveGrid.svelte';
	import PivotMatrix from '$lib/apex/PivotMatrix.svelte';
	import DynamicActions from '$lib/apex/DynamicActions.svelte';
	import CalendarTimeline from '$lib/apex/CalendarTimeline.svelte';
	import AssetMapView from '$lib/apex/AssetMapView.svelte';
	import TreeView from '$lib/apex/TreeView.svelte';
	import FacetedSearch from '$lib/apex/FacetedSearch.svelte';
	import SignaturePad from '$lib/apex/SignaturePad.svelte';
	import CurrencyInput from '$lib/apex/CurrencyInput.svelte';
	import { exportBastPdf } from '$lib/utils/pdfExport';
	import {
		TableProperties,
		Grid3X3,
		Zap,
		Calendar,
		MapPin,
		FolderTree,
		FileSignature,
		Download,
		CheckCircle2
	} from 'lucide-svelte';

	type TabKey = 'grid' | 'pivot' | 'actions' | 'calendar' | 'map' | 'tree' | 'signature';

	let activeTab = $state<TabKey>('grid');

	// BAST Signature State
	let bastAmount = $state(28500000);
	let bastSigner = $state('Drs. Mukti Wibowo, M.Kom');
	let bastDocNo = $state('BAST-2026/X/0842');
	let bastSignature = $state('');
	let bastSuccess = $state(false);

	function generateBastPdf() {
		exportBastPdf({
			docNo: bastDocNo,
			date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
			partyOne: 'Kepala Bagian Pengelolaan Aset & Inventaris',
			partyTwo: bastSigner,
			items: [
				{ name: 'Server Rack Dell PowerEdge R750', code: 'SRV-2026-001', qty: 1, val: 24000000 },
				{ name: 'Cisco Catalyst 9200L 48-Port PoE+', code: 'NET-2026-042', qty: 1, val: 4500000 }
			],
			signatureImg: bastSignature || undefined
		});
		bastSuccess = true;
		setTimeout(() => (bastSuccess = false), 4000);
	}

	const tabs: Array<{ id: TabKey; label: string; icon: any }> = [
		{ id: 'grid', label: 'Interactive Grid', icon: TableProperties },
		{ id: 'pivot', label: 'Pivot Matrix', icon: Grid3X3 },
		{ id: 'actions', label: 'Dynamic Actions', icon: Zap },
		{ id: 'calendar', label: 'SLA Calendar & Timeline', icon: Calendar },
		{ id: 'map', label: 'GIS Campus Map', icon: MapPin },
		{ id: 'tree', label: 'Spatial Tree & Facets', icon: FolderTree },
		{ id: 'signature', label: 'Digital Sign & BAST', icon: FileSignature }
	];
</script>

<div class="flex flex-col gap-6">
	<!-- Module Tab Selector Bar -->
	<nav class="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5 shadow-xl backdrop-blur">
		{#each tabs as tab}
			{@const Icon = tab.icon}
			{@const isActive = activeTab === tab.id}
			<button
				type="button"
				onclick={() => (activeTab = tab.id)}
				class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition {isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Icon class="h-4 w-4" />
				<span>{tab.label}</span>
			</button>
		{/each}
	</nav>

	<!-- Active Tab Viewport -->
	<div class="w-full">
		{#if activeTab === 'grid'}
			<InteractiveGrid />
		{:else if activeTab === 'pivot'}
			<PivotMatrix />
		{:else if activeTab === 'actions'}
			<DynamicActions />
		{:else if activeTab === 'calendar'}
			<CalendarTimeline />
		{:else if activeTab === 'map'}
			<AssetMapView />
		{:else if activeTab === 'tree'}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<TreeView />
				<FacetedSearch />
			</div>
		{:else if activeTab === 'signature'}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Left Form -->
				<div class="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
					<div class="border-b border-slate-800 pb-3">
						<span class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
							FORM BAST RESMI
						</span>
						<h3 class="mt-2 text-base font-bold text-slate-100">Berita Acara Serah Terima Aset</h3>
						<p class="text-xs text-slate-400">Verifikasi fisik & pengesahan tanda tangan digital langsung ke dokumen cetak PDF</p>
					</div>

					<div class="flex flex-col gap-3 text-xs">
						<div class="flex flex-col gap-1">
							<label for="bast-docno" class="font-semibold text-slate-300">Nomor Registrasi Dokumen</label>
							<input
								id="bast-docno"
								type="text"
								bind:value={bastDocNo}
								class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-slate-200 focus:border-emerald-500 focus:outline-none"
							/>
						</div>

						<div class="flex flex-col gap-1">
							<label for="bast-signer" class="font-semibold text-slate-300">Nama Lengkap Pejabat Penerima</label>
							<input
								id="bast-signer"
								type="text"
								bind:value={bastSigner}
								class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
							/>
						</div>

						<div class="flex flex-col gap-1">
							<span class="font-semibold text-slate-300">Nilai Total Verifikasi (Auto IDR Mask)</span>
							<CurrencyInput bind:value={bastAmount} />
						</div>
					</div>

					<div class="mt-2 flex items-center justify-between pt-4 border-t border-slate-800">
						<button
							type="button"
							onclick={generateBastPdf}
							class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
						>
							<Download class="h-4 w-4" />
							<span>Cetak Dokumen BAST (PDF)</span>
						</button>

						{#if bastSuccess}
							<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
								<CheckCircle2 class="h-4 w-4" />
								<span>PDF Berhasil Diunduh!</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Signature Pad -->
				<div class="flex flex-col gap-4">
					<SignaturePad
						bind:signatureData={bastSignature}
						signerName={bastSigner}
						label="Bubuhkan Tanda Tangan Penerima"
					/>

					<div class="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400">
						<p class="font-semibold text-slate-300 mb-1">Ketentuan Keabsahan Tanda Tangan Digital:</p>
						<p>Goresan tanda tangan digital pada kanvas ini disematkan secara legal ke dalam slip BAST 1-halaman format A4 formal dengan cap watermark tanggal sistem dan checksum verifikasi.</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
