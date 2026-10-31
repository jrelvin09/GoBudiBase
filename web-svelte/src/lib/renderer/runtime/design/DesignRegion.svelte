<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import BarChart from '$lib/kit/organisms/chart/BarChart.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import type { RegionDefinition } from '../page-definition';
	import { fieldInsertBefore, isFieldDrag, MIME_FIELD, parseFieldDrag } from './dnd';
	import { CALENDAR_MARKED_DAYS, cardFields, chartSample, formFields, kanbanSample, kpiSample, sampleCell, SAMPLE_ROWS, tableFields } from './sample';

	// Gambar satu region di kanvas desain: struktur nyata (kolom, urutan, field,
	// kelompok grafik) dari metadata, nilainya data contoh. Tidak memanggil API
	// data: konteks PLATFORM tidak boleh membaca data company. Kolom dan field form
	// bisa diseret untuk mengubah urutan (atau dilepas dari palet field); bagian
	// lain dibuat `inert` agar tidak ada yang bisa difokus atau diklik.
	let {
		region,
		meta,
		index = -1,
		onfield,
		onpick
	}: {
		region: RegionDefinition;
		meta?: ResourceMeta;
		/** Indeks region di halaman; dibawa dalam muatan seretan agar lepas antar-region ditolak. */
		index?: number;
		/** `before` = nama field yang harus didahului, null = di akhir. */
		onfield?: (name: string, before: string | null) => void;
		/** Klik pada kolom/field memilih region (overlay pemilih berada di bawahnya). */
		onpick?: () => void;
	} = $props();

	const FAUX = 'border-input bg-background text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm';
	const isTable = $derived(region.type === 'ir-report' || region.type === 'resource-list' || region.type === 'grid');
	const cardCols = $derived(meta && region.type === 'cards' ? cardFields(region, meta) : []);
	const board = $derived(meta && region.type === 'kanban' ? kanbanSample(region, meta) : []);
	const columns = $derived(meta && isTable ? tableFields(region, meta) : []);
	const formControls = $derived(meta && region.type === 'resource-form' ? formFields(region, meta) : []);
	const editable = $derived(!!onfield && index >= 0);
	const metricLabel = $derived(
		!region.metric || region.metric.fn === 'count' || !region.metric.field
			? (meta?.plural ?? region.resourceId)
			: `${region.metric.fn}(${meta?.fields.find((f) => f.name === region.metric?.field)?.label ?? region.metric.field})`
	);
	const title = $derived(meta?.plural ?? region.resourceId);

	let hover = $state<{ name: string; after: boolean } | null>(null);

	function startField(event: DragEvent, name: string) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData(MIME_FIELD, JSON.stringify({ region: index, name }));
		event.dataTransfer.effectAllowed = 'move';
	}

	function overField(event: DragEvent, name: string) {
		if (!editable || !isFieldDrag(event.dataTransfer?.types)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		hover = { name, after: event.clientX > (box.left + box.right) / 2 };
	}

	function dropField(event: DragEvent, name: string) {
		const drag = parseFieldDrag(event.dataTransfer?.getData(MIME_FIELD));
		const at = hover;
		hover = null;
		if (!editable || !drag || drag.region !== index || !at) return;
		event.preventDefault();
		const names = (isTable ? columns : formControls).map((f) => f.name);
		onfield?.(drag.name, fieldInsertBefore(names, name, at.after));
	}
</script>

{#snippet control(field: FieldMeta)}
	{#if field.type === 'toggle'}
		<span class="bg-muted border-input inline-flex h-5 w-9 items-center rounded-full border px-0.5" aria-hidden="true"><span class="bg-background size-4 rounded-full border"></span></span>
	{:else if field.type === 'textarea'}
		<div class="{FAUX} h-16 items-start py-2"></div>
	{:else if field.type === 'select'}
		<div class="{FAUX} justify-between"><span>—</span><span aria-hidden="true">▾</span></div>
	{:else if field.type === 'belongs_to'}
		<div class="{FAUX} justify-between"><span>→</span><span aria-hidden="true">▾</span></div>
	{:else if field.type === 'file' || field.type === 'image'}
		<div class="{FAUX}">⇪</div>
	{:else}
		<div class={FAUX}>{region.mode === 'edit' ? sampleCell(field, 0) : ''}</div>
	{/if}
{/snippet}

{#snippet dropBar(name: string)}
	{#if hover?.name === name}
		<span class="bg-primary pointer-events-none absolute inset-y-0 w-0.5 {hover.after ? 'end-0' : 'start-0'}" role="presentation" data-field-drop></span>
	{/if}
{/snippet}

<div class="@container flex flex-col gap-2">
	<div inert class="flex flex-wrap items-center gap-2">
		<span class="text-sm font-semibold">{title}</span>
		{#if region.dialog}<Badge variant="outline">{t('kit.design.dialog')}</Badge>{/if}
		{#if region.datasource}<Badge variant="outline">ds: {region.datasource}</Badge>{/if}
		{#if region.auth}<Badge variant="outline">🔒 {region.auth}</Badge>{/if}
		{#if region.onSubmit?.length}<Badge variant="outline">{t('kit.design.process')}</Badge>{/if}
	</div>

	{#if !meta}
		<p class="text-muted-foreground text-sm">{t('kit.design.no_meta', { resource: region.resourceId })}</p>
	{:else if isTable}
		<div inert class="flex flex-wrap items-center gap-2 text-xs">
			<span class="{FAUX} h-8 w-44">🔍 {t('kit.design.search')}</span>
			<span class="{FAUX} h-8">{t('kit.design.actions')} ▾</span>
			{#each region.filters ?? [] as flt (flt.field + flt.value)}
				<Badge variant="secondary">{flt.field} = {flt.value}</Badge>
			{/each}
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#if region.rowAction !== 'none'}<Table.Head class="w-8"></Table.Head>{/if}
					{#each columns as col (col.name)}
						<!-- Kolom bisa diseret: tidak ada padanan papan ketik, jadi ↑/↓ di inspector tetap tersedia. -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
						<Table.Head
							class="relative z-20 {editable ? 'cursor-grab' : ''}"
							draggable={editable}
							title={editable ? t('kit.design.field_drag') : undefined}
							data-testid="field-col"
							data-field={col.name}
							ondragstart={(e) => startField(e, col.name)}
							ondragover={(e) => overField(e, col.name)}
							ondragleave={() => (hover = null)}
							ondrop={(e) => dropField(e, col.name)}
							ondragend={() => (hover = null)}
							onclick={() => onpick?.()}
						>
							{col.label}{#if region.sort?.field === col.name}<span aria-hidden="true"> {region.sort.dir === 'desc' ? '▼' : '▲'}</span>{/if}
							{@render dropBar(col.name)}
						</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body inert>
				{#each Array.from({ length: SAMPLE_ROWS }, (_, i) => i) as row (row)}
					<Table.Row>
						{#if region.rowAction !== 'none'}<Table.Cell class="text-muted-foreground w-8">{region.rowAction === 'select' ? '◉' : '✎'}</Table.Cell>{/if}
						{#each columns as col (col.name)}<Table.Cell>{sampleCell(col, row)}</Table.Cell>{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<p inert class="text-muted-foreground text-xs">
			1 - {SAMPLE_ROWS} · {t('kit.design.rows', { n: String(region.pageSize ?? 25) })}
			{#if region.rowAction === 'select' && region.rowItem}· {t('kit.design.row_select', { item: region.rowItem })}{/if}
		</p>
	{:else if region.type === 'cards'}
		<div inert class="grid gap-2 @md:grid-cols-3" data-testid="design-cards">
			{#each [0, 1, 2] as n (n)}
				<div class="flex flex-col gap-1 rounded-md border p-3 text-sm">
					{#each cardCols as col, i (col.name)}
						<span class={i === 0 ? 'font-medium' : 'text-muted-foreground text-xs'}>{sampleCell(col, n)}</span>
					{/each}
				</div>
			{/each}
		</div>
	{:else if region.type === 'calendar'}
		<div inert class="flex flex-col gap-1 rounded-md border p-2" data-testid="design-calendar">
			<div class="text-muted-foreground flex justify-between text-xs"><span>◀ ▶</span><span>{region.dateField ?? '—'}</span></div>
			<div class="grid grid-cols-7 gap-1 text-center text-xs">
				{#each Array.from({ length: 28 }, (_, i) => i + 1) as day (day)}
					<span class="rounded border px-1 py-2 {CALENDAR_MARKED_DAYS.includes(day) ? 'bg-primary/15 border-primary' : ''}">{day}</span>
				{/each}
			</div>
		</div>
	{:else if region.type === 'facets'}
		<div inert class="grid gap-3 @md:grid-cols-[10rem_1fr]" data-testid="design-facets">
			<div class="flex flex-col gap-1 text-xs">
				{#each tableFields({}, meta).slice(0, 3) as col (col.name)}
					<span class="font-medium">{col.label}</span>
					<span class="text-muted-foreground">☐ A (3) · ☐ B (2)</span>
				{/each}
			</div>
			<div class="flex flex-col gap-1">
				{#each [0, 1, 2] as n (n)}<div class="{FAUX} h-8">{sampleCell(tableFields({}, meta)[0] ?? meta.fields[0], n)}</div>{/each}
			</div>
		</div>
	{:else if region.type === 'kanban'}
		<div inert class="flex gap-2 overflow-hidden" data-testid="design-kanban">
			{#each board as column (column.label)}
				<div class="bg-muted/40 flex min-w-28 flex-1 flex-col gap-1 rounded-md border p-2 text-xs">
					<span class="font-medium">{column.label}</span>
					{#each Array.from({ length: column.cards }, (_, i) => i) as n (n)}<div class="bg-background rounded border p-1">{sampleCell(meta.fields.find((f) => f.name === meta.title_field) ?? meta.fields[0], n)}</div>{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">{t('kit.design.kanban_pick')}</p>
			{/each}
		</div>
	{:else if region.type === 'text'}
		<div inert class="flex flex-col gap-1" data-testid="design-text">
			{#if region.text?.heading}<span class="text-base font-semibold">{region.text.heading}</span>{/if}
			{#if region.text?.body}<span class="text-sm whitespace-pre-wrap">{region.text.body}</span>{/if}
		</div>
	{:else if region.type === 'kpi'}
		<div inert class="flex flex-col gap-1 rounded-md border p-4">
			<span class="text-muted-foreground text-sm">{metricLabel}</span>
			<span class="text-3xl font-semibold tabular-nums">{kpiSample(region)}</span>
		</div>
	{:else if region.type === 'chart'}
		<div inert class="rounded-md border p-4">
			<BarChart data={chartSample(region, meta)} label={metricLabel} height={170} />
		</div>
	{:else if region.type === 'resource-form'}
		<div class="grid gap-3 @md:grid-cols-2">
			{#each formControls as field (field.name)}
				<!-- Field form bisa diseret untuk mengubah urutan (↑/↓ di inspector sebagai padanan papan ketik). -->
				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<div
					class="relative z-20 flex flex-col gap-1 {editable ? 'cursor-grab' : ''}"
					draggable={editable}
					title={editable ? t('kit.design.field_drag') : undefined}
					data-testid="field-control"
					data-field={field.name}
					ondragstart={(e) => startField(e, field.name)}
					ondragover={(e) => overField(e, field.name)}
					ondragleave={() => (hover = null)}
					ondrop={(e) => dropField(e, field.name)}
					ondragend={() => (hover = null)}
					onclick={() => onpick?.()}
				>
					<span class="text-sm font-medium">{field.label}{#if field.required}<span class="text-destructive" aria-hidden="true"> *</span>{/if}</span>
					<div inert>{@render control(field)}</div>
					{@render dropBar(field.name)}
				</div>
			{/each}
		</div>
		<div inert class="flex gap-2 pt-1">
			<span class="{FAUX} h-8">{t('kit.design.cancel')}</span>
			<span class="bg-primary text-primary-foreground flex h-8 items-center rounded-md px-3 text-sm">{region.mode === 'edit' ? t('kit.design.save') : t('kit.design.create')}</span>
		</div>
	{:else}
		<p class="text-muted-foreground text-sm">{region.type}</p>
	{/if}
</div>
