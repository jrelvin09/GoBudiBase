<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError } from '$lib/api/client';
	import { exportReport, createReport, updateReport, deleteReport, fileDownloadUrl, listReports, queryReport, groupByReport, pivotReport, distinctValues, lookup } from '$lib/api/resources';
	import { confirm } from '$lib/kit/confirm.svelte';
import { Button } from '$lib/components/ui/button';
import MenuPopup from '$lib/kit/molecules/MenuPopup.svelte';
import ActionRunner from '$lib/renderer/actions/ActionRunner.svelte';
import { headerActions, rowActions } from '$lib/renderer/actions/actions';
	import type { ActionMeta, ResourceMeta } from '$lib/api/resource-types';
import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
import { resolveFileNames } from '$lib/renderer/files';
	import { t } from '$lib/i18n/index.svelte';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import Pagination from '$lib/kit/organisms/ir/Pagination.svelte';
	import ActionsMenu from '$lib/kit/organisms/ir/ActionsMenu.svelte';
	import ColumnHeaderMenu from '$lib/kit/organisms/ir/ColumnHeaderMenu.svelte';
	import FilterDialog from '$lib/kit/organisms/ir/FilterDialog.svelte';
	import ColumnsDialog from '$lib/kit/organisms/ir/ColumnsDialog.svelte';
	import SortDialog from '$lib/kit/organisms/ir/SortDialog.svelte';
	import ControlBreakDialog from '$lib/kit/organisms/ir/ControlBreakDialog.svelte';
	import HighlightDialog from '$lib/kit/organisms/ir/HighlightDialog.svelte';
	import AggregateDialog from '$lib/kit/organisms/ir/AggregateDialog.svelte';
	import DownloadDialog, { type DownloadStart } from '$lib/kit/organisms/ir/DownloadDialog.svelte';
	import JobProgress from '$lib/renderer/jobs/JobProgress.svelte';
	import ImportDialog from '$lib/renderer/jobs/ImportDialog.svelte';
	import SaveReportDialog, { type SaveReportInput } from '$lib/kit/organisms/ir/SaveReportDialog.svelte';
	import HelpDialog from '$lib/kit/organisms/ir/HelpDialog.svelte';
	import GroupByDialog from '$lib/kit/organisms/ir/GroupByDialog.svelte';
	import GroupByTable from '$lib/kit/organisms/ir/GroupByTable.svelte';
	import PivotDialog from '$lib/kit/organisms/ir/PivotDialog.svelte';
	import PivotTable from '$lib/kit/organisms/ir/PivotTable.svelte';
	import ChartDialog from '$lib/kit/organisms/ir/ChartDialog.svelte';
	import ChartView from '$lib/kit/organisms/ir/ChartView.svelte';
	import ComputeDialog from '$lib/kit/organisms/ir/ComputeDialog.svelte';
	import ViewSwitcher from '$lib/kit/organisms/ir/ViewSwitcher.svelte';
	import ReportTable from '$lib/kit/organisms/ir/ReportTable.svelte';
	import SearchBar from '$lib/kit/organisms/ir/SearchBar.svelte';
	import SettingsChips from '$lib/kit/organisms/ir/SettingsChips.svelte';
	import {
		addBreak,
		addFilter,
		fieldOf,
		hideColumn,
		newId,
		buildInitialSettings,
		normalizeSettings,
		restrictColumns,
		removeAggregate,
		removeBreak,
		removeFilter,
		removeHighlight,
		setPageSize,
		setSortOnly,
		toggleAggregate,
		toggleBreak,
		toggleFilter,
		toggleHighlight,
		updateFilter,
		availableViews,
		addComputation,
		chartPoints,
		computationField,
		setChart,
		setGroupBy,
		setPivot,
		setView,
		updateComputation,
		withLockedFilters
	} from '$lib/kit/organisms/ir/model';
	import type {
		ReportAggregates,
		ReportFilter,
		ReportGroupBy,
		ReportGroupPage,
		ReportHighlight,
		ReportKind,
		ReportPivot,
		ReportPivotPage,
		ReportChart,
		ReportComputation,
		ReportSettings,
		ReportView,
		SavedReport
	} from '$lib/kit/organisms/ir/types';
	import type { Snippet } from 'svelte';

	let {
		meta,
		right,
		onedit,
		lockedFilter,
		initialSearch = '',
		allowedColumns,
		rowAction,
		lockedFilters,
		initialSort,
		initialPageSize
	}: {
		meta: ResourceMeta;
		right?: Snippet;
		onedit?: (id: string) => void;
		/** A relation tab locks the child list to one parent (F3-02). */
		lockedFilter?: { column: string; value: string };
		/** Fills the search box on load, e.g. from the command palette (F5-06). */
		initialSearch?: string;
		/** Kolom yang diizinkan halaman terbit, berurutan (B011; presentasi, bukan otorisasi). */
		allowedColumns?: string[];
		/** Aksi klik baris dari halaman terbit (D010); none = baris tidak menjadi tautan. */
		rowAction?: 'edit' | 'none';
		/** Filter statis dari halaman terbit (D008); terkunci, `eq` saja. */
		lockedFilters?: { column: string; value: string }[];
		/** Sort awal dari halaman terbit (D004); hanya bila pengguna belum punya pengaturan. */
		initialSort?: { field: string; dir: 'asc' | 'desc' };
		/** Ukuran halaman awal dari halaman terbit (D004). */
		initialPageSize?: number;
	}
	= $props();

	const storageKey = $derived(
		(lockedFilter ? `bb.ir.${meta.id}.${lockedFilter.column}=${lockedFilter.value}` : `bb.ir.${meta.id}`) + (allowedColumns?.length ? `:f=${allowedColumns.join(',')}` : '') + (lockedFilters?.length ? `:lf=${lockedFilters.map((f) => f.column + '=' + f.value).join(',')}` : '')
	);
	const lockedAll = $derived(
		[...(lockedFilter ? [lockedFilter] : []), ...(lockedFilters ?? []).map((f) => ({ column: f.column, value: typedValue(f.column, f.value) }))]
	);
	function typedValue(column: string, raw: string): unknown {
		const type = meta.fields.find((field) => field.name === column)?.type;
		if (type === 'toggle') return raw === 'true';
		if (type === 'number') return Number(raw);
		return raw;
	}
	const columnsMeta = $derived(
		allowedColumns?.length
			? { ...meta, fields: allowedColumns.flatMap((name) => meta.fields.filter((field) => field.name === name)) }
			: meta
	);
	const searchable = ['text', 'email', 'textarea', 'select'];

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	let settings = $state<ReportSettings | null>(null);
	let baseline = $state<ReportSettings | null>(null);
	let page = $state(1);
	let rows = $state<Record<string, unknown>[]>([]);
	let labels = $state<LabelMap>({});
	let fileNames = $state<Record<string, Record<string, string>>>({});
	let aggregates = $state<ReportAggregates>({ overall: {}, breaks: [] });
	let total = $state(0);
	let reports = $state<SavedReport[]>([]);
	let currentReportId = $state('primary');
	let searchColumn = $state<string | null>(null);
	let searchText = $state('');

	// The command palette's "More" link fills the box on load (F5-06).
	$effect(() => {
		searchText = initialSearch ?? '';
	});
	let loading = $state(false);
	let controller: AbortController | null = null;
	let groupController: AbortController | null = null;
	let groupPage = $state<ReportGroupPage | null>(null);
	let groupTotal = $state(0);
	let pivotController: AbortController | null = null;
	let pivotPage = $state<ReportPivotPage | null>(null);
	let pivotTotal = $state(0);
	let pivotTooWide = $state(false);
	let chartOpen = $state(false);
	let chartData = $state<{ label: string; value: number }[]>([]);
	let chartController: AbortController | null = null;
	let chartLoading = $state(false);
	let computeOpen = $state(false);
	let computeEditing = $state<ReportComputation | null>(null);
	let reloadToken = $state(0);
	let runner = $state<{ run: (action: ActionMeta, ids: string[]) => Promise<void> } | null>(null);

	const modified = $derived(
		settings !== null && baseline !== null && JSON.stringify(settings) !== JSON.stringify(baseline)
	);
	const isLastPage = $derived(page * (settings?.page_size ?? 15) >= total);
	const hasRowActions = $derived(rowActions(meta).length > 0);
	const columnOptions = $derived(
		meta.fields.filter((field) => searchable.includes(field.type)).map((field) => ({ value: field.name, label: field.label }))
	);

	function readStored(): ReportSettings | null {
		try {
			const raw = sessionStorage.getItem(storageKey);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as ReportSettings;
			if (!Array.isArray(parsed.columns) || parsed.columns.length === 0 || !parsed.page_size) return null;
			return restrictColumns(normalizeSettings(parsed), allowedColumns);
		} catch {
			return null;
		}
	}

	function writeStored(value: ReportSettings) {
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(value));
		} catch {
			// storage unavailable — settings still work for this page view
		}
	}

	function clearStored() {
		try {
			sessionStorage.removeItem(storageKey);
		} catch {
			// ignore
		}
	}

	function selectReport(report: SavedReport | undefined) {
		if (!report) return;
		settings = restrictColumns(normalizeSettings(report.settings), allowedColumns);
		baseline = restrictColumns(normalizeSettings(report.settings), allowedColumns);
		currentReportId = report.id;
		page = 1;
		// The chosen report becomes the stored view for this resource (§1.7).
		writeStored(settings);
	}

	function reportError(err: unknown) {
		if (err instanceof ApiError) notify.errors([{ text: err.message }]);
		else notify.errors([{ text: t('kit.ir.load_failed') }]);
	}

	let fellBack = false;

	function resetToPrimary(applyDefaults = true) {
		const primary = reports.find((report) => report.id === 'primary') ?? reports[0];
		if (!primary) return;
		selectReport(primary);
		if (applyDefaults && settings && (initialSort || initialPageSize)) {
			settings = buildInitialSettings(settings, { sort: initialSort, pageSize: initialPageSize });
			baseline = settings;
			writeStored(settings);
		}
	}

	// A stored report can become invalid when the resource definition changes.
	// One fallback to the built-in primary per page load (unconditionally: the
	// restored sessionStorage settings also count as "primary"); if that also
	// fails we stop querying instead of looping (K3-F10a step 1).
	function onInvalidSettings(message: string) {
		clearStored();
		notify.errors([{ text: message }]);
		if (!fellBack) {
			fellBack = true;
			resetToPrimary(false);
			return;
		}
		settings = null;
	}

	onMount(async () => {
		try {
			const resp = await listReports(context(), meta.id);
			reports = resp.data;
			const stored = readStored();
			if (stored) {
				const primary = reports.find((report) => report.id === 'primary') ?? reports[0];
				settings = stored;
				baseline = primary ? normalizeSettings(primary.settings) : null;
				currentReportId = primary?.id ?? 'primary';
			} else {
				resetToPrimary();
			}
		} catch (err) {
			reportError(err);
		}
	});

	// Every settings/page change re-queries; the previous request is aborted so
	// a slow response can never overwrite a newer view (K3-F08 step 2). The
	// plain report is not queried while another view is active (K4 §1.1).
	$effect(() => {
		const current = settings;
		const currentPage = page;
		const token = reloadToken;
		if (!current || current.view !== 'report' || token < 0) return;
		controller?.abort();
		const request = new AbortController();
		controller = request;
		loading = true;
		void (async () => {
			try {
				const resp = await queryReport(context(), meta.id, withLockedFilters(current, lockedAll), currentPage, sessionStore.csrfToken, request.signal);
				rows = resp.data.rows;
				total = resp.data.total;
				aggregates = resp.data.aggregates;
				writeStored(current);
				const map = await resolveLabels(context(), meta, resp.data.rows);
				if (controller === request) labels = map;
				const names = await resolveFileNames(context(), meta, resp.data.rows);
				if (controller === request) fileNames = names;
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				if (err instanceof ApiError && err.status === 422) {
					// Stored settings no longer match the resource: drop them and
					// fall back to the primary report (K3-F08 step 4).
					onInvalidSettings(err.message);
					return;
				}
				reportError(err);
			} finally {
				if (controller === request) loading = false;
			}
		})();
	});

	// The Group By view pages over groups (K4-03), so it needs its own request
	// and its own total; the same abort discipline applies.
	$effect(() => {
		const current = settings;
		const currentPage = page;
		if (!current || current.view !== 'group_by' || !current.group_by) return;
		groupController?.abort();
		const request = new AbortController();
		groupController = request;
		loading = true;
		void (async () => {
			try {
				const resp = await groupByReport(context(), meta.id, withLockedFilters(current, lockedAll), currentPage, sessionStore.csrfToken, request.signal);
				groupPage = resp.data;
				groupTotal = resp.data.total;
				writeStored(current);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				if (err instanceof ApiError && err.status === 422) {
					onInvalidSettings(err.message);
					return;
				}
				reportError(err);
			} finally {
				if (groupController === request) loading = false;
			}
		})();
	});

	// The Pivot view has the same shape as Group By (K4-05); a pivot that is too
	// wide is reported by the server as PIVOT_TOO_WIDE and shown in place.
	$effect(() => {
		const current = settings;
		const currentPage = page;
		if (!current || current.view !== 'pivot' || !current.pivot) return;
		pivotController?.abort();
		const request = new AbortController();
		pivotController = request;
		loading = true;
		void (async () => {
			try {
				const resp = await pivotReport(context(), meta.id, withLockedFilters(current, lockedAll), currentPage, sessionStore.csrfToken, request.signal);
				pivotPage = resp.data;
				pivotTotal = resp.data.total;
				pivotTooWide = false;
				writeStored(current);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				if (err instanceof ApiError && err.code === 'PIVOT_TOO_WIDE') {
					pivotPage = null;
					pivotTooWide = true;
					return;
				}
				if (err instanceof ApiError && err.status === 422) {
					onInvalidSettings(err.message);
					return;
				}
				reportError(err);
			} finally {
				if (pivotController === request) loading = false;
			}
		})();
	});

	function update(next: ReportSettings) {
		settings = next;
		page = 1;
	}

	// The chart requests its own grouping: a temporary group_by over the label
	// column only, so the user's saved Group By view is never touched (K4-07).
	async function loadChartData(current: ReportSettings, signal: AbortSignal) {
		const chart = current.chart;
		if (!chart) return;
		const chartSettings: ReportSettings = {
			...current,
			group_by: {
				columns: [chart.label_column],
				functions: [{ id: '', fn: chart.fn, column: chart.value_column, label: '' }],
				sort:
					chart.sort === 'label_asc' || chart.sort === 'label_desc'
						? [{ column: chart.label_column, dir: chart.sort === 'label_desc' ? 'desc' : 'asc', nulls: 'default' }]
						: []
			},
			// One request must see every category it will chart (capped at 50).
			page_size: 1000,
			view: 'group_by'
		};
		const resp = await groupByReport(context(), meta.id, withLockedFilters(chartSettings, lockedAll), 1, sessionStore.csrfToken, signal);
		let points = chartPoints(meta, chart, resp.data.rows);
		if (chart.sort === 'value_asc') points = [...points].sort((a, b) => a.value - b.value);
		if (chart.sort === 'value_desc') points = [...points].sort((a, b) => b.value - a.value);
		chartData = points;
	}

	// Chart data follows the active definition and the page size, exactly like
	// the other views.
	$effect(() => {
		const current = settings;
		if (!current || current.view !== 'chart' || !current.chart) return;
		chartController?.abort();
		const request = new AbortController();
		chartController = request;
		chartLoading = true;
		void (async () => {
			try {
				await loadChartData(current, request.signal);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				if (err instanceof ApiError && err.status === 422) {
					onInvalidSettings(err.message);
					return;
				}
				reportError(err);
			} finally {
				if (chartController === request) chartLoading = false;
			}
		})();
	});

	function onSearch(text: string, column: string | null) {
		if (!settings) return;
		update(addFilter(settings, { id: newId('f'), kind: 'search', column, op: 'contains', value: text, enabled: true }));
	}

	function onToggle(kind: string, id: string) {
		if (!settings) return;
		if (kind === 'filter') settings = toggleFilter(settings, id);
		else if (kind === 'break') settings = toggleBreak(settings, id);
		else if (kind === 'highlight') settings = toggleHighlight(settings, id);
		else settings = toggleAggregate(settings, id);
	}

	function onRemove(kind: string, id: string) {
		if (!settings) return;
		if (kind === 'filter') update(removeFilter(settings, id));
		else if (kind === 'break') update(removeBreak(settings, id));
		else if (kind === 'highlight') settings = removeHighlight(settings, id);
		else settings = removeAggregate(settings, id);
	}

	let headerColumnName = $state<string | null>(null);
	let headerAnchor = $state<HTMLElement | null>(null);

	function onHeaderClick(column: string, anchorEl: HTMLElement) {
		headerAnchor = anchorEl;
		headerColumnName = headerColumnName === column ? null : column;
	}

	function closeHeaderMenu() {
		headerColumnName = null;
		headerAnchor?.focus();
	}

	function onPageSize(size: number) {
		if (!settings) return;
		update(setPageSize(settings, size));
	}

	const activeReport = $derived(reports.find((report) => report.id === currentReportId));
	const canDeleteReport = $derived(
		currentReportId !== 'primary' && activeReport?.can_edit === true
	);

	let columnsOpen = $state(false);
	let sortOpen = $state(false);
	let breakOpen = $state(false);
	let highlightOpen = $state(false);
	let highlightEditing = $state<ReportHighlight | null>(null);
	let aggregateOpen = $state(false);
	let downloadOpen = $state(false);
	let importOpen = $state(false);
	let saveOpen = $state(false);
	let groupByOpen = $state(false);
	let pivotOpen = $state(false);
	let helpOpen = $state(false);
	let filterOpen = $state(false);
	let filterEditing = $state<ReportFilter | null>(null);

	function onAction(name: string, value?: number) {
		if (name === 'rows' && value) {
			onPageSize(value);
			return;
		}
		if (name === 'save') {
			saveOpen = true;
			return;
		}
		if (name === 'reset') {
			void resetReport();
			return;
		}
		if (name === 'delete') {
			void removeReport();
			return;
		}
		if (name === 'filter') {
			filterEditing = null;
			filterOpen = true;
			return;
		}
		if (name === 'columns') {
			columnsOpen = true;
			return;
		}
		if (name === 'sort') {
			sortOpen = true;
			return;
		}
		if (name === 'break') {
			breakOpen = true;
			return;
		}
		if (name === 'highlight') {
			highlightEditing = null;
			highlightOpen = true;
			return;
		}
		if (name === 'aggregate') {
			aggregateOpen = true;
			return;
		}
		if (name === 'download') {
			downloadOpen = true;
			return;
		}
		if (name === 'import') {
			importOpen = true;
			return;
		}
		if (name === 'group_by') {
			groupByOpen = true;
			return;
		}
		if (name === 'pivot') {
			pivotOpen = true;
			return;
		}
		if (name === 'chart') {
			chartOpen = true;
			return;
		}
		if (name === 'compute') {
			computeEditing = null;
			computeOpen = true;
			return;
		}
		if (name === 'help') {
			helpOpen = true;
			return;
		}
		// Every Actions entry is wired (K3-F18).
	}

	async function reloadReports(select?: SavedReport) {
		const resp = await listReports(context(), meta.id);
		reports = resp.data;
		if (select) {
			const saved = reports.find((report) => report.id === select.id) ?? select;
			currentReportId = saved.id;
			baseline = normalizeSettings(saved.settings);
			writeStored(baseline);
		}
	}

	// Save: an existing editable report keeps its id; a new name creates one.
	async function saveReport(input: SaveReportInput): Promise<string | null> {
		if (!settings) return null;
		const primary = reports.find((report) => report.kind === 'primary');
		const current = reports.find((report) => report.id === currentReportId);
		const body = {
			name: input.name,
			description: input.description,
			settings
		};
		try {
			let saved: SavedReport;
			if (input.asDefault) {
				saved =
					primary && primary.version > 0
						? (await updateReport(context(), meta.id, primary.id, { expected_version: primary.version, ...body }, sessionStore.csrfToken)).data
						: (await createReport(context(), meta.id, { kind: 'primary', ...body }, sessionStore.csrfToken)).data;
			} else if (current && current.kind !== 'primary' && current.can_edit && input.name === current.name) {
				saved = (await updateReport(context(), meta.id, current.id, { expected_version: current.version, ...body }, sessionStore.csrfToken)).data;
			} else {
				const kind: ReportKind = input.public ? 'public' : 'private';
				saved = (await createReport(context(), meta.id, { kind, ...body }, sessionStore.csrfToken)).data;
			}
			await reloadReports(saved);
			notify.success(t('kit.ir.saved_ok'));
			return null;
		} catch (err) {
			return err instanceof ApiError ? err.message : t('kit.ir.load_failed');
		}
	}

	async function resetReport() {
		if (!(await confirm({ title: t('kit.ir.reset.title'), message: t('kit.ir.reset_confirm') }))) return;
		clearStored();
		resetToPrimary();
	}

	async function removeReport() {
		const current = reports.find((report) => report.id === currentReportId);
		if (!current || !(await confirm({ title: t('kit.ir.delete.title'), message: t('kit.ir.delete_confirm'), danger: true }))) return;
		try {
			await deleteReport(context(), meta.id, current.id, current.version, sessionStore.csrfToken);
			await reloadReports();
			resetToPrimary();
			notify.success(t('kit.ir.deleted_ok'));
		} catch (err) {
			reportError(err);
		}
	}

	// Starts the export: a small CSV downloads at once, while an XLSX or a large
	// export returns the id of the queued job to follow in the dialog (F4-05).
	async function downloadReport(format: string, separator: string): Promise<DownloadStart> {
		if (!settings) return null;
		if (format === 'pdf') {
			window.open(`/print/report/${meta.id}`, '_blank');
			return null;
		}
		try {
			const result = await exportReport(
				context(),
				meta.id,
				// A relation tab exports only the parent's rows too (F3-02a).
				withLockedFilters(settings, lockedAll),
				format,
				separator,
				sessionStore.csrfToken
			);
			if (result.kind === 'job') return { jobId: result.jobId };
			const url = URL.createObjectURL(result.blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = result.filename ?? `${meta.id}.csv`;
			link.click();
			// Revoking immediately can cancel the download in some browsers (K3-F17a).
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			return null;
		} catch (err) {
			return { error: err instanceof ApiError ? err.message : t('kit.ir.load_failed') };
		}
	}
	function onEditChip(kind: string, id: string) {
		if (!settings) return;
		if (kind === 'highlight') {
			highlightEditing = settings.highlights.find((entry) => entry.id === id) ?? null;
			highlightOpen = true;
			return;
		}
		if (kind !== 'filter') return;
		const entry = settings.filters.find((item) => item.id === id);
		if (!entry) return;
		if (entry.kind === 'search') {
			// A search chip goes back to the search box (no dialog), so the text
			// stays editable instead of silently becoming a column filter.
			searchText = entry.value === null || entry.value === undefined ? '' : String(entry.value);
			update(removeFilter(settings, id));
			return;
		}
		filterEditing = entry;
		filterOpen = true;
	}

	function applyFilter(next: ReportFilter) {
		if (!settings) return;
		update(filterEditing ? updateFilter(settings, next.id, next) : addFilter(settings, next));
	}

	// Defining a view also switches to it; removing it falls back to report
	// (K4 §1.1).
	function applyGroupBy(next: ReportGroupBy | null) {
		if (!settings) return;
		update(setView(setGroupBy(settings, next), next ? 'group_by' : 'report'));
	}

	function applyPivot(next: ReportPivot | null) {
		if (!settings) return;
		update(setView(setPivot(settings, next), next ? 'pivot' : 'report'));
	}

	function applyChart(next: ReportChart | null) {
		if (!settings) return;
		update(setView(setChart(settings, next), next ? 'chart' : 'report'));
	}

	function applyComputation(next: ReportComputation) {
		if (!settings) return;
		settings = computeEditing ? updateComputation(settings, next) : addComputation(settings, next);
	}

	function onViewChange(view: ReportView) {
		if (!settings) return;
		settings = setView(settings, view);
	}
</script>

{#snippet rightContent()}
	{#each headerActions(meta) as action (action.name)}
		<Button variant={action.danger ? 'destructive' : 'outline'} onclick={() => void runner?.run(action, [])}>
			{action.label}
		</Button>
	{/each}
	{@render right?.()}
{/snippet}

{#snippet rowmenu(row: Record<string, unknown>)}
	<MenuPopup
		items={rowActions(meta).map((action) => ({
			label: action.label,
			danger: action.danger,
			onselect: () => void runner?.run(action, [String(row.id)])
		}))}
		ariaLabel={t('kit.ig.row_actions')}
	/>
{/snippet}

{#snippet viewSwitcher()}
	{#if settings}
		<ViewSwitcher views={availableViews(settings)} value={settings.view} onchange={onViewChange} />
	{/if}
{/snippet}

{#snippet actionsMenu()}
	<ActionsMenu
		canExport={meta.capabilities.export === true}
		canImport={meta.capabilities.import === true}
		canSaveReport={meta.capabilities.read_only !== true}
		{canDeleteReport}
		pageSize={settings?.page_size ?? 15}
		onaction={onAction}
	/>
{/snippet}

<div class="flex flex-col gap-3">
	<SearchBar
		columns={columnOptions}
		bind:searchColumn
		bind:text={searchText}
		{reports}
		{currentReportId}
		{modified}
		onsearch={onSearch}
		onselectreport={(id) => selectReport(reports.find((report) => report.id === id))}
		actions={actionsMenu}
		{viewSwitcher}
		right={rightContent}
	/>
	{#if settings}
		<SettingsChips
			{meta}
			{settings}
			ontoggle={onToggle}
			onremove={onRemove}
			onedit={onEditChip}
		/>
		{#if settings.view === 'group_by' && settings.group_by && groupPage}
			<GroupByTable {meta} groupBy={settings.group_by} page={groupPage} />
		{:else if settings.view === 'pivot' && settings.pivot && pivotPage}
			<PivotTable {meta} pivot={settings.pivot} page={pivotPage} />
		{:else if settings.view === 'pivot' && pivotTooWide}
			<p class="text-destructive text-sm" role="alert">{t('kit.ir.pivot.too_wide')}</p>
		{:else if settings.view === 'chart' && settings.chart}
			<ChartView chart={settings.chart} data={chartData} />
		{:else}
			<ReportTable
				{meta}
				{settings}
				{rows}
				{aggregates}
				{isLastPage}
				linkHref={meta.capabilities.view && rowAction !== 'none' ? (row) => `/r/${encodeURIComponent(meta.id)}/${encodeURIComponent(String(row.id))}` : undefined}
				onedit={onedit ? (row) => onedit(String(row.id)) : undefined}
				{onHeaderClick}
			{labels}
			rowmenu={hasRowActions ? rowmenu : undefined}
			fileHref={(row, column) => fileDownloadUrl(meta.id, String(row.id), column)}
			{fileNames}
			/>
		{/if}
		{#if headerColumnName}
			{@const current = settings}
			{@const computed = current.computations.find((entry) => entry.id === headerColumnName)}
			{@const field = fieldOf(meta, headerColumnName) ?? (computed ? computationField(computed) : undefined)}
			{#if field}
				<ColumnHeaderMenu
					column={field}
					anchor={headerAnchor}
					onclose={closeHeaderMenu}
					onsort={(dir) => {
						update(setSortOnly(current, headerColumnName!, dir));
						closeHeaderMenu();
					}}
					onhide={() => {
						update(hideColumn(current, headerColumnName!));
						closeHeaderMenu();
					}}
					onbreak={() => {
						if (!current.breaks.some((entry) => entry.column === headerColumnName)) {
							update(addBreak(current, headerColumnName!));
						}
						closeHeaderMenu();
					}}
					onvalue={(value) => {
						update(
							addFilter(current, {
								id: newId('f'),
								kind: 'column',
								column: headerColumnName,
								op: 'eq',
								value,
								enabled: true
							})
						);
						closeHeaderMenu();
					}}
					loadValues={(q) =>
						distinctValues(context(), meta.id, withLockedFilters(current, lockedAll), headerColumnName!, q, sessionStore.csrfToken).then(
							(resp) => resp.data
						)}
				/>
			{/if}
		{/if}
		{@const currentSettings = settings}
		<FilterDialog
		bind:open={filterOpen}
		{meta}
		filter={filterEditing}
		onapply={applyFilter}
		loadValues={(column, q) =>
			distinctValues(context(), meta.id, withLockedFilters(currentSettings, lockedAll), column, q, sessionStore.csrfToken).then(
				(resp) => resp.data
			)}
	loadRelation={(field, q, page) => lookup(context(), meta.id, field, q, page).then((resp) => resp.data)}
	/>
		<ColumnsDialog
			bind:open={columnsOpen}
			meta={columnsMeta}
			columns={currentSettings.columns}
			onapply={(cols) => update({ ...currentSettings, columns: cols })}
		/>
		<SortDialog
			bind:open={sortOpen}
			{meta}
			sort={currentSettings.sort}
			onapply={(next) => update({ ...currentSettings, sort: next })}
		/>
		<ControlBreakDialog
			bind:open={breakOpen}
			{meta}
			breaks={currentSettings.breaks}
			onapply={(next) => update({ ...currentSettings, breaks: next })}
		/>
		<HighlightDialog
			bind:open={highlightOpen}
			{meta}
			highlight={highlightEditing}
			highlights={currentSettings.highlights}
			onapply={(next) =>
				update(
					highlightEditing
						? { ...currentSettings, highlights: currentSettings.highlights.map((entry) => (entry.id === next.id ? next : entry)) }
						: { ...currentSettings, highlights: [...currentSettings.highlights, next] }
				)}
			ondelete={(id) =>
				update({ ...currentSettings, highlights: currentSettings.highlights.filter((entry) => entry.id !== id) })}
		/>
		<AggregateDialog
			bind:open={aggregateOpen}
			{meta}
			aggregates={currentSettings.aggregates}
			onapply={(next) =>
				update({
					...currentSettings,
					aggregates: currentSettings.aggregates.some((entry) => entry.id === next.id)
						? currentSettings.aggregates.map((entry) => (entry.id === next.id ? next : entry))
						: [...currentSettings.aggregates, next]
				})}
			ondelete={(id) =>
				update({ ...currentSettings, aggregates: currentSettings.aggregates.filter((entry) => entry.id !== id) })}
		/>
		<DownloadDialog bind:open={downloadOpen} ondownload={downloadReport}>
		{#snippet progress(jobId: string)}
			<JobProgress {jobId} />
		{/snippet}
	</DownloadDialog>
		<ImportDialog bind:open={importOpen} {meta} onimported={() => (reloadToken += 1)} />
		<SaveReportDialog
			bind:open={saveOpen}
			canPublish={meta.capabilities.publish_report === true}
			initialName={activeReport?.name ?? ''}
			initialDescription={activeReport?.description ?? ''}
			onsave={saveReport}
		/>
		<HelpDialog bind:open={helpOpen} />
		<GroupByDialog
			bind:open={groupByOpen}
			{meta}
			groupBy={currentSettings.group_by}
			onapply={applyGroupBy}
		/>
		<PivotDialog
			bind:open={pivotOpen}
			{meta}
			pivot={currentSettings.pivot}
			onapply={applyPivot}
		/>
		<ChartDialog
			bind:open={chartOpen}
			{meta}
			chart={currentSettings.chart}
			onapply={applyChart}
		/>
		<ComputeDialog
			bind:open={computeOpen}
			{meta}
			computations={currentSettings.computations}
			computation={computeEditing}
			onapply={applyComputation}
		/>
		{#if currentSettings.view !== 'chart'}
			<div class="flex items-center justify-end gap-2">
				<Pagination
					page={page}
					pageSize={settings.page_size}
					total={currentSettings.view === 'group_by' ? groupTotal : currentSettings.view === 'pivot' ? pivotTotal : total}
					onpage={(next) => (page = next)}
				/>
			</div>
		{/if}
	{/if}
	<ActionRunner bind:this={runner} {meta} ondone={() => (reloadToken += 1)} />

	{#if loading}
		<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
	{/if}
</div>
