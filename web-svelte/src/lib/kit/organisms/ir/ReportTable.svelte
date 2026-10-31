<script lang="ts">
import { cn } from '$lib/utils';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '$lib/components/ui/table';
import { displayText } from '$lib/kit/molecules/display';
import type { DisplayType } from '$lib/kit/molecules/display';
import { t } from '$lib/i18n/index.svelte';
import { columnLabel, fieldOf, visibleColumns } from './model';
import { rowHighlight } from './highlight';
import type { HighlightColor } from './highlight';
import type { Snippet } from 'svelte';
import type { ReportAggregate, ReportAggregates, ReportMeta, ReportSettings } from './types';

let {
	meta,
	settings,
	rows,
	aggregates,
	isLastPage = false,
	linkHref,
	onedit,
	onHeaderClick,
	labels,
	rowmenu,
	fileHref,
	fileNames
}: {
	meta: ReportMeta;
	settings: ReportSettings;
	rows: Record<string, unknown>[];
	aggregates: ReportAggregates;
	isLastPage?: boolean;
	linkHref?: (row: Record<string, unknown>) => string;
	onedit?: (row: Record<string, unknown>) => void;
	onHeaderClick?: (column: string, anchorEl: HTMLElement) => void;
	labels?: Record<string, Record<string, string>>;
	/** Menu aksi baris (F2-11): satu sel per baris. */
	rowmenu?: Snippet<[Record<string, unknown>]>;
	/** Download URL of a file/image cell (F6-03). */
	fileHref?: (row: Record<string, unknown>, column: string) => string | undefined;
	/** Names of the file cells on this page, keyed by column then value (F6-03). */
	fileNames?: Record<string, Record<string, string>>;
} = $props();

// Palette classes are spelled out so Tailwind emits them (T0-02).
const BG_SUBTLE: Record<number, string> = {
	1: 'bg-palette-1-subtle', 2: 'bg-palette-2-subtle', 3: 'bg-palette-3-subtle', 4: 'bg-palette-4-subtle',
	5: 'bg-palette-5-subtle', 6: 'bg-palette-6-subtle', 7: 'bg-palette-7-subtle', 8: 'bg-palette-8-subtle',
	9: 'bg-palette-9-subtle', 10: 'bg-palette-10-subtle', 11: 'bg-palette-11-subtle', 12: 'bg-palette-12-subtle'
};
const TEXT_STRONG: Record<number, string> = {
	1: 'text-palette-1', 2: 'text-palette-2', 3: 'text-palette-3', 4: 'text-palette-4',
	5: 'text-palette-5', 6: 'text-palette-6', 7: 'text-palette-7', 8: 'text-palette-8',
	9: 'text-palette-9', 10: 'text-palette-10', 11: 'text-palette-11', 12: 'text-palette-12'
};

function colorClass(color: HighlightColor | undefined): string {
	if (!color) return '';
	return cn(color.bg ? BG_SUBTLE[color.bg] : '', color.fg ? TEXT_STRONG[color.fg] : '');
}

const columns = $derived(visibleColumns(settings));
const breakColumns = $derived(settings.breaks.filter((entry) => entry.enabled).map((entry) => entry.column));
const enabledAggregates = $derived(settings.aggregates.filter((a) => a.enabled));
const sortBy = $derived(settings.sort.length > 0 ? settings.sort[0] : null);
const today = new Date();
const colspan = $derived(columns.length + (linkHref || onedit ? 1 : 0) + (rowmenu ? 1 : 0));

function tupleKey(row: Record<string, unknown>): string {
	return JSON.stringify(breakColumns.map((column) => row[column] ?? null));
}

// A computed column is addressed by its own id; its label and format mask come
// from the computation definition (K4-09).
const computedColumns = $derived(
	new Map(settings.computations.map((entry) => [entry.id, entry]))
);

function columnHeading(column: string): string {
	return computedColumns.get(column)?.label ?? columnLabel(meta, column);
}

function cellText(row: Record<string, unknown>, column: string): string {
	const computation = computedColumns.get(column);
	if (computation) {
		return row[column] === null || row[column] === undefined
			? ''
			: displayText(computation.format as DisplayType, row[column]);
	}
	const field = fieldOf(meta, column);
	if (!field) return row[column] === null || row[column] === undefined ? '' : String(row[column]);
	if (field.type === 'belongs_to') {
		const raw = row[column];
		if (raw === null || raw === undefined || raw === '') return '';
		return labels?.[column]?.[String(raw)] ?? '—';
	}
	return displayText(field.type as DisplayType, row[column], field.options);
}

function aggregateText(aggregate: ReportAggregate, value: unknown): string {
	const field = fieldOf(meta, aggregate.column);
	return `${t(`kit.ir.agg.${aggregate.fn}`)}: ${field ? displayText(field.type as DisplayType, value) : String(value ?? '')}`;
}

type Line =
	| { kind: 'break'; tuple: Record<string, unknown> }
	| { kind: 'row'; row: Record<string, unknown> }
	| { kind: 'aggregate'; byColumn: Record<string, string[]> };

// Aggregate text goes into its own column's cell (K3 §1.1): several aggregates
// on one column stack inside that cell.
function aggregateCells(entries: ReportAggregate[], values: Record<string, unknown>): Record<string, string[]> {
	const cells: Record<string, string[]> = {};
	for (const entry of entries) {
		if (!cells[entry.column]) cells[entry.column] = [];
		cells[entry.column].push(aggregateText(entry, values[entry.id]));
	}
	return cells;
}

function groupAggregateCells(key: string): Record<string, string[]> {
	const group = aggregates.breaks.find((entry) => JSON.stringify(breakColumns.map((c) => entry.key[c] ?? null)) === key);
	return aggregateCells(enabledAggregates, group?.values ?? {});
}

