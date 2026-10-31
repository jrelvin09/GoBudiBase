<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchRuntimeApp, type RuntimeApp, type RuntimePage, type RuntimeComponent } from '$lib/api/builderClient';
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
		Layers,
		FileText,
		Edit3,
		RefreshCw,
		AlertCircle,
		Download,
		CheckCircle2,
		Sparkles
	} from 'lucide-svelte';

	let {
		appSlug = 'bmn-enterprise',
		onOpenStudio
	}: {
		appSlug?: string;
		onOpenStudio?: () => void;
	} = $props();

	let runtimeApp = $state<RuntimeApp | null>(null);
	let activePageSlug = $state<string>('');
	let loading = $state(false);
	let error = $state<string>('');

	// BAST Signature state for signature_bast components
	let bastAmount = $state(28500000);
	let bastSigner = $state('Drs. Mukti Wibowo, M.Kom');
	let bastDocNo = $state('BAST-2026/X/0842');
	let bastSignature = $state('');
	let bastSuccess = $state(false);

	async function loadRuntime() {
		loading = true;
		error = '';
		try {
			const data = await fetchRuntimeApp(appSlug);
			runtimeApp = data;
			if (data.pages && data.pages.length > 0) {
				const homePage = data.pages.find((p) => p.is_home) || data.pages[0];
				activePageSlug = homePage.slug;
			}
		} catch (e: any) {
			error = e.message || 'Gagal memuat aplikasi low-code runtime';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadRuntime();
	});

	const activePage = $derived<RuntimePage | null>(
		runtimeApp?.pages?.find((p) => p.slug === activePageSlug) || runtimeApp?.pages?.[0] || null
	);

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
</script>

<div class="flex flex-col gap-6">
	<!-- Top Runtime Header -->
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-bold text-white shadow-lg shadow-emerald-500/20">
				GB
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
						{runtimeApp?.app?.name || 'Loading Enterprise App...'}
					</h2>
					<span class="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
						RUNTIME v{runtimeApp?.app?.version || '1.0.0'}
					</span>
				</div>
				<p class="text-[11px] text-slate-400">
					{runtimeApp?.app?.description || 'Aplikasi Enterprise Low-Code'}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if onOpenStudio}
				<button
					type="button"
					onclick={onOpenStudio}
					class="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow"
				>
					<Edit3 class="h-3.5 w-3.5 text-emerald-400" />
					<span>Buka di Studio Builder</span>
				</button>
			{/if}

			<button
				type="button"
				onclick={loadRuntime}
				disabled={loading}
				class="rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
				title="Refresh Runtime Metadata"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>

	<!-- Dynamic Page Tabs Navbar -->
	{#if runtimeApp?.pages && runtimeApp.pages.length > 0}
		<nav class="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5 shadow-xl backdrop-blur">
			{#each runtimeApp.pages as page}
				{@const isActive = activePageSlug === page.slug}
				<button
					type="button"
					onclick={() => (activePageSlug = page.slug)}
					class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition {isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
				>
					<FileText class="h-4 w-4" />
					<span>{page.title}</span>
				</button>
			{/each}
		</nav>
	{/if}

	<!-- Dynamic Page Content Canvas -->
	{#if loading && !runtimeApp}
		<div class="flex h-64 items-center justify-center text-sm text-slate-500">
			<RefreshCw class="mr-2 h-5 w-5 animate-spin text-emerald-500" />
			Memuat runtime aplikasi...
		</div>
	{:else if error}
		<div class="flex h-64 flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-400">
			<AlertCircle class="h-8 w-8 mb-2" />
			<p class="text-sm font-semibold">{error}</p>
		</div>
	{:else if activePage}
		{#if activePage.components.length === 0}
			<div class="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
				<Sparkles class="h-10 w-10 text-slate-600 mb-2" />
				<h4 class="text-sm font-bold text-slate-300">Halaman "{activePage.title}" Kosong</h4>
				<p class="text-xs text-slate-500 mt-1">Buka di Studio / Page Designer untuk menambahkan komponen data ke halaman ini.</p>
				{#if onOpenStudio}
					<button
						type="button"
						onclick={onOpenStudio}
						class="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow"
					>
						<Edit3 class="h-3.5 w-3.5" />
						<span>Buka Page Designer</span>
					</button>
				{/if}
			</div>
		{:else}
			<!-- Dynamic Component Renderer by Layout Type -->
			<div class="flex flex-col gap-6">
				{#if activePage.layout === 'split-2'}
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{#each activePage.components as comp}
							<div class="w-full">
								{#if comp.type === 'interactive_grid'}
									<InteractiveGrid />
								{:else if comp.type === 'pivot_matrix'}
									<PivotMatrix />
								{:else if comp.type === 'calendar_timeline'}
									<CalendarTimeline />
								{:else if comp.type === 'asset_map'}
									<AssetMapView />
								{:else if comp.type === 'tree_view'}
									<TreeView />
								{:else if comp.type === 'faceted_search'}
									<FacetedSearch />
								{:else if comp.type === 'dynamic_actions'}
									<DynamicActions />
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<!-- Single Column / Stacked Components -->
					<div class="flex flex-col gap-6">
						{#each activePage.components as comp}
							<div class="w-full">
								{#if comp.type === 'interactive_grid'}
									<InteractiveGrid />
								{:else if comp.type === 'pivot_matrix'}
									<PivotMatrix />
								{:else if comp.type === 'calendar_timeline'}
									<CalendarTimeline />
								{:else if comp.type === 'asset_map'}
									<AssetMapView />
								{:else if comp.type === 'tree_view'}
									<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
										<TreeView />
										<FacetedSearch />
									</div>
								{:else if comp.type === 'faceted_search'}
									<FacetedSearch />
								{:else if comp.type === 'dynamic_actions'}
									<DynamicActions />
								{:else if comp.type === 'signature_bast'}
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
													<label for="rt-docno" class="font-semibold text-slate-300">Nomor Registrasi Dokumen</label>
													<input
														id="rt-docno"
														type="text"
														bind:value={bastDocNo}
														class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-slate-200 focus:border-emerald-500 focus:outline-none"
													/>
												</div>

												<div class="flex flex-col gap-1">
													<label for="rt-signer" class="font-semibold text-slate-300">Nama Lengkap Pejabat Penerima</label>
													<input
														id="rt-signer"
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
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
