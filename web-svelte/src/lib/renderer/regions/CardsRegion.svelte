<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ApiError } from '$lib/api/client';
	import { listReports, queryReport } from '$lib/api/resources';
import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
	import type { ActionMeta, ResourceMeta } from '$lib/api/resource-types';
	import { Button } from '$lib/components/ui/button';
import MenuPopup from '$lib/kit/molecules/MenuPopup.svelte';
import ActionRunner from '$lib/renderer/actions/ActionRunner.svelte';
import { headerActions, rowActions } from '$lib/renderer/actions/actions';
	import { t } from '$lib/i18n/index.svelte';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import CardsGrid from '$lib/kit/organisms/cards/CardsGrid.svelte';
	import { addFilter, newId, normalizeSettings, setPageSize, setSortOnly } from '$lib/kit/organisms/ir/model';
	import Pagination from '$lib/kit/organisms/ir/Pagination.svelte';
	import SearchBar from '$lib/kit/organisms/ir/SearchBar.svelte';
	import type { ReportSettings, SortDir } from '$lib/kit/organisms/ir/types';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Region Cards (K6-02): data, pencarian, dan sortir memakai `_query` yang sama
	// dengan Interactive Report. Ukuran halaman memakai nilai yang diterima server
	// (K3 §2.1); 12/24/48 pada rencana ditolak fw.ReportPageSizes.
	let { meta, onedit, oncreate }: { meta: ResourceMeta; onedit?: (id: string) => void; oncreate?: () => void } = $props();

	const storageKey = $derived(`bb.cards.${meta.id}`);
	const PAGE_SIZES = [10, 25, 50];
	const searchable = ['text', 'email', 'textarea', 'select'];
	const columnOptions = $derived(
		meta.fields
			.filter((field) => searchable.includes(field.type))
			.map((field) => ({ value: field.name, label: field.label }))
	);
	const sortOptions = $derived(
		meta.fields
			.filter((field) => field.sortable && field.type !== 'textarea')
			.map((field) => ({ value: field.name, label: field.label }))
	);
	const dirOptions = $derived([
		{ value: 'asc', label: t('kit.ir.sort.asc') },
		{ value: 'desc', label: t('kit.ir.sort.desc') }
	]);
	const sizeOptions = $derived(PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) })));

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	let settings = $state<ReportSettings | null>(null);
	let page = $state(1);
	let rows = $state<Record<string, unknown>[]>([]);
	let labels = $state<LabelMap>({});
	let total = $state(0);
	let loading = $state(false);
	let searchColumn = $state<string | null>(null);
	let searchText = $state('');
	let sortColumn = $state('');
	let sortDir = $state('asc');
	let pageSize = $state('10');
	let controller: AbortController | null = null;
	let reloadToken = $state(0);
	let runner = $state<{ run: (action: ActionMeta, ids: string[]) => Promise<void> } | null>(null);
	const hasRowActions = $derived(rowActions(meta).length > 0);
	let fellBack = false;
	function readStored(): ReportSettings | null {
		try {
			const raw = sessionStorage.getItem(storageKey);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as ReportSettings;
			if (!Array.isArray(parsed.columns) || parsed.columns.length === 0) return null;
			return normalizeSettings(parsed);
		} catch {
			return null;
		}
	}

	function writeStored(value: ReportSettings) {
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(value));
		} catch {
			// preferensi tampilan saja
		}
	}

	function clearStored() {
		try {
			sessionStorage.removeItem(storageKey);
		} catch {
			// abaikan
		}
	}

	function reportError(err: unknown) {
		if (err instanceof ApiError) notify.errors([{ text: err.message }]);
		else notify.errors([{ text: t('kit.ir.load_failed') }]);
	}

	function applySettings(next: ReportSettings | null) {
		if (!next) {
			settings = null;
			return;
		}
		const size = PAGE_SIZES.includes(next.page_size) ? next.page_size : 10;
		settings = setPageSize(next, size);
		page = 1;
		sortColumn = settings.sort[0]?.column ?? '';
		sortDir = settings.sort[0]?.dir ?? 'asc';
		pageSize = String(settings.page_size);
	}
	async function loadPrimary() {
		try {
			const resp = await listReports(context(), meta.id);
			const primary = resp.data.find((report) => report.id === 'primary') ?? resp.data[0];
			applySettings(primary ? normalizeSettings(primary.settings) : null);
		} catch (err) {
			reportError(err);
		}
	}

	function resetToPrimary() {
		if (!fellBack) {
			fellBack = true;
			void loadPrimary();
			return;
		}
		settings = null;
	}

	onMount(() => {
		void (async () => {
			try {
				const resp = await listReports(context(), meta.id);
				const primary = resp.data.find((report) => report.id === 'primary') ?? resp.data[0];
				applySettings(readStored() ?? (primary ? normalizeSettings(primary.settings) : null));
			} catch (err) {
				reportError(err);
			}
		})();
	});

	$effect(() => {
		const current = settings;
		const currentPage = page;
		const token = reloadToken;
		if (!current || token < 0) return;
		controller?.abort();
		const request = new AbortController();
		controller = request;
		loading = true;
		void (async () => {
			try {
				const resp = await queryReport(context(), meta.id, current, currentPage, sessionStore.csrfToken, request.signal);
				rows = resp.data.rows;
				const map = await resolveLabels(context(), meta, resp.data.rows);
				if (controller === request) labels = map;
				total = resp.data.total;
				writeStored(current);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				if (err instanceof ApiError && err.status === 422) {
					clearStored();
					notify.errors([{ text: err.message }]);
					resetToPrimary();
					return;
				}
				reportError(err);
			} finally {
				if (controller === request) loading = false;
			}
		})();
	});
	function update(next: ReportSettings) {
		settings = next;
		page = 1;
	}

	function onSearch(text: string) {
		if (!settings) return;
		update(
			addFilter(settings, {
				id: newId('f'),
				kind: 'search',
				column: searchColumn,
				op: 'contains',
				value: text,
				enabled: true
			})
		);
	}

	function onSort(column: string | null) {
		if (!settings || !column) return;
		sortColumn = column;
		update(setSortOnly(settings, column, sortDir as SortDir));
	}

	function onDir(dir: string | null) {
		if (!dir) return;
		sortDir = dir;
		if (settings && sortColumn) update(setSortOnly(settings, sortColumn, dir as SortDir));
	}

	function onPageSize(size: string | null) {
		if (!size || !settings) return;
		pageSize = size;
		update(setPageSize(settings, Number(size)));
	}
