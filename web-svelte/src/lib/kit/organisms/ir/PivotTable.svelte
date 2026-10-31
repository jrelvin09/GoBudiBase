<script lang="ts">
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import { displayText } from '$lib/kit/molecules/display';
	import { columnLabel, fieldOf, groupFunctionLabel, pivotCellKey } from './model';
	import type { ReportMeta, ReportPivot, ReportPivotPage } from './types';

	let {
		meta,
		pivot,
		page
	}: {
		meta: ReportMeta;
		pivot: ReportPivot;
		page: ReportPivotPage;
	} = $props();

	const functionCount = $derived(pivot.functions.length);

	/** Every pivot group starts with a left border, so the two header levels
	 * read as one block per pivot value. */
	function groupClass(fnIndex: number): string {
		return fnIndex === 0 ? 'border-border border-l' : '';
	}

	function cellText(row: Record<string, unknown>, column: string): string {
		const field = fieldOf(meta, column);
		const value = row[column];
		if (!field) return value === null || value === undefined ? '' : String(value);
		return displayText(field.type, value, field.options);
	}

	function pivotText(row: Record<string, unknown>, pivotIndex: number, fnIndex: number): string {
		const value = row[pivotCellKey(pivotIndex, pivot.functions[fnIndex], fnIndex)];
		if (value === null || value === undefined) return '';
		return displayText('number', value);
	}
</script>

<div class="overflow-x-auto">
	<Table>
		<TableHeader class="bg-card sticky top-0 z-10">
			<TableRow>
				{#each pivot.row_columns as column (column)}
					<TableHead rowspan={2} class="px-(--cell-px) py-(--cell-py) align-bottom">
						{columnLabel(meta, column)}
					</TableHead>
				{/each}
				{#each page.pivot_values as value, index (index)}
					<TableHead
						colspan={functionCount}
						class={cn('px-(--cell-px) py-(--cell-py) text-center', groupClass(0))}
					>
						{value.label}
					</TableHead>
				{/each}
			</TableRow>
			<TableRow>
				{#each page.pivot_values as _value, index (index)}
					{#each pivot.functions as fn, fnIndex (fn.id)}
						<TableHead class={cn('px-(--cell-px) py-(--cell-py)', groupClass(fnIndex))}>
							{groupFunctionLabel(meta, fn)}
						</TableHead>
					{/each}
				{/each}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if page.rows.length === 0}
				<TableRow>
					<TableCell
						colspan={pivot.row_columns.length + page.pivot_values.length * functionCount}
						class="text-muted-foreground p-6 text-center"
					>
						{t('kit.msg.no_data_found')}
					</TableCell>
				</TableRow>
			{/if}
			{#each page.rows as row, rowIndex (rowIndex)}
				<TableRow>
					{#each pivot.row_columns as column (column)}
						<TableCell class="px-(--cell-px) py-(--cell-py)">{cellText(row, column)}</TableCell>
					{/each}
					{#each page.pivot_values as _value, pivotIndex (pivotIndex)}
						{#each pivot.functions as fn, fnIndex (fn.id)}
							<TableCell class={cn('px-(--cell-px) py-(--cell-py) text-right tabular-nums', groupClass(fnIndex))}>
								{pivotText(row, pivotIndex, fnIndex)}
							</TableCell>
						{/each}
					{/each}
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
