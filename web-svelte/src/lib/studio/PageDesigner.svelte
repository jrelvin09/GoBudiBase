<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchRuntimeApp,
		createNewPage,
		updatePage,
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
		ChevronDown,
		ArrowLeft,
		CheckCircle2,
		RefreshCw,
		Play,
		Square,
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
		SquareCheck,
		Puzzle,
		MousePointer,
		Folder,
		Sliders,
		Minus,
		Maximize2,
		X,
		MousePointerClick,
		Type,
		CheckSquare,
		ToggleLeft,
		Tag,
		AlertTriangle
	} from 'lucide-svelte';
	import { catalog } from '$lib/kit/catalog';
	import { catalogTitle } from '$lib/kit/catalog-title';

	let {
		appSlug = 'bmn-enterprise',
		onBack,
		onRun
	}: {
		appSlug: string;
		onBack: () => void;
		onRun?: (pageSlug?: string) => void;
	} = $props();

	let runtimeApp = $state<RuntimeApp | null>(null);
	let activePageIndex = $state(0);
	let selectedComponentId = $state<number | null>(null);
	let schemaTables = $state<SchemaTable[]>([]);
	let loading = $state(false);
	let isDraggingOver = $state(false);
	let saveSuccess = $state(false);

	// Visual Basic Toolbox State
	let toolboxTab = $state<'standard' | 'uikit' | 'tables'>('standard');
	let toolboxSearch = $state('');

	// Visual Basic Property Grid State
	let propertyTab = $state<'categorized' | 'alphabetic'>('categorized');
	let activePropertyHelp = $state({
		title: '(Name)',
		desc: 'Menentukan pengenal unik kontrol dalam runtime dan kode aplikasi.'
	});

	// Visual Basic Form Window State
	let snapToGrid = $state(true);

	// Add Page modal state
	let showAddPageModal = $state(false);
	let newPageTitle = $state('');
	let newPageSlug = $state('');
	let newPageLayout = $state('single');
	let newPageGroup = $state('Menu Utama');
	let newPageParentSlug = $state<string | null>(null);

	const formsByGroup = $derived.by(() => {
		const groups: Record<string, { pg: RuntimePage; idx: number }[]> = {};
		(runtimeApp?.pages || []).forEach((pg, idx) => {
			const g = pg.group_name || 'Menu Utama';
			if (!groups[g]) groups[g] = [];
			groups[g].push({ pg, idx });
		});
		return groups;
	});

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

	// Standard Visual Basic & APEX Controls
	const standardControls = [
		// Standard RAD Atoms & Inputs
		{ type: 'button', name: 'CommandButton', icon: MousePointerClick, group: 'Standard Controls', desc: 'Tombol aksi interaktif dengan caption & handler klik' },
		{ type: 'input', name: 'TextBox', icon: Type, group: 'Standard Controls', desc: 'Kotak input teks pengguna dengan label & placeholder' },
		{ type: 'label', name: 'Label', icon: Type, group: 'Standard Controls', desc: 'Teks statis judul atau keterangan form' },
		{ type: 'badge', name: 'StatusBadge', icon: Tag, group: 'Standard Controls', desc: 'Badge penanda status warna-warni' },
		{ type: 'checkbox', name: 'CheckBox', icon: CheckSquare, group: 'Standard Controls', desc: 'Kotak centang boolean Ya/Tidak' },
		{ type: 'switch', name: 'ToggleSwitch', icon: ToggleLeft, group: 'Standard Controls', desc: 'Saklar On/Off interaktif' },
		{ type: 'card', name: 'Frame / Card', icon: Square, group: 'Standard Controls', desc: 'Wadah panel kartu pengelompok elemen form' },
		{ type: 'alert', name: 'AlertCallout', icon: AlertTriangle, group: 'Standard Controls', desc: 'Kotak peringatan pesan atau status' },

		// APEX Grids & Reports
		{ type: 'interactive_grid', name: 'Interactive Grid', icon: TableProperties, group: 'Grids', desc: 'Tabel data 100k, sort, filter, inline edit, Excel paste' },
		{ type: 'interactive_report', name: 'Interactive Report (IR)', icon: FileSpreadsheet, group: 'Grids', desc: 'Laporan 18 operator filter, aggregasi, export CSV/PDF' },
		{ type: 'pivot_matrix', name: 'Pivot Matrix', icon: Grid3X3, group: 'Grids', desc: '2D Cross-tab aggregation dengan heatmap' },
		{ type: 'cards_grid', name: 'Cards Grid View', icon: LayoutGrid, group: 'Grids', desc: 'Tampilan kartu multi-kolom visual aset' },
		{ type: 'kpi_cards', name: 'KPI Metric Cards', icon: Gauge, group: 'Visuals', desc: 'Statistik metrik ringkasan eksekutif' },
		{ type: 'bar_chart', name: 'Bar Chart (SVG)', icon: ChartBar, group: 'Visuals', desc: 'Grafik batang perbandingan kategori' },
		{ type: 'line_chart', name: 'Line Trend Chart', icon: ChartLine, group: 'Visuals', desc: 'Grafik garis tren waktu & pergerakan' },
		{ type: 'pie_chart', name: 'Pie / Donut Chart', icon: ChartPie, group: 'Visuals', desc: 'Diagram proporsi komposisi aset' },
		{ type: 'kanban', name: 'Kanban Workflow', icon: Layers, group: 'Specialized', desc: 'Papan kartu status alur kerja BMN' },
		{ type: 'calendar_timeline', name: 'SLA Calendar', icon: Calendar, group: 'Specialized', desc: 'Kalender pemeliharaan & Gantt duration' },
		{ type: 'asset_map', name: 'GIS Campus Map', icon: MapPin, group: 'Specialized', desc: 'Peta spasial SVG dengan pin lokasi' },
		{ type: 'tree_view', name: 'Spatial Tree View', icon: FolderTree, group: 'Specialized', desc: 'Navigasi hierarki bertingkat' },
		{ type: 'faceted_search', name: 'Faceted Search', icon: Filter, group: 'Specialized', desc: 'Filter multi-dimensi real-time counter' },
		{ type: 'history_timeline', name: 'Audit Timeline', icon: History, group: 'Specialized', desc: 'Jejak audit riwayat modifikasi' },
		{ type: 'popup_lov', name: 'Popup LOV Modal', icon: Search, group: 'Forms', desc: 'Modal dialog lookup foreign key' },
		{ type: 'shuttle', name: 'Shuttle Dual List', icon: ArrowLeftRight, group: 'Forms', desc: 'Selector APEX dua kolom multi-select' },
		{ type: 'signature_bast', name: 'Digital Sign & BAST', icon: FileSignature, group: 'Forms', desc: 'Kanvas tanda tangan digital & PDF slip' },
		{ type: 'dynamic_actions', name: 'Dynamic Actions Rule', icon: Zap, group: 'Forms', desc: 'Event-driven logic & validation' },
		{ type: 'date_picker', name: 'Date & Time Picker', icon: Clock, group: 'Forms', desc: 'Input tanggal & kalender popup' },
		{ type: 'currency_input', name: 'Currency IDR Input', icon: DollarSign, group: 'Forms', desc: 'Input nominal angka otomatis Rupiah' },
		{ type: 'tabs_container', name: 'Tabs Container', icon: Layout, group: 'Containers', desc: 'Wadah navigasi multi-tab' },
		{ type: 'wizard_progress', name: 'Wizard Step Progress', icon: SquareCheck, group: 'Containers', desc: 'Indikator langkah sekuensial' }
	];

	// 71 UI Kit Parity Controls
	const uikitControls = catalog.map((c) => ({
		type: `kit:${c.id}`,
		name: catalogTitle(c),
		icon: Puzzle,
		group: c.tier.toUpperCase(),
		desc: `[${c.tier.toUpperCase()}] Svelte Kit Component (${c.id})`
	}));

	const allAvailableControls = [...standardControls, ...uikitControls];

	const filteredStandard = $derived(
		standardControls.filter((c) =>
			!toolboxSearch || c.name.toLowerCase().includes(toolboxSearch.toLowerCase()) || c.type.toLowerCase().includes(toolboxSearch.toLowerCase())
		)
	);

	const filteredUiKit = $derived(
		uikitControls.filter((c) =>
			!toolboxSearch || c.name.toLowerCase().includes(toolboxSearch.toLowerCase()) || c.type.toLowerCase().includes(toolboxSearch.toLowerCase())
		)
	);

	async function handleAddComponent(compType: string, customName?: string, datasourceConfig?: Record<string, unknown>) {
		if (!activePage) return;
		const def = allAvailableControls.find((c) => c.type === compType);
		const name = customName || def?.name || 'Komponen Baru';

		try {
			await createComponent({
				page_id: activePage.id,
				name,
				type: compType,
				region: 'main',
				datasource_type: datasourceConfig ? 'table' : 'rpc',
				datasource_config: datasourceConfig || {},
				props: { title: name, catalogId: compType.replace('kit:', '') }
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

	async function handleSaveComponentProperty() {
		if (!selectedComponent) return;
		try {
			await updateComponent({
				component_id: selectedComponent.id,
				name: selectedComponent.name,
				region: selectedComponent.region,
				datasource_type: selectedComponent.datasource_type,
				datasource_config: selectedComponent.datasource_config,
				props: selectedComponent.props
			});
			triggerSaveNotification();
		} catch (e) {
			console.error('Failed to update component:', e);
		}
	}

	async function handleSavePageProperty() {
		if (!activePage) return;
		try {
			await updatePage({
				page_id: activePage.id,
				title: activePage.title,
				slug: activePage.slug,
				layout: activePage.layout || 'single',
				icon: activePage.icon || 'FileText',
				group_name: activePage.group_name || 'Menu Utama',
				parent_slug: activePage.parent_slug || null
			});
			triggerSaveNotification();
		} catch (e) {
			console.error('Failed to update page:', e);
		}
	}

	async function handleSaveAll() {
		if (selectedComponent) {
			await handleSaveComponentProperty();
		}
		if (activePage) {
			await handleSavePageProperty();
		}
	}

	async function handleRunApp() {
		await handleSaveAll();
		onRun?.(activePage?.slug);
	}

	async function handleAddPage() {
		if (!runtimeApp || !newPageTitle || !newPageSlug) return;
		try {
			await createNewPage({
				app_id: runtimeApp.app.id,
				slug: newPageSlug,
				title: newPageTitle,
				layout: newPageLayout,
				group_name: newPageGroup || 'Menu Utama',
				parent_slug: newPageParentSlug || null
			});
			showAddPageModal = false;
			newPageTitle = '';
			newPageSlug = '';
			newPageGroup = 'Menu Utama';
			newPageParentSlug = null;
			await loadApp();
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
		setTimeout(() => (saveSuccess = false), 2500);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'F5') {
			e.preventDefault();
			handleRunApp();
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			handleSaveAll();
		}
	}}
/>

<!-- Visual Basic 6.0 / Visual Studio RAD IDE Main Container -->
<div class="flex h-[calc(100vh-140px)] flex-col rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden font-sans select-none">
	<!-- 1. VISUAL BASIC TOP MENU & TOOLBAR RIBBON -->
	<header class="flex flex-col border-b border-slate-800 bg-slate-900/90 text-xs text-slate-300">
		<!-- Menu Bar Row -->
		<div class="flex items-center justify-between border-b border-slate-800/80 px-3 py-1 text-[11px]">
			<div class="flex items-center gap-4">
				<span class="font-bold text-emerald-400 tracking-wider">GoBudiBase 2.0 RAD Studio</span>
				<nav class="hidden md:flex items-center gap-3 text-slate-400">
					<button type="button" class="hover:text-slate-200">File</button>
					<button type="button" class="hover:text-slate-200">Edit</button>
					<button type="button" class="hover:text-slate-200">View</button>
					<button type="button" onclick={() => (showAddPageModal = true)} class="hover:text-emerald-400 font-semibold">+ Project</button>
					<button type="button" class="hover:text-slate-200">Format</button>
					<button type="button" class="hover:text-slate-200">Debug</button>
					<button type="button" onclick={handleRunApp} class="hover:text-emerald-400 font-semibold">Run (F5)</button>
					<button type="button" class="hover:text-slate-200">Tools</button>
					<button type="button" class="hover:text-slate-200">Window</button>
					<button type="button" class="hover:text-slate-200">Help</button>
				</nav>
			</div>

			<!-- Project Info Badge -->
			<div class="flex items-center gap-2">
				<span class="font-mono text-[10px] text-slate-400">Project:</span>
				<span class="font-semibold text-slate-200">{runtimeApp?.app?.name || appSlug}</span>
				<span class="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[9px] text-emerald-400 border border-slate-700">v{runtimeApp?.app?.version || '1.0.0'}</span>
			</div>
		</div>

		<!-- Command Toolbar Ribbon Row -->
		<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/60">
			<!-- Left Action Buttons -->
			<div class="flex items-center gap-1.5">
				<!-- Return to App Manager -->
				<button
					type="button"
					onclick={onBack}
					class="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition"
					title="Kembali ke App Manager"
				>
					<ArrowLeft class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Apps</span>
				</button>

				<div class="h-4 w-px bg-slate-800 mx-0.5"></div>

				<!-- Save Button -->
				<button
					type="button"
					onclick={handleSaveAll}
					class="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
					title="Save Project (Ctrl+S)"
				>
					<Save class="h-3.5 w-3.5 text-emerald-400" />
					<span>Save</span>
				</button>

				<!-- Add Form/Page Button -->
				<button
					type="button"
					onclick={() => (showAddPageModal = true)}
					class="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700 hover:text-emerald-300 transition cursor-pointer"
					title="Tambah Form Baru (New Page)"
				>
					<Plus class="h-3.5 w-3.5 text-emerald-400" />
					<span>Add Form</span>
				</button>

				<div class="h-4 w-px bg-slate-800 mx-0.5"></div>

				<!-- Classic Visual Basic RUN (F5) Button -->
				<button
					type="button"
					onclick={handleRunApp}
					class="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1 font-bold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
					title="Start Run App (F5)"
				>
					<Play class="h-3.5 w-3.5 fill-current" />
					<span>Start (F5)</span>
				</button>

				<button
					type="button"
					class="rounded bg-slate-800 p-1 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition"
					title="End / Break Execution"
				>
					<Square class="h-3.5 w-3.5" />
				</button>

				<div class="h-4 w-px bg-slate-800 mx-0.5"></div>

				<!-- Active Form Dropdown -->
				<div class="flex items-center gap-1.5 rounded bg-slate-950 px-2 py-0.5 border border-slate-800 text-xs">
					<span class="text-slate-500 font-mono text-[10px]">Form:</span>
					<select
						class="bg-transparent font-semibold text-slate-200 outline-none cursor-pointer"
						value={activePageIndex}
						onchange={(e) => {
							activePageIndex = Number(e.currentTarget.value);
							selectedComponentId = runtimeApp?.pages?.[activePageIndex]?.components?.[0]?.id || null;
						}}
					>
						{#each runtimeApp?.pages || [] as pg, idx}
							<option value={idx} class="bg-slate-900">
								frm_{pg.slug} ({pg.title})
							</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Right Status & Grid Options -->
			<div class="flex items-center gap-3 text-[11px]">
				<!-- Snap to Grid Toggle -->
				<label class="flex items-center gap-1.5 text-slate-400 cursor-pointer">
					<input type="checkbox" bind:checked={snapToGrid} class="accent-emerald-500" />
					<span>Snap Grid (16px)</span>
				</label>

				{#if saveSuccess}
					<span class="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
						<CheckCircle2 class="h-3.5 w-3.5" />
						<span>Tersimpan!</span>
					</span>
				{/if}
			</div>
		</div>
	</header>

	<!-- 2. MAIN VISUAL BASIC 3-COLUMN WORKSPACE -->
	<div class="flex-1 grid grid-cols-12 gap-1.5 p-1.5 overflow-hidden bg-slate-950">
		<!-- ========================================== -->
		<!-- LEFT: VISUAL BASIC TOOLBOX (Col: 3)       -->
		<!-- ========================================== -->
		<aside class="col-span-3 flex flex-col rounded-lg border border-slate-800 bg-slate-900/80 shadow overflow-hidden">
			<!-- Toolbox Title Bar -->
			<div class="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 bg-slate-950/80 text-xs font-bold text-slate-200">
				<div class="flex items-center gap-1.5">
					<Sliders class="h-3.5 w-3.5 text-emerald-400" />
					<span>Toolbox</span>
				</div>
				<span class="font-mono text-[10px] text-slate-500">
					{toolboxTab === 'standard' ? `${standardControls.length} APEX` : toolboxTab === 'uikit' ? `${catalog.length} UI Kit` : `${schemaTables.length} Tables`}
				</span>
			</div>

			<!-- Toolbox Tabs: APEX Standard | UI Kit (71) | DB Schema -->
			<div class="grid grid-cols-3 border-b border-slate-800 text-[10px] font-bold text-center">
				<button
					type="button"
					onclick={() => (toolboxTab = 'standard')}
					class="py-1.5 transition {toolboxTab === 'standard' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
				>
					Standard
				</button>
				<button
					type="button"
					onclick={() => (toolboxTab = 'uikit')}
					class="py-1.5 transition {toolboxTab === 'uikit' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500' : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
				>
					UI Kit (71)
				</button>
				<button
					type="button"
					onclick={() => (toolboxTab = 'tables')}
					class="py-1.5 transition {toolboxTab === 'tables' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
				>
					Database
				</button>
			</div>

			<!-- Search Box -->
			<div class="relative p-2 border-b border-slate-800/80">
				<Search class="absolute left-4 top-3.5 h-3.5 w-3.5 text-slate-500" />
				<input
					type="text"
					bind:value={toolboxSearch}
					placeholder="Cari kontrol..."
					class="w-full rounded border border-slate-800 bg-slate-950 py-1 pl-8 pr-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
				/>
			</div>

			<!-- Classic Pointer Tool -->
			<div class="p-2 border-b border-slate-800/60">
				<div class="flex items-center gap-2 rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 shadow-sm cursor-default">
					<MousePointer class="h-3.5 w-3.5 text-emerald-400" />
					<span>Pointer (Select / Move)</span>
				</div>
			</div>

			<!-- Toolbox Scrollable Item List -->
			<div class="flex-1 overflow-y-auto p-2">
				{#if toolboxTab === 'standard'}
					<!-- 22 APEX Controls -->
					<div class="grid grid-cols-2 gap-1.5">
						{#each filteredStandard as item}
							{@const Icon = item.icon}
							<button
								type="button"
								draggable="true"
								ondragstart={(e) => {
									e.dataTransfer?.setData('text/gobudibase-component', item.type);
									e.dataTransfer?.setData('text/plain', item.name);
								}}
								onclick={() => handleAddComponent(item.type, item.name)}
								class="flex flex-col items-center justify-center rounded border border-slate-800 bg-slate-950/60 p-2 text-center transition hover:border-emerald-500/70 hover:bg-emerald-950/20 group cursor-grab active:cursor-grabbing shadow-sm"
								title="{item.name}: {item.desc}"
							>
								<div class="mb-1 rounded p-1 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition">
									<Icon class="h-4 w-4" />
								</div>
								<span class="text-[10px] font-semibold text-slate-300 group-hover:text-emerald-300 line-clamp-1">
									{item.name}
								</span>
							</button>
						{/each}
					</div>
				{:else if toolboxTab === 'uikit'}
					<!-- 71 Svelte UI Kit Parity Controls -->
					<div class="flex flex-col gap-1">
						{#each filteredUiKit as item}
							<button
								type="button"
								draggable="true"
								ondragstart={(e) => {
									e.dataTransfer?.setData('text/gobudibase-component', item.type);
									e.dataTransfer?.setData('text/plain', item.name);
								}}
								onclick={() => handleAddComponent(item.type, item.name)}
								class="flex items-center justify-between rounded border border-slate-800 bg-slate-950/60 p-1.5 text-left text-xs transition hover:border-indigo-500/70 hover:bg-indigo-950/20 group cursor-grab active:cursor-grabbing"
							>
								<div class="flex items-center gap-1.5 truncate">
									<Puzzle class="h-3.5 w-3.5 text-indigo-400 shrink-0" />
									<span class="text-[11px] font-semibold text-slate-300 group-hover:text-indigo-300 truncate">{item.name}</span>
								</div>
								<span class="rounded bg-slate-800 px-1 py-0.2 font-mono text-[9px] text-slate-400 shrink-0">
									{item.group}
								</span>
							</button>
						{/each}
					</div>
				{:else if toolboxTab === 'tables'}
					<!-- PostgreSQL Schema Tables -->
					<div class="flex flex-col gap-1.5">
						{#each schemaTables as tbl}
							<div class="flex items-center justify-between rounded border border-slate-800 bg-slate-950/60 p-1.5 text-xs">
								<div class="flex items-center gap-1.5 truncate font-mono text-[10px]">
									<Database class="h-3.5 w-3.5 text-slate-500 shrink-0" />
									<span class="text-slate-300 truncate">{tbl.name}</span>
								</div>
								<button
									type="button"
									onclick={() => handleAddTableToPage(tbl)}
									class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-400 hover:bg-amber-600 hover:text-white transition"
									title="Buat Grid dari tabel ini"
								>
									+ Grid
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</aside>

		<!-- ======================================================= -->
		<!-- CENTER: VISUAL BASIC FORM DESIGNER CANVAS (Col: 6)      -->
		<!-- ======================================================= -->
		<main class="col-span-6 flex flex-col rounded-lg border border-slate-800 bg-slate-950 shadow overflow-hidden">
			<!-- Canvas Header Status -->
			<div class="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 bg-slate-900/90 text-xs">
				<div class="flex items-center gap-2">
					<Layout class="h-3.5 w-3.5 text-emerald-400" />
					<span class="font-bold text-slate-200">Form Designer</span>
					<span class="font-mono text-[10px] text-slate-500">[{activePage?.layout || 'single'}]</span>
				</div>
				<div class="flex items-center gap-1 font-mono text-[10px] text-slate-500">
					<span>Grid:</span>
					<span class="text-emerald-400">16x16 Dot Matrix</span>
				</div>
			</div>

			<!-- Visual Basic Workbench Background (Overflow Area) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="flex-1 overflow-auto p-4 flex flex-col items-center bg-slate-950/90 transition-colors {isDraggingOver ? 'bg-emerald-950/20' : ''}"
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
				<!-- THE VISUAL BASIC FORM WINDOW -->
				<div class="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col my-auto transition-all {isDraggingOver ? 'ring-2 ring-emerald-400 border-emerald-500' : ''}">
					<!-- Classic Form Window Title Bar -->
					<div class="flex items-center justify-between bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-900 border-b border-slate-700 px-3 py-1.5 select-none">
						<div class="flex items-center gap-2">
							<div class="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 font-mono text-[9px] font-bold text-white">
								F
							</div>
							<span class="text-xs font-bold text-slate-100">
								Form{activePageIndex + 1}: {activePage?.title || 'Form'} (frm_{activePage?.slug || 'page'}.frm)
							</span>
						</div>

						<!-- Window Buttons: Min, Max, Close -->
						<div class="flex items-center gap-1 text-slate-400">
							<button type="button" class="h-4 w-4 flex items-center justify-center rounded hover:bg-slate-700 hover:text-white text-xs">
								<Minus class="h-3 w-3" />
							</button>
							<button type="button" class="h-4 w-4 flex items-center justify-center rounded hover:bg-slate-700 hover:text-white text-xs">
								<Maximize2 class="h-2.5 w-2.5" />
							</button>
							<button type="button" class="h-4 w-4 flex items-center justify-center rounded hover:bg-rose-900 hover:text-rose-200 text-xs">
								<X class="h-3 w-3" />
							</button>
						</div>
					</div>

					<!-- Form Window Client Canvas (Authentic Dot Grid) -->
					<div
						class="min-h-[460px] p-5 relative overflow-y-auto"
						style="background-image: radial-gradient(#334155 1.5px, transparent 1.5px); background-size: 16px 16px; background-color: rgba(15, 23, 42, 0.95);"
					>
						{#if !activePage?.components || activePage.components.length === 0}
							<!-- Empty Form Placeholder -->
							<div class="flex min-h-[360px] flex-col items-center justify-center rounded border-2 border-dashed border-slate-700/80 bg-slate-950/40 p-6 text-center">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 text-emerald-400 mb-2">
									<Box class="h-5 w-5" />
								</div>
								<h4 class="text-xs font-bold text-slate-200">Form Masih Kosong</h4>
								<p class="text-[11px] text-slate-400 mt-0.5 max-w-sm">
									Tarik (<span class="text-emerald-400 font-semibold">drag & drop</span>) kontrol dari Toolbox di kiri, atau klik pintasan cepat di bawah:
								</p>

								<!-- Quick Add Shortcuts on Empty Form -->
								<div class="mt-4 flex flex-wrap justify-center gap-1.5 max-w-md">
									<button
										type="button"
										onclick={() => handleAddComponent('interactive_grid', 'Data Grid Utama')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-300 transition"
									>
										+ Interactive Grid
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('kanban', 'Papan Kanban')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-500 hover:bg-purple-950/30 hover:text-purple-300 transition"
									>
										+ Kanban
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('shuttle', 'Selector Shuttle')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-amber-500 hover:bg-amber-950/30 hover:text-amber-300 transition"
									>
										+ Shuttle
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('popup_lov', 'Popup LOV Modal')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-cyan-500 hover:bg-cyan-950/30 hover:text-cyan-300 transition"
									>
										+ Popup LOV
									</button>
								</div>
							</div>
						{:else}
							<!-- Stack of Controls on Form -->
							<div class="flex flex-col gap-3">
								{#each activePage.components as comp}
									{@const isSelected = selectedComponentId === comp.id}
									<!-- Control Container with VB Selection Bounding Box Handles -->
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="relative rounded border bg-slate-950/80 p-3 transition cursor-pointer {isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-xl' : 'border-slate-700/80 hover:border-slate-600'}"
										onclick={() => (selectedComponentId = comp.id)}
									>
										<!-- VB 8 Classic Grab Handles when selected -->
										{#if isSelected}
											<div class="absolute -top-1.5 -left-1.5 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute -top-1.5 -right-1.5 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute top-1/2 -right-1.5 -translate-y-1/2 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 bg-white border border-black shadow"></div>
											<div class="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white border border-black shadow"></div>
										{/if}

										<!-- Control Header Bar -->
										<div class="mb-2 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
											<div class="flex items-center gap-2">
												<span class="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-400 uppercase border border-emerald-500/30">
													{comp.type}
												</span>
												<h5 class="text-xs font-bold text-slate-100">{comp.name}</h5>
											</div>
											<div class="flex items-center gap-2">
												<span class="font-mono text-[9px] text-slate-500">Source: {comp.datasource_type}</span>
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														handleDeleteComponent(comp.id);
													}}
													class="rounded p-1 text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 transition"
													title="Hapus kontrol dari Form"
												>
													<Trash2 class="h-3 w-3" />
												</button>
											</div>
										</div>

										<!-- Wireframe Simulation inside Form -->
										<div class="rounded border border-slate-800/60 bg-slate-900/60 p-3">
											{#if comp.type === 'interactive_grid'}
												<div class="flex flex-col gap-1.5">
													<div class="flex items-center justify-between text-xs">
														<span class="font-semibold text-slate-300">Data Grid [100k Records]</span>
														<span class="font-mono text-[9px] text-emerald-400">Sort • Filter • Inline Edit</span>
													</div>
													<div class="h-14 rounded bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500">
														[ InteractiveGrid Control ]
													</div>
												</div>
											{:else if comp.type === 'kanban'}
												<div class="grid grid-cols-3 gap-1.5">
													<div class="rounded bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-slate-400 text-center">Backlog</div>
													<div class="rounded bg-slate-950 border border-purple-900/50 p-1.5 text-[9px] text-purple-300 text-center">In Progress</div>
													<div class="rounded bg-slate-950 border border-emerald-900/50 p-1.5 text-[9px] text-emerald-300 text-center">Done</div>
												</div>
											{:else if comp.type === 'shuttle'}
												<div class="grid grid-cols-5 gap-1.5 items-center">
													<div class="col-span-2 rounded bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-slate-400 text-center">Tersedia</div>
													<div class="col-span-1 text-center text-amber-400 font-bold text-xs">⇄</div>
													<div class="col-span-2 rounded bg-slate-950 border border-amber-900/40 p-1.5 text-[9px] text-amber-300 text-center">Terpilih</div>
												</div>
											{:else if comp.type === 'popup_lov'}
												<div class="flex items-center justify-between rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-300 font-mono">
													<span>[Lookup Dialog Foreign Key]</span>
													<span class="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-cyan-400 font-bold">🔍 Cari</span>
												</div>
											{:else if comp.type === 'button' || comp.type === 'kit:button'}
												<div class="flex items-center py-1">
													<button
														type="button"
														class="rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow transition cursor-default {comp.props?.variant === 'danger' || comp.props?.variant === 'destructive' ? 'bg-rose-600' : comp.props?.variant === 'secondary' ? 'bg-slate-800 border border-slate-700 text-slate-200' : comp.props?.variant === 'outline' ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'bg-emerald-600'}"
													>
														{comp.props?.title || comp.name || 'Button'}
													</button>
												</div>
											{:else if comp.type === 'badge' || comp.type === 'kit:badge'}
												<div class="flex items-center py-1">
													<span class="rounded-full px-3 py-0.5 text-xs font-bold {comp.props?.variant === 'destructive' || comp.props?.variant === 'danger' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : comp.props?.variant === 'secondary' ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
														{comp.props?.title || comp.name || 'Badge'}
													</span>
												</div>
											{:else if comp.type === 'input' || comp.type === 'kit:input' || comp.type === 'kit:text-item'}
												<div class="flex flex-col gap-1 max-w-sm py-1">
													<span class="text-[11px] font-semibold text-slate-300">{comp.props?.title || comp.name}</span>
													<div class="h-7 rounded bg-slate-950 border border-slate-800 px-2.5 flex items-center text-xs text-slate-400 font-mono">
														{comp.props?.placeholder || 'Ketik nilai...'}
													</div>
												</div>
											{:else if comp.type === 'label' || comp.type === 'kit:label' || comp.type === 'kit:typography'}
												<div class="py-1">
													<span class="text-xs font-semibold text-slate-200">{comp.props?.title || comp.name}</span>
												</div>
											{:else if comp.type === 'checkbox' || comp.type === 'kit:checkbox'}
												<div class="flex items-center gap-2 py-1 text-xs text-slate-200">
													<div class="h-4 w-4 rounded border border-slate-700 bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-[10px]">✓</div>
													<span>{comp.props?.title || comp.name}</span>
												</div>
											{:else if comp.type === 'switch' || comp.type === 'kit:switch'}
												<div class="flex items-center gap-2 py-1 text-xs text-slate-200">
													<div class="h-4 w-7 rounded-full bg-emerald-600 p-0.5 flex justify-end">
														<div class="h-3 w-3 rounded-full bg-white"></div>
													</div>
													<span>{comp.props?.title || comp.name}</span>
												</div>
											{:else if comp.type === 'alert' || comp.type === 'kit:alert'}
												<div class="flex items-center gap-2 rounded bg-amber-950/20 border border-amber-500/30 p-2 text-xs text-amber-200">
													<span class="font-bold">⚠️ {comp.props?.title || comp.name}</span>
												</div>
											{:else if comp.type.startsWith('kit:')}
												<div class="flex items-center justify-between text-xs">
													<span class="font-semibold text-indigo-300">{comp.name}</span>
													<span class="rounded bg-indigo-500/20 px-1.5 py-0.2 font-mono text-[9px] text-indigo-300 uppercase">
														{comp.type.replace('kit:', '')}
													</span>
												</div>
											{:else}
												<div class="h-10 rounded bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400">
													[ {comp.name} : {comp.type} ]
												</div>
											{/if}
										</div>
									</div>
								{/each}

								<!-- Drop / Add Next Control Strip -->
								<div class="flex items-center justify-between rounded border border-dashed border-slate-700/80 p-2 text-slate-500 text-xs hover:border-slate-600 transition">
									<div class="flex items-center gap-1.5">
										<Plus class="h-3.5 w-3.5 text-emerald-400" />
										<span>Tarik kontrol ke sini untuk menambah</span>
									</div>
									<div class="flex items-center gap-1">
										<button
											type="button"
											onclick={() => handleAddComponent('button', 'Tombol Aksi')}
											class="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-600 hover:text-white transition font-semibold"
										>
											+ Button
										</button>
										<button
											type="button"
											onclick={() => handleAddComponent('interactive_grid', 'Grid Baru')}
											class="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-emerald-600 hover:text-white transition"
										>
											+ Grid
										</button>
										<button
											type="button"
											onclick={() => handleAddComponent('kanban', 'Kanban Baru')}
											class="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-purple-600 hover:text-white transition"
										>
											+ Kanban
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</main>

		<!-- ============================================================== -->
		<!-- RIGHT: PROJECT EXPLORER (Top) & PROPERTIES WINDOW (Bottom)     -->
		<!-- ============================================================== -->
		<aside class="col-span-3 flex flex-col gap-1.5 overflow-hidden">
			<!-- TOP: VISUAL BASIC PROJECT EXPLORER WINDOW (Height: 40%) -->
			<div class="h-[42%] flex flex-col rounded-lg border border-slate-800 bg-slate-900/80 shadow overflow-hidden">
				<div class="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 bg-slate-950/80 text-xs font-bold text-slate-200">
					<div class="flex items-center gap-1.5">
						<FolderTree class="h-3.5 w-3.5 text-emerald-400" />
						<span>Project Explorer</span>
					</div>
					<button
						type="button"
						onclick={() => (showAddPageModal = true)}
						class="text-emerald-400 hover:text-emerald-300 font-bold"
						title="Add Form"
					>
						+ Form
					</button>
				</div>

				<!-- Project Tree Hierarchy -->
				<div class="flex-1 overflow-y-auto p-2 text-xs font-mono">
					<!-- Root Project -->
					<div class="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
						<Folder class="h-3.5 w-3.5 text-amber-400" />
						<span>Project1 ({runtimeApp?.app.slug || appSlug})</span>
					</div>

					<!-- Forms Branch Grouped by Menu Groups -->
					<div class="pl-2 flex flex-col gap-1.5">
						<div class="flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
							<ChevronDown class="h-3 w-3" />
							<span>Menu & Forms ({runtimeApp?.pages?.length || 0})</span>
						</div>

						<div class="pl-2 flex flex-col gap-2">
							{#each Object.entries(formsByGroup) as [groupName, groupPages]}
								<div class="flex flex-col gap-1">
									<div class="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider pr-1">
										<div class="flex items-center gap-1 truncate">
											<Folder class="h-3 w-3 text-amber-500/80 shrink-0" />
											<span class="truncate">{groupName}</span>
										</div>
										<span class="rounded bg-slate-800 px-1 py-0.2 text-[8px] font-mono text-slate-400 shrink-0">
											{groupPages.length}
										</span>
									</div>

									<div class="pl-2 flex flex-col gap-0.5 border-l border-slate-800/80 ml-1">
										{#each groupPages as { pg, idx }}
											{@const isActiveForm = activePageIndex === idx}
											{@const isSubMenu = !!pg.parent_slug}
											<div class="flex flex-col {isSubMenu ? 'pl-2.5' : ''}">
												<button
													type="button"
													onclick={() => {
														activePageIndex = idx;
														selectedComponentId = pg.components?.[0]?.id || null;
													}}
													class="flex items-center justify-between rounded px-2 py-1 text-left transition {isActiveForm ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}"
												>
													<div class="flex items-center gap-1.5 truncate">
														{#if isSubMenu}
															<span class="text-teal-400 font-bold text-[10px]">↳</span>
														{/if}
														<FileText class="h-3 w-3 shrink-0 {isSubMenu ? 'text-teal-400' : 'text-slate-400'}" />
														<span class="truncate">frm_{pg.slug}</span>
													</div>
													<span class="text-[9px] opacity-75 shrink-0">({pg.components?.length || 0})</span>
												</button>

												<!-- Components under Active Form -->
												{#if isActiveForm && pg.components && pg.components.length > 0}
													<div class="pl-4 flex flex-col gap-0.5 border-l border-slate-800 my-0.5">
														{#each pg.components as comp}
															{@const isCompSelected = selectedComponentId === comp.id}
															<button
																type="button"
																onclick={() => (selectedComponentId = comp.id)}
																class="flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-[10px] transition {isCompSelected ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}"
															>
																<span class="text-slate-500">•</span>
																<span class="truncate">{comp.name}</span>
															</button>
														{/each}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- BOTTOM: VISUAL BASIC PROPERTIES WINDOW (Height: 58%) -->
			<div class="h-[58%] flex flex-col rounded-lg border border-slate-800 bg-slate-900/80 shadow overflow-hidden">
				<!-- Window Title Bar -->
				<div class="flex items-center justify-between border-b border-slate-800 px-3 py-1 bg-slate-950/80 text-xs font-bold text-slate-200">
					<div class="flex items-center gap-1.5">
						<Sliders class="h-3.5 w-3.5 text-emerald-400" />
						<span>Properties - {selectedComponent ? selectedComponent.name : activePage?.title || 'Form'}</span>
					</div>
				</div>

				<!-- Object Selector Combo -->
				<div class="border-b border-slate-800 p-1.5 bg-slate-950/60">
					<select
						class="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
						value={selectedComponentId || 'form'}
						onchange={(e) => {
							const val = e.currentTarget.value;
							if (val === 'form') {
								selectedComponentId = null;
							} else {
								selectedComponentId = Number(val);
							}
						}}
					>
						<option value="form">Form1: {activePage?.title || 'Form'} (Form)</option>
						{#each activePage?.components || [] as c}
							<option value={c.id}>{c.name} ({c.type})</option>
						{/each}
					</select>
				</div>

				<!-- Property Tabs: Categorized | Alphabetic -->
				<div class="grid grid-cols-2 border-b border-slate-800 text-[10px] font-bold text-center">
					<button
						type="button"
						onclick={() => (propertyTab = 'categorized')}
						class="py-1 transition {propertyTab === 'categorized' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-950/60 text-slate-400'}"
					>
						Categorized
					</button>
					<button
						type="button"
						onclick={() => (propertyTab = 'alphabetic')}
						class="py-1 transition {propertyTab === 'alphabetic' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-950/60 text-slate-400'}"
					>
						Alphabetic
					</button>
				</div>

				<!-- Visual Basic 2-Column Property Grid Table -->
				<div class="flex-1 overflow-y-auto text-xs">
					{#if selectedComponent}
						<table class="w-full border-collapse text-left">
							<tbody>
								<!-- (Name) Property -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: '(Name)', desc: 'Menentukan pengenal simbolik unik komponen dalam kode dan runtime.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										(Name)
									</td>
									<td class="px-2 py-1">
										<input
											type="text"
											bind:value={selectedComponent.name}
											onblur={handleSaveComponentProperty}
											class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
										/>
									</td>
								</tr>

								<!-- Caption / Title Property -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Caption', desc: 'Teks judul atau label yang terlihat pada header tampilan kontrol.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Caption
									</td>
									<td class="px-2 py-1">
										<input
											type="text"
											value={(selectedComponent.props?.title as string) || selectedComponent.name}
											oninput={(e) => {
												if (!selectedComponent.props) selectedComponent.props = {};
												selectedComponent.props.title = e.currentTarget.value;
												selectedComponent.name = e.currentTarget.value;
											}}
											onblur={handleSaveComponentProperty}
											class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
										/>
									</td>
								</tr>

								<!-- Variant / Style Property for Buttons, Badges, etc. -->
								{#if selectedComponent.type === 'button' || selectedComponent.type === 'kit:button' || selectedComponent.type === 'badge' || selectedComponent.type === 'kit:badge'}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<tr
										class="border-b border-slate-800/80 hover:bg-slate-800/40"
										onclick={() => (activePropertyHelp = { title: 'Variant', desc: 'Gaya tampilan visual kontrol: default (Primary Emerald), secondary (Slate), destructive (Rose), outline.' })}
									>
										<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
											Variant
										</td>
										<td class="px-2 py-1">
											<select
												value={(selectedComponent.props?.variant as string) || 'default'}
												onchange={(e) => {
													if (!selectedComponent.props) selectedComponent.props = {};
													selectedComponent.props.variant = e.currentTarget.value;
													handleSaveComponentProperty();
												}}
												class="w-full bg-slate-950 text-emerald-400 outline-none cursor-pointer border border-slate-800 rounded px-1 py-0.5"
											>
												<option value="default">default (Primary Emerald)</option>
												<option value="secondary">secondary (Slate)</option>
												<option value="destructive">destructive (Rose/Danger)</option>
												<option value="outline">outline (Border)</option>
											</select>
										</td>
									</tr>
								{/if}

								<!-- Placeholder Property for Inputs -->
								{#if selectedComponent.type === 'input' || selectedComponent.type === 'kit:input' || selectedComponent.type === 'kit:text-item'}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<tr
										class="border-b border-slate-800/80 hover:bg-slate-800/40"
										onclick={() => (activePropertyHelp = { title: 'Placeholder', desc: 'Teks panduan abu-abu di dalam kotak input sebelum pengguna mengetik.' })}
									>
										<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
											Placeholder
										</td>
										<td class="px-2 py-1">
											<input
												type="text"
												value={(selectedComponent.props?.placeholder as string) || ''}
												oninput={(e) => {
													if (!selectedComponent.props) selectedComponent.props = {};
													selectedComponent.props.placeholder = e.currentTarget.value;
												}}
												onblur={handleSaveComponentProperty}
												class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
											/>
										</td>
									</tr>
								{/if}

								<!-- Type (Read-Only) -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Type', desc: 'Tipe definisi kontrol APEX / UI Kit komponen yang sedang aktif.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Type
									</td>
									<td class="px-2 py-1 font-mono text-[11px] text-emerald-400">
										{selectedComponent.type}
									</td>
								</tr>

								<!-- DataSource Property -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'DataSource', desc: 'Sumber data pengisi tabel (PostgreSQL 17 Table / Stored Procedure RPC).' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										DataSource
									</td>
									<td class="px-2 py-1">
										<select
											bind:value={selectedComponent.datasource_type}
											onchange={handleSaveComponentProperty}
											class="w-full bg-transparent text-slate-200 outline-none cursor-pointer"
										>
											<option value="table" class="bg-slate-900">PostgreSQL Table</option>
											<option value="rpc" class="bg-slate-900">RPC Procedure</option>
											<option value="none" class="bg-slate-900">None / Static</option>
										</select>
									</td>
								</tr>

								<!-- Region Property -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Region', desc: 'Zona penempatan kontrol dalam layout halaman (main, header, footer).' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Region
									</td>
									<td class="px-2 py-1">
										<input
											type="text"
											bind:value={selectedComponent.region}
											onblur={handleSaveComponentProperty}
											class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
										/>
									</td>
								</tr>

								<!-- Visible Property -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Visible', desc: 'Menentukan apakah kontrol dirender dan terlihat di runtime.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Visible
									</td>
									<td class="px-2 py-1 text-slate-300 font-mono text-[11px]">
										True
									</td>
								</tr>

								<!-- Enabled Property -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Enabled', desc: 'Menentukan apakah kontrol menerima interaksi klik dan ketukan pengguna.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Enabled
									</td>
									<td class="px-2 py-1 text-slate-300 font-mono text-[11px]">
										True
									</td>
								</tr>
							</tbody>
						</table>
					{:else if activePage}
						<!-- Form Properties -->
						<table class="w-full border-collapse text-left">
							<tbody>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: '(Name)', desc: 'Slug identitas unik URL form/halaman aktif.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										(Name)
									</td>
									<td class="px-2 py-1 font-mono text-slate-200">
										<input
											type="text"
											bind:value={activePage.slug}
											onblur={handleSavePageProperty}
											class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded font-mono"
										/>
									</td>
								</tr>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Caption', desc: 'Judul tab atau navigasi form di runtime aplikasi.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Caption
									</td>
									<td class="px-2 py-1">
										<input
											type="text"
											bind:value={activePage.title}
											onblur={handleSavePageProperty}
											class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded font-semibold"
										/>
									</td>
								</tr>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'Layout', desc: 'Susunan tata letak kontrol form: single (1 kolom bertumpuk) atau split-2 (2 kolom grid).' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Layout
									</td>
									<td class="px-2 py-1">
										<select
											bind:value={activePage.layout}
											onchange={handleSavePageProperty}
											class="w-full bg-slate-950 text-emerald-400 border border-slate-800 rounded px-1 py-0.5 outline-none cursor-pointer text-xs"
										>
											<option value="single">single (1 Kolom Stacked)</option>
											<option value="split-2">split-2 (2 Kolom Grid)</option>
										</select>
									</td>
								</tr>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'MenuGroup', desc: 'Kategori atau nama section menu grup di navigasi (contoh: Operasional & Fisik, Analitika & Monitoring).' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										MenuGroup
									</td>
									<td class="px-2 py-1">
										<input
											type="text"
											bind:value={activePage.group_name}
											onblur={handleSavePageProperty}
											placeholder="Menu Utama"
											list="group-presets"
											class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded font-mono text-xs"
										/>
										<datalist id="group-presets">
											<option value="Operasional & Fisik">Operasional & Fisik</option>
											<option value="Analitika & Monitoring">Analitika & Monitoring</option>
											<option value="Kustom & Pengujian">Kustom & Pengujian</option>
											<option value="Menu Utama">Menu Utama</option>
										</datalist>
									</td>
								</tr>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<tr
									class="border-b border-slate-800/80 hover:bg-slate-800/40"
									onclick={() => (activePropertyHelp = { title: 'SubMenuOf', desc: 'Jadikan halaman ini sub-menu bertingkat di bawah halaman induk yang dipilih.' })}
								>
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										SubMenuOf
									</td>
									<td class="px-2 py-1">
										<select
											bind:value={activePage.parent_slug}
											onchange={handleSavePageProperty}
											class="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-1 py-0.5 outline-none cursor-pointer text-xs"
										>
											<option value={null}>(None - Top Level Menu)</option>
											{#each runtimeApp?.pages.filter((p) => p.slug !== activePage?.slug && !p.parent_slug) || [] as parentCandidate}
												<option value={parentCandidate.slug}>
													↳ {parentCandidate.title} ({parentCandidate.slug})
												</option>
											{/each}
										</select>
									</td>
								</tr>
								<tr class="border-b border-slate-800/80 hover:bg-slate-800/40">
									<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
										Controls
									</td>
									<td class="px-2 py-1 font-mono text-slate-300">
										{activePage.components?.length || 0} items
									</td>
								</tr>
							</tbody>
						</table>
					{/if}
				</div>

				<!-- Classic VB Property Help Description Box -->
				<div class="border-t border-slate-800 p-2 bg-slate-950/90 text-[10px]">
					<strong class="text-slate-200 block">{activePropertyHelp.title}</strong>
					<p class="text-slate-400 leading-tight mt-0.5">{activePropertyHelp.desc}</p>
				</div>
			</div>
		</aside>
	</div>

	<!-- 3. VISUAL BASIC STATUS BAR (Bottom) -->
	<footer class="h-6 px-3 flex items-center justify-between border-t border-slate-800 bg-slate-900/90 text-[10px] font-mono text-slate-400 select-none">
		<div class="flex items-center gap-4">
			<span class="text-emerald-400 font-semibold">● Ready</span>
			<span>Form: frm_{activePage?.slug || 'page'}</span>
			<span>Selected: {selectedComponent ? `${selectedComponent.name} [${selectedComponent.type}]` : 'Form Canvas'}</span>
		</div>
		<div class="flex items-center gap-4">
			<span>Controls: {activePage?.components?.length || 0}</span>
			<span>Snap: {snapToGrid ? '16x16 px' : 'Off'}</span>
			<span class="text-slate-300">PostgreSQL 17.11 (Pool: 30)</span>
		</div>
	</footer>
</div>

<!-- Modal Add Page (Form) -->
{#if showAddPageModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-sm font-bold text-slate-100 flex items-center gap-1.5">
					<Plus class="h-4 w-4 text-emerald-400" />
					<span>Add New Form (Page)</span>
				</h3>
				<button type="button" onclick={() => (showAddPageModal = false)} class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">&times;</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleAddPage(); }} class="mt-4 flex flex-col gap-3 text-xs">
				<div class="flex flex-col gap-1">
					<label for="new-page-title" class="font-semibold text-slate-300">Form Caption (Judul)</label>
					<input
						id="new-page-title"
						type="text"
						bind:value={newPageTitle}
						placeholder="contoh: Master Data Aset"
						oninput={() => { newPageSlug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }}
						required
						class="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-page-slug" class="font-semibold text-slate-300">Form Name (Slug)</label>
					<input
						id="new-page-slug"
						type="text"
						bind:value={newPageSlug}
						required
						class="rounded border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-page-layout" class="font-semibold text-slate-300">Layout</label>
					<select
						id="new-page-layout"
						bind:value={newPageLayout}
						class="rounded border border-slate-800 bg-slate-950 px-2 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
					>
						<option value="single">Single Column</option>
						<option value="split-2">Split 2 Columns</option>
						<option value="dashboard-4">Dashboard 4 Widgets</option>
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-page-group" class="font-semibold text-slate-300">Menu Group</label>
					<input
						id="new-page-group"
						type="text"
						bind:value={newPageGroup}
						placeholder="Menu Utama"
						list="new-group-presets"
						class="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
					/>
					<datalist id="new-group-presets">
						<option value="Operasional & Fisik">Operasional & Fisik</option>
						<option value="Analitika & Monitoring">Analitika & Monitoring</option>
						<option value="Kustom & Pengujian">Kustom & Pengujian</option>
						<option value="Menu Utama">Menu Utama</option>
					</datalist>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-page-parent" class="font-semibold text-slate-300">Sub-Menu Of (Parent Form)</label>
					<select
						id="new-page-parent"
						bind:value={newPageParentSlug}
						class="rounded border border-slate-800 bg-slate-950 px-2 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
					>
						<option value={null}>(None - Top Level Menu)</option>
						{#each runtimeApp?.pages.filter((p) => !p.parent_slug) || [] as p}
							<option value={p.slug}>↳ {p.title} ({p.slug})</option>
						{/each}
					</select>
				</div>

				<div class="mt-3 flex justify-end gap-2 border-t border-slate-800 pt-3">
					<button type="button" onclick={() => (showAddPageModal = false)} class="rounded px-3 py-1.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">Batal</button>
					<button type="submit" class="rounded bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500">Create Form</button>
				</div>
			</form>
		</div>
	</div>
{/if}
