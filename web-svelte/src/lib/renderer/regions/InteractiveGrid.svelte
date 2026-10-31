<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ApiError } from '$lib/api/client';
	import { batchRecords, fileDownloadUrl, labels as fetchLabels, listReports, lookup, queryReport } from '$lib/api/resources';
	import type { ActionMeta, ResourceMeta } from '$lib/api/resource-types';
import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
import { resolveFileNames } from '$lib/renderer/files';
	import { t } from '$lib/i18n/index.svelte';
	import { confirm } from '$lib/kit/confirm.svelte';
import ActionRunner from '$lib/renderer/actions/ActionRunner.svelte';
import { bulkActions } from '$lib/renderer/actions/actions';
	import { setRelationSource } from '$lib/kit/fields/relation';
	import ColumnsDialog from '$lib/kit/organisms/ir/ColumnsDialog.svelte';
	import FilterDialog from '$lib/kit/organisms/ir/FilterDialog.svelte';
	import Pagination from '$lib/kit/organisms/ir/Pagination.svelte';
	import SortDialog from '$lib/kit/organisms/ir/SortDialog.svelte';
	import { addFilter, newId, normalizeSettings, setPageSize, setSortOnly, withLockedFilter } from '$lib/kit/organisms/ir/model';
	import type { ReportFilter, ReportSettings, ReportSort } from '$lib/kit/organisms/ir/types';
	import Grid from '$lib/kit/organisms/ig/Grid.svelte';
	import {
		addRow,
		applyBatchErrors,
		deleteRow,
		duplicateRow,
		fromRows,
		hasChanges,
		opRowKeys,
		refreshRow,
		revertRow,
		setCell,
		setCellError,
		toOps,
		type BatchOpError,
		type GridState
	} from '$lib/kit/organisms/ig/model';
	import { pasteableFields, parsePaste } from '$lib/kit/organisms/ig/paste';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Interactive Grid region (K5-07): the page comes from the same `_query` as
	// the Interactive Report, and every change of the page is saved at once
	// through `_batch` (K5 §1.4).
	let {
		meta,
		onedit,
		lockedFilter
	}: {
		meta: ResourceMeta;
		onedit?: (id: string) => void;
		/** A relation tab locks the child list to one parent (F3-02). */
		lockedFilter?: { column: string; value: string };
	}
	= $props();

	// belongs_to lookups for the grid editors (F2-06).
	setRelationSource({
		search: (field, q, page) => lookup(context(), meta.id, field, q, page).then((resp) => resp.data),
		labels: (field, ids) => fetchLabels(context(), meta.id, field, ids).then((resp) => resp.data.labels)
	});

	const storageKey = $derived(
		lockedFilter ? `bb.ig.${meta.id}.${lockedFilter.column}=${lockedFilter.value}` : `bb.ig.${meta.id}`
	);
	const can = (op: string) => meta.capabilities?.[op] === true;
	const canEdit = $derived(can('update') || can('create'));

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	let settings = $state<ReportSettings | null>(null);
	let page = $state(1);
	let total = $state(0);
	let grid = $state<GridState>({ rows: [], nextTmpId: 1 });
	let labels = $state<LabelMap>({});
	let fileNames = $state<Record<string, Record<string, string>>>({});
	let selection = $state<string[]>([]);
	let activeKey = $state('');
	let activeColumn = $state('');
	let editable = $state(false);
	let searchText = $state('');
	let loading = $state(false);
	let saving = $state(false);
	let reloadToken = $state(0);
	let lastErrors = $state<BatchOpError[]>([]);
	let controller: AbortController | null = null;
	let filterOpen = $state(false);
	let filterEditing = $state<ReportFilter | null>(null);
	let sortOpen = $state(false);
	let columnsOpen = $state(false);
	let runner = $state<{ run: (action: ActionMeta, ids: string[]) => Promise<void> } | null>(null);

	const pageSize = $derived(settings?.page_size ?? 25);

	const lockedDefaults = $derived(lockedFilter ? { [lockedFilter.column]: lockedFilter.value } : {});
	const gridColumns = $derived(
		meta.fields
			.filter((field) => field.in_table && field.name !== lockedFilter?.column)
			.map((field) => field.name)
	);
	const canSave = $derived(hasChanges(grid) && can('update'));

	function readStored(): ReportSettings | null {
		try {
			const raw = sessionStorage.getItem(storageKey);
			return raw ? (JSON.parse(raw) as ReportSettings) : null;
		} catch {
			return null;
		}
	}

	function writeStored(value: ReportSettings) {
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(value));
		} catch {
			// Preferences only: a browser that refuses storage still works.
		}
	}

	function clearStored() {
		try {
			sessionStorage.removeItem(storageKey);
		} catch {
			// ignore
		}
	}

	function reportError(err: unknown) {
		if (err instanceof ApiError) notify.errors([{ text: err.message }]);
		else notify.errors([{ text: t('kit.ir.load_failed') }]);
	}

	let fellBack = false;

	function onInvalidSettings(message: string) {
		clearStored();
		notify.errors([{ text: message }]);
		if (fellBack) {
			settings = null;
			return;
		}
		fellBack = true;
		void loadPrimary();
	}

	async function loadPrimary() {
		try {
			const resp = await listReports(context(), meta.id);
			const primary = resp.data.find((report) => report.id === 'primary') ?? resp.data[0];
			settings = primary ? normalizeSettings(primary.settings) : null;
			page = 1;
		} catch (err) {
			reportError(err);
		}
	}

	onMount(async () => {
		try {
			const resp = await listReports(context(), meta.id);
			const primary = resp.data.find((report) => report.id === 'primary') ?? resp.data[0];
			settings = readStored() ?? (primary ? normalizeSettings(primary.settings) : null);
			page = 1;
		} catch (err) {
			reportError(err);
		}
	});

	// A page, settings, or reload change re-queries. The rows (and with them the
	// pending edits) always come from the server, which is why page, filter and
	// sort changes ask first (K5-07).
	$effect(() => {
		const current = settings;
		const currentPage = page;
		const token = reloadToken;
		// reloadToken is read so a successful save or Reset re-queries the page.
		if (!current || token < 0) return;
		controller?.abort();
		const request = new AbortController();
		controller = request;
		loading = true;
		void (async () => {
			try {
				const resp = await queryReport(context(), meta.id, withLockedFilter(current, lockedFilter), currentPage, sessionStore.csrfToken, request.signal);
				grid = fromRows(resp.data.rows);
				const map = await resolveLabels(context(), meta, resp.data.rows);
				if (controller === request) labels = map;
				const names = await resolveFileNames(
						context(),
						meta,
						grid.rows.map((row) => ({ id: row.id, ...row.values }))
				);
				if (controller === request) fileNames = names;
				total = resp.data.total;
				selection = [];
				activeKey = '';
				activeColumn = '';
				writeStored(current);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				if (err instanceof ApiError && err.status === 422) {
					onInvalidSettings(err.message);
					return;
				}
				reportError(err);
			} finally {
				if (controller === request) loading = false;
			}
		})();
	});

	async function guard(): Promise<boolean> {
		if (!hasChanges(grid)) return true;
		return confirm({ title: t('kit.ig.unsaved_title'), message: t('kit.msg.unsaved_changes') });
	}

	function update(next: ReportSettings) {
		settings = next;
		page = 1;
	}

	async function onPage(next: number) {
		if (next === page) return;
		if (!(await guard())) return;
		page = next;
	}

	async function onSearch(text: string) {
		if (!settings) return;
		if (!(await guard())) return;
		update(
			addFilter(settings, {
				id: newId('f'),
				kind: 'search',
				column: null,
				op: 'contains',
				value: text,
				enabled: true
			})
		);
	}

	async function onApplyFilter(next: ReportFilter) {
		if (!settings) return;
		if (!(await guard())) return;
		update({ ...settings, filters: [...settings.filters.filter((entry) => entry.id !== next.id), next] });
	}

	async function onApplySort(next: ReportSort[]) {
		if (!settings) return;
		if (!(await guard())) return;
		update({ ...settings, sort: next });
	}

	async function onSortHeader(column: string, dir: 'asc' | 'desc') {
		if (!settings) return;
		if (!(await guard())) return;
		update(setSortOnly(settings, column, dir));
	}

	async function onAction(name: string, value?: number) {
		switch (name) {
			case 'columns':
				columnsOpen = true;
				return;
			case 'filter':
				filterEditing = null;
				filterOpen = true;
				return;
			case 'sort':
				sortOpen = true;
				return;
			case 'rows':
				if (!settings || !value) return;
				if (!(await guard())) return;
				update(setPageSize(settings, value));
		}
	}

	function onCellChange(rowKey: string, column: string, value: unknown) {
		grid = setCell(grid, rowKey, column, value);
	}

	// Ctrl+V on an active cell pastes a TSV block to the right and down, into
	// editable columns only (F8-01). Extra rows need the create permission.
	function pasteTargets(): FieldMeta[] {
		return pasteableFields(meta.fields, lockedFilter?.column);
	}

	function pasteStart(column: string, targets: FieldMeta[]): number {
		const direct = targets.findIndex((field) => field.name === column);
		if (direct >= 0) return direct;
		const active = gridColumns.indexOf(column);
		if (active < 0) return -1;
		return targets.findIndex((field) => gridColumns.indexOf(field.name) >= active);
	}

	function onPaste(text: string, rowKey: string, column: string) {
		const targets = pasteTargets();
		const startCol = pasteStart(column, targets);
		const startRow = grid.rows.findIndex((row) => row.key === rowKey);
		if (startCol < 0 || startRow < 0) return;
		const result = parsePaste(text, targets, startRow, startCol);
		if (result.rows === 0) return;

		const missing = Math.max(0, startRow + result.rows - grid.rows.length);
		const canCreate = can('create');
		let skipped = 0;
		let next = grid;
		if (missing > 0 && canCreate) {
			for (let i = 0; i < missing; i += 1) next = addRow(next, undefined, lockedDefaults);
		} else if (missing > 0) {
			skipped = missing;
		}
		for (const cell of result.cells) {
			const row = next.rows[cell.row];
			if (!row) continue;
			if (cell.value !== undefined) next = setCell(next, row.key, cell.column, cell.value);
			const field = targets.find((entry) => entry.name === cell.column);
			next = setCellError(
				next,
				row.key,
				cell.column,
				cell.error ? t(cell.error, { min: field?.min ?? '', max: field?.max ?? '' }) : ''
			);
		}
		grid = next;

		if (skipped > 0) notify.errors([{ text: t('kit.ig.paste_skipped', { n: skipped }) }]);
	}

	async function onRowAction(name: string, rowKey: string) {
		switch (name) {
			case 'row_edit':
				if (onedit) onedit(rowKey);
				return;
			case 'row_add':
				grid = addRow(grid, rowKey, lockedDefaults);
				return;
			case 'row_duplicate':
				grid = duplicateRow(grid, rowKey);
				return;
			case 'row_delete':
				grid = deleteRow(grid, rowKey);
				return;
			case 'row_revert':
				grid = revertRow(grid, rowKey);
				return;
			case 'row_refresh':
				await refreshFromServer(rowKey);
		}
	}

	// Refresh Row reads the row again, which discards that row's pending edits.
	async function refreshFromServer(rowKey: string) {
		if (!settings) return;
		try {
			const resp = await queryReport(context(), meta.id, withLockedFilter(settings, lockedFilter), page, sessionStore.csrfToken);
			const fresh = resp.data.rows.find((row) => String(row.id) === rowKey);
			if (fresh) grid = refreshRow(grid, rowKey, fresh);
		} catch (err) {
			reportError(err);
		}
	}

	function onSelection(name: string) {
		const keys = [...selection];
		if (name === 'selection_delete') grid = keys.reduce(deleteRow, grid);
		else if (name === 'selection_duplicate') grid = keys.reduce(duplicateRow, grid);
		else if (name === 'selection_revert') grid = keys.reduce(revertRow, grid);
		selection = [];
	}

	// The batch errors point at operations; the operations are the grid's rows in
	// order, so each message can name its row and field (K5 §1.4).
	function failureMessages(): string[] {
		const keys = opRowKeys(grid, meta);
		return lastErrors.map((error) => {
			const rowIndex = grid.rows.findIndex((row) => row.key === keys[error.index]);
			const fields = (error.field_errors ?? [])
				.map(
					(fe) =>
						`${meta.fields.find((field) => field.name === fe.field)?.label ?? fe.field} - ${fe.message}`
				)
				.join(', ');
			const row = rowIndex < 0 ? '' : `${t('kit.ig.row_n', { n: rowIndex + 1 })}: `;
			return `${row}${fields || error.code}`;
		});
	}

	async function save() {
		const ops = toOps(grid, meta);
		if (ops.length === 0 || saving) return;
		saving = true;
		try {
			await batchRecords(context(), meta.id, ops, sessionStore.csrfToken);
			lastErrors = [];
			notify.success(t('kit.msg.changes_saved'));
			reloadToken += 1;
		} catch (err) {
			if (err instanceof ApiError && err.code === 'BATCH_FAILED') {
				lastErrors = err.ops ?? [];
				grid = applyBatchErrors(grid, lastErrors, meta);
				const messages = failureMessages();
				notify.errors(
					(messages.length > 0 ? messages : [t('kit.ig.save_failed')]).map((text) => ({ text }))
				);
				return;
			}
			reportError(err);
		} finally {
			saving = false;
		}
	}

	function onReset() {
		lastErrors = [];
		reloadToken += 1;
	}

	// Column layout is a display preference: it is stored with the settings but
	// must not reload the page (K5 §1.5).
	function patch(change: Partial<ReportSettings>) {
		if (!settings) return;
		settings = { ...settings, ...change };
	}

	// K5-10: the pending edits live in this page, so leaving it needs a warning
	// (mirrors K2-10 for the record form). A company or location switch reloads
	// the page, which the beforeunload handler below covers.
	let leaving = $state(false);

	beforeNavigate((navigation) => {
		if (leaving || !hasChanges(grid)) return;
		navigation.cancel();
		// A reload or a closed tab already has the browser's own dialog.
		if (navigation.type === 'leave') return;
		void confirm({
			title: t('kit.ig.unsaved_title'),
			message: t('kit.msg.unsaved_changes'),
			okLabel: t('kit.common.go'),
			danger: true
		}).then((ok) => {
			if (ok && navigation.to) {
				leaving = true;
				void goto(navigation.to.url.pathname + navigation.to.url.search);
			}
		});
	});

	$effect(() => {
		if (leaving || !hasChanges(grid)) return;
		const handler = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});
