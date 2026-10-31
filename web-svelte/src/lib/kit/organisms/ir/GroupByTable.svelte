<script lang="ts">
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { t } from '$lib/i18n/index.svelte';
	import { displayText } from '$lib/kit/molecules/display';
	import { columnLabel, fieldOf } from './model';
	import type { ReportGroupBy, ReportGroupPage, ReportMeta } from './types';

	let {
		meta,
		groupBy,
		page
	}: {
		meta: ReportMeta;
		groupBy: ReportGroupBy;
		page: ReportGroupPage;
	} = $props();

	function functionLabel(fn: ReportGroupBy['functions'][number]): string {
		if (fn.label) return fn.label;
		return `${t(`kit.ir.agg.${fn.fn}`)} ${columnLabel(meta, fn.column)}`;
	}

	function cellText(row: Record<string, unknown>, column: string): string {
		const field = fieldOf(meta, column);
		const value = row[column];
		if (!field) return value === null || value === undefined ? '' : String(value);
		return displayText(field.type, value, field.options);
	}

	function aggregateText(row: Record<string, unknown>, id: string): string {
		const value = row[id];
		if (value === null || value === undefined) return '';
		return displayText('number', value);
	}
</script>

<div class="overflow-x-auto">
	<Table>
		<TableHeader class="bg-card sticky top-0 z-10">
			<TableRow>
				{#each groupBy.columns as column (column)}
					<TableHead class="px-(--cell-px) py-(--cell-py)">{columnLabel(meta, column)}</TableHead>
				{/each}
				{#each groupBy.functions as fn (fn.id)}
					<TableHead class="px-(--cell-px) py-(--cell-py) text-right">{functionLabel(fn)}</TableHead>
				{/each}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if page.rows.length === 0}
				<TableRow>
					<TableCell colspan={groupBy.columns.length + groupBy.functions.length} class="text-muted-foreground p-6 text-center">
						{t('kit.msg.no_data_found')}
					</TableCell>
				</TableRow>
			{/if}
			{#each page.rows as row, index (index)}
				<TableRow>
					{#each groupBy.columns as column (column)}
						<TableCell class="px-(--cell-px) py-(--cell-py)">{cellText(row, column)}</TableCell>
					{/each}
					{#each groupBy.functions as fn (fn.id)}
						<TableCell class="px-(--cell-px) py-(--cell-py) text-right tabular-nums">
							{aggregateText(row, fn.id)}
						</TableCell>
					{/each}
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
