<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type RegistryItem } from '$lib/api/client';
	import { exportRegistryReport } from '$lib/utils/pdfExport';
	import * as XLSX from 'xlsx';
	import {
		TableProperties,
		ChevronLeft,
		ChevronRight,
		FileSpreadsheet,
		FileText,
		CheckCircle2,
		AlertCircle
	} from 'lucide-svelte';

	import type {
		ChartConfig,
		IgAggregate,
		IgColumnMeta,
		IgFilter,
		IgGroup,
		IgHighlight,
		IgRecord,
		IgSavedReport,
		IgSort,
		ViewMode
	} from './ig/types';
	import { evaluateAllFilters } from './ig/filterEngine';

	import IgToolbar from './ig/IgToolbar.svelte';
	import IgFilterBar from './ig/IgFilterBar.svelte';
	import IgGridView from './ig/IgGridView.svelte';
	import IgSingleRowView from './ig/IgSingleRowView.svelte';
	import IgIconView from './ig/IgIconView.svelte';
	import IgChartView from './ig/IgChartView.svelte';

	import IgFilterDialog from './ig/IgFilterDialog.svelte';
	import IgColumnsDialog from './ig/IgColumnsDialog.svelte';
	import IgSortDialog from './ig/IgSortDialog.svelte';
	import IgAggregateDialog from './ig/IgAggregateDialog.svelte';
	import IgGroupDialog from './ig/IgGroupDialog.svelte';
	import IgHighlightDialog from './ig/IgHighlightDialog.svelte';
	import IgSaveReportDialog from './ig/IgSaveReportDialog.svelte';

	let {
		title = 'Interactive Grid (Oracle APEX 1:1 Parity)'
	}: {
		title?: string;
	} = $props();

	// Primary State (apex.model equivalent)
	let rawRecords = $state<IgRecord[]>([]);
	let totalCount = $state(0);
	let limit = $state(50);
	let offset = $state(0);
	let loading = $state(false);
	let saving = $state(false);
	let statusMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);

	// Client-side Dirty Tracking Model
	let dirtyCells = $state<Record<number, Record<string, any>>>({});
	let deletedIds = $state<number[]>([]);
	let newRowCounter = $state(-1);

	// View Modes: 'grid' | 'single' | 'icon' | 'chart'
	let viewMode = $state<ViewMode>('grid');
	let activeSingleRowId = $state<number>(1);
	let editable = $state(true);
	let selectedIds = $state<number[]>([]);
	let activeCell = $state<{ rowId: number; col: string } | null>(null);

	// Search & Reporting Rules
	let searchTerm = $state('');
	let searchColumn = $state('all');
	let filters = $state<IgFilter[]>([]);
	let sorts = $state<IgSort[]>([{ column: 'id', dir: 'asc' }]);
	let group = $state<IgGroup | null>(null);
	let highlights = $state<IgHighlight[]>([
		{
			id: 'hl_init',
			name: 'Perlu Perbaikan (Maintenance)',
			column: 'status',
			op: 'equals',
			value: 'maintenance',
			bgColor: '#fee2e2',
			textColor: '#991b1b',
			target: 'row',
			enabled: true
		}
	]);
	let aggregates = $state<IgAggregate[]>([
		{ column: 'value', func: 'sum' },
		{ column: 'value', func: 'avg' }
	]);
	let chartConfig = $state<ChartConfig>({
		type: 'bar',
		dimensionCol: 'category',
		metricCol: 'value',
		metricFunc: 'sum'
	});

	// Saved Reports
	let savedReports = $state<IgSavedReport[]>([
		{
			id: 'primary',
			name: '1. Primary Report',
			isDefault: true,
			isPublic: true,
			viewMode: 'grid',
			filters: [],
			sorts: [{ column: 'id', dir: 'asc' }],
			groups: [],
			highlights: [],
			aggregates: [{ column: 'value', func: 'sum' }],
			columns: []
		}
	]);
	let activeReportId = $state('primary');

	// Column Metadata Definition
	let columns = $state<IgColumnMeta[]>([
		{ name: 'id', label: 'ID Aset', type: 'number', visible: true, frozen: true, width: 80, align: 'center' },
		{ name: 'code', label: 'Kode Aset', type: 'text', visible: true, frozen: true, width: 130, align: 'left' },
		{ name: 'name', label: 'Nama Inventaris', type: 'text', visible: true, frozen: false, width: 260, align: 'left' },
		{
			name: 'category',
			label: 'Kategori',
			type: 'select',
			visible: true,
			frozen: false,
			width: 140,
			options: ['Furniture', 'Vehicle', 'Electronic', 'Building', 'Machinery', 'IT Asset', 'Land'],
			align: 'left'
		},
		{ name: 'location', label: 'Lokasi Gedung', type: 'text', visible: true, frozen: false, width: 160, align: 'left' },
		{
			name: 'status',
			label: 'Status Operasional',
			type: 'badge',
			visible: true,
			frozen: false,
			width: 150,
			options: ['active', 'maintenance', 'retired', 'in_stock'],
			align: 'center'
		},
		{ name: 'value', label: 'Nilai Aset (Rp)', type: 'currency', visible: true, frozen: false, width: 170, align: 'right' },
		{ name: 'acquired_at', label: 'Tgl Perolehan', type: 'date', visible: true, frozen: false, width: 130, align: 'center' }
	]);

	// Modals State
	let filterDialogOpen = $state(false);
	let filterEditing = $state<IgFilter | null>(null);
	let columnsDialogOpen = $state(false);
	let sortDialogOpen = $state(false);
	let aggregateDialogOpen = $state(false);
	let groupDialogOpen = $state(false);
	let highlightDialogOpen = $state(false);
	let highlightEditing = $state<IgHighlight | null>(null);
	let saveReportDialogOpen = $state(false);

	// Load Data from PostgreSQL backend
	async function loadData() {
		loading = true;
		statusMessage = null;
		try {
			const serverFilters: Record<string, string> = {};
			if (searchTerm) {
				if (searchColumn === 'all') {
					serverFilters['name'] = `%${searchTerm}%`;
				} else {
					serverFilters[searchColumn] = `%${searchTerm}%`;
				}
			}

			const primarySort = sorts[0] || { column: 'id', dir: 'asc' };
			const [data, count] = await Promise.all([
				postRPC<RegistryItem[]>('/registry/list', {
					p_limit: limit,
					p_offset: offset,
					p_sort_col: primarySort.column,
					p_sort_dir: primarySort.dir,
					p_filters: serverFilters
				}),
				postRPC<number>('/registry/count', { p_filters: serverFilters })
			]);

			rawRecords = (data || []).map((item) => ({
				...item,
				_status: 'normal',
				_dirtyCols: {}
			}));
			totalCount = count || rawRecords.length;

			if (rawRecords.length > 0 && (!activeSingleRowId || !rawRecords.some(r => r.id === activeSingleRowId))) {
				activeSingleRowId = rawRecords[0].id;
			}
		} catch (err: any) {
			console.error('Failed to load IG records:', err);
			// Fallback mock dataset if network error
			if (rawRecords.length === 0) {
				generateFallbackData();
			}
		} finally {
			loading = false;
		}
	}

	function generateFallbackData() {
		const cats = ['Furniture', 'Vehicle', 'Electronic', 'Building', 'Machinery'];
		const stats = ['active', 'maintenance', 'retired', 'in_stock'];
		const sample: IgRecord[] = [];
		for (let i = 1; i <= 30; i++) {
			sample.push({
				id: i,
				code: `ITEM-${String(i).padStart(6, '0')}`,
				name: `Aset Inventaris Utama #${i}`,
				value: 1500000 + i * 250000,
				status: stats[i % stats.length],
				category: cats[i % cats.length],
				location: `Gedung ${((i % 4) + 1)} Lantai ${((i % 3) + 1)}`,
				acquired_at: '2025-01-15',
				last_updated: '2026-10-31 12:00',
				_status: 'normal',
				_dirtyCols: {}
			});
		}
		rawRecords = sample;
		totalCount = 30;
		activeSingleRowId = 1;
	}

	onMount(() => {
		loadData();
		loadSavedReportsFromStorage();
	});

	// Client-side Model Updates (apex.model inline edit)
	function handleCellChange(rowId: number, col: string, val: any) {
		if (col.startsWith('_sort_')) {
			const dir = col === '_sort_asc' ? 'asc' : 'desc';
			sorts = [{ column: val, dir }];
			return;
		}

		const rec = rawRecords.find((r) => r.id === rowId);
		if (!rec) return;

		rec[col] = val;
		if (!dirtyCells[rowId]) dirtyCells[rowId] = {};
		dirtyCells[rowId][col] = val;

		if (!rec._dirtyCols) rec._dirtyCols = {};
		rec._dirtyCols[col] = true;
	}

	// Row Operations (Add, Duplicate, Delete, Revert)
	function handleAddRow() {
		const newId = newRowCounter--;
		const newRecord: IgRecord = {
			id: newId,
			code: `ITEM-NEW-${Math.abs(newId)}`,
			name: 'Aset Baru',
			value: 0,
			status: 'in_stock',
			category: 'Electronic',
			location: 'Gedung Pusat Lantai 1',
			acquired_at: new Date().toISOString().substring(0, 10),
			_status: 'inserted',
			_dirtyCols: { name: true, category: true, value: true }
		};

		rawRecords = [newRecord, ...rawRecords];
		activeSingleRowId = newId;
		if (!dirtyCells[newId]) dirtyCells[newId] = {};
		dirtyCells[newId]['name'] = newRecord.name;
		dirtyCells[newId]['category'] = newRecord.category;
	}

	function handleRowAction(action: 'duplicate' | 'delete' | 'revert', rowId: number) {
		const rec = rawRecords.find((r) => r.id === rowId);
		if (!rec) return;

		if (action === 'duplicate') {
			const dupId = newRowCounter--;
			const dup: IgRecord = {
				...rec,
				id: dupId,
				code: `${rec.code}-COPY`,
				name: `${rec.name} (Copy)`,
				_status: 'inserted',
				_dirtyCols: { name: true }
			};
			rawRecords = [dup, ...rawRecords];
			activeSingleRowId = dupId;
			if (!dirtyCells[dupId]) dirtyCells[dupId] = {};
			dirtyCells[dupId]['name'] = dup.name;
		} else if (action === 'delete') {
			if (rec._status === 'inserted') {
				rawRecords = rawRecords.filter((r) => r.id !== rowId);
				delete dirtyCells[rowId];
			} else {
				rec._status = 'deleted';
				if (!deletedIds.includes(rowId)) deletedIds.push(rowId);
			}
		} else if (action === 'revert') {
			if (rec._status === 'deleted') {
				rec._status = 'normal';
				deletedIds = deletedIds.filter((id) => id !== rowId);
			} else {
				delete dirtyCells[rowId];
				rec._dirtyCols = {};
				rec._status = 'normal';
				loadData();
			}
		}
	}

	// Batch Persistence (Save button)
	async function saveChanges() {
		saving = true;
		statusMessage = null;
		try {
			const changes: Array<{ id: number; column: string; value: string }> = [];
			Object.entries(dirtyCells).forEach(([idStr, cols]) => {
				const id = Number(idStr);
				Object.entries(cols).forEach(([column, value]) => {
					changes.push({ id, column, value: String(value) });
				});
			});

			if (changes.length > 0) {
				await postRPC('/registry/batch', {
					p_changes: changes,
					p_actor: 'admin@gobudibase.local'
				});
			}

			dirtyCells = {};
			deletedIds = [];
			statusMessage = { text: 'Perubahan berhasil disimpan ke database!', type: 'success' };
			await loadData();
		} catch (err: any) {
			console.error('Batch save failed:', err);
			statusMessage = { text: `Gagal menyimpan: ${err.message || 'Kesalahan jaringan'}`, type: 'error' };
		} finally {
			saving = false;
			setTimeout(() => (statusMessage = null), 4000);
		}
	}

	// Filter & Sort Pipeline (Evaluated client-side for loaded records)
	const displayedRecords = $derived.by(() => {
		let list = [...rawRecords];

		// 1. Text Global Search
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			list = list.filter((r) => {
				if (searchColumn !== 'all') {
					return String(r[searchColumn] ?? '').toLowerCase().includes(q);
				}
				return (
					String(r.name ?? '').toLowerCase().includes(q) ||
					String(r.code ?? '').toLowerCase().includes(q) ||
					String(r.category ?? '').toLowerCase().includes(q) ||
					String(r.location ?? '').toLowerCase().includes(q) ||
					String(r.status ?? '').toLowerCase().includes(q)
				);
			});
		}

		// 2. 12-Operator Filters
		if (filters.length > 0) {
			list = list.filter((r) => evaluateAllFilters(r, filters));
		}

		// 3. Multi-Column Sorting
		if (sorts.length > 0) {
			list.sort((a, b) => {
				for (const s of sorts) {
					const va = a[s.column];
					const vb = b[s.column];
					if (va === vb) continue;
					if (va === null || va === undefined) return 1;
					if (vb === null || vb === undefined) return -1;

					let cmp = 0;
					if (typeof va === 'number' && typeof vb === 'number') {
						cmp = va - vb;
					} else {
						cmp = String(va).localeCompare(String(vb));
					}
					return s.dir === 'asc' ? cmp : -cmp;
				}
				return 0;
			});
		}

		return list;
	});

	// Exports (Excel, PDF, CSV)
	function exportExcel() {
		const exportRows = displayedRecords.map((r) => {
			const row: Record<string, any> = {};
			for (const col of columns.filter((c) => c.visible)) {
				row[col.label] = r[col.name];
			}
			return row;
		});
		const ws = XLSX.utils.json_to_sheet(exportRows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Interactive Grid');
		XLSX.writeFile(wb, `InteractiveGrid_${new Date().toISOString().slice(0, 10)}.xlsx`);
	}

	function exportPDF() {
		exportRegistryReport(displayedRecords, {
			title: 'LAPORAN AUDIT INTERACTIVE GRID (ORACLE APEX PARITY)',
			filterSummary: searchTerm ? `Pencarian: ${searchTerm}` : 'Semua Aset'
		});
	}

	function exportCSV() {
		const visibleCols = columns.filter((c) => c.visible);
		const headers = visibleCols.map((c) => `"${c.label}"`).join(',');
		const rowsStr = displayedRecords
			.map((r) => visibleCols.map((c) => `"${String(r[c.name] ?? '').replace(/"/g, '""')}"`).join(','))
			.join('\n');
		const blob = new Blob([`${headers}\n${rowsStr}`], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `InteractiveGrid_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
	}

	function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
		if (format === 'csv') exportCSV();
		else if (format === 'xlsx') exportExcel();
		else if (format === 'pdf') exportPDF();
	}

	// Saved Reports Management
	function loadSavedReportsFromStorage() {
		try {
			const raw = localStorage.getItem('gobudibase_ig_reports');
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed) && parsed.length > 0) {
					savedReports = parsed;
				}
			}
		} catch (e) {
			console.warn('Could not read saved reports from storage', e);
		}
	}

	function handleSaveReport(name: string, isDefault: boolean, isPublic: boolean) {
		const newReport: IgSavedReport = {
			id: `rep_${Date.now()}`,
			name,
			isDefault,
			isPublic,
			viewMode,
			filters: [...filters],
			sorts: [...sorts],
			groups: group ? [group] : [],
			highlights: [...highlights],
			aggregates: [...aggregates],
			columns: columns.map((c) => ({ ...c })),
			chartConfig: { ...chartConfig }
		};

		savedReports = [...savedReports, newReport];
		activeReportId = newReport.id;
		try {
			localStorage.setItem('gobudibase_ig_reports', JSON.stringify(savedReports));
		} catch (e) {}
		statusMessage = { text: `Laporan "${name}" berhasil disimpan!`, type: 'success' };
	}

	function handleSelectReport(reportId: string) {
		activeReportId = reportId;
		const r = savedReports.find((rep) => rep.id === reportId);
		if (!r) return;

		viewMode = r.viewMode || 'grid';
		filters = [...(r.filters || [])];
		sorts = [...(r.sorts || [{ column: 'id', dir: 'asc' }])];
		group = r.groups && r.groups.length > 0 ? r.groups[0] : null;
		highlights = [...(r.highlights || [])];
		aggregates = [...(r.aggregates || [])];
		if (r.columns && r.columns.length > 0) {
			columns = [...r.columns];
		}
		if (r.chartConfig) {
			chartConfig = { ...r.chartConfig };
		}
	}

	function handleReset() {
		handleSelectReport('primary');
		dirtyCells = {};
		deletedIds = [];
		searchTerm = '';
		loadData();
		statusMessage = { text: 'Tampilan direset ke Primary Report.', type: 'success' };
	}

	function handleOpenDialog(name: string) {
		if (name === 'filter') {
			filterEditing = null;
			filterDialogOpen = true;
		} else if (name === 'columns') {
			columnsDialogOpen = true;
		} else if (name === 'sort') {
			sortDialogOpen = true;
		} else if (name === 'aggregate') {
			aggregateDialogOpen = true;
		} else if (name === 'group') {
			groupDialogOpen = true;
		} else if (name === 'highlight') {
			highlightEditing = null;
			highlightDialogOpen = true;
		} else if (name === 'save_report') {
			saveReportDialogOpen = true;
		}
	}

	const hasDirty = $derived(
		Object.keys(dirtyCells).length > 0 || deletedIds.length > 0 || rawRecords.some((r) => r._status === 'inserted')
	);
	const currentPage = $derived(Math.floor(offset / limit) + 1);
	const totalPages = $derived(Math.ceil(totalCount / limit) || 1);
</script>

<div class="space-y-3 font-sans w-full">
	<!-- Top Region Header (APEX Title & Status Alert) -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2.5">
			<div class="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
				<TableProperties class="w-5 h-5" />
			</div>
			<div>
				<h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
					<span>{title}</span>
					<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
						Oracle APEX IG 1:1
					</span>
				</h2>
				<p class="text-[11px] text-slate-500">
					4 Mode Tampilan (Grid, Single Row, Icon, Chart) • 12 Operator Filter • Multi-Sort • Grouping • Spreadsheet Paste
				</p>
			</div>
		</div>

		<!-- Notification Badge -->
		{#if statusMessage}
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all {statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
				{#if statusMessage.type === 'success'}
					<CheckCircle2 class="w-4 h-4 text-emerald-600" />
				{:else}
					<AlertCircle class="w-4 h-4 text-rose-600" />
				{/if}
				<span>{statusMessage.text}</span>
			</div>
		{/if}
	</div>

	<!-- 1:1 Oracle APEX IG Toolbar -->
	<IgToolbar
		bind:searchTerm
		bind:searchColumn
		bind:viewMode
		bind:editable
		{columns}
		{savedReports}
		bind:activeReportId
		{hasDirty}
		{saving}
		{loading}
		onSave={saveChanges}
		onAddRow={handleAddRow}
		onReset={handleReset}
		onRefresh={loadData}
		onOpenDialog={handleOpenDialog}
		onExport={handleExport}
		onSelectReport={handleSelectReport}
	/>

	<!-- Active Filter & Highlight Chips Bar -->
	<IgFilterBar
		bind:filters
		bind:group
		bind:highlights
		onEditFilter={(f) => { filterEditing = f; filterDialogOpen = true; }}
		onEditGroup={() => (groupDialogOpen = true)}
		onEditHighlight={(h) => { highlightEditing = h; highlightDialogOpen = true; }}
	/>

	<!-- Main View Switcher Render (4 Modes) -->
	{#if viewMode === 'grid'}
		<!-- 1. Grid View (Standard Tabular View) -->
		<IgGridView
			records={displayedRecords}
			bind:columns
			bind:selectedIds
			{group}
			{highlights}
			{aggregates}
			{editable}
			bind:activeCell
			onCellChange={handleCellChange}
			onRowAction={handleRowAction}
			onOpenSingleRow={(id) => { activeSingleRowId = id; viewMode = 'single'; }}
			onColumnFilter={(col) => {
				filterEditing = { id: '', column: col, op: 'contains', value: '', enabled: true };
				filterDialogOpen = true;
			}}
		/>

		<!-- Pagination Footer (1:1 APEX Pagination) -->
		<div class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 shadow-2xs">
			<div class="flex items-center gap-2">
				<span>
					Menampilkan <strong class="text-slate-900">{displayedRecords.length}</strong> record
					{#if totalCount > displayedRecords.length}
						(dari total <strong class="text-slate-900">{totalCount.toLocaleString()}</strong> data)
					{/if}
				</span>
				{#if hasDirty}
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
						Unsaved Changes
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-1.5">
					<span class="text-slate-500">Baris:</span>
					<select
						bind:value={limit}
						onchange={loadData}
						class="px-2 py-1 rounded border border-slate-300 bg-white text-xs font-semibold cursor-pointer"
					>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</div>

				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={() => { offset = Math.max(0, offset - limit); loadData(); }}
						disabled={offset === 0}
						class="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
					>
						<ChevronLeft class="w-4 h-4" />
					</button>
					<span class="px-2 font-mono font-medium">{currentPage} / {totalPages}</span>
					<button
						type="button"
						onclick={() => { offset += limit; loadData(); }}
						disabled={currentPage >= totalPages}
						class="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
					>
						<ChevronRight class="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>

	{:else if viewMode === 'single'}
		<!-- 2. Single Row View (Detail Form Inspector) -->
		<IgSingleRowView
			records={displayedRecords}
			{columns}
			bind:activeRecordId={activeSingleRowId}
			onClose={() => (viewMode = 'grid')}
			onCellChange={handleCellChange}
			onRowAction={handleRowAction}
			onSave={saveChanges}
			{hasDirty}
			{saving}
		/>

	{:else if viewMode === 'icon'}
		<!-- 3. Icon / Cards View -->
		<IgIconView
			records={displayedRecords}
			onOpenSingleRow={(id) => { activeSingleRowId = id; viewMode = 'single'; }}
			onRowAction={handleRowAction}
		/>

	{:else if viewMode === 'chart'}
		<!-- 4. Chart View (Interactive Analytics) -->
		<IgChartView
			records={displayedRecords}
			{columns}
			bind:config={chartConfig}
		/>
	{/if}

	<!-- Dialogs (Modals) -->
	<IgFilterDialog
		bind:open={filterDialogOpen}
		{columns}
		filterToEdit={filterEditing}
		onApply={(f) => {
			const idx = filters.findIndex((item) => item.id === f.id);
			if (idx >= 0) filters[idx] = f;
			else filters = [...filters, f];
		}}
	/>

	<IgColumnsDialog
		bind:open={columnsDialogOpen}
		bind:columns
	/>

	<IgSortDialog
		bind:open={sortDialogOpen}
		{columns}
		bind:sorts
	/>

	<IgAggregateDialog
		bind:open={aggregateDialogOpen}
		{columns}
		bind:aggregates
	/>

	<IgGroupDialog
		bind:open={groupDialogOpen}
		{columns}
		bind:group
	/>

	<IgHighlightDialog
		bind:open={highlightDialogOpen}
		{columns}
		highlightToEdit={highlightEditing}
		onApply={(h) => {
			const idx = highlights.findIndex((item) => item.id === h.id);
			if (idx >= 0) highlights[idx] = h;
			else highlights = [...highlights, h];
		}}
	/>

	<IgSaveReportDialog
		bind:open={saveReportDialogOpen}
		onSave={handleSaveReport}
	/>
</div>