</script>

<div class="flex flex-col gap-2">
	<Grid
		{meta}
		columns={gridColumns}
		grid={grid}
		highlights={settings?.highlights ?? []}
		{labels}
		bind:selection
		bind:editable
		{activeKey}
		{activeColumn}
		{pageSize}
		bind:search={searchText}
		onsearch={(text) => void onSearch(text)}
		widths={settings?.widths ?? {}}
		frozen={settings?.frozen ?? null}
		onwidthchange={(column, width) => patch({ widths: { ...(settings?.widths ?? {}), [column]: width } })}
		onfreeze={(column) => patch({ frozen: settings?.frozen === column ? null : column })}
		onsort={(column, dir) => void onSortHeader(column, dir)}
		canEdit={canEdit}
		canCreate={can('create')}
		canDrawerEdit={!!onedit}
		{canSave}
		onaction={(name, value) => void onAction(name, value)}
		onselection={onSelection}
		bulkActions={bulkActions(meta).map((action) => ({ name: action.name, label: action.label, danger: action.danger }))}
		onbulkaction={(name) => {
			const action = bulkActions(meta).find((entry) => entry.name === name);
			if (action) void runner?.run(action, [...selection]);
		}}
		onrowaction={(name, rowKey) => void onRowAction(name, rowKey)}
		oncellactivate={(rowKey, column) => {
			activeKey = rowKey;
			activeColumn = column;
		}}
		oncellchange={onCellChange}
		onpaste={onPaste}
		onsave={() => void save()}
		onaddrow={() => (grid = addRow(grid, undefined, lockedDefaults))}
		onreset={onReset}
		fileHref={(row, column) => fileDownloadUrl(meta.id, row.id, column)}
		{fileNames}
	/>

	<ActionRunner bind:this={runner} {meta} ondone={() => (reloadToken += 1)} />

	{#if settings}
		<div class="flex items-center justify-end gap-2">
			<Pagination {page} {pageSize} {total} onpage={(next) => void onPage(next)} />
		</div>
	{/if}

	<FilterDialog
		bind:open={filterOpen}
		{meta}
		filter={filterEditing}
		onapply={(next) => void onApplyFilter(next)}
	loadRelation={(field, q, page) => lookup(context(), meta.id, field, q, page).then((resp) => resp.data)}
	/>
	<SortDialog
		bind:open={sortOpen}
		{meta}
		sort={settings?.sort ?? []}
		onapply={(next) => void onApplySort(next)}
	/>
	<ColumnsDialog
		bind:open={columnsOpen}
		{meta}
		columns={settings?.columns ?? []}
		onapply={(columns) => settings && update({ ...settings, columns })}
	/>
</div>
