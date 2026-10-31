<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import Shuttle from '$lib/kit/molecules/Shuttle.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { newId } from './model';
	import type { AggregateFn, ReportGroupFunction, ReportMeta, ReportPivot } from './types';

	const MAX_COLUMNS = 3;
	const MAX_FUNCTIONS = 3;

	let {
		open = $bindable(false),
		meta,
		pivot,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		pivot: ReportPivot | null;
		onapply: (pivot: ReportPivot | null) => void;
	} = $props();

	const FNS: AggregateFn[] = ['sum', 'avg', 'count', 'count_distinct', 'min', 'max'];

	const fields = $derived(meta.fields.filter((field) => field.type !== 'textarea'));
	const numericColumns = $derived(meta.fields.filter((field) => field.type === 'number'));

	let pivotColumns = $state<string[]>([]);
	let rowColumns = $state<string[]>([]);
	let functions = $state<ReportGroupFunction[]>([]);

	$effect(() => {
		if (!open) return;
		pivotColumns = [...(pivot?.pivot_columns ?? [])];
		rowColumns = [...(pivot?.row_columns ?? [])];
		functions = (pivot?.functions ?? []).map((fn) => ({ ...fn }));
	});

	const canApply = $derived(pivotColumns.length > 0 && rowColumns.length > 0 && functions.length > 0);

	function addFunction() {
		const first = rowColumns[0] ?? fields[0]?.name ?? '';
		functions = [...functions, { id: newId('p'), fn: 'count', column: first, label: '' }];
	}

	function removeFunction(id: string) {
		functions = functions.filter((fn) => fn.id !== id);
	}

	function patchFunction(id: string, patch: Partial<ReportGroupFunction>) {
		functions = functions.map((fn) => (fn.id === id ? { ...fn, ...patch } : fn));
	}

	function apply() {
		onapply({
			pivot_columns: [...pivotColumns],
			row_columns: [...rowColumns],
			functions: functions.map((fn) => ({ ...fn }))
		});
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.pivot.title')} class="max-w-3xl">
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={!canApply} onclick={apply}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.pivot.pivot_columns')}</span>
				<Shuttle available={fields.map((field) => ({ value: field.name, label: field.label }))} bind:value={pivotColumns} max={MAX_COLUMNS} />
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.pivot.row_columns')}</span>
				<Shuttle available={fields.map((field) => ({ value: field.name, label: field.label }))} bind:value={rowColumns} max={MAX_COLUMNS} />
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
				{#if !canApply}
					<p class="text-destructive text-xs">{t('kit.ir.pivot.empty')}</p>
				{/if}
			</div>
		</div>
	</DialogContent>
</Dialog>
