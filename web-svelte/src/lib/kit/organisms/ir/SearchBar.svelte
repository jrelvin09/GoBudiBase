<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { t } from '$lib/i18n/index.svelte';
	import { reportOptionLabel } from './model';
	import SearchIcon from '@lucide/svelte/icons/search';
	import type { Snippet } from 'svelte';
	import type { SavedReport } from './types';

	const ALL_COLUMNS = '__bb_all_columns__';

	let {
		columns,
		searchColumn = $bindable(null),
		text = $bindable(''),
		reports = [],
		currentReportId = '',
		modified = false,
		onsearch,
		onselectreport,
		actions,
		viewSwitcher,
		right
	}: {
		columns: { value: string; label: string }[];
		searchColumn?: string | null;
		text?: string;
		reports?: SavedReport[];
		currentReportId?: string;
		modified?: boolean;
		onsearch: (text: string, column: string | null) => void;
		onselectreport?: (id: string) => void;
		actions?: Snippet;
		viewSwitcher?: Snippet;
		right?: Snippet;
	} = $props();

	const currentReport = $derived(reports.find((report) => report.id === currentReportId));
	const reportLabel = $derived(
		(currentReport?.name ?? t('kit.ir.report')) + (modified ? ` ${t('kit.ir.modified')}` : '')
	);
	const columnLabelText = $derived(
		searchColumn ? (columns.find((column) => column.value === searchColumn)?.label ?? searchColumn) : t('kit.ir.search.all_columns')
	);

	function go() {
		const value = text.trim();
		if (value === '') return;
		onsearch(value, searchColumn);
		text = '';
	}

	function onColumnChange(next: string | undefined) {
		searchColumn = !next || next === ALL_COLUMNS ? null : next;
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<Select type="single" value={searchColumn ?? ALL_COLUMNS} onValueChange={onColumnChange}>
		<SelectTrigger size="sm" class="w-40" aria-label={t('kit.ir.search.all_columns')}>
			<span data-slot="select-value" class="line-clamp-1 truncate">{columnLabelText}</span>
		</SelectTrigger>
		<SelectContent>
			<SelectItem value={ALL_COLUMNS} label={t('kit.ir.search.all_columns')}>
				{t('kit.ir.search.all_columns')}
			</SelectItem>
			{#each columns as column (column.value)}
				<SelectItem value={column.value} label={column.label}>{column.label}</SelectItem>
			{/each}
		</SelectContent>
	</Select>

	<div class="relative min-w-48 flex-1">
		<SearchIcon class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2" />
		<Input
			bind:value={text}
			class="pl-8"
			placeholder={t('kit.ir.search.placeholder')}
			aria-label={t('kit.ir.search.placeholder')}
			onkeydown={(event) => {
				if (event.key === 'Enter') go();
			}}
		/>
	</div>
	<Button variant="outline" size="sm" onclick={go}>{t('kit.common.go')}</Button>

	{#if reports.length > 1}
		<Select
			type="single"
			value={currentReportId}
			onValueChange={(next) => next && onselectreport?.(next)}
		>
			<SelectTrigger size="sm" class="w-48" aria-label={t('kit.ir.report')}>
				<span data-slot="select-value" class="line-clamp-1 truncate">{reportLabel}</span>
			</SelectTrigger>
			<SelectContent>
				{#each reports as report, index (report.id)}
					<SelectItem value={report.id} label={reportOptionLabel(report, index)}>
						{reportOptionLabel(report, index)}
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	{/if}

	{@render viewSwitcher?.()}
	{@render actions?.()}
	{#if right}
		<div class="ml-auto">{@render right()}</div>
	{/if}
</div>
