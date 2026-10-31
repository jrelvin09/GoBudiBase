<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import Shuttle from '$lib/kit/molecules/Shuttle.svelte';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { newId } from './model';
	import type { AggregateFn, ReportGroupBy, ReportGroupFunction, ReportMeta, ReportSort, SortDir } from './types';

	const MAX_COLUMNS = 8;
	const MAX_FUNCTIONS = 8;

	let {
		open = $bindable(false),
		meta,
		groupBy,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		groupBy: ReportGroupBy | null;
		onapply: (groupBy: ReportGroupBy | null) => void;
	} = $props();

	const FNS: AggregateFn[] = ['sum', 'avg', 'count', 'count_distinct', 'min', 'max'];

	// A group column has no meaningful value in a textarea (K4-01 validation).
	const fields = $derived(meta.fields.filter((field) => field.type !== 'textarea'));
	const numericColumns = $derived(meta.fields.filter((field) => field.type === 'number'));

	let columns = $state<string[]>([]);
	let functions = $state<ReportGroupFunction[]>([]);
	let sortColumn = $state('');
	let sortDir = $state<SortDir>('asc');

	$effect(() => {
		if (!open) return;
		columns = [...(groupBy?.columns ?? [])];
		functions = (groupBy?.functions ?? []).map((fn) => ({ ...fn }));
		const first = groupBy?.sort[0];
		sortColumn = first?.column ?? '';
		sortDir = first?.dir ?? 'asc';
	});

	const columnOptions = $derived(meta.fields.map((field) => ({ value: field.name, label: field.label })));
	const canApply = $derived(columns.length > 0);

	function addFunction() {
		const first = fields[0]?.name ?? '';
		functions = [...functions, { id: newId('g'), fn: 'count', column: first, label: '' }];
	}

	function removeFunction(id: string) {
		functions = functions.filter((fn) => fn.id !== id);
	}

	function patchFunction(id: string, patch: Partial<ReportGroupFunction>) {
		functions = functions.map((fn) => (fn.id === id ? { ...fn, ...patch } : fn));
	}

	function apply() {
		const sort: ReportSort[] = sortColumn
			? [{ column: sortColumn, dir: sortDir, nulls: 'default' }]
			: [];
		onapply({ columns: [...columns], functions: functions.map((fn) => ({ ...fn })), sort });
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.group.title')} class="max-w-3xl">
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={!canApply} onclick={apply}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.group.columns')}</span>
				<Shuttle
					available={fields.map((field) => ({ value: field.name, label: field.label }))}
					bind:value={columns}
					max={MAX_COLUMNS}
				/>
				{#if !canApply}
					<p class="text-destructive text-xs">{t('kit.ir.group.empty')}</p>
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">{t('kit.ir.group.functions')}</span>
					<Button
						variant="outline"
						size="sm"
						disabled={functions.length >= MAX_FUNCTIONS}
						onclick={addFunction}>{t('kit.ir.group.add_function')}</Button
					>
				</div>
				<div class="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 text-sm">
					<span class="text-muted-foreground font-medium">{t('kit.ir.aggregate.fn')}</span>
					<span class="text-muted-foreground font-medium">{t('kit.ir.aggregate.column')}</span>
					<span class="text-muted-foreground font-medium">{t('kit.ir.fn.label')}</span>
					<span></span>
					{#each functions as fn (fn.id)}
						<select
							class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
							bind:value={fn.fn}
							aria-label={t('kit.ir.aggregate.fn')}
						>
							{#each FNS as name (name)}
								<option value={name}>{t(`kit.ir.agg.${name}`)}</option>
							{/each}
						</select>
						<select
							class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
							bind:value={fn.column}
							aria-label={t('kit.ir.aggregate.column')}
						>
							{#each fn.fn === 'sum' || fn.fn === 'avg' ? numericColumns : fields as field (field.name)}
								<option value={field.name}>{field.label}</option>
							{/each}
						</select>
						<input
							class="border-input h-(--control-h) rounded-lg border bg-transparent px-2"
							value={fn.label}
							oninput={(event) => patchFunction(fn.id, { label: event.currentTarget.value })}
							placeholder={fn.id}
							aria-label={t('kit.ir.fn.label')}
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={t('kit.ir.group.remove')}
							onclick={() => removeFunction(fn.id)}
						>
							<TrashIcon />
						</Button>
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<span class="text-sm font-medium">{t('kit.ir.group.sort')}</span>
				<div class="flex flex-wrap gap-2">
					<SelectListItem
						id="group-sort-column"
						label={t('kit.ir.filter.column')}
						options={[{ value: '', label: t('kit.ir.none') }, ...columnOptions]}
						bind:value={sortColumn}
					/>
					<SelectListItem
						id="group-sort-dir"
						label={t('kit.ir.sort.direction')}
						options={[
							{ value: 'asc', label: t('kit.ir.sort.asc') },
							{ value: 'desc', label: t('kit.ir.sort.desc') }
						]}
						bind:value={sortDir}
					/>
				</div>
			</div>
		</div>
	</DialogContent>
</Dialog>
