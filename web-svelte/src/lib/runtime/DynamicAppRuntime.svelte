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
	import KanbanBoard from '$lib/apex/KanbanBoard.svelte';
	import ShuttleSelector from '$lib/apex/ShuttleSelector.svelte';
	import PopupLovDemo from '$lib/apex/PopupLovDemo.svelte';
	import { catalog } from '$lib/kit/catalog';
	import { exportBastPdf } from '$lib/utils/pdfExport';
	import {
		Layers,
		FileText,
		Edit3,
		RefreshCw,
		AlertCircle,
		AlertTriangle,
		Download,
		CheckCircle2,
		Sparkles
	} from 'lucide-svelte';

	let {
		appSlug = 'bmn-enterprise',
		initialPageSlug = '',
		onOpenStudio
	}: {
		appSlug?: string;
		initialPageSlug?: string;
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
				const preferredPage = initialPageSlug ? data.pages.find((p) => p.slug === initialPageSlug) : null;
				const homePage = preferredPage || data.pages.find((p) => p.is_home) || data.pages[0];
				activePageSlug = homePage.slug;
			}
		} catch (e: any) {
			error = e.message || 'Gagal memuat aplikasi low-code runtime';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (initialPageSlug && runtimeApp?.pages?.some((p) => p.slug === initialPageSlug)) {
			activePageSlug = initialPageSlug;
		}
	});

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
									<InteractiveGrid title={comp.props?.title || comp.name} />
								{:else if comp.type === 'kanban_board' || comp.type === 'kanban'}
									<KanbanBoard title={comp.props?.title || comp.name} />
								{:else if comp.type === 'shuttle_selector' || comp.type === 'shuttle'}
									<ShuttleSelector title={comp.props?.title || comp.name} />
								{:else if comp.type === 'popup_lov'}
									<PopupLovDemo title={comp.props?.title || comp.name} />
								{:else if comp.type === 'pivot_matrix'}
									<PivotMatrix title={comp.props?.title || comp.name} />
								{:else if comp.type === 'calendar_timeline'}
									<CalendarTimeline title={comp.props?.title || comp.name} />
								{:else if comp.type === 'asset_map'}
									<AssetMapView title={comp.props?.title || comp.name} />
								{:else if comp.type === 'tree_view'}
									<TreeView title={comp.props?.title || comp.name} />
								{:else if comp.type === 'faceted_search'}
									<FacetedSearch />
								{:else if comp.type === 'dynamic_actions'}
									<DynamicActions title={comp.props?.title || comp.name} />
								{:else if comp.type === 'button' || comp.type === 'kit:button'}
									<div class="py-2 flex items-center">
										<button
											type="button"
											class="rounded-xl px-6 py-2.5 font-bold text-sm text-white shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer {comp.props?.variant === 'danger' || comp.props?.variant === 'destructive' ? 'bg-rose-600 hover:bg-rose-500' : comp.props?.variant === 'secondary' ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200' : comp.props?.variant === 'outline' ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-500'}"
											onclick={() => alert(`Aksi Tombol "${comp.props?.title || comp.name}" dijalankan!`)}
										>
											{comp.props?.title || comp.name || 'Button'}
										</button>
									</div>
								{:else if comp.type === 'badge' || comp.type === 'kit:badge'}
									<div class="py-2 flex items-center">
										<span class="rounded-full px-3.5 py-1 text-xs font-bold {comp.props?.variant === 'destructive' || comp.props?.variant === 'danger' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : comp.props?.variant === 'secondary' ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
											{comp.props?.title || comp.name || 'Badge'}
										</span>
									</div>
								{:else if comp.type === 'input' || comp.type === 'kit:input' || comp.type === 'kit:text-item'}
									<div class="flex flex-col gap-1.5 max-w-md py-2">
										<label class="text-xs font-semibold text-slate-300">{comp.props?.title || comp.name || 'Input'}</label>
										<input
											type="text"
											placeholder={comp.props?.placeholder || 'Masukkan teks di sini...'}
											class="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
										/>
									</div>
								{:else if comp.type === 'label' || comp.type === 'kit:label' || comp.type === 'kit:typography'}
									<div class="py-2">
										<h4 class="text-sm font-semibold text-slate-200">{comp.props?.title || comp.name || 'Label Text'}</h4>
									</div>
								{:else if comp.type === 'checkbox' || comp.type === 'kit:checkbox'}
									<div class="py-2 flex items-center gap-2.5">
										<input type="checkbox" id={`chk-${comp.id}`} class="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer" />
										<label for={`chk-${comp.id}`} class="text-xs font-medium text-slate-200 cursor-pointer">{comp.props?.title || comp.name}</label>
									</div>
								{:else if comp.type === 'switch' || comp.type === 'kit:switch'}
									<div class="py-2 flex items-center gap-3">
										<input type="checkbox" role="switch" class="h-5 w-9 rounded-full border-slate-700 bg-slate-900 text-emerald-500 cursor-pointer" />
										<span class="text-xs font-medium text-slate-200">{comp.props?.title || comp.name}</span>
									</div>
								{:else if comp.type === 'card' || comp.type === 'kit:card'}
									<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
										<h3 class="text-sm font-bold text-slate-100 mb-1">{comp.props?.title || comp.name}</h3>
										<p class="text-xs text-slate-400">Wadah kartu untuk mengelompokkan elemen form.</p>
									</div>
								{:else if comp.type === 'alert' || comp.type === 'kit:alert'}
									<div class="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
										<AlertTriangle class="h-5 w-5 text-amber-400 shrink-0" />
										<div>
											<strong class="font-bold block text-amber-300">{comp.props?.title || comp.name}</strong>
											<span class="text-amber-200/80">Informasi atau notifikasi penting pada form ini.</span>
										</div>
									</div>
								{:else if comp.type.startsWith('kit:') || catalog.some(c => c.id === comp.type)}
									{@const kitId = comp.type.startsWith('kit:') ? comp.type.slice(4) : comp.type}
									{@const entry = catalog.find((c) => c.id === kitId)}
									<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
										<div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
											<div class="flex items-center gap-2">
												<span class="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase">
													{entry?.tier || 'UI KIT'}
												</span>
												<h3 class="text-xs font-bold text-slate-100">{comp.props?.title || comp.name}</h3>
											</div>
											<span class="font-mono text-[10px] text-slate-500">{kitId}</span>
										</div>
										{#if entry?.load}
											{#await entry.load()}
												<div class="flex h-28 items-center justify-center text-xs text-slate-500">
													<div class="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mr-2"></div>
													<span>Memuat {comp.props?.title || comp.name}...</span>
												</div>
											{:then loaded}
												{@const DemoComp = loaded.default}
												<div class="kit-demo-container">
													<DemoComp />
												</div>
											{:catch err}
												<div class="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
													Gagal memuat komponen: {err.message}
												</div>
											{/await}
										{:else}
											<div class="text-xs text-slate-400">
												[ Region Komponen: {comp.props?.title || comp.name} ]
											</div>
										{/if}
									</div>
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
									<InteractiveGrid title={comp.props?.title || comp.name} />
								{:else if comp.type === 'kanban_board' || comp.type === 'kanban'}
									<KanbanBoard title={comp.props?.title || comp.name} />
								{:else if comp.type === 'shuttle_selector' || comp.type === 'shuttle'}
									<ShuttleSelector title={comp.props?.title || comp.name} />
								{:else if comp.type === 'popup_lov'}
									<PopupLovDemo title={comp.props?.title || comp.name} />
								{:else if comp.type === 'pivot_matrix'}
									<PivotMatrix title={comp.props?.title || comp.name} />
								{:else if comp.type === 'calendar_timeline'}
									<CalendarTimeline title={comp.props?.title || comp.name} />
								{:else if comp.type === 'asset_map'}
									<AssetMapView title={comp.props?.title || comp.name} />
								{:else if comp.type === 'tree_view'}
									<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
										<TreeView title={comp.props?.title || comp.name} />
										<FacetedSearch />
									</div>
								{:else if comp.type === 'faceted_search'}
									<FacetedSearch />
								{:else if comp.type === 'dynamic_actions'}
									<DynamicActions title={comp.props?.title || comp.name} />
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
								{:else if comp.type === 'button' || comp.type === 'kit:button'}
									<div class="py-2 flex items-center">
										<button
											type="button"
											class="rounded-xl px-6 py-2.5 font-bold text-sm text-white shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer {comp.props?.variant === 'danger' || comp.props?.variant === 'destructive' ? 'bg-rose-600 hover:bg-rose-500' : comp.props?.variant === 'secondary' ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200' : comp.props?.variant === 'outline' ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-500'}"
											onclick={() => alert(`Aksi Tombol "${comp.props?.title || comp.name}" dijalankan!`)}
										>
											{comp.props?.title || comp.name || 'Button'}
										</button>
									</div>
								{:else if comp.type === 'badge' || comp.type === 'kit:badge'}
									<div class="py-2 flex items-center">
										<span class="rounded-full px-3.5 py-1 text-xs font-bold {comp.props?.variant === 'destructive' || comp.props?.variant === 'danger' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : comp.props?.variant === 'secondary' ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
											{comp.props?.title || comp.name || 'Badge'}
										</span>
									</div>
								{:else if comp.type === 'input' || comp.type === 'kit:input' || comp.type === 'kit:text-item'}
									<div class="flex flex-col gap-1.5 max-w-md py-2">
										<label class="text-xs font-semibold text-slate-300">{comp.props?.title || comp.name || 'Input'}</label>
										<input
											type="text"
											placeholder={comp.props?.placeholder || 'Masukkan teks di sini...'}
											class="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
										/>
									</div>
								{:else if comp.type === 'label' || comp.type === 'kit:label' || comp.type === 'kit:typography'}
									<div class="py-2">
										<h4 class="text-sm font-semibold text-slate-200">{comp.props?.title || comp.name || 'Label Text'}</h4>
									</div>
								{:else if comp.type === 'checkbox' || comp.type === 'kit:checkbox'}
									<div class="py-2 flex items-center gap-2.5">
										<input type="checkbox" id={`chk-${comp.id}`} class="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer" />
										<label for={`chk-${comp.id}`} class="text-xs font-medium text-slate-200 cursor-pointer">{comp.props?.title || comp.name}</label>
									</div>
								{:else if comp.type === 'switch' || comp.type === 'kit:switch'}
									<div class="py-2 flex items-center gap-3">
										<input type="checkbox" role="switch" class="h-5 w-9 rounded-full border-slate-700 bg-slate-900 text-emerald-500 cursor-pointer" />
										<span class="text-xs font-medium text-slate-200">{comp.props?.title || comp.name}</span>
									</div>
								{:else if comp.type === 'card' || comp.type === 'kit:card'}
									<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
										<h3 class="text-sm font-bold text-slate-100 mb-1">{comp.props?.title || comp.name}</h3>
										<p class="text-xs text-slate-400">Wadah kartu untuk mengelompokkan elemen form.</p>
									</div>
								{:else if comp.type === 'alert' || comp.type === 'kit:alert'}
									<div class="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
										<AlertTriangle class="h-5 w-5 text-amber-400 shrink-0" />
										<div>
											<strong class="font-bold block text-amber-300">{comp.props?.title || comp.name}</strong>
											<span class="text-amber-200/80">Informasi atau notifikasi penting pada form ini.</span>
										</div>
									</div>
								{:else if comp.type.startsWith('kit:') || catalog.some(c => c.id === comp.type)}
									{@const kitId = comp.type.startsWith('kit:') ? comp.type.slice(4) : comp.type}
									{@const entry = catalog.find((c) => c.id === kitId)}
									<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
										<div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
											<div class="flex items-center gap-2.5">
												<span class="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase">
													{entry?.tier || 'UI KIT'}
												</span>
												<h3 class="text-sm font-bold text-slate-100">{comp.props?.title || comp.name}</h3>
											</div>
											<span class="font-mono text-[10px] text-slate-500">{kitId}</span>
										</div>
										{#if entry?.load}
											{#await entry.load()}
												<div class="flex h-32 items-center justify-center text-xs text-slate-500">
													<div class="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mr-2"></div>
													<span>Memuat komponen {comp.props?.title || comp.name}...</span>
												</div>
											{:then loaded}
												{@const DemoComp = loaded.default}
												<div class="kit-demo-container">
													<DemoComp />
												</div>
											{:catch err}
												<div class="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
													Gagal memuat komponen: {err.message}
												</div>
											{/await}
										{:else}
											<div class="text-xs text-slate-400">
												[ Region Komponen: {comp.name} ]
											</div>
										{/if}
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
