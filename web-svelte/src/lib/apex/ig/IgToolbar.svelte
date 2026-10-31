<script lang="ts">
	import type { IgColumnMeta, IgSavedReport, ViewMode } from './types';
	import {
		Search,
		Table,
		FileSpreadsheet,
		FileText,
		LayoutGrid,
		BarChart2,
		SlidersHorizontal,
		Save,
		Plus,
		RotateCcw,
		RefreshCw,
		Check,
		ChevronDown,
		Filter,
		Columns,
		ArrowUpDown,
		PieChart,
		Highlighter,
		FolderTree,
		Download,
		Bookmark
	} from 'lucide-svelte';

	let {
		searchTerm = $bindable(''),
		searchColumn = $bindable('all'),
		viewMode = $bindable<ViewMode>('grid'),
		editable = $bindable(false),
		columns = [],
		savedReports = [],
		activeReportId = $bindable('primary'),
		hasDirty = false,
		saving = false,
		loading = false,
		onSave,
		onAddRow,
		onReset,
		onRefresh,
		onOpenDialog,
		onExport,
		onSelectReport
	}: {
		searchTerm: string;
		searchColumn: string;
		viewMode: ViewMode;
		editable: boolean;
		columns: IgColumnMeta[];
		savedReports: IgSavedReport[];
		activeReportId: string;
		hasDirty: boolean;
		saving: boolean;
		loading: boolean;
		onSave: () => void;
		onAddRow: () => void;
		onReset: () => void;
		onRefresh: () => void;
		onOpenDialog: (dialog: 'filter' | 'columns' | 'sort' | 'aggregate' | 'group' | 'highlight' | 'save_report') => void;
		onExport: (format: 'csv' | 'xlsx' | 'pdf') => void;
		onSelectReport: (reportId: string) => void;
	} = $props();

	let actionsMenuOpen = $state(false);
	let reportMenuOpen = $state(false);

	function toggleActionsMenu() {
		actionsMenuOpen = !actionsMenuOpen;
		if (actionsMenuOpen) reportMenuOpen = false;
	}

	function toggleReportMenu() {
		reportMenuOpen = !reportMenuOpen;
		if (reportMenuOpen) actionsMenuOpen = false;
	}

	function closeAllMenus() {
		actionsMenuOpen = false;
		reportMenuOpen = false;
	}

	const activeReportName = $derived(
		savedReports.find((r) => r.id === activeReportId)?.name || 'Primary Report'
	);
</script>

<svelte:window onclick={closeAllMenus} />