</script>
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

<div class="flex flex-col gap-3">
	<SearchBar columns={columnOptions} bind:searchColumn bind:text={searchText} onsearch={onSearch}>
		{#snippet right()}
			{#each headerActions(meta) as action (action.name)}
				<Button variant={action.danger ? 'destructive' : 'outline'} onclick={() => void runner?.run(action, [])}>{action.label}</Button>
			{/each}
			{#if meta.capabilities.create}
				<Button onclick={() => (oncreate ? oncreate() : goto(`/r/${meta.id}/new`))}>{t('kit.common.create')}</Button>
			{/if}
		{/snippet}
	</SearchBar>

	<div class="flex flex-wrap items-end gap-3">
		<div class="w-48">
			<SelectListItem
				id="cards-sort"
				label={t('kit.cards.sort')}
				options={sortOptions}
				value={sortColumn}
				onchange={onSort}
			/>
		</div>
		<div class="w-36">
			<SelectListItem
				id="cards-dir"
				label={t('kit.ir.sort.direction')}
				options={dirOptions}
				value={sortDir}
				onchange={onDir}
			/>
		</div>
		<div class="w-36">
			<SelectListItem
				id="cards-rows"
				label={t('kit.ir.action.rows_per_page')}
				options={sizeOptions}
				value={pageSize}
				onchange={onPageSize}
			/>
		</div>
	</div>

	{#if settings}
		<CardsGrid
			{rows}
			{meta}
			cards={meta.cards}
		{labels}
		rowmenu={hasRowActions ? rowmenu : undefined}
			linkHref={meta.capabilities.view ? (row) => `/r/${meta.id}/${row.id}` : undefined}
			onedit={onedit ? (row) => onedit(String(row.id)) : undefined}
		/>
		<div class="flex items-center justify-end">
			<Pagination {page} pageSize={settings.page_size} {total} onpage={(next) => (page = next)} />
		</div>
	{/if}
	<ActionRunner bind:this={runner} {meta} ondone={() => (reloadToken += 1)} />

	{#if loading}
		<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
	{/if}
</div>