// Control-break header rows, their per-group aggregates, and the page-total row.
const lines = $derived.by(() => {
	const out: Line[] = [];
	if (breakColumns.length > 0) {
		let current = '';
		for (const row of rows) {
			const key = tupleKey(row);
			if (key !== current) {
				if (current !== '') out.push({ kind: 'aggregate', byColumn: groupAggregateCells(current) });
				const tuple: Record<string, unknown> = {};
				for (const column of breakColumns) tuple[column] = row[column] ?? null;
				out.push({ kind: 'break', tuple });
				current = key;
			}
			out.push({ kind: 'row', row });
		}
		if (current !== '') out.push({ kind: 'aggregate', byColumn: groupAggregateCells(current) });
	} else {
		for (const row of rows) out.push({ kind: 'row', row });
	}
	if (isLastPage && enabledAggregates.length > 0) {
		out.push({ kind: 'aggregate', byColumn: aggregateCells(enabledAggregates, aggregates.overall) });
	}
	return out;
});
</script>

<div class="overflow-x-auto">
	<Table>
		<TableHeader class="bg-card sticky top-0 z-10">
			<TableRow>
				{#if linkHref || onedit}
					<TableHead class="w-8"><span class="sr-only">{t('kit.ir.edit_row')}</span></TableHead>
				{/if}
				{#each columns as column (column)}
					{@const sorted = sortBy?.column === column}
					<TableHead
						class="px-(--cell-px) py-(--cell-py)"
						aria-sort={sorted ? (sortBy?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
					>
						<svelte:element
							this={onHeaderClick ? 'button' : 'span'}
							type={onHeaderClick ? 'button' : undefined}
							role={onHeaderClick ? 'button' : undefined}
							class={onHeaderClick ? 'flex w-full items-center gap-1 font-medium hover:text-foreground' : 'font-medium'}
							onclick={onHeaderClick ? (event: MouseEvent) => {
								event.stopPropagation();
								onHeaderClick(column, event.currentTarget as HTMLElement);
							} : undefined}
						>
							{columnHeading(column)}
							{#if sorted}
								<span aria-hidden="true">{sortBy?.dir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</svelte:element>
					</TableHead>
				{/each}
				{#if rowmenu}
					<TableHead class="w-8"><span class="sr-only">{t('kit.ig.row_actions')}</span></TableHead>
				{/if}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each lines as line, index (index)}
				{#if line.kind === 'break'}
					<TableRow class="hover:bg-muted bg-muted">
						<TableCell colspan={colspan} class="px-(--cell-px) py-(--cell-py) font-medium">
							{breakColumns
								.map((column) => `${columnLabel(meta, column)} : ${cellText(line.tuple, column)}`)
								.join(' · ')}
						</TableCell>
					</TableRow>
				{:else if line.kind === 'aggregate'}
					<TableRow class="bg-muted/50 font-medium">
						{#if linkHref || onedit}
							<TableCell class="px-(--cell-px) py-(--cell-py)"></TableCell>
						{/if}
						{#each columns as column (column)}
							{@const texts = line.byColumn[column] ?? []}
							<TableCell
								class={cn(
									'px-(--cell-px) py-(--cell-py)',
									fieldOf(meta, column)?.type === 'number' && 'text-right'
								)}
							>
								{#each texts as text, i (i)}
									<div>{text}</div>
								{/each}
							</TableCell>
						{/each}
						{#if rowmenu}
							<TableCell class="px-(--cell-px) py-(--cell-py)"></TableCell>
						{/if}
					</TableRow>
				{:else}
					{@const highlight = rowHighlight(line.row, settings.highlights, today)}
					<TableRow class={cn('hover:bg-muted/50', colorClass(highlight.row))}>
						{#if linkHref || onedit}
							<TableCell class="px-(--cell-px) py-(--cell-py)">
								{#if onedit}
									<button
										type="button"
										class="text-primary"
										aria-label={t('kit.ir.edit_row')}
										onclick={() => onedit(line.row)}
									>
										✎
									</button>
								{:else}
									<a class="text-primary" href={linkHref?.(line.row)} aria-label={t('kit.ir.edit_row')}>✎</a>
								{/if}
							</TableCell>
						{/if}
						{#each columns as column (column)}
							{@const field = fieldOf(meta, column)}
							<TableCell
								class={cn(
									'px-(--cell-px) py-(--cell-py)',
									field?.type === 'number' && 'text-right',
									colorClass(highlight.cells[column])
								)}
							>
								{#if fileHref && field?.type === 'image' && line.row[column]}
									<a href={fileHref(line.row, column)} aria-label={columnHeading(column)}>
										<img src={fileHref(line.row, column)} alt="" class="h-8 w-8 rounded object-cover" />
									</a>
								{:else if fileHref && field?.type === 'file' && line.row[column]}
									<a class="text-primary underline-offset-4 hover:underline" href={fileHref(line.row, column)}>
										{fileNames?.[column]?.[String(line.row[column])] ?? String(line.row[column])}
									</a>
								{:else}
									{cellText(line.row, column)}
								{/if}
							</TableCell>
						{/each}
						{#if rowmenu}
							<TableCell class="px-(--cell-px) py-(--cell-py)">
								{@render rowmenu(line.row)}
							</TableCell>
						{/if}
					</TableRow>
				{/if}
			{/each}
			{#if rows.length === 0}
				<TableRow>
					<TableCell colspan={colspan} class="text-muted-foreground py-6 text-center">
						{t('kit.msg.no_data_found')}
					</TableCell>
				</TableRow>
			{/if}
		</TableBody>
	</Table>
</div>