<div class="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-xs text-xs">
	<!-- Left section: Search, Column selector, and Saved Reports -->
	<div class="flex flex-wrap items-center gap-2">
		<!-- Saved Reports Dropdown (1:1 APEX) -->
		<div class="relative" onclick={(e) => e.stopPropagation()}>
			<button
				type="button"
				onclick={toggleReportMenu}
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
				title="Pilih Saved Report"
			>
				<Bookmark class="w-3.5 h-3.5 text-blue-600" />
				<span class="max-w-[130px] truncate">{activeReportName}</span>
				<ChevronDown class="w-3 h-3 text-slate-400" />
			</button>

			{#if reportMenuOpen}
				<div class="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50">
					<div class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
						Saved Reports
					</div>
					{#each savedReports as report}
						<button
							type="button"
							onclick={() => { onSelectReport(report.id); closeAllMenus(); }}
							class="w-full flex items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-blue-50 transition cursor-pointer {report.id === activeReportId ? 'text-blue-700 font-semibold bg-blue-50/50' : 'text-slate-700'}"
						>
							<span class="truncate">{report.name} {report.isDefault ? '(Default)' : ''}</span>
							{#if report.id === activeReportId}
								<Check class="w-3.5 h-3.5 text-blue-600 shrink-0" />
							{/if}
						</button>
					{/each}
					<div class="my-1 border-t border-slate-100"></div>
					<button
						type="button"
						onclick={() => { onOpenDialog('save_report'); closeAllMenus(); }}
						class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition font-medium cursor-pointer"
					>
						<Bookmark class="w-3.5 h-3.5" />
						<span>Save Current Report As...</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Search Input & Column filter selector -->
		<div class="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
			<select
				bind:value={searchColumn}
				class="bg-slate-50 border-r border-slate-300 px-2 py-1.5 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer"
			>
				<option value="all">Semua Kolom</option>
				{#each columns.filter((c) => c.visible) as col}
					<option value={col.name}>{col.label}</option>
				{/each}
			</select>
			<div class="relative flex items-center">
				<Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
				<input
					type="text"
					placeholder="Cari (Global Search)..."
					bind:value={searchTerm}
					class="pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 w-48 sm:w-60 outline-none"
				/>
				{#if searchTerm}
					<button
						type="button"
						onclick={() => (searchTerm = '')}
						class="pr-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
					>
						×
					</button>
				{/if}
			</div>
		</div>

		<!-- Actions Menu Button (1:1 APEX Actions) -->
		<div class="relative" onclick={(e) => e.stopPropagation()}>
			<button
				type="button"
				onclick={toggleActionsMenu}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer shadow-2xs"
			>
				<SlidersHorizontal class="w-3.5 h-3.5 text-slate-600" />
				<span>Actions</span>
				<ChevronDown class="w-3 h-3 text-slate-400" />
			</button>

			{#if actionsMenuOpen}
				<div class="absolute left-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50">
					<div class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
						Data & Layout
					</div>
					<button
						type="button"
						onclick={() => { onOpenDialog('columns'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<Columns class="w-3.5 h-3.5 text-slate-500" />
						<span>Columns (Pilih & Urutkan)...</span>
					</button>
					<button
						type="button"
						onclick={() => { onOpenDialog('filter'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<Filter class="w-3.5 h-3.5 text-slate-500" />
						<span>Filter (12 Operator APEX)...</span>
					</button>
					<button
						type="button"
						onclick={() => { onOpenDialog('sort'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<ArrowUpDown class="w-3.5 h-3.5 text-slate-500" />
						<span>Sort (Multi-Column)...</span>
					</button>
					<button
						type="button"
						onclick={() => { onOpenDialog('aggregate'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<PieChart class="w-3.5 h-3.5 text-slate-500" />
						<span>Aggregate (SUM, AVG, MIN, MAX)...</span>
					</button>

					<div class="my-1 border-t border-slate-100"></div>
					<div class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
						Format & Grouping
					</div>
					<button
						type="button"
						onclick={() => { onOpenDialog('group'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<FolderTree class="w-3.5 h-3.5 text-slate-500" />
						<span>Control Break (Grouping)...</span>
					</button>
					<button
						type="button"
						onclick={() => { onOpenDialog('highlight'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<Highlighter class="w-3.5 h-3.5 text-slate-500" />
						<span>Highlight (Conditional Format)...</span>
					</button>

					<div class="my-1 border-t border-slate-100"></div>
					<div class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
						Export / Unduh
					</div>
					<button
						type="button"
						onclick={() => { onExport('csv'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 transition cursor-pointer"
					>
						<Download class="w-3.5 h-3.5 text-slate-500" />
						<span>Unduh CSV</span>
					</button>
					<button
						type="button"
						onclick={() => { onExport('xlsx'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-emerald-700 font-medium hover:bg-emerald-50 transition cursor-pointer"
					>
						<FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
						<span>Unduh Excel (XLSX)</span>
					</button>
					<button
						type="button"
						onclick={() => { onExport('pdf'); closeAllMenus(); }}
						class="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-rose-700 font-medium hover:bg-rose-50 transition cursor-pointer"
					>
						<FileText class="w-3.5 h-3.5 text-rose-600" />
						<span>Unduh Laporan PDF</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Right section: View Switchers, Edit Mode, Save, Add Row, Reset -->
	<div class="flex flex-wrap items-center gap-2">
		<!-- 4 View Modes Switcher (1:1 APEX: Grid, Single Row, Icon, Chart) -->
		<div class="flex items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5">
			<button
				type="button"
				onclick={() => (viewMode = 'grid')}
				class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {viewMode === 'grid' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				title="Grid View (Spreadsheet Tabular)"
			>
				<Table class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Grid</span>
			</button>

			<button
				type="button"
				onclick={() => (viewMode = 'single')}
				class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {viewMode === 'single' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				title="Single Row View (Detail Form)"
			>
				<FileText class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Single Row</span>
			</button>

			<button
				type="button"
				onclick={() => (viewMode = 'icon')}
				class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {viewMode === 'icon' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				title="Icon / Cards View"
			>
				<LayoutGrid class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Icon</span>
			</button>

			<button
				type="button"
				onclick={() => (viewMode = 'chart')}
				class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer {viewMode === 'chart' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
				title="Chart View (Analisis Grafik)"
			>
				<BarChart2 class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Chart</span>
			</button>
		</div>

		<!-- Edit Mode Toggle -->
		<button
			type="button"
			onclick={() => (editable = !editable)}
			class="px-2.5 py-1.5 rounded-lg border font-semibold transition cursor-pointer {editable ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}"
			title="Toggle Mode Edit Data"
		>
			{editable ? 'Edit Mode ON' : 'Edit'}
		</button>

		<!-- Save Button (Disabled when clean) -->
		<button
			type="button"
			onclick={onSave}
			disabled={!hasDirty || saving}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-white transition cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed {hasDirty ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400/40 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}"
			title="Simpan Perubahan ke Database"
		>
			<Save class="w-3.5 h-3.5" />
			<span>{saving ? 'Menyimpan...' : 'Save'}</span>
		</button>

		<!-- Add Row Button -->
		{#if editable}
			<button
				type="button"
				onclick={onAddRow}
				class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer shadow-2xs"
				title="Tambah Baris Baru"
			>
				<Plus class="w-3.5 h-3.5 text-blue-600" />
				<span>Add Row</span>
			</button>
		{/if}

		<!-- Reset Button -->
		<button
			type="button"
			onclick={onReset}
			class="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
			title="Reset Perubahan & Laporan"
		>
			<RotateCcw class="w-3.5 h-3.5" />
		</button>

		<!-- Refresh Button -->
		<button
			type="button"
			onclick={onRefresh}
			disabled={loading}
			class="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer disabled:opacity-40"
			title="Muat Ulang Data Server"
		>
			<RefreshCw class="w-3.5 h-3.5 {loading ? 'animate-spin text-blue-600' : ''}" />
		</button>
	</div>
</div>
