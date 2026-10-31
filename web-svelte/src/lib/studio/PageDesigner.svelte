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
		AlertTriangle,
		BarChart3,
		Blocks,
		Upload,
		Sparkles
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
	let toolboxTab = $state<'standard' | 'uikit' | 'tables' | 'budibase'>('standard');
	let toolboxSearch = $state('');

	// Visual Basic Property Grid State
	let propertyTab = $state<'categorized' | 'alphabetic'>('categorized');
	let collapsedCategories = $state<Record<string, boolean>>({});
	function toggleCategory(cat: string) {
		collapsedCategories[cat] = !collapsedCategories[cat];
	}
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
	let newPageLayout = $state('free');
	let newPageGroup = $state('Menu Utama');
	let newPageParentSlug = $state<string | null>(null);
	// Screen Wizard mode
	let wizardMode = $state<'blank' | 'auto-crud'>('blank');
	let wizardTable = $state<string>('');

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
		{ type: 'textarea', name: 'TextArea (Multiline)', icon: FileText, group: 'Standard Controls', desc: 'Kotak input teks multi-baris untuk deskripsi/catatan' },
		{ type: 'select', name: 'Dropdown Select', icon: ChevronDown, group: 'Standard Controls', desc: 'Pemilih opsi dropdown tunggal' },
		{ type: 'label', name: 'Label', icon: Type, group: 'Standard Controls', desc: 'Teks statis judul atau keterangan form' },
		{ type: 'badge', name: 'StatusBadge', icon: Tag, group: 'Standard Controls', desc: 'Badge penanda status warna-warni' },
		{ type: 'checkbox', name: 'CheckBox', icon: CheckSquare, group: 'Standard Controls', desc: 'Kotak centang boolean Ya/Tidak' },
		{ type: 'switch', name: 'ToggleSwitch', icon: ToggleLeft, group: 'Standard Controls', desc: 'Saklar On/Off interaktif' },
		{ type: 'file_upload', name: 'File Upload / Attachment', icon: Upload, group: 'Standard Controls', desc: 'Unggah file atau lampiran dokumen' },
		{ type: 'card', name: 'Frame / Card', icon: Square, group: 'Standard Controls', desc: 'Wadah panel kartu pengelompok elemen form' },
		{ type: 'alert', name: 'AlertCallout', icon: AlertTriangle, group: 'Standard Controls', desc: 'Kotak peringatan pesan atau status' },
		{ type: 'date_picker', name: 'DatePicker', icon: Calendar, group: 'Standard Controls', desc: 'Pemilih tanggal tunggal sederhana (Single Date Input)' },
		{ type: 'date_range_picker', name: 'Date Range Picker', icon: Calendar, group: 'Standard Controls', desc: 'Pemilih rentang tanggal (Dari & Sampai Tanggal)' },

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

	// Budibase Blocks
	const budibaseBlocks = [
		{ type: 'data_provider',    name: 'Data Provider',    icon: Database,    group: 'Blocks', desc: 'Fetch data dari tabel/RPC, expose ke child components' },
		{ type: 'table_block',      name: 'Table Block',      icon: Grid3X3,     group: 'Blocks', desc: 'Auto-generate tabel dari schema dengan search, sort, paginate' },
		{ type: 'form_block',       name: 'Form Block',       icon: Layout,      group: 'Blocks', desc: 'Auto-generate form input dari column types' },
		{ type: 'cards_repeater',   name: 'Cards Repeater',   icon: LayoutGrid,  group: 'Blocks', desc: 'Repeat card template untuk setiap row data' },
		{ type: 'chart_block',      name: 'Chart Block',      icon: BarChart3,   group: 'Blocks', desc: 'Bar/Line/Pie/Donut chart dari data binding' },
		{ type: 'container_section',name: 'Container/Section',icon: Square,      group: 'Blocks', desc: 'Layout container dengan padding, background, border' },
	];

	const allAvailableControls = [...standardControls, ...budibaseBlocks, ...uikitControls];

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

	const filteredBudibase = $derived(
		budibaseBlocks.filter((c) =>
			!toolboxSearch || c.name.toLowerCase().includes(toolboxSearch.toLowerCase()) || c.desc.toLowerCase().includes(toolboxSearch.toLowerCase())
		)
	);

	function getCompBounds(comp: RuntimeComponent, index: number) {
		const left = typeof comp.props?.left === 'number' ? comp.props.left : 24 + ((index % 3) * 32);
		const top = typeof comp.props?.top === 'number' ? comp.props.top : 24 + (index * 72);
		const width = typeof comp.props?.width === 'number' ? comp.props.width : (
			comp.type.includes('button') ? 160 :
			comp.type.includes('badge') ? 120 :
			comp.type.includes('switch') || comp.type.includes('checkbox') ? 180 :
			comp.type.includes('grid') || comp.type.includes('table') ? 660 :
			comp.type.includes('kanban') ? 660 :
			comp.type.includes('cards') ? 640 :
			comp.type.includes('chart') ? 500 :
			comp.type.includes('form') ? 520 :
			comp.type.includes('container') ? 660 :
			comp.type.includes('data_provider') ? 480 :
			comp.type.includes('date_range') || comp.type.includes('date-picker-item') ? 420 :
			comp.type.includes('date') ? 260 :
			comp.type.includes('textarea') ? 360 :
			comp.type.includes('select') ? 280 :
			comp.type.includes('file') ? 340 :
			comp.type.includes('input') || comp.type.includes('text-item') ? 320 : 360
		);
		const height = typeof comp.props?.height === 'number' ? comp.props.height : (
			comp.type.includes('button') || comp.type.includes('badge') ? 52 :
			comp.type.includes('input') || comp.type.includes('text-item') ? 72 :
			comp.type.includes('date_range') || comp.type.includes('date-picker-item') ? 130 :
			comp.type.includes('date') ? 70 :
			comp.type.includes('grid') || comp.type.includes('table') ? 240 :
			comp.type.includes('kanban') ? 220 :
			comp.type.includes('cards') ? 260 :
			comp.type.includes('chart') ? 220 :
			comp.type.includes('form') ? 340 :
			comp.type.includes('container') ? 240 :
			comp.type.includes('data_provider') ? 160 :
			comp.type.includes('textarea') ? 110 :
			comp.type.includes('select') ? 70 :
			comp.type.includes('file') ? 120 : 84
		);
		return { left, top, width, height };
	}

	let canvasLayoutMode = $state<'vb' | 'flow'>('vb'); // Visual Basic absolute vs flow stack

	let isDraggingComponent = $state(false);
	let dragTargetCompId = $state<number | null>(null);
	let dragStartX = 0;
	let dragStartY = 0;
	let compStartLeft = 0;
	let compStartTop = 0;

	let isResizing = $state(false);
	let resizeTargetCompId = $state<number | null>(null);
	let resizeHandle = $state<string | null>(null);
	let resizeStartX = 0;
	let resizeStartY = 0;
	let compStartWidth = 0;
	let compStartHeight = 0;

	function handleStartMove(e: MouseEvent, comp: RuntimeComponent, index: number) {
		if (e.button !== 0) return;
		selectedComponentId = comp.id;
		isDraggingComponent = true;
		dragTargetCompId = comp.id;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		const bounds = getCompBounds(comp, index);
		compStartLeft = bounds.left;
		compStartTop = bounds.top;

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleStartResize(e: MouseEvent, comp: RuntimeComponent, handle: string, index: number) {
		e.stopPropagation();
		e.preventDefault();
		selectedComponentId = comp.id;
		isResizing = true;
		resizeTargetCompId = comp.id;
		resizeHandle = handle;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		const bounds = getCompBounds(comp, index);
		compStartLeft = bounds.left;
		compStartTop = bounds.top;
		compStartWidth = bounds.width;
		compStartHeight = bounds.height;

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDraggingComponent && dragTargetCompId) {
			const comp = activePage?.components.find((c) => c.id === dragTargetCompId);
			if (!comp) return;
			if (!comp.props) comp.props = {};

			const deltaX = e.clientX - dragStartX;
			const deltaY = e.clientY - dragStartY;

			let newLeft = Math.max(0, compStartLeft + deltaX);
			let newTop = Math.max(0, compStartTop + deltaY);

			if (snapToGrid) {
				newLeft = Math.round(newLeft / 16) * 16;
				newTop = Math.round(newTop / 16) * 16;
			}

			comp.props.left = newLeft;
			comp.props.top = newTop;
		} else if (isResizing && resizeTargetCompId && resizeHandle) {
			const comp = activePage?.components.find((c) => c.id === resizeTargetCompId);
			if (!comp) return;
			if (!comp.props) comp.props = {};

			const deltaX = e.clientX - resizeStartX;
			const deltaY = e.clientY - resizeStartY;

			let newWidth = compStartWidth;
			let newHeight = compStartHeight;
			let newLeft = compStartLeft;
			let newTop = compStartTop;

			// Horizontal resizing
			if (resizeHandle.includes('e')) {
				newWidth = Math.max(64, compStartWidth + deltaX);
				if (snapToGrid) newWidth = Math.round(newWidth / 16) * 16;
			} else if (resizeHandle.includes('w')) {
				newWidth = Math.max(64, compStartWidth - deltaX);
				if (snapToGrid) {
					newWidth = Math.round(newWidth / 16) * 16;
					newLeft = Math.max(0, compStartLeft + (compStartWidth - newWidth));
				} else {
					newLeft = Math.max(0, compStartLeft + deltaX);
				}
			}

			// Vertical resizing
			if (resizeHandle.includes('s')) {
				newHeight = Math.max(36, compStartHeight + deltaY);
				if (snapToGrid) newHeight = Math.round(newHeight / 16) * 16;
			} else if (resizeHandle.includes('n')) {
				newHeight = Math.max(36, compStartHeight - deltaY);
				if (snapToGrid) {
					newHeight = Math.round(newHeight / 16) * 16;
					newTop = Math.max(0, compStartTop + (compStartHeight - newHeight));
				} else {
					newTop = Math.max(0, compStartTop + deltaY);
				}
			}

			comp.props.width = newWidth;
			comp.props.height = newHeight;
			comp.props.left = newLeft;
			comp.props.top = newTop;
		}
	}

	function handleMouseUp() {
		if (isDraggingComponent || isResizing) {
			isDraggingComponent = false;
			dragTargetCompId = null;
			isResizing = false;
			resizeTargetCompId = null;
			resizeHandle = null;
			debounceSaveProperty();
		}
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	async function handleAddComponent(compType: string, customName?: string, datasourceConfig?: Record<string, unknown>, dropX?: number, dropY?: number) {
		if (!activePage) return;
		const def = allAvailableControls.find((c) => c.type === compType);
		const name = customName || def?.name || 'Komponen Baru';

		const count = activePage.components?.length || 0;
		const left = typeof dropX === 'number' ? dropX : 24 + ((count % 3) * 32);
		const top = typeof dropY === 'number' ? dropY : 24 + (count * 72);
		const width = compType.includes('button') ? 160 :
			compType.includes('badge') ? 120 :
			compType.includes('switch') || compType.includes('checkbox') ? 180 :
			compType.includes('grid') || compType.includes('table') ? 660 :
			compType.includes('kanban') ? 660 :
			compType.includes('chart') ? 500 :
			compType.includes('input') || compType.includes('text-item') ? 320 : 360;
		const height = compType.includes('button') || compType.includes('badge') ? 52 :
			compType.includes('input') || compType.includes('text-item') ? 72 :
			compType.includes('grid') || compType.includes('table') ? 240 :
			compType.includes('kanban') ? 220 :
			compType.includes('chart') ? 220 : 84;

		try {
			await createComponent({
				page_id: activePage.id,
				name,
				type: compType,
				region: 'main',
				datasource_type: datasourceConfig ? 'table' : 'rpc',
				datasource_config: datasourceConfig || {},
				props: {
					title: name,
					catalogId: compType.replace('kit:', ''),
					left,
					top,
					width,
					height
				}
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
				parent_slug: activePage.parent_slug || null,
				min_role: activePage.min_role || 'public'
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

	let propertySaveTimer: any = null;
	function debounceSaveProperty() {
		if (propertySaveTimer) clearTimeout(propertySaveTimer);
		propertySaveTimer = setTimeout(() => {
			if (selectedComponent) {
				handleSaveComponentProperty();
			}
		}, 400);
	}

	async function handleDeletePage(pageId: number, pageTitle?: string) {
		if (!runtimeApp) return;
		if (runtimeApp.pages.length <= 1) {
			alert('Tidak dapat menghapus form! Aplikasi harus memiliki minimal 1 form aktif.');
			return;
		}
		const title = pageTitle || 'Form';
		const confirmed = confirm(`Hapus form "${title}"?\nSemua komponen di dalam form ini akan terhapus secara permanen.`);
		if (!confirmed) return;

		try {
			await deletePage(pageId);
			const deletedIdx = runtimeApp.pages.findIndex((p) => p.id === pageId);
			await loadApp();
			if (deletedIdx >= 0) {
				activePageIndex = Math.max(0, Math.min(deletedIdx, runtimeApp.pages.length - 1));
			} else {
				activePageIndex = 0;
			}
			selectedComponentId = null;
		} catch (e: any) {
			alert('Gagal menghapus form: ' + (e.message || e));
		}
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

	// Auto-CRUD Wizard: create 3 pages (List + Create Form + Edit/Detail) for a table
	async function handleAutoCrud(tableName: string, groupName: string) {
		if (!runtimeApp) return;
		const appId = runtimeApp.app.id;
		const base = tableName.toLowerCase().replace(/[^a-z0-9]/g, '_');
		const timestamp = Date.now();

		// 1. List page
		await createNewPage({
			app_id: appId,
			slug: `${base}_list_${timestamp}`,
			title: `${tableName} â€” List`,
			layout: 'single',
			group_name: groupName || 'Menu Utama',
			parent_slug: null
		});
		await loadApp();
		const listPageIdx = (runtimeApp?.pages.length ?? 1) - 1;
		activePageIndex = listPageIdx;
		await handleAddComponent('table_block', `${tableName} Table`, { table: tableName });

		// 2. Create Form page
		await createNewPage({
			app_id: appId,
			slug: `${base}_create_${timestamp}`,
			title: `${tableName} â€” Tambah`,
			layout: 'single',
			group_name: groupName || 'Menu Utama',
			parent_slug: null
		});
		await loadApp();
		const createPageIdx = (runtimeApp?.pages.length ?? 1) - 1;
		activePageIndex = createPageIdx;
		await handleAddComponent('form_block', `Form Tambah ${tableName}`, { table: tableName, mode: 'create' });

		// 3. Edit/Detail page
		await createNewPage({
			app_id: appId,
			slug: `${base}_edit_${timestamp}`,
			title: `${tableName} â€” Edit`,
			layout: 'single',
			group_name: groupName || 'Menu Utama',
			parent_slug: null
		});
		await loadApp();
		const editPageIdx = (runtimeApp?.pages.length ?? 1) - 1;
		activePageIndex = editPageIdx;
		await handleAddComponent('form_block', `Form Edit ${tableName}`, { table: tableName, mode: 'edit' });

		// Navigate to list page
		activePageIndex = listPageIdx;
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
					<button
						type="button"
						onclick={() => activePage && handleDeletePage(activePage.id, activePage.title)}
						disabled={!runtimeApp || runtimeApp.pages.length <= 1}
						class="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
						title="Hapus Form Aktif"
					>
						<Trash2 class="h-3 w-3" />
						<span>Hapus Form</span>
					</button>
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

				<!-- Prominent Red Delete Form Button -->
				<button
					type="button"
					onclick={() => activePage && handleDeletePage(activePage.id, activePage.title)}
					disabled={!runtimeApp || runtimeApp.pages.length <= 1}
					class="flex items-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-600 px-3 py-1 font-bold text-xs text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
					title="Hapus form aktif ini dari aplikasi"
				>
					<Trash2 class="h-3.5 w-3.5" />
					<span>Hapus Form</span>
				</button>
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
					{toolboxTab === 'standard' ? `${standardControls.length} APEX` : toolboxTab === 'uikit' ? `${catalog.length} UI Kit` : toolboxTab === 'tables' ? `${schemaTables.length} Tables` : `${budibaseBlocks.length} Blocks`}
				</span>
			</div>

			<!-- Toolbox Tabs: APEX Standard | UI Kit (71) | DB Schema | Budibase Blocks -->
			<div class="grid grid-cols-4 border-b border-slate-800 text-[10px] font-bold text-center">
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
				<button
					type="button"
					onclick={() => (toolboxTab = 'budibase')}
					class="py-1.5 transition {toolboxTab === 'budibase' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500' : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
				>
					Blocks
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
				{:else if toolboxTab === 'budibase'}
					<!-- Budibase Blocks - high-level composed blocks -->
					<div class="grid grid-cols-2 gap-1.5">
						{#each filteredBudibase as item}
							{@const Icon = item.icon}
							<button
								type="button"
								draggable="true"
								ondragstart={(e) => {
									e.dataTransfer?.setData('text/gobudibase-component', item.type);
									e.dataTransfer?.setData('text/plain', item.name);
								}}
								onclick={() => handleAddComponent(item.type, item.name)}
								class="flex flex-col items-center justify-center rounded border border-purple-900/40 bg-slate-950/60 p-2 text-center transition hover:border-purple-500/70 hover:bg-purple-950/20 group cursor-grab active:cursor-grabbing shadow-sm"
								title="{item.name}: {item.desc}"
							>
								<div class="mb-1 rounded p-1 text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition">
									<Icon class="h-4 w-4" />
								</div>
								<span class="text-[10px] font-semibold text-slate-300 group-hover:text-purple-300 line-clamp-1">
									{item.name}
								</span>
							</button>
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
					<!-- Canvas Layout Mode Switcher -->
					<div class="flex items-center rounded border border-slate-700 bg-slate-950 p-0.5 text-[10px]">
						<button
							type="button"
							onclick={() => (canvasLayoutMode = 'vb')}
							class="px-2 py-0.5 rounded font-bold transition {canvasLayoutMode === 'vb' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
							title="Visual Basic Absolute Layout (Draggable & Resizable)"
						>
							📐 VB Free Form
						</button>
						<button
							type="button"
							onclick={() => (canvasLayoutMode = 'flow')}
							class="px-2 py-0.5 rounded font-bold transition {canvasLayoutMode === 'flow' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
							title="Vertical Flow Stack Layout"
						>
							☰ Flow Stack
						</button>
					</div>
				</div>
				<div class="flex items-center gap-2 font-mono text-[10px] text-slate-500">
					<span>Snap:</span>
					<span class="font-bold {snapToGrid ? 'text-emerald-400' : 'text-slate-500'}">{snapToGrid ? '16px Grid' : 'Off'}</span>
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
						const formCanvas = document.getElementById('vb-form-client-canvas');
						let dropX = 24;
						let dropY = 24;
						if (formCanvas) {
							const rect = formCanvas.getBoundingClientRect();
							dropX = Math.max(16, e.clientX - rect.left);
							dropY = Math.max(16, e.clientY - rect.top);
							if (snapToGrid) {
								dropX = Math.round(dropX / 16) * 16;
								dropY = Math.round(dropY / 16) * 16;
							}
						}
						handleAddComponent(compType, compName || compType, undefined, dropX, dropY);
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
							<button type="button" class="h-4 w-4 flex items-center justify-center rounded hover:bg-slate-700 hover:text-white text-xs" title="Minimize Form">
								<Minus class="h-3 w-3" />
							</button>
							<button type="button" class="h-4 w-4 flex items-center justify-center rounded hover:bg-slate-700 hover:text-white text-xs" title="Maximize Form">
								<Maximize2 class="h-2.5 w-2.5" />
							</button>
							<button
								type="button"
								onclick={() => activePage && handleDeletePage(activePage.id, activePage.title)}
								class="h-4 w-4 flex items-center justify-center rounded hover:bg-rose-600 hover:text-white text-xs transition cursor-pointer"
								title="Hapus / Tutup Form Ini (Delete Form)"
							>
								<X class="h-3 w-3" />
							</button>
						</div>
					</div>

					<!-- Form Window Client Canvas (Authentic Dot Grid) -->
					<div
						id="vb-form-client-canvas"
						class="min-h-[520px] p-5 relative overflow-auto"
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
								<div class="mt-4 flex flex-wrap justify-center gap-1.5 max-w-lg">
									<button
										type="button"
										onclick={() => { wizardMode = 'auto-crud'; showAddPageModal = true; }}
										class="rounded bg-purple-600/30 border border-purple-500/50 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-purple-600 hover:text-white transition shadow-sm flex items-center gap-1"
									>
										<Sparkles class="h-3 w-3 text-purple-300" />
										<span>⚡ Auto-CRUD Wizard</span>
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('table_block', 'Table Block')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-500 hover:bg-purple-950/30 hover:text-purple-300 transition"
									>
										+ Table Block
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('form_block', 'Form Block')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-500 hover:bg-purple-950/30 hover:text-purple-300 transition"
									>
										+ Form Block
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('cards_repeater', 'Cards Repeater')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-500 hover:bg-purple-950/30 hover:text-purple-300 transition"
									>
										+ Cards Repeater
									</button>
									<button
										type="button"
										onclick={() => handleAddComponent('chart_block', 'Chart Analytics')}
										class="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-500 hover:bg-purple-950/30 hover:text-purple-300 transition"
									>
										+ Chart Block
									</button>
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
							<!-- Controls on Form (Visual Basic Freeform or Flow Stack) -->
							<div class={canvasLayoutMode === 'vb' ? 'relative w-full min-h-[520px]' : 'flex flex-col gap-3'}>
								{#each activePage.components as comp, idx}
									{@const isSelected = selectedComponentId === comp.id}
									{@const bounds = getCompBounds(comp, idx)}
									<!-- Control Container with VB Selection Bounding Box Handles -->
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="rounded border bg-slate-950/90 select-none shadow-lg transition-shadow {canvasLayoutMode === 'vb' ? 'absolute' : 'relative p-3'} {isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/30 z-30 shadow-2xl' : 'border-slate-700/80 hover:border-slate-600 z-10'}"
										style={canvasLayoutMode === 'vb' ? `left: ${bounds.left}px; top: ${bounds.top}px; width: ${bounds.width}px; min-height: ${bounds.height}px;` : ''}
										onclick={() => (selectedComponentId = comp.id)}
									>
										<!-- VB 8 Classic Grab Handles when selected in VB mode -->
										{#if isSelected && canvasLayoutMode === 'vb'}
											<!-- NW -->
											<div
												class="absolute -top-1.5 -left-1.5 h-3 w-3 bg-white border border-slate-950 shadow cursor-nwse-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'nw', idx)}
												title="Resize NW"
											></div>
											<!-- N -->
											<div
												class="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 bg-white border border-slate-950 shadow cursor-ns-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'n', idx)}
												title="Resize N"
											></div>
											<!-- NE -->
											<div
												class="absolute -top-1.5 -right-1.5 h-3 w-3 bg-white border border-slate-950 shadow cursor-nesw-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'ne', idx)}
												title="Resize NE"
											></div>
											<!-- W -->
											<div
												class="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3 w-3 bg-white border border-slate-950 shadow cursor-ew-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'w', idx)}
												title="Resize W"
											></div>
											<!-- E -->
											<div
												class="absolute top-1/2 -right-1.5 -translate-y-1/2 h-3 w-3 bg-white border border-slate-950 shadow cursor-ew-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'e', idx)}
												title="Resize E"
											></div>
											<!-- SW -->
											<div
												class="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white border border-slate-950 shadow cursor-nesw-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'sw', idx)}
												title="Resize SW"
											></div>
											<!-- S -->
											<div
												class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 bg-white border border-slate-950 shadow cursor-ns-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 's', idx)}
												title="Resize S"
											></div>
											<!-- SE -->
											<div
												class="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white border border-slate-950 shadow cursor-nwse-resize z-40 hover:bg-emerald-400"
												onmousedown={(e) => handleStartResize(e, comp, 'se', idx)}
												title="Resize SE"
											></div>

											<!-- Realtime Coordinates Badge -->
											<div class="absolute -bottom-6 left-0 bg-slate-900/95 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700 shadow pointer-events-none z-40 whitespace-nowrap">
												X: {bounds.left}px &nbsp; Y: {bounds.top}px &nbsp; W: {bounds.width}px &nbsp; H: {bounds.height}px
											</div>
										{/if}

										<!-- Control Header Bar (Move Drag Handle) -->
										<div
											class="flex items-center justify-between border-b border-slate-800/80 px-2 py-1 bg-slate-900/80 select-none {canvasLayoutMode === 'vb' ? 'cursor-move' : ''}"
											onmousedown={(e) => canvasLayoutMode === 'vb' && handleStartMove(e, comp, idx)}
										>
											<div class="flex items-center gap-1.5 overflow-hidden">
												<span class="rounded bg-emerald-500/20 px-1 py-0.2 font-mono text-[9px] font-bold text-emerald-400 uppercase border border-emerald-500/30 whitespace-nowrap">
													{comp.type}
												</span>
												<h5 class="text-xs font-bold text-slate-100 truncate">{comp.name}</h5>
											</div>
											<div class="flex items-center gap-1.5">
												{#if canvasLayoutMode === 'vb'}
													<span class="font-mono text-[9px] text-slate-500 hidden sm:inline">
														{bounds.left},{bounds.top}
													</span>
												{:else}
													<span class="font-mono text-[9px] text-slate-500">Source: {comp.datasource_type}</span>
												{/if}
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														handleDeleteComponent(comp.id);
													}}
													class="rounded p-0.5 text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 transition cursor-pointer"
													title="Hapus kontrol dari Form"
												>
													<Trash2 class="h-3 w-3" />
												</button>
											</div>
										</div>

										<!-- Wireframe Simulation inside Form -->
										<div class="p-2.5">
											{#if comp.type === 'interactive_grid'}
												<div class="flex flex-col gap-1.5">
													<div class="flex items-center justify-between text-xs">
														<span class="font-semibold text-slate-300">Data Grid [100k Records]</span>
														<span class="font-mono text-[9px] text-emerald-400">Sort â€¢ Filter â€¢ Inline Edit</span>
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
													<div class="col-span-1 text-center text-amber-400 font-bold text-xs">â‡„</div>
													<div class="col-span-2 rounded bg-slate-950 border border-amber-900/40 p-1.5 text-[9px] text-amber-300 text-center">Terpilih</div>
												</div>
											{:else if comp.type === 'popup_lov'}
												<div class="flex items-center justify-between rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-300 font-mono">
													<span>[Lookup Dialog Foreign Key]</span>
													<span class="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-cyan-400 font-bold">ðŸ” Cari</span>
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
											{:else if comp.type === 'textarea'}
												<div class="flex flex-col gap-1 max-w-sm py-1">
													<span class="text-[11px] font-semibold text-slate-300">{comp.props?.title || comp.name || 'Text Area'}</span>
													<div class="h-16 rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs text-slate-400 font-mono">
														{comp.props?.placeholder || 'Ketik teks multi-baris di sini...'}
													</div>
												</div>
											{:else if comp.type === 'select'}
												<div class="flex flex-col gap-1 max-w-sm py-1">
													<span class="text-[11px] font-semibold text-slate-300">{comp.props?.title || comp.name || 'Dropdown Select'}</span>
													<div class="h-8 rounded-lg bg-slate-950 border border-slate-800 px-3 flex items-center justify-between text-xs text-slate-300">
														<span>{comp.props?.placeholder || '-- Pilih Opsi --'}</span>
														<ChevronDown class="h-3.5 w-3.5 text-slate-400" />
													</div>
												</div>
											{:else if comp.type === 'file_upload'}
												<div class="flex flex-col gap-1 max-w-sm py-1">
													<span class="text-[11px] font-semibold text-slate-300">{comp.props?.title || comp.name || 'File Upload'}</span>
													<div class="h-16 rounded-lg bg-slate-950/60 border border-dashed border-slate-700 flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
														<Upload class="h-4 w-4 text-purple-400" />
														<span class="text-[10px]">Tarik file ke sini atau klik u/ upload</span>
													</div>
												</div>
											{:else if comp.type === 'label' || comp.type === 'kit:label' || comp.type === 'kit:typography'}
												<div class="py-1">
													<span class="text-xs font-semibold text-slate-200">{comp.props?.title || comp.name}</span>
												</div>
											{:else if comp.type === 'checkbox' || comp.type === 'kit:checkbox'}
												<div class="flex items-center gap-2 py-1 text-xs text-slate-200">
													<div class="h-4 w-4 rounded border border-slate-700 bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-[10px]">âœ“</div>
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
													<span class="font-bold">âš ï¸ {comp.props?.title || comp.name}</span>
												</div>
											{:else if comp.type === 'date_picker' || comp.type === 'datepicker' || comp.type === 'kit:date-picker' || comp.type === 'kit:simple-date-picker'}
												<div class="flex flex-col gap-1 py-1">
													<span class="text-[11px] font-semibold text-slate-300">{comp.props?.title || comp.name || 'Pilih Tanggal'}</span>
													<div class="h-8 rounded-lg bg-slate-950 border border-slate-800 px-3 flex items-center justify-between text-xs text-slate-300 font-mono">
														<span>{comp.props?.value || '2026-10-31'}</span>
														<Calendar class="h-3.5 w-3.5 text-emerald-400" />
													</div>
												</div>
											{:else if comp.type === 'date_range_picker'}
												<div class="flex flex-col gap-1 py-1">
													<div class="flex items-center justify-between text-[11px]">
														<span class="font-semibold text-slate-300">{comp.props?.title || comp.name || 'Rentang Tanggal'}</span>
														<span class="font-mono text-[9px] text-emerald-400">Date Range</span>
													</div>
													<div class="grid grid-cols-2 gap-1.5">
														<div class="h-7 rounded bg-slate-950 border border-slate-800 px-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
															<span>Dari: 01 Okt</span>
															<Calendar class="h-3 w-3 text-emerald-400" />
														</div>
														<div class="h-7 rounded bg-slate-950 border border-slate-800 px-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
															<span>S/d: 31 Okt</span>
															<Calendar class="h-3 w-3 text-emerald-400" />
														</div>
													</div>
												</div>
										{:else if comp.type === 'data_provider'}
											<div class="rounded border border-purple-800/50 bg-purple-950/20 p-2 text-xs text-purple-300 flex items-center justify-between">
												<div class="flex items-center gap-1.5 font-mono text-[11px]">
													<Database class="h-3.5 w-3.5 text-purple-400" />
													<span>Data Provider: {comp.datasource_config?.table || comp.props?.table || 'bmn_items'}</span>
												</div>
												<span class="rounded bg-purple-900/60 px-1.5 py-0.2 font-mono text-[9px] text-purple-200">EXPOSE BINDINGS</span>
											</div>
										{:else if comp.type === 'table_block'}
											<div class="flex flex-col gap-1 rounded border border-purple-800/40 bg-slate-950 p-2">
												<div class="flex items-center justify-between text-[11px]">
													<span class="font-bold text-slate-200">âš¡ Table Block: {comp.props?.title || comp.name}</span>
													<span class="font-mono text-[9px] text-purple-400">Search â€¢ Sort â€¢ Paginate â€¢ CRUD</span>
												</div>
												<div class="grid grid-cols-4 gap-1 text-[9px] text-slate-500 font-mono border-t border-slate-800 pt-1">
													<span>id</span><span>name</span><span>status</span><span>[actions]</span>
												</div>
											</div>
										{:else if comp.type === 'form_block'}
											<div class="flex flex-col gap-1.5 rounded border border-purple-800/40 bg-slate-950 p-2">
												<div class="flex items-center justify-between text-[11px]">
													<span class="font-bold text-purple-300">ðŸ“ Form Block: {comp.props?.title || comp.name}</span>
													<span class="rounded bg-purple-900/50 px-1 py-0.2 text-[9px] text-purple-200 font-mono uppercase">{comp.datasource_config?.mode || 'create'}</span>
												</div>
												<div class="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
													<div class="rounded bg-slate-900 border border-slate-800 px-2 py-0.5">Input Field A</div>
													<div class="rounded bg-slate-900 border border-slate-800 px-2 py-0.5">Input Field B</div>
												</div>
											</div>
										{:else if comp.type === 'cards_repeater'}
											<div class="grid grid-cols-3 gap-1 rounded border border-purple-800/40 bg-slate-950 p-2">
												<div class="rounded bg-slate-900 border border-slate-800 p-1 text-[9px] text-slate-400 text-center">Card 1</div>
												<div class="rounded bg-slate-900 border border-slate-800 p-1 text-[9px] text-slate-400 text-center">Card 2</div>
												<div class="rounded bg-slate-900 border border-slate-800 p-1 text-[9px] text-slate-400 text-center">Card 3</div>
											</div>
										{:else if comp.type === 'chart_block'}
											<div class="flex flex-col gap-1 rounded border border-purple-800/40 bg-slate-950 p-2">
												<div class="flex items-center justify-between text-[11px]">
													<span class="font-bold text-slate-200">ðŸ“Š Chart Block: {comp.props?.title || comp.name}</span>
													<span class="font-mono text-[9px] text-purple-400">Bar / Donut</span>
												</div>
												<div class="flex items-end gap-1 h-8 pt-1">
													<div class="flex-1 bg-purple-500/70 h-4 rounded-t"></div>
													<div class="flex-1 bg-emerald-500/70 h-7 rounded-t"></div>
													<div class="flex-1 bg-amber-500/70 h-5 rounded-t"></div>
													<div class="flex-1 bg-indigo-500/70 h-8 rounded-t"></div>
												</div>
											</div>
										{:else if comp.type === 'container_section'}
											<div class="rounded border border-dashed border-purple-700/60 bg-purple-950/10 p-2.5 text-center text-[10px] text-purple-300">
												[ Container / Section Box ]
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

								{#if canvasLayoutMode === 'flow'}
									<!-- Drop / Add Next Control Strip in Flow mode -->
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
								{/if}
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
											<div class="flex flex-col group/formitem {isSubMenu ? 'pl-2.5' : ''}">
												<div class="flex items-center justify-between rounded px-2 py-1 transition {isActiveForm ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}">
													<button
														type="button"
														onclick={() => {
															activePageIndex = idx;
															selectedComponentId = pg.components?.[0]?.id || null;
														}}
														class="flex items-center gap-1.5 truncate flex-1 text-left"
													>
														{#if isSubMenu}
															<span class="text-teal-400 font-bold text-[10px]">â†³</span>
														{/if}
														<FileText class="h-3 w-3 shrink-0 {isSubMenu ? 'text-teal-400' : 'text-slate-400'}" />
														<span class="truncate">frm_{pg.slug}</span>
													</button>
													<div class="flex items-center gap-1 shrink-0">
														<span class="text-[9px] opacity-75">({pg.components?.length || 0})</span>
														{#if runtimeApp && runtimeApp.pages.length > 1}
															<button
																type="button"
																onclick={(e) => {
																	e.stopPropagation();
																	handleDeletePage(pg.id, pg.title);
																}}
																class="p-1 rounded transition text-rose-400/80 hover:text-white hover:bg-rose-600 cursor-pointer"
																title="Hapus Form {pg.title}"
															>
																<Trash2 class="h-3 w-3" />
															</button>
														{/if}
													</div>
												</div>

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
																<span class="text-slate-500">â€¢</span>
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
						<!-- Property Row Snippets -->
						{#snippet propName()}
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
										oninput={() => {
											if (selectedComponent.props) {
												selectedComponent.props.title = selectedComponent.name;
											}
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										onkeydown={(e) => {
											if (e.key === 'Enter') handleSaveComponentProperty();
										}}
										class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propCaption()}
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
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										onkeydown={(e) => {
											if (e.key === 'Enter') handleSaveComponentProperty();
										}}
										class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propLeft()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Left', desc: 'Jarak posisi horizontal kontrol dari tepi kiri form (dalam pixel).' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									Left
								</td>
								<td class="px-2 py-1">
									<input
										type="number"
										value={typeof selectedComponent.props?.left === 'number' ? selectedComponent.props.left : 24}
										oninput={(e) => {
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.left = Number(e.currentTarget.value);
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										class="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propTop()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Top', desc: 'Jarak posisi vertikal kontrol dari tepi atas form (dalam pixel).' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									Top
								</td>
								<td class="px-2 py-1">
									<input
										type="number"
										value={typeof selectedComponent.props?.top === 'number' ? selectedComponent.props.top : 24}
										oninput={(e) => {
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.top = Number(e.currentTarget.value);
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										class="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propWidth()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Width', desc: 'Lebar ukuran kontrol pada form (dalam pixel).' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									Width
								</td>
								<td class="px-2 py-1">
									<input
										type="number"
										value={typeof selectedComponent.props?.width === 'number' ? selectedComponent.props.width : 240}
										oninput={(e) => {
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.width = Number(e.currentTarget.value);
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										class="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propHeight()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Height', desc: 'Tinggi ukuran kontrol pada form (dalam pixel).' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									Height
								</td>
								<td class="px-2 py-1">
									<input
										type="number"
										value={typeof selectedComponent.props?.height === 'number' ? selectedComponent.props.height : 48}
										oninput={(e) => {
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.height = Number(e.currentTarget.value);
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										class="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propVariant()}
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
						{/snippet}

						{#snippet propPlaceholder()}
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
											debounceSaveProperty();
										}}
										onblur={handleSaveComponentProperty}
										onkeydown={(e) => {
											if (e.key === 'Enter') handleSaveComponentProperty();
										}}
										class="w-full bg-transparent text-slate-200 outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
									/>
								</td>
							</tr>
						{/snippet}

						{#snippet propType()}
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
						{/snippet}

						{#snippet propDataSource()}
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
						{/snippet}

						{#snippet propTable()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Table', desc: 'Tabel database PostgreSQL target untuk data binding komponen ini.' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									Table
								</td>
								<td class="px-2 py-1">
									<select
										value={(selectedComponent.datasource_config?.table as string) || (selectedComponent.props?.table as string) || ''}
										onchange={(e) => {
											const val = (e.target as HTMLSelectElement).value;
											if (!selectedComponent.datasource_config) selectedComponent.datasource_config = {};
											selectedComponent.datasource_config.table = val;
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.table = val;
											handleSaveComponentProperty();
										}}
										class="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none cursor-pointer"
									>
										<option value="" class="bg-slate-900 text-slate-400">-- Pilih Tabel --</option>
										{#each schemaTables as tbl}
											<option value={tbl.name} class="bg-slate-900 text-slate-200">{tbl.schema}.{tbl.name}</option>
										{/each}
									</select>
								</td>
							</tr>
						{/snippet}

						{#snippet propMode()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Mode', desc: 'Mode operasi form: create (tambah record baru) atau edit (perbarui record yang ada).' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									Mode
								</td>
								<td class="px-2 py-1">
									<select
										value={(selectedComponent.datasource_config?.mode as string) || (selectedComponent.props?.mode as string) || 'create'}
										onchange={(e) => {
											const val = (e.target as HTMLSelectElement).value;
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.mode = val;
											if (!selectedComponent.datasource_config) selectedComponent.datasource_config = {};
											selectedComponent.datasource_config.mode = val;
											handleSaveComponentProperty();
										}}
										class="w-full bg-transparent text-purple-400 font-mono text-xs outline-none cursor-pointer"
									>
										<option value="create" class="bg-slate-900 text-slate-200">create (Tambah Baru)</option>
										<option value="edit" class="bg-slate-900 text-slate-200">edit (Edit Record)</option>
									</select>
								</td>
							</tr>
						{/snippet}

						{#snippet propChartType()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'ChartType', desc: 'Tipe tampilan grafik analitika: bar (batang), donut (lingkaran), atau line (garis tren).' })}
							>
								<td class="w-28 bg-slate-950/80 px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-800">
									ChartType
								</td>
								<td class="px-2 py-1">
									<select
										value={(selectedComponent.props?.chartType as string) || 'bar'}
										onchange={(e) => {
											const val = (e.target as HTMLSelectElement).value;
											if (!selectedComponent.props) selectedComponent.props = {};
											selectedComponent.props.chartType = val;
											handleSaveComponentProperty();
										}}
										class="w-full bg-transparent text-purple-400 font-mono text-xs outline-none cursor-pointer"
									>
										<option value="bar" class="bg-slate-900 text-slate-200">bar (Batang)</option>
										<option value="donut" class="bg-slate-900 text-slate-200">donut (Lingkaran)</option>
										<option value="line" class="bg-slate-900 text-slate-200">line (Tren Garis)</option>
									</select>
								</td>
							</tr>
						{/snippet}

						{#snippet propRegion()}
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
						{/snippet}

						{#snippet propVisible()}
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
						{/snippet}

						{#snippet propEnabled()}
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
						{/snippet}

						<table class="w-full border-collapse text-left">
							{#if propertyTab === 'categorized'}
								<!-- CATEGORIZED VIEW (Grouped by VB Categories with Collapsible Headers) -->
								<tbody>
									<!-- Category 1: Appearance -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('appearance')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['appearance'] ? '▶' : '▼'}</span> Appearance
										</td>
									</tr>
									{#if !collapsedCategories['appearance']}
										{@render propCaption()}
										{#if selectedComponent.type === 'button' || selectedComponent.type === 'kit:button' || selectedComponent.type === 'badge' || selectedComponent.type === 'kit:badge'}
											{@render propVariant()}
										{/if}
										{#if selectedComponent.type === 'input' || selectedComponent.type === 'kit:input' || selectedComponent.type === 'kit:text-item'}
											{@render propPlaceholder()}
										{/if}
									{/if}

									<!-- Category 2: Position & Size -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('position')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['position'] ? '▶' : '▼'}</span> Position & Size
										</td>
									</tr>
									{#if !collapsedCategories['position']}
										{@render propLeft()}
										{@render propTop()}
										{@render propWidth()}
										{@render propHeight()}
										{@render propRegion()}
									{/if}

									<!-- Category 3: Data -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('data')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['data'] ? '▶' : '▼'}</span> Data
										</td>
									</tr>
									{#if !collapsedCategories['data']}
										{@render propDataSource()}
										{#if selectedComponent.datasource_type === 'table' || ['table_block', 'form_block', 'data_provider', 'cards_repeater', 'chart_block', 'interactive_grid', 'interactive_report'].includes(selectedComponent.type)}
											{@render propTable()}
										{/if}
										{#if selectedComponent.type === 'form_block'}
											{@render propMode()}
										{/if}
										{#if selectedComponent.type === 'chart_block'}
											{@render propChartType()}
										{/if}
									{/if}

									<!-- Category 4: Behavior & Misc -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('behavior')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['behavior'] ? '▶' : '▼'}</span> Behavior & Misc
										</td>
									</tr>
									{#if !collapsedCategories['behavior']}
										{@render propName()}
										{@render propType()}
										{@render propVisible()}
										{@render propEnabled()}
									{/if}
								</tbody>
							{:else}
								<!-- ALPHABETIC VIEW (Strict A-Z Sort) -->
								<tbody>
									{@render propName()}
									{@render propCaption()}
									{#if selectedComponent.type === 'chart_block'}
										{@render propChartType()}
									{/if}
									{@render propDataSource()}
									{@render propEnabled()}
									{@render propHeight()}
									{@render propLeft()}
									{#if selectedComponent.type === 'form_block'}
										{@render propMode()}
									{/if}
									{#if selectedComponent.type === 'input' || selectedComponent.type === 'kit:input' || selectedComponent.type === 'kit:text-item' || selectedComponent.type === 'textarea'}
										{@render propPlaceholder()}
									{/if}
									{@render propRegion()}
									{#if selectedComponent.datasource_type === 'table' || ['table_block', 'form_block', 'data_provider', 'cards_repeater', 'chart_block', 'interactive_grid', 'interactive_report'].includes(selectedComponent.type)}
										{@render propTable()}
									{/if}
									{@render propTop()}
									{@render propType()}
									{#if selectedComponent.type === 'button' || selectedComponent.type === 'kit:button' || selectedComponent.type === 'badge' || selectedComponent.type === 'kit:badge'}
										{@render propVariant()}
									{/if}
									{@render propVisible()}
									{@render propWidth()}
								</tbody>
							{/if}
						</table>
						<!-- Action Chains Inspector for Selected Component -->
						<div class="border-t border-slate-800 bg-slate-950/90 p-2.5">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-1.5 text-xs font-bold text-slate-200">
									<Zap class="h-3.5 w-3.5 text-amber-400" />
									<span>Action Chains</span>
									<span class="rounded bg-amber-500/10 px-1.5 py-0.2 font-mono text-[9px] text-amber-400 border border-amber-500/20">{selectedComponent.actions?.length || 0}</span>
								</div>
								<button
									type="button"
									onclick={() => {
										if (!selectedComponent.actions) selectedComponent.actions = [];
										selectedComponent.actions.push({ type: 'toast', message: 'Aksi dijalankan!', toastType: 'success' });
										handleSaveComponentProperty();
									}}
									class="rounded bg-amber-600/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-600/30 transition"
								>
									+ Action
								</button>
							</div>
							<div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
								{#each selectedComponent.actions || [] as action, actIdx}
									<div class="rounded border border-slate-800 bg-slate-900 p-2 text-[11px] flex flex-col gap-1.5">
										<div class="flex items-center justify-between">
											<select
												bind:value={action.type}
												onchange={handleSaveComponentProperty}
												class="bg-slate-950 text-amber-400 font-bold border border-slate-800 rounded px-1.5 py-0.5 outline-none text-[10px]"
											>
												<option value="navigate">Navigate to Page</option>
												<option value="toast">Show Toast</option>
												<option value="save_row">Save Row (CRUD)</option>
												<option value="delete_row">Delete Row</option>
												<option value="query">Execute SQL</option>
											</select>
											<button
												type="button"
												onclick={() => { selectedComponent.actions.splice(actIdx, 1); handleSaveComponentProperty(); }}
												class="text-slate-500 hover:text-rose-400 p-0.5"
											>
												<Trash2 class="h-3 w-3" />
											</button>
										</div>
										{#if action.type === 'navigate'}
											<input
												type="text"
												bind:value={action.targetPage}
												onblur={handleSaveComponentProperty}
												placeholder="Page Slug (e.g. bmn_list)"
												class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none font-mono text-[10px]"
											/>
										{:else if action.type === 'toast'}
											<input
												type="text"
												bind:value={action.message}
												onblur={handleSaveComponentProperty}
												placeholder="Pesan Toast (e.g. Simpan Sukses!)"
												class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none text-[10px]"
											/>
										{:else if action.type === 'save_row' || action.type === 'delete_row'}
											<input
												type="text"
												bind:value={action.table}
												onblur={handleSaveComponentProperty}
												placeholder="Tabel target (e.g. bmn_items)"
												class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none font-mono text-[10px]"
											/>
										{:else if action.type === 'query'}
											<input
												type="text"
												bind:value={action.sql}
												onblur={handleSaveComponentProperty}
												placeholder="SQL Query (e.g. UPDATE ...)"
												class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none font-mono text-[10px]"
											/>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else if activePage}
						<!-- Form Property Row Snippets -->
						{#snippet formSlug()}
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
						{/snippet}

						{#snippet formTitle()}
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
						{/snippet}

						{#snippet formLayout()}
							<tr
								class="border-b border-slate-800/80 hover:bg-slate-800/40"
								onclick={() => (activePropertyHelp = { title: 'Layout', desc: 'Susunan tata letak kontrol form: free (Visual Basic Freeform Canvas), single (1 kolom bertumpuk), atau split-2 (2 kolom grid).' })}
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
										<option value="free">free (Visual Basic Freeform)</option>
										<option value="single">single (1 Kolom Stacked)</option>
										<option value="split-2">split-2 (2 Kolom Grid)</option>
									</select>
								</td>
							</tr>
						{/snippet}

						{#snippet formMenuGroup()}
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
						{/snippet}

						{#snippet formSubMenuOf()}
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
						{/snippet}

						<table class="w-full border-collapse text-left">
							{#if propertyTab === 'categorized'}
								<tbody>
									<!-- Appearance -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('form_appearance')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['form_appearance'] ? '▶' : '▼'}</span> Appearance
										</td>
									</tr>
									{#if !collapsedCategories['form_appearance']}
										{@render formTitle()}
									{/if}

									<!-- Layout -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('form_layout')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['form_layout'] ? '▶' : '▼'}</span> Layout
										</td>
									</tr>
									{#if !collapsedCategories['form_layout']}
										{@render formLayout()}
									{/if}

									<!-- Navigation -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('form_nav')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['form_nav'] ? '▶' : '▼'}</span> Navigation
										</td>
									</tr>
									{#if !collapsedCategories['form_nav']}
										{@render formMenuGroup()}
										{@render formSubMenuOf()}
									{/if}

									<!-- System -->
									<tr
										class="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-emerald-400 cursor-pointer select-none hover:bg-slate-850"
										onclick={() => toggleCategory('form_sys')}
									>
										<td colspan="2" class="px-2 py-1">
											<span>{collapsedCategories['form_sys'] ? '▶' : '▼'}</span> System
										</td>
									</tr>
									{#if !collapsedCategories['form_sys']}
										{@render formSlug()}
									{/if}
								</tbody>
							{:else}
								<tbody>
									{@render formSlug()}
									{@render formTitle()}
									{@render formLayout()}
									{@render formMenuGroup()}
									{@render formSubMenuOf()}
								</tbody>
							{/if}
						</table>

						<!-- Prominent Form Action Box in Properties Window -->
						<div class="m-2 p-3 rounded-xl border border-rose-800/60 bg-rose-950/25 flex flex-col gap-2">
							<div class="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
								<Trash2 class="h-4 w-4 text-rose-400" />
								<span>Aksi Form</span>
							</div>
							<p class="text-[10px] text-slate-400 leading-normal">
								Hapus form "{activePage?.title}" (frm_{activePage?.slug}) beserta seluruh kontrol di dalamnya secara permanen.
							</p>
							<button
								type="button"
								onclick={() => activePage && handleDeletePage(activePage.id, activePage.title)}
								disabled={!runtimeApp || runtimeApp.pages.length <= 1}
								class="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 font-bold text-xs text-white shadow hover:bg-rose-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
							>
								<Trash2 class="h-3.5 w-3.5" />
								<span>Hapus Form Ini</span>
							</button>
						</div>
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
			<span class="text-emerald-400 font-semibold">â— Ready</span>
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

			<!-- Wizard Mode Toggle -->
			<div class="mt-3 mb-3 flex rounded-lg border border-slate-800 overflow-hidden text-xs font-bold">
				<button
					type="button"
					onclick={() => (wizardMode = 'blank')}
					class="flex-1 py-1.5 transition {wizardMode === 'blank' ? 'bg-emerald-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}"
				>
					ðŸ“„ Blank Page
				</button>
				<button
					type="button"
					onclick={() => (wizardMode = 'auto-crud')}
					class="flex-1 py-1.5 transition {wizardMode === 'auto-crud' ? 'bg-purple-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}"
				>
					âš¡ Auto-CRUD Wizard
				</button>
			</div>

			{#if wizardMode === 'auto-crud'}
				<!-- Auto-CRUD Wizard -->
				<div class="flex flex-col gap-3 text-xs">
					<div class="rounded-lg border border-purple-800/40 bg-purple-950/20 p-3 text-purple-300 text-[11px] leading-relaxed">
						âš¡ Pilih tabel â†’ otomatis buat 3 page: <strong>List</strong>, <strong>Tambah</strong>, <strong>Edit</strong> + komponen block terpasang.
					</div>
					<div class="flex flex-col gap-1">
						<label class="font-semibold text-slate-300">Pilih Tabel</label>
						<select
							bind:value={wizardTable}
							class="rounded border border-slate-800 bg-slate-950 px-2 py-2 text-slate-200 focus:border-purple-500 focus:outline-none cursor-pointer"
						>
							<option value="">-- Pilih tabel --</option>
							{#each schemaTables as tbl}
								<option value={tbl.name}>{tbl.schema}.{tbl.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1">
						<label class="font-semibold text-slate-300">Menu Group</label>
						<input
							type="text"
							bind:value={newPageGroup}
							placeholder="Menu Utama"
							class="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
						/>
					</div>
					<div class="mt-3 flex justify-end gap-2 border-t border-slate-800 pt-3">
						<button type="button" onclick={() => (showAddPageModal = false)} class="rounded px-3 py-1.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">Batal</button>
						<button
							type="button"
							disabled={!wizardTable}
							onclick={async () => { showAddPageModal = false; await handleAutoCrud(wizardTable, newPageGroup); wizardTable = ''; }}
							class="rounded bg-purple-600 px-4 py-1.5 font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>âš¡ Generate 3 Pages</button>
					</div>
				</div>
			{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleAddPage(); }} class="mt-1 flex flex-col gap-3 text-xs">
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
						<option value="free">free (Visual Basic Freeform Canvas)</option>
						<option value="single">single (1 Kolom Stacked)</option>
						<option value="split-2">split-2 (2 Kolom Grid)</option>
						<option value="dashboard-4">dashboard-4 (4 Widgets)</option>
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
							<option value={p.slug}>â†³ {p.title} ({p.slug})</option>
						{/each}
					</select>
				</div>

				<div class="mt-3 flex justify-end gap-2 border-t border-slate-800 pt-3">
					<button type="button" onclick={() => (showAddPageModal = false)} class="rounded px-3 py-1.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">Batal</button>
					<button type="submit" class="rounded bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500">Create Form</button>
				</div>
			</form>
			{/if}
		</div>
	</div>
{/if}
