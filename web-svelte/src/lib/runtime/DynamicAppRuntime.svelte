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
	import NavigationLayout from '$lib/runtime/NavigationLayout.svelte';
	import DataProvider from '$lib/blocks/DataProvider.svelte';
	import TableBlock from '$lib/blocks/TableBlock.svelte';
	import FormBlock from '$lib/blocks/FormBlock.svelte';
	import CardsRepeater from '$lib/blocks/CardsRepeater.svelte';
	import ChartBlock from '$lib/blocks/ChartBlock.svelte';
	import ContainerSection from '$lib/blocks/ContainerSection.svelte';
	import SimpleDatePicker from '$lib/kit/molecules/SimpleDatePicker.svelte';
	import DateRangePicker from '$lib/kit/molecules/DateRangePicker.svelte';
	import { runActionChain, type ActionStep } from '$lib/runtime/actionRunner';
	import { catalog } from '$lib/kit/catalog';
	import { exportBastPdf } from '$lib/utils/pdfExport';
	import SetupUserInformations from '$lib/pims/setup/SetupUserInformations.svelte';
	import SetupUserMenus from '$lib/pims/setup/SetupUserMenus.svelte';
	import SetupRoleManagement from '$lib/pims/setup/SetupRoleManagement.svelte';
	import SetupApprovalHierarchy from '$lib/pims/setup/SetupApprovalHierarchy.svelte';
	import SetupResetPassword from '$lib/pims/setup/SetupResetPassword.svelte';
	import PimsDashboard from '$lib/pims/PimsDashboard.svelte';
	import PimsLogin from '$lib/pims/PimsLogin.svelte';
	import {
		Layers,
		FileText,
		Edit3,
		RefreshCw,
		AlertCircle,
		AlertTriangle,
		Download,
		CheckCircle2,
		Sparkles,
		Upload
	} from 'lucide-svelte';

	let {
		appSlug = 'gopimsbase',
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

	async function handleButtonClick(comp: RuntimeComponent) {
		if (comp.actions && comp.actions.length > 0) {
			await runActionChain(comp.actions as ActionStep[], {
				currentPage: activePageSlug,
				onNavigate: (slug) => { activePageSlug = slug; },
				onNotify: (msg) => { alert(msg); }
			});
		} else {
			alert(`Aksi Tombol "${comp.props?.title || comp.name}" dijalankan!`);
		}
	}

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

	$effect(() => {
		if (appSlug) {
			loadRuntime();
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

{#snippet renderComponent(comp: RuntimeComponent)}
								{#if comp.type === 'interactive_grid'}
									<InteractiveGrid title={comp.props?.title || comp.name} />
								{:else if comp.type === 'metric_card'}
									<div class="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
										<div class="flex items-center justify-between">
											<span class="text-xs font-semibold text-slate-400">{comp.props?.title || comp.name}</span>
											<span class="rounded bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400 font-bold border border-sky-500/20">LIVE</span>
										</div>
										<div class="mt-2 text-2xl font-black text-slate-100">{comp.props?.value || '761'}</div>
										{#if comp.props?.subtitle}
											<div class="mt-1 text-xs text-slate-400">{comp.props.subtitle}</div>
										{/if}
									</div>
								{:else if comp.type === 'chart'}
									<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
										<h3 class="text-sm font-bold text-slate-100 mb-4">{comp.props?.title || comp.name}</h3>
										<div class="flex items-end gap-3 h-36 pt-4 border-b border-slate-800">
											<div class="flex-1 flex flex-col items-center gap-1">
												<div class="w-full bg-sky-500/80 rounded-t h-20 transition-all hover:bg-sky-400"></div>
												<span class="text-[10px] text-slate-400 font-mono">KYA (285)</span>
											</div>
											<div class="flex-1 flex flex-col items-center gap-1">
												<div class="w-full bg-emerald-500/80 rounded-t h-28 transition-all hover:bg-emerald-400"></div>
												<span class="text-[10px] text-slate-400 font-mono">SWA (310)</span>
											</div>
											<div class="flex-1 flex flex-col items-center gap-1">
												<div class="w-full bg-amber-500/80 rounded-t h-16 transition-all hover:bg-amber-400"></div>
												<span class="text-[10px] text-slate-400 font-mono">CPEA (112)</span>
											</div>
											<div class="flex-1 flex flex-col items-center gap-1">
												<div class="w-full bg-purple-500/80 rounded-t h-12 transition-all hover:bg-purple-400"></div>
												<span class="text-[10px] text-slate-400 font-mono">TMM (54)</span>
											</div>
										</div>
									</div>
								{:else if comp.type === 'form'}
									<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
										<h3 class="text-sm font-bold text-slate-100 mb-4">{comp.props?.title || comp.name}</h3>
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											{#if Array.isArray(comp.props?.fields)}
												{#each comp.props.fields as f}
													<div class="flex flex-col gap-1.5">
														<label class="text-xs font-semibold text-slate-300">{f.label || f.name}</label>
														{#if f.type === 'select'}
															<select class="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500">
																<option value="">-- Pilih {f.label || f.name} --</option>
															</select>
														{:else if f.type === 'checkbox'}
															<div class="flex items-center gap-2 py-2">
																<input type="checkbox" checked class="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500" />
																<span class="text-xs text-slate-300">Aktif</span>
															</div>
														{:else}
															<input
																type={f.type || 'text'}
																placeholder={f.label || f.name}
																class="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
															/>
														{/if}
													</div>
												{/each}
											{/if}
										</div>
									</div>
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
											onclick={() => handleButtonClick(comp)}
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
								{:else if comp.type === 'textarea'}
									<div class="flex flex-col gap-1.5 max-w-md py-2">
										<label class="text-xs font-semibold text-slate-300">{comp.props?.title || comp.name || 'Text Area'}</label>
										<textarea
											rows="3"
											placeholder={comp.props?.placeholder || 'Masukkan teks multi-baris di sini...'}
											class="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
										></textarea>
									</div>
								{:else if comp.type === 'select'}
									<div class="flex flex-col gap-1.5 max-w-md py-2">
										<label class="text-xs font-semibold text-slate-300">{comp.props?.title || comp.name || 'Pilih Opsi'}</label>
										<select class="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer">
											<option value="">{comp.props?.placeholder || '-- Pilih Opsi --'}</option>
											<option value="opt1">Pilihan 1</option>
											<option value="opt2">Pilihan 2</option>
											<option value="opt3">Pilihan 3</option>
										</select>
									</div>
								{:else if comp.type === 'file_upload'}
									<div class="flex flex-col gap-1.5 max-w-md py-2">
										<label class="text-xs font-semibold text-slate-300">{comp.props?.title || comp.name || 'Lampiran File'}</label>
										<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center cursor-pointer hover:border-emerald-500/60 transition">
											<Upload class="h-6 w-6 text-emerald-400 mb-1" />
											<span class="text-xs font-medium text-slate-300">Tarik file ke sini atau klik u/ memilih</span>
											<span class="text-[10px] text-slate-500 mt-0.5">Mendukung PDF, PNG, JPG, XLSX (maks 10MB)</span>
										</div>
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
								{:else if comp.type === 'date_picker' || comp.type === 'datepicker' || comp.type === 'kit:date-picker' || comp.type === 'kit:simple-date-picker'}
									<div class="py-2 max-w-sm">
										<SimpleDatePicker
											label={comp.props?.title || comp.name || 'Pilih Tanggal'}
											value={comp.props?.value ?? null}
											onchange={(val) => {
												if (!comp.props) comp.props = {};
												comp.props.value = val;
											}}
										/>
									</div>
								{:else if comp.type === 'date_range_picker'}
									<div class="py-2 max-w-md">
										<DateRangePicker
											label={String(comp.props?.title || comp.name || 'Rentang Tanggal')}
											startDate={comp.props?.startDate ? String(comp.props.startDate) : null}
											endDate={comp.props?.endDate ? String(comp.props.endDate) : null}
											onchange={(range) => {
												if (!comp.props) comp.props = {};
												comp.props.startDate = range.start;
												comp.props.endDate = range.end;
											}}
										/>
									</div>
								<!-- Budibase Smart Blocks -->
								{:else if comp.type === 'data_provider'}
									<DataProvider
										title={String(comp.props?.title || comp.name || 'Data Provider')}
										table={(comp.datasource_config?.table as string) || (comp.props?.table as string) || 'bmn_items'}
									/>
								{:else if comp.type === 'table_block'}
									<TableBlock
										title={String(comp.props?.title || comp.name || 'Table Block')}
										table={(comp.datasource_config?.table as string) || (comp.props?.table as string) || 'bmn_items'}
									/>
								{:else if comp.type === 'form_block'}
									<FormBlock
										title={String(comp.props?.title || comp.name || 'Form Block')}
										table={(comp.datasource_config?.table as string) || (comp.props?.table as string) || 'bmn_items'}
										mode={(comp.datasource_config?.mode as any) || (comp.props?.mode as any) || 'create'}
									/>
								{:else if comp.type === 'cards_repeater'}
									<CardsRepeater
										title={String(comp.props?.title || comp.name || 'Cards Repeater')}
										table={(comp.datasource_config?.table as string) || (comp.props?.table as string) || 'bmn_items'}
									/>
								{:else if comp.type === 'chart_block'}
									<ChartBlock
										title={String(comp.props?.title || comp.name || 'Chart Block')}
										table={(comp.datasource_config?.table as string) || (comp.props?.table as string) || 'bmn_items'}
										chartType={(comp.props?.chartType as any) || 'bar'}
									/>
								{:else if comp.type === 'container_section'}
									<ContainerSection
										title={String(comp.props?.title || comp.name || 'Container Section')}
									/>
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
{/snippet}

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
{:else if runtimeApp}
	<NavigationLayout
		pages={runtimeApp.pages}
		activeSlug={activePageSlug}
		appName={runtimeApp.app.name}
		appVersion={runtimeApp.app.version}
		onSelectPage={(slug) => (activePageSlug = slug)}
		{onOpenStudio}
		onRefresh={loadRuntime}
	>
		{#if activePage}
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
				{#if appSlug === 'gopimsbase' && activePage.slug === 'login'}
					<div class="flex items-center justify-center p-2">
						<PimsLogin onLoginSuccess={(u) => {
							alert(`Login Berhasil! Selamat datang, ${u.fullName} (${u.role})`);
							activePageSlug = 'dashboard';
						}} />
					</div>
				{:else if appSlug === 'gopimsbase' && activePage.slug === 'dashboard'}
					<PimsDashboard />
				{:else if appSlug === 'gopimsbase' && activePage.slug === 'setup-user-informations'}
					<SetupUserInformations />
				{:else if appSlug === 'gopimsbase' && activePage.slug === 'setup-user-menus'}
					<SetupUserMenus />
				{:else if appSlug === 'gopimsbase' && activePage.slug === 'role-management'}
					<SetupRoleManagement />
				{:else if appSlug === 'gopimsbase' && activePage.slug === 'approval-hierarchy'}
					<SetupApprovalHierarchy />
				{:else if appSlug === 'gopimsbase' && activePage.slug === 'reset-password'}
					<SetupResetPassword />
				{:else if activePage.layout === 'free' || activePage.components.some((c) => typeof c.props?.left === 'number')}
					<!-- Visual Basic Freeform Canvas Layout -->
					<div
						class="relative w-full min-h-[640px] rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 shadow-2xl backdrop-blur overflow-auto"
						style="background-image: radial-gradient(#1e293b 1.5px, transparent 1.5px); background-size: 20px 20px;"
					>
						{#each activePage.components as comp, idx}
							{@const left = typeof comp.props?.left === 'number' ? comp.props.left : 24 + ((idx % 3) * 32)}
							{@const top = typeof comp.props?.top === 'number' ? comp.props.top : 24 + (idx * 72)}
							{@const width = typeof comp.props?.width === 'number' ? comp.props.width : undefined}
							{@const height = typeof comp.props?.height === 'number' ? comp.props.height : undefined}
							<div
								class="absolute transition-all"
								style="left: {left}px; top: {top}px; {width ? `width: ${width}px;` : ''} {height ? `min-height: ${height}px;` : ''}"
							>
								{@render renderComponent(comp)}
							</div>
						{/each}
					</div>
				{:else if activePage.layout === 'split-2'}
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{#each activePage.components as comp}
							<div class="w-full">
								{@render renderComponent(comp)}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-6">
						{#each activePage.components as comp}
							<div class="w-full">
								{@render renderComponent(comp)}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</NavigationLayout>
{/if}
