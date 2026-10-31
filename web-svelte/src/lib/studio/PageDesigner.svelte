<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchRuntimeApp,
		createNewPage,
		deletePage,
		createComponent,
		deleteComponent,
		updateComponent,
		fetchSchemaTables,
		type RuntimeApp,
		type RuntimePage,
		type RuntimeComponent,
		type SchemaTable
	} from '$lib/api/builderClient';
	import {
		Layers,
		Plus,
		Trash2,
		Save,
		Eye,
		Settings,
		Database,
		FileText,
		TableProperties,
		Grid3X3,
		Calendar,
		MapPin,
		FolderTree,
		Filter,
		FileSignature,
		ChevronRight,
		ArrowLeft,
		CheckCircle2,
		RefreshCw,
		Play,
		Layout,
		Box,
		ArrowLeftRight,
		Search,
		FileSpreadsheet,
		LayoutGrid,
		Gauge,
		ChartBar,
		ChartLine,
		ChartPie,
		History,
		Zap,
		Clock,
		DollarSign,
		SquareCheck
	} from 'lucide-svelte';

	let {
		appSlug = 'bmn-enterprise',
		onBack
	}: {
		appSlug: string;
		onBack: () => void;
	} = $props();

	let runtimeApp = $state<RuntimeApp | null>(null);
	let activePageIndex = $state(0);
	let selectedComponentId = $state<number | null>(null);
	let schemaTables = $state<SchemaTable[]>([]);
	let loading = $state(false);
	let leftTab = $state<'tree' | 'palette' | 'tables'>('tree');
	let isPreviewMode = $state(false);
	let saveSuccess = $state(false);
	let isDraggingOver = $state(false);

	// Add Page modal state
	let showAddPageModal = $state(false);
	let newPageTitle = $state('');
	let newPageSlug = $state('');
	let newPageLayout = $state('single');

	async function loadApp() {
		loading = true;
		try {
			const [appData, tables] = await Promise.all([
				fetchRuntimeApp(appSlug),
				fetchSchemaTables()
			]);
			runtimeApp = appData;
			schemaTables = tables;
			if (appData.pages.length > 0 && selectedComponentId === null) {
				const firstComp = appData.pages[0]?.components?.[0];
				if (firstComp) selectedComponentId = firstComp.id;
			}
		} catch (e) {
			console.error('Failed to load runtime app:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadApp();
	});

	const activePage = $derived<RuntimePage | null>(
		runtimeApp?.pages?.[activePageIndex] || null
	);

	const selectedComponent = $derived<RuntimeComponent | null>(
		activePage?.components?.find((c) => c.id === selectedComponentId) || null
	);

	type PaletteCategory = 'all' | 'reports' | 'visuals' | 'specialized' | 'forms' | 'containers';
	let selectedCategory = $state<PaletteCategory>('all');

	const componentPalette = [
		// 1. Reports & Data Grids
		{ category: 'reports', type: 'interactive_grid', name: 'Interactive Grid', icon: TableProperties, desc: 'Tabel data 100k, sort, filter, inline edit, Excel paste, batch save' },
		{ category: 'reports', type: 'interactive_report', name: 'Interactive Report (IR)', icon: FileSpreadsheet, desc: 'Laporan 18 operator filter, aggregasi, compute, highlight, CSV/PDF' },
		{ category: 'reports', type: 'pivot_matrix', name: 'Pivot Matrix', icon: Grid3X3, desc: '2D Cross-tab dynamic aggregation dengan heatmap shading' },
		{ category: 'reports', type: 'cards_grid', name: 'Cards Grid View', icon: LayoutGrid, desc: 'Tampilan kartu multi-kolom untuk katalog visual aset' },

		// 2. Visualizations & KPI
		{ category: 'visuals', type: 'kpi_cards', name: 'KPI Metric Cards', icon: Gauge, desc: 'Statistik metrik ringkasan eksekutif dengan delta trend' },
		{ category: 'visuals', type: 'bar_chart', name: 'Bar Chart (Pure SVG)', icon: ChartBar, desc: 'Grafik batang perbandingan kategori zero-dependency' },
		{ category: 'visuals', type: 'line_chart', name: 'Line Trend Chart', icon: ChartLine, desc: 'Grafik garis tren waktu & pergerakan nilai aset' },
		{ category: 'visuals', type: 'pie_chart', name: 'Pie / Donut Chart', icon: ChartPie, desc: 'Diagram proporsi komposisi aset & anggaran' },

		// 3. Specialized APEX Views
		{ category: 'specialized', type: 'kanban_board', name: 'Kanban Workflow Board', icon: Layers, desc: 'Papan kartu status alur kerja BMN & pemeliharaan aset' },
		{ category: 'specialized', type: 'calendar_timeline', name: 'SLA Calendar & Timeline', icon: Calendar, desc: 'Kalender pemeliharaan & Gantt SLA duration' },
		{ category: 'specialized', type: 'asset_map', name: 'GIS Campus Map', icon: MapPin, desc: 'Peta spasial SVG interaktif dengan pin gedung & valuasi' },
		{ category: 'specialized', type: 'tree_view', name: 'Spatial Tree View', icon: FolderTree, desc: 'Navigasi hierarki lokasi bertingkat (Kampus/Gedung/Lantai)' },
		{ category: 'specialized', type: 'faceted_search', name: 'Faceted Search', icon: Filter, desc: 'Filter multi-dimensi dengan dynamic counter real-time' },
		{ category: 'specialized', type: 'history_timeline', name: 'Audit History Timeline', icon: History, desc: 'Jejak audit riwayat modifikasi data record historis' },

		// 4. Form Controls (Oracle APEX Molecules)
		{ category: 'forms', type: 'popup_lov', name: 'Popup LOV (List of Values)', icon: Search, desc: 'Modal dialog lookup foreign key dengan pencarian live' },
		{ category: 'forms', type: 'shuttle_selector', name: 'Shuttle Dual Listbox', icon: ArrowLeftRight, desc: 'Selector APEX dua kolom untuk alokasi aset massal' },
		{ category: 'forms', type: 'signature_bast', name: 'Digital Sign & BAST', icon: FileSignature, desc: 'Kanvas tanda tangan digital touch/mouse & ekspor slip PDF' },
		{ category: 'forms', type: 'dynamic_actions', name: 'Dynamic Actions Rule', icon: Zap, desc: 'Rule engine event-driven (Set Value, Show/Hide, Disable)' },
		{ category: 'forms', type: 'date_picker', name: 'Date & Time Picker', icon: Clock, desc: 'Input tanggal & jam dengan kalender popup' },
		{ category: 'forms', type: 'currency_input', name: 'Currency IDR Input', icon: DollarSign, desc: 'Input nominal angka otomatis separator Rupiah' },

		// 5. Layout Containers
		{ category: 'containers', type: 'tabs_container', name: 'Tabs Container', icon: Layout, desc: 'Wadah navigasi multi-tab untuk memecah form panjang' },
		{ category: 'containers', type: 'wizard_progress', name: 'Wizard Step Progress', icon: SquareCheck, desc: 'Indikator langkah bertahap untuk proses bisnis sekuensial' }
	];

	const filteredPalette = $derived(
		selectedCategory === 'all'
			? componentPalette
			: componentPalette.filter((c) => c.category === selectedCategory)
	);

	async function handleAddComponent(compType: string, customName?: string, datasourceConfig?: Record<string, unknown>) {
		if (!activePage) return;
		const def = componentPalette.find((c) => c.type === compType);
		const name = customName || def?.name || 'Komponen Baru';

		try {
			await createComponent({
				page_id: activePage.id,
				name,
				type: compType,
				region: 'main',
				datasource_type: datasourceConfig ? 'table' : 'rpc',
				datasource_config: datasourceConfig || {},
				props: { title: name }
			});
			await loadApp();
		} catch (e) {
			console.error('Failed to add component:', e);
		}
	}

	async function handleDeleteComponent(compId: number) {
		try {
			await deleteComponent(compId);
			if (selectedComponentId === compId) selectedComponentId = null;
			await loadApp();
		} catch (e) {
			console.error('Failed to delete component:', e);
		}
	}

	async function handleAddPage() {
		if (!runtimeApp || !newPageTitle || !newPageSlug) return;
		try {
			await createNewPage({
				app_id: runtimeApp.app.id,
				slug: newPageSlug,
				title: newPageTitle,
				layout: newPageLayout
			});
			showAddPageModal = false;
			newPageTitle = '';
			newPageSlug = '';
			await loadApp();
			// Switch to the new page
			activePageIndex = runtimeApp.pages.length - 1;
		} catch (e) {
			console.error('Failed to create page:', e);
		}
	}

	function handleAddTableToPage(table: SchemaTable) {
		handleAddComponent('interactive_grid', `Grid: ${table.name}`, {
			schema: table.schema,
			table: table.name
		});
	}

	function triggerSaveNotification() {
		saveSuccess = true;
		setTimeout(() => (saveSuccess = false), 3000);
	}
</script>

<div class="flex h-[calc(100vh-140px)] flex-col gap-3">
	<!-- Top Navigation Control Bar -->
	<div class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 shadow-lg backdrop-blur">
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={onBack}
				class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
				title="Kembali ke App Manager"
			>
				<ArrowLeft class="h-4 w-4" />
			</button>

			<div class="h-5 w-px bg-slate-800"></div>

			<div class="flex items-center gap-2">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-xs">
					GB
				</div>
				<div>
					<h3 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
						<span>{runtimeApp?.app?.name || 'Aplikasi'}</span>
						<span class="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[9px] text-emerald-400">
							v{runtimeApp?.app?.version || '1.0.0'}
						</span>
					</h3>
					<span class="text-[10px] text-slate-500 font-mono">slug: {appSlug}</span>
				</div>
			</div>

			<div class="h-5 w-px bg-slate-800"></div>

			<!-- Page Selector Tabs -->
			<div class="flex items-center gap-1 overflow-x-auto">
				{#each runtimeApp?.pages || [] as page, idx}
					{@const isActive = activePageIndex === idx}
					<button
						type="button"
						onclick={() => (activePageIndex = idx)}
						class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition {isActive ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
					>
						<FileText class="h-3.5 w-3.5 {isActive ? 'text-emerald-400' : 'text-slate-500'}" />
						<span>{page.title}</span>
					</button>
				{/each}

				<button
					type="button"
					onclick={() => (showAddPageModal = true)}
					class="flex items-center gap-1 rounded-lg border border-dashed border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:border-slate-500 hover:text-slate-200 transition"
				>
					<Plus class="h-3 w-3" />
					<span>Halaman</span>
				</button>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => (isPreviewMode = !isPreviewMode)}
				class="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold transition {isPreviewMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}"
			>
				<Eye class="h-3.5 w-3.5" />
				<span>{isPreviewMode ? 'Keluar Preview' : 'Preview Mode'}</span>
			</button>

			<button
				type="button"
				onclick={triggerSaveNotification}
				class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
			>
				<Save class="h-3.5 w-3.5" />
				<span>Simpan</span>
			</button>

			{#if saveSuccess}
				<span class="flex items-center gap-1 text-xs font-semibold text-emerald-400">
					<CheckCircle2 class="h-3.5 w-3.5" /> Tersimpan!
				</span>
			{/if}
		</div>
	</div>

	<!-- 3-Pane Page Designer Layout -->
	<div class="grid flex-1 grid-cols-12 gap-3 overflow-hidden">
		<!-- Left Pane: Component Tree & Palette & Schema (Width: 3 cols) -->
		<div class="col-span-3 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
			<!-- Sub-Tabs Header -->
			<div class="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400">
				<button
					type="button"
					onclick={() => (leftTab = 'tree')}
					class="py-2.5 text-center transition {leftTab === 'tree' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-900/80 font-bold' : 'hover:text-slate-200'}"
				>
					Tree
				</button>
				<button
					type="button"
					onclick={() => (leftTab = 'palette')}
					class="py-2.5 text-center transition {leftTab === 'palette' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-900/80 font-bold' : 'hover:text-slate-200'}"
				>
					Palette
				</button>
				<button
					type="button"
					onclick={() => (leftTab = 'tables')}
					class="py-2.5 text-center transition {leftTab === 'tables' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-900/80 font-bold' : 'hover:text-slate-200'}"
				>
					Schema
				</button>
			</div>

			<!-- Tab Body -->
			<div class="flex-1 overflow-y-auto p-3">
				{#if leftTab === 'tree'}
					<!-- Component Hierarchy Tree -->
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
							<span>Komponen Halaman</span>
							<span class="font-mono text-emerald-400">{activePage?.components?.length || 0}</span>
						</div>

						{#if !activePage?.components || activePage.components.length === 0}
							<div class="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
								Halaman ini masih kosong. Klik tab "Palette" untuk menambahkan komponen APEX.
							</div>
						{:else}
							<div class="flex flex-col gap-1.5">
								{#each activePage.components as comp}
									{@const isSelected = selectedComponentId === comp.id}
									<div
										class="flex items-center justify-between rounded-lg border p-2 text-xs transition cursor-pointer {isSelected ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold' : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:bg-slate-800/50'}"
										onclick={() => (selectedComponentId = comp.id)}
									>
										<div class="flex items-center gap-2 truncate">
											<Box class="h-3.5 w-3.5 {isSelected ? 'text-emerald-400' : 'text-slate-500'}" />
											<span class="truncate">{comp.name}</span>
										</div>

										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); handleDeleteComponent(comp.id); }}
											class="text-slate-500 hover:text-rose-400 transition"
											title="Hapus komponen"
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if leftTab === 'palette'}
					<!-- Palette Components List with Category Pills -->
					<div class="flex flex-col gap-2.5">
						<div class="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
							<span>Katalog APEX ({filteredPalette.length})</span>
						</div>

						<!-- Category Filter Pills -->
						<div class="flex flex-wrap gap-1 border-b border-slate-800 pb-2 text-[10px] font-semibold">
							<button
								type="button"
								onclick={() => (selectedCategory = 'all')}
								class="rounded px-2 py-0.5 transition {selectedCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
							>
								Semua ({componentPalette.length})
							</button>
							<button
								type="button"
								onclick={() => (selectedCategory = 'reports')}
								class="rounded px-2 py-0.5 transition {selectedCategory === 'reports' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
							>
								Grids
							</button>
							<button
								type="button"
								onclick={() => (selectedCategory = 'visuals')}
								class="rounded px-2 py-0.5 transition {selectedCategory === 'visuals' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
							>
								Visuals
							</button>
							<button
								type="button"
								onclick={() => (selectedCategory = 'specialized')}
								class="rounded px-2 py-0.5 transition {selectedCategory === 'specialized' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
							>
								Specialized
							</button>
							<button
								type="button"
								onclick={() => (selectedCategory = 'forms')}
								class="rounded px-2 py-0.5 transition {selectedCategory === 'forms' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
							>
								Forms
							</button>
							<button
								type="button"
								onclick={() => (selectedCategory = 'containers')}
								class="rounded px-2 py-0.5 transition {selectedCategory === 'containers' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
							>
								Containers
							</button>
						</div>

						<div class="flex flex-col gap-1.5 overflow-y-auto max-h-[520px] pr-1">
							{#each filteredPalette as item}
								{@const Icon = item.icon}
								<button
									type="button"
									draggable="true"
									ondragstart={(e) => {
										e.dataTransfer?.setData('text/gobudibase-component', item.type);
										e.dataTransfer?.setData('text/plain', item.name);
									}}
									onclick={() => handleAddComponent(item.type, item.name)}
									class="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/50 p-2 text-left transition hover:border-emerald-500/50 hover:bg-emerald-950/20 group cursor-grab active:cursor-grabbing"
								>
									<div class="rounded bg-slate-800 p-1.5 text-slate-400 group-hover:text-emerald-400 transition shrink-0">
										<Icon class="h-4 w-4" />
									</div>
									<div class="min-w-0">
										<h4 class="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate">{item.name}</h4>
										<p class="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">{item.desc}</p>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{:else if leftTab === 'tables'}
					<!-- PostgreSQL 17 Schema Browser -->
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
							<span>Tabel Database</span>
							<span class="font-mono text-emerald-400">{schemaTables.length}</span>
						</div>
						<div class="flex flex-col gap-1.5">
							{#each schemaTables as tbl}
								<div class="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-2 text-xs">
									<div class="flex items-center gap-1.5 truncate font-mono text-[11px]">
										<Database class="h-3.5 w-3.5 text-slate-500" />
										<span class="text-slate-400">{tbl.schema}.</span>
										<span class="text-slate-200 font-semibold">{tbl.name}</span>
									</div>
									<button
										type="button"
										onclick={() => handleAddTableToPage(tbl)}
										class="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
										title="Buat Grid dari tabel ini"
									>
										<Plus class="h-3 w-3" /> Grid
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Center Pane: Visual Canvas Preview (Width: 6 cols) -->
		<div class="col-span-6 flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 shadow-xl backdrop-blur overflow-hidden">
			<!-- Canvas Header -->
			<div class="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs text-slate-400 bg-slate-900/60">
				<div class="flex items-center gap-2">
					<Layout class="h-3.5 w-3.5 text-emerald-400" />
					<span class="font-semibold text-slate-200">{activePage?.title || 'Canvas'}</span>
					<span class="font-mono text-[10px] text-slate-500">Layout: {activePage?.layout || 'single'}</span>
				</div>
				<span class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
					WYSIWYG CANVAS
				</span>
			</div>

			<!-- Canvas Body Area with Drag & Drop Listener -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="flex-1 overflow-y-auto p-4 transition-colors {isDraggingOver ? 'bg-emerald-950/20 ring-2 ring-inset ring-emerald-500/60' : ''}"
				ondragover={(e) => {
					e.preventDefault();
					e.dataTransfer!.dropEffect = 'copy';
					isDraggingOver = true;
				}}
				ondragleave={(e) => {
					if (!e.currentTarget.contains(e.relatedTarget as Node)) {
						isDraggingOver = false;
					}
				}}
				ondrop={(e) => {
					e.preventDefault();
					isDraggingOver = false;
					const compType = e.dataTransfer?.getData('text/gobudibase-component');
					const compName = e.dataTransfer?.getData('text/plain');
					if (compType) {
						handleAddComponent(compType, compName || compType);
					}
				}}
			>
				{#if !activePage?.components || activePage.components.length === 0}
					<div class="flex h-full min-h-[380px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition {isDraggingOver ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200' : 'border-slate-800 bg-slate-950/30 text-slate-500'}">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 mb-3 text-emerald-400 shadow-inner">
							<Box class="h-6 w-6" />
						</div>
						<p class="text-sm font-bold text-slate-200">Kanvas Masih Kosong</p>
						<p class="text-xs text-slate-400 mt-1 max-w-sm">
							Tarik (<span class="text-emerald-400 font-semibold">drag & drop</span>) komponen dari panel kiri, atau klik pintasan langsung di bawah:
						</p>

						<!-- Quick Add Action Buttons on Empty Canvas -->
						<div class="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-lg">
							<button
								type="button"
								onclick={() => handleAddComponent('interactive_grid', 'Data Grid Utama')}
								class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/60 hover:bg-emerald-950/30 hover:text-emerald-300 transition shadow-sm"
							>
								<TableProperties class="h-3.5 w-3.5 text-emerald-400" />
								+ Interactive Grid
							</button>
							<button
								type="button"
								onclick={() => handleAddComponent('kanban', 'Papan Kanban')}
								class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-purple-500/60 hover:bg-purple-950/30 hover:text-purple-300 transition shadow-sm"
							>
								<LayoutGrid class="h-3.5 w-3.5 text-purple-400" />
								+ Kanban Board
							</button>
							<button
								type="button"
								onclick={() => handleAddComponent('shuttle', 'Dual Shuttle Selector')}
								class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/60 hover:bg-amber-950/30 hover:text-amber-300 transition shadow-sm"
							>
								<ArrowLeftRight class="h-3.5 w-3.5 text-amber-400" />
								+ Shuttle Selector
							</button>
							<button
								type="button"
								onclick={() => handleAddComponent('popup_lov', 'Cari Item (Popup LOV)')}
								class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/60 hover:bg-cyan-950/30 hover:text-cyan-300 transition shadow-sm"
							>
								<Search class="h-3.5 w-3.5 text-cyan-400" />
								+ Popup LOV
							</button>
							<button
								type="button"
								onclick={() => handleAddComponent('chart_dashboard', 'Grafik Penjualan')}
								class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-blue-500/60 hover:bg-blue-950/30 hover:text-blue-300 transition shadow-sm"
							>
								<ChartBar class="h-3.5 w-3.5 text-blue-400" />
								+ Chart Dashboard
							</button>
							<button
								type="button"
								onclick={() => (leftTab = 'palette')}
								class="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-900/50 transition shadow-sm"
							>
								Buka Tab Palette (22 Komponen) →
							</button>
						</div>
					</div>
				{:else}
					<div class="flex flex-col gap-4">
						{#each activePage.components as comp}
							{@const isSelected = selectedComponentId === comp.id}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="relative rounded-xl border p-4 transition cursor-pointer {isSelected ? 'border-emerald-500 bg-slate-900/90 ring-1 ring-emerald-500/50 shadow-lg' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}"
								onclick={() => (selectedComponentId = comp.id)}
							>
								<!-- Component Frame Header -->
								<div class="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2">
									<div class="flex items-center gap-2">
										<span class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 uppercase">
											{comp.type}
										</span>
										<h4 class="text-xs font-bold text-slate-200">{comp.name}</h4>
									</div>
									<div class="flex items-center gap-2">
										<span class="text-[10px] font-mono text-slate-500">
											Source: {comp.datasource_type}
										</span>
										<button
											type="button"
											onclick={(e) => {
												e.stopPropagation();
												handleDeleteComponent(comp.id);
											}}
											class="rounded p-1 text-slate-500 hover:bg-red-950/50 hover:text-red-400 transition"
											title="Hapus komponen dari page"
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
								</div>

								<!-- Mock Component Wireframe Preview -->
								<div class="rounded-lg border border-slate-800/60 bg-slate-950/60 p-4">
									{#if comp.type === 'interactive_grid'}
										<div class="flex flex-col gap-2">
											<div class="flex items-center justify-between text-xs">
												<span class="font-semibold text-slate-300">Preview Data Grid</span>
												<span class="font-mono text-[10px] text-emerald-400">100.000 Rekor</span>
											</div>
											<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
												[ InteractiveGrid: Sort • Filter • Inline Edit • Export ]
											</div>
										</div>
									{:else if comp.type === 'kanban'}
										<div class="flex flex-col gap-2">
											<div class="flex items-center justify-between text-xs">
												<span class="font-semibold text-purple-300">Kanban Swimlanes</span>
												<span class="font-mono text-[10px] text-purple-400">Drag & Drop Ready</span>
											</div>
											<div class="grid grid-cols-3 gap-2">
												<div class="rounded bg-slate-900 border border-slate-800 p-2 text-[10px] text-slate-400 text-center">Backlog</div>
												<div class="rounded bg-slate-900 border border-purple-900/50 p-2 text-[10px] text-purple-300 text-center">In Progress</div>
												<div class="rounded bg-slate-900 border border-emerald-900/50 p-2 text-[10px] text-emerald-300 text-center">Done</div>
											</div>
										</div>
									{:else if comp.type === 'shuttle'}
										<div class="flex flex-col gap-2">
											<div class="flex items-center justify-between text-xs">
												<span class="font-semibold text-amber-300">Dual Shuttle Transfer</span>
												<span class="font-mono text-[10px] text-amber-400">Multi-Select</span>
											</div>
											<div class="grid grid-cols-5 gap-2 items-center">
												<div class="col-span-2 rounded bg-slate-900 border border-slate-800 p-2 text-[10px] text-slate-400 text-center">Tersedia</div>
												<div class="col-span-1 text-center text-amber-400 font-bold text-xs">⇄</div>
												<div class="col-span-2 rounded bg-slate-900 border border-amber-900/40 p-2 text-[10px] text-amber-300 text-center">Terpilih</div>
											</div>
										</div>
									{:else if comp.type === 'popup_lov'}
										<div class="flex items-center justify-between rounded bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-400">
											<span class="text-slate-300 font-mono">[Cari Data / Popup LOV Modal Dialog]</span>
											<span class="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-400 font-bold">🔍 Pilih</span>
										</div>
									{:else if comp.type === 'chart_dashboard'}
										<div class="flex flex-col gap-1.5">
											<div class="flex items-center justify-between text-xs font-semibold text-blue-300">
												<span>Sales & Performance Metrics</span>
												<span class="font-mono text-[10px] text-blue-400">Live SVG / Canvas</span>
											</div>
											<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
												[ Interactive Charts: Bar • Line • Area • Donut ]
											</div>
										</div>
									{:else if comp.type === 'pivot_matrix'}
										<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
											[ PivotMatrix: 2D Cross-tab Aggregation & Heatmap ]
										</div>
									{:else if comp.type === 'calendar_timeline'}
										<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
											[ CalendarTimeline: SLA Schedule & Gantt Bar View ]
										</div>
									{:else if comp.type === 'asset_map'}
										<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
											[ AssetMapView: GIS Campus Pins & Valuation Inspector ]
										</div>
									{:else if comp.type === 'tree_view'}
										<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
											[ TreeView: Multi-level Location Drilldown ]
										</div>
									{:else if comp.type === 'signature_bast'}
										<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
											[ SignaturePad & BAST PDF Export Slip ]
										</div>
									{:else}
										<div class="h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-500">
											[ Komponen: {comp.name} ]
										</div>
									{/if}
								</div>
							</div>
						{/each}

						<!-- Bottom Quick-Add & Drop Zone Strip -->
						<div
							class="flex items-center justify-between rounded-xl border-2 border-dashed p-3 transition {isDraggingOver ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/50 text-emerald-300' : 'border-slate-800/80 bg-slate-950/20 text-slate-500 hover:border-slate-700'}"
						>
							<div class="flex items-center gap-2 text-xs">
								<Plus class="h-4 w-4 text-emerald-400" />
								<span class="font-medium text-slate-400">Tarik komponen ke sini, atau</span>
								<button
									type="button"
									onclick={() => (leftTab = 'palette')}
									class="font-bold text-emerald-400 hover:underline"
								>
									buka Palette (22 Komponen)
								</button>
							</div>
							<div class="flex items-center gap-1.5">
								<button
									type="button"
									onclick={() => handleAddComponent('interactive_grid', 'Grid Tambahan')}
									class="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-emerald-600 hover:text-white transition"
								>
									+ Grid
								</button>
								<button
									type="button"
									onclick={() => handleAddComponent('kanban', 'Kanban Tambahan')}
									class="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-purple-600 hover:text-white transition"
								>
									+ Kanban
								</button>
								<button
									type="button"
									onclick={() => handleAddComponent('shuttle', 'Shuttle Baru')}
									class="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-amber-600 hover:text-white transition"
								>
									+ Shuttle
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Pane: Property & Binding Inspector (Width: 3 cols) -->
		<div class="col-span-3 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
			<div class="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-950/60">
				<Settings class="h-3.5 w-3.5 text-emerald-400" />
				<span>Property Inspector</span>
			</div>

			<div class="flex-1 overflow-y-auto p-4">
				{#if !selectedComponent}
					<div class="flex h-full items-center justify-center text-center text-xs text-slate-500">
						Pilih komponen di kanvas atau pohon untuk mengedit properti & data binding.
					</div>
				{:else}
					<div class="flex flex-col gap-4 text-xs">
						<!-- General Properties -->
						<div class="flex flex-col gap-1.5 border-b border-slate-800/80 pb-3">
							<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Informasi Komponen</span>
							<label for="inspector-comp-name" class="font-semibold text-slate-300">Nama Tampilan</label>
							<input
								id="inspector-comp-name"
								type="text"
								bind:value={selectedComponent.name}
								class="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
							/>
						</div>

						<!-- Datasource Binding -->
						<div class="flex flex-col gap-2 border-b border-slate-800/80 pb-3">
							<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Binding (PostgreSQL 17)</span>
							<label for="inspector-ds-type" class="font-semibold text-slate-300">Tipe Sumber Data</label>
							<select
								id="inspector-ds-type"
								bind:value={selectedComponent.datasource_type}
								class="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
							>
								<option value="table">Tabel PostgreSQL (Auto Query)</option>
								<option value="rpc">Stored Procedure / RPC</option>
								<option value="custom">Form Custom</option>
							</select>
						</div>

						<!-- Dynamic Actions Declarative Rules -->
						<div class="flex flex-col gap-2 border-b border-slate-800/80 pb-3">
							<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dynamic Actions</span>
							<div class="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] text-slate-400">
								<p class="font-semibold text-slate-300">Active Rule Trigger:</p>
								<p class="mt-0.5">Event onCellChange &rarr; Execute API / Validate Cell</p>
							</div>
						</div>

						<!-- Delete Button -->
						<button
							type="button"
							onclick={() => handleDeleteComponent(selectedComponent.id)}
							class="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
						>
							<Trash2 class="h-3.5 w-3.5" />
							<span>Hapus Komponen Ini</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Modal Add Page -->
{#if showAddPageModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-sm font-bold text-slate-100">Tambah Halaman Baru</h3>
				<button type="button" onclick={() => (showAddPageModal = false)} class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">&times;</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleAddPage(); }} class="mt-4 flex flex-col gap-3 text-xs">
				<div class="flex flex-col gap-1">
					<label for="new-page-title" class="font-semibold text-slate-300">Judul Halaman</label>
					<input
						id="new-page-title"
						type="text"
						bind:value={newPageTitle}
						placeholder="contoh: Laporan Audit Triwulan"
						oninput={() => { newPageSlug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }}
						required
						class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-page-slug" class="font-semibold text-slate-300">Slug Halaman</label>
					<input
						id="new-page-slug"
						type="text"
						bind:value={newPageSlug}
						required
						class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-page-layout" class="font-semibold text-slate-300">Layout Grid</label>
					<select
						id="new-page-layout"
						bind:value={newPageLayout}
						class="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
					>
						<option value="single">Single Column</option>
						<option value="split-2">Split 2 Columns</option>
						<option value="dashboard-4">Dashboard 4 Widgets</option>
					</select>
				</div>

				<div class="mt-3 flex justify-end gap-2 border-t border-slate-800 pt-3">
					<button type="button" onclick={() => (showAddPageModal = false)} class="rounded-lg px-3 py-1.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">Batal</button>
					<button type="submit" class="rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500">Tambah</button>
				</div>
			</form>
		</div>
	</div>
{/if}
