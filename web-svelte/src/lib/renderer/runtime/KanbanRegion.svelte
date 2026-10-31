<script lang="ts">
	import { goto } from '$app/navigation';
	import { listRecords } from '$lib/api/resources';
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { displayText, type DisplayType } from '$lib/kit/molecules/display';
	import { resolveLabels, type LabelMap } from '$lib/renderer/labels';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { kanbanColumns, kanbanHasMore, mergeKanbanRows } from './kanban';

	// Region runtime `kanban`: kolom = opsi field select (`groupBy`), kartu = rekaman.
	// Hanya baca: data lewat endpoint daftar resource dengan izin pemanggil sendiri,
	// klik kartu membuka rekamannya. Halaman demi halaman 100 rekaman; "muat lebih
	// banyak" menambahkan halaman berikutnya ke kolom.
	let {
		meta,
		groupBy,
		fields,
		filters
	}: {
		meta: ResourceMeta;
		groupBy?: string;
		fields?: string[];
		filters?: { field: string; op: 'eq'; value: string }[];
	} = $props();

	const LIMIT = 100;
	let rows = $state<Record<string, unknown>[]>([]);
	let labels = $state<LabelMap>({});
	let loading = $state(true);
	let failed = $state(false);
	let page = $state(1);
	let hasMore = $state(false);
	let loadingMore = $state(false);
	let moreController: AbortController | null = null;

	const field = $derived(meta.fields.find((f) => f.name === groupBy));
	const shown = $derived((fields ?? []).filter((n) => n !== meta.title_field).slice(0, 3));
	const columns = $derived(kanbanColumns(field, rows, groupBy ?? ''));

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	function filterValues() {
		return Object.fromEntries((filters ?? []).map((f) => [f.field, f.value]));
	}

	$effect(() => {
		const wanted = filterValues();
		const controller = new AbortController();
		moreController?.abort();
		loading = true;
		failed = false;
		void (async () => {
			try {
				const resp = await listRecords(context(), meta.id, { page: 1, pageSize: LIMIT, sort: meta.default_sort || undefined, filters: wanted }, controller.signal);
				if (controller.signal.aborted) return;
				rows = resp.data;
				page = 1;
				hasMore = kanbanHasMore(resp.data, LIMIT, resp.meta.pagination?.has_next);
				labels = await resolveLabels(context(), meta, resp.data);
			} catch (err) {
				// Permintaan basi (efek dijalankan ulang) tidak boleh menimpa hasil permintaan baru.
				if (!controller.signal.aborted && (err as Error)?.name !== 'AbortError') failed = true;
			} finally {
				if (!controller.signal.aborted) loading = false;
			}
		})();
		return () => {
			controller.abort();
			moreController?.abort();
		};
	});

	async function loadMore() {
		if (loadingMore) return;
		const controller = new AbortController();
		moreController = controller;
		loadingMore = true;
		const next = page + 1;
		try {
			const resp = await listRecords(
				context(),
				meta.id,
				{ page: next, pageSize: LIMIT, sort: meta.default_sort || undefined, filters: filterValues() },
				controller.signal
			);
			if (controller.signal.aborted) return;
			rows = mergeKanbanRows(rows, resp.data);
			page = next;
			hasMore = kanbanHasMore(resp.data, LIMIT, resp.meta.pagination?.has_next);
			const more = await resolveLabels(context(), meta, resp.data);
			if (controller.signal.aborted) return;
			const merged: LabelMap = { ...labels };
			for (const [name, map] of Object.entries(more)) merged[name] = { ...merged[name], ...map };
			labels = merged;
		} catch {
			// Gagal memuat halaman berikutnya: biarkan tombol tampil untuk dicoba lagi.
		} finally {
			loadingMore = false;
		}
	}

	function show(row: Record<string, unknown>, name: string): string {
		const f = meta.fields.find((x) => x.name === name);
		const raw = row[name];
		if (raw === null || raw === undefined || raw === '') return '';
		if (f?.type === 'belongs_to') return labels[name]?.[String(raw)] ?? '—';
		return f ? displayText(f.type as DisplayType, raw, f.options) : String(raw);
	}
</script>

{#if !field}
	<p class="text-destructive text-sm" role="alert">{t('kit.runtime.kanban_no_field')}</p>
{:else if failed}
	<p class="text-destructive text-sm" role="alert">{t('kit.msg.request_failed')}</p>
{:else if loading}
	<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
{:else}
	<div class="flex gap-3 overflow-x-auto pb-2" data-testid="kanban">
		{#each columns as column (column.value)}
			<section class="bg-muted/40 flex w-64 shrink-0 flex-col gap-2 rounded-md border p-2" aria-label={column.label}>
				<h3 class="flex items-center justify-between text-sm font-medium">
					<span>{column.label}</span>
					<span class="text-muted-foreground text-xs tabular-nums">{column.rows.length}</span>
				</h3>
				{#each column.rows as row (row.id)}
					<a class="bg-background hover:border-primary flex flex-col gap-1 rounded-md border p-2 text-sm" href={`/r/${meta.id}/${row.id}`} onclick={(e) => { e.preventDefault(); void goto(`/r/${meta.id}/${row.id}`); }}>
						<span class="font-medium">{show(row, meta.title_field) || '—'}</span>
						{#each shown as name (name)}
							{@const text = show(row, name)}
							{#if text}<span class="text-muted-foreground text-xs">{text}</span>{/if}
						{/each}
					</a>
				{:else}
					<p class="text-muted-foreground text-xs">{t('kit.runtime.kanban_empty')}</p>
				{/each}
			</section>
		{/each}
	</div>
	{#if hasMore}
		<div class="flex items-center gap-3">
			<Button variant="outline" size="sm" disabled={loadingMore} onclick={() => void loadMore()}>
				{t('kit.runtime.kanban_load_more')}
			</Button>
			<p class="text-muted-foreground text-xs" role="note">{t('kit.runtime.kanban_limit', { n: String(LIMIT) })}</p>
		</div>
	{/if}
{/if}
