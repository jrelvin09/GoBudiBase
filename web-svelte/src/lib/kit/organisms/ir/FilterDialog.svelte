<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import CheckboxItem from '$lib/kit/molecules/CheckboxItem.svelte';
	import DatePickerItem from '$lib/kit/molecules/DatePickerItem.svelte';
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';
	import PopupLovItem from '$lib/kit/molecules/PopupLovItem.svelte';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import TextareaItem from '$lib/kit/molecules/TextareaItem.svelte';
	import ExpressionPanels from './ExpressionPanels.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { parseNumber } from '$lib/i18n/format';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { newId, operatorsFor } from './model';
	import type { DistinctResponse, DistinctValue, ReportFilter, ReportMeta } from './types';

	let {
		open = $bindable(false),
		meta,
		filter,
		onapply,
		loadValues,
		loadRelation
	}: {
		open?: boolean;
		meta: ReportMeta;
		filter?: ReportFilter | null;
		onapply: (filter: ReportFilter) => void;
		loadValues?: (column: string, search: string) => Promise<DistinctResponse>;
		loadRelation?: (field: string, q: string, page: number) => Promise<{ items: { id: string; label: string }[]; total: number }>;
	} = $props();

	const firstField = $derived(meta.fields[0]?.name ?? '');

	// Filter Type: a column filter compares one column, a row filter tests a
	// boolean expression over the whole row (K4-10).
	let filterType = $state<'column' | 'row'>('column');
	let rowName = $state('');
	let rowExpr = $state('');
	const isRow = $derived(filterType === 'row');

	let columnName = $state('');
	const field = $derived(meta.fields.find((entry) => entry.name === columnName));
	const operators = $derived(operatorsFor(field?.type ?? 'text'));
	let op = $state('eq');

	// One state per editor kind, so every bind stays exactly typed.
	let textValue = $state<string | null>(null);
	let numberValue = $state<number | null>(null);
	let dateValue = $state<string | null>(null);
	let choiceValue = $state<string | null>(null);
	let lowNumber = $state<number | null>(null);
	let highNumber = $state<number | null>(null);
	let dateLow = $state<string | null>(null);
	let dateHigh = $state<string | null>(null);
	let listText = $state<string | null>(null);
	let selectedOptions = $state<string[]>([]);
	let rangeN = $state<number | null>(30);
	let unit = $state<string | null>('days');

	// Unique-value picker (K3-F13a step 4).
	let pickerOpen = $state(false);
	let pickerValues = $state<DistinctValue[]>([]);
	let pickerLoading = $state(false);
	let relationLabel = $state<string | null>(null);
	let relationSelected = $state<{ id: string; label: string }[]>([]);

	const isRelative = $derived(['last', 'not_last', 'next', 'not_next'].includes(op));
	const isList = $derived(op === 'in' || op === 'not_in');
	const isBetween = $derived(op === 'between');
	const needsValue = $derived(!isRelative && !isList && !isBetween && op !== 'is_null' && op !== 'not_null');

	// A number list separated with ';': report a part that is not a number
	// instead of silently dropping it (K3-F17a).
	const listError = $derived.by(() => {
		if (!isList || field?.type !== 'number') return '';
		const parts = (listText ?? '')
			.split(';')
			.map((part) => part.trim())
			.filter((part) => part !== '');
		const bad = parts.find((part) => Number.isNaN(parseNumber(part)));
		return bad === undefined ? '' : t('kit.ir.filter.list_invalid', { part: bad });
	});

	const choiceOptions = $derived(
		field?.type === 'toggle'
			? [
					{ value: 'true', label: t('kit.common.yes') },
					{ value: 'false', label: t('kit.common.no') }
				]
			: (field?.options ?? [])
	);

	$effect(() => {
		if (!operators.includes(op)) op = operators[0] ?? 'eq';
	});

	// Seed the editors from the chip being edited, each time the dialog opens.
	$effect(() => {
		if (!open) return;
		const target = meta.fields.find((entry) => entry.name === (filter?.column ?? firstField));
		filterType = filter?.kind === 'row' ? 'row' : 'column';
		rowName = filter?.name ?? '';
		rowExpr = filter?.expr ?? '';
		columnName = filter?.column ?? firstField;
		op = filter?.op ?? 'eq';
		textValue = null;
		numberValue = null;
		dateValue = null;
		choiceValue = null;
		lowNumber = null;
		highNumber = null;
		dateLow = null;
		dateHigh = null;
		listText = null;
		selectedOptions = [];
		rangeN = 30;
		unit = 'days';
		pickerOpen = false;
		relationLabel = null;
		relationSelected = [];
		const value = filter?.value;
		if (value === null || value === undefined) return;
		if (filter?.op === 'between' && Array.isArray(value)) {
			if (target?.type === 'date') {
				dateLow = String(value[0] ?? '');
				dateHigh = String(value[1] ?? '');
			} else {
				lowNumber = Number(value[0]);
				highNumber = Number(value[1]);
			}
		} else if (Array.isArray(value)) {
			if (target?.type === 'select') selectedOptions = value.map(String);
			else listText = value.map(String).join(target?.type === 'number' ? '; ' : ', ');
		} else if (typeof value === 'object' && value !== null && 'unit' in value) {
			const range = value as { n?: number; unit?: string };
			rangeN = range.n ?? 30;
			unit = range.unit ?? 'days';
		} else if (typeof value === 'number') {
			numberValue = value;
		} else if (typeof value === 'boolean') {
			choiceValue = String(value);
		} else {
			textValue = String(value);
			dateValue = String(value);
			choiceValue = String(value);
		}
		if (target?.type === 'belongs_to') {
			if (typeof value === 'string') relationLabel = value;
			if (Array.isArray(value)) relationSelected = value.map((entry) => ({ id: String(entry), label: String(entry) }));
		}
	});

	function buildValue(): unknown {
		if (isBetween) {
			if (field?.type === 'date') return [dateLow, dateHigh];
			return [lowNumber, highNumber];
		}
		if (isList) {
			if (field?.type === 'select') return selectedOptions;
			if (field?.type === 'belongs_to') return relationSelected.map((entry) => entry.id);
			if (field?.type === 'number') {
				// Numbers are separated with ';' because ',' is the id decimal mark.
				return (listText ?? '')
					.split(';')
					.map((part) => parseNumber(part.trim()))
					.filter((value): value is number => value !== null && !Number.isNaN(value));
			}
			return (listText ?? '')
				.split(',')
				.map((part) => part.trim())
				.filter((part) => part !== '');
		}
		if (isRelative) return { n: rangeN ?? 0, unit: unit ?? 'days' };
		if (!needsValue) return null;
		if (field?.type === 'number') return numberValue;
		if (field?.type === 'date') return dateValue;
		if (field?.type === 'select') return choiceValue;
		if (field?.type === 'toggle') return choiceValue === 'true';
		if (field?.type === 'belongs_to') return choiceValue;
		return textValue;
	}

	function commit() {
		if (isRow) {
			onapply({
				id: filter?.id ?? newId('f'),
				kind: 'row',
				column: null,
				op: 'row',
				value: null,
				name: rowName.trim(),
				expr: rowExpr.trim(),
				enabled: filter?.enabled ?? true
			});
			open = false;
			return;
		}
		onapply({
			id: filter?.id ?? newId('f'),
			kind: 'column',
			column: columnName,
			op,
			value: buildValue(),
			enabled: filter?.enabled ?? true
		});
		open = false;
	}

	const relationSearch = (q: string, page: number) =>
		loadRelation && columnName ? loadRelation(columnName, q, page) : Promise.resolve({ items: [], total: 0 });

	async function togglePicker() {
		if (!loadValues || !columnName) return;
		pickerOpen = !pickerOpen;
		if (!pickerOpen) return;
		pickerLoading = true;
		try {
			const resp = await loadValues(columnName, '');
			pickerValues = resp.values;
		} catch {
			pickerValues = [];
		} finally {
			pickerLoading = false;
		}
	}

	function pickValue(value: unknown) {
		if (isList) {
			if (field?.type === 'select') {
				const text = String(value);
				if (!selectedOptions.includes(text)) selectedOptions = [...selectedOptions, text];
			} else {
				const text = String(value);
				const trimmed = (listText ?? '').trim();
				listText = trimmed === '' ? text : `${trimmed}${field?.type === 'number' ? '; ' : ', '}${text}`;
			}
		} else if (field?.type === 'number') {
			numberValue = Number(value);
		} else if (field?.type === 'date') {
			dateValue = String(value);
		} else if (field?.type === 'select' || field?.type === 'toggle') {
			choiceValue = String(value);
		} else {
			textValue = String(value);
		}
		pickerOpen = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.filter.title')}>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={(isRow && rowExpr.trim() === '') || listError !== ''} onclick={commit}
				>{t('kit.common.apply')}</Button
			>
		{/snippet}

		<div class="flex flex-col gap-3">
			<SelectListItem
				id="filter-type"
				label={t('kit.ir.filter.type')}
				options={[
					{ value: 'column', label: t('kit.ir.filter.type_column') },
					{ value: 'row', label: t('kit.ir.filter.type_row') }
				]}
				bind:value={filterType}
				required
			/>
			{#if isRow}
				<TextItem id="filter-name" label={t('kit.ir.filter.name')} bind:value={rowName} />
				<TextareaItem
					id="filter-row-expr"
					label={t('kit.ir.filter.expression')}
					bind:value={rowExpr}
					rows={2}
				/>
				<ExpressionPanels {meta} oninsert={(text) => (rowExpr = `${rowExpr}${text}`)} />
			{:else}
				<SelectListItem
				id="filter-column"
				label={t('kit.ir.filter.column')}
				options={meta.fields.map((entry) => ({ value: entry.name, label: entry.label }))}
				bind:value={columnName}
				required
			/>
			<SelectListItem
				id="filter-operator"
				label={t('kit.ir.filter.operator')}
				options={operators.map((entry) => ({ value: entry, label: t(`kit.ir.op.${entry}`) }))}
				bind:value={op}
				required
			/>

			{#if isBetween}
				{#if field?.type === 'date'}
					<DatePickerItem id="filter-low" label={t('kit.ir.filter.expression')} bind:value={dateLow} />
					<DatePickerItem id="filter-high" label={t('kit.ir.filter.expression')} bind:value={dateHigh} />
				{:else}
					<NumberItem id="filter-low" label={t('kit.ir.filter.expression')} bind:value={lowNumber} />
					<NumberItem id="filter-high" label={t('kit.ir.filter.expression')} bind:value={highNumber} />
				{/if}
			{:else if isRelative}
				<NumberItem id="filter-n" label={t('kit.ir.filter.expression')} bind:value={rangeN} />
				<SelectListItem
					id="filter-unit"
					label={t('kit.ir.filter.unit')}
					options={[
						{ value: 'days', label: t('kit.ir.unit.days') },
						{ value: 'months', label: t('kit.ir.unit.months') },
						{ value: 'years', label: t('kit.ir.unit.years') }
					]}
					bind:value={unit}
					required
				/>
			{:else if isList && field?.type === 'select'}
				<div class="flex flex-col gap-2">
					{#each choiceOptions as option (option.value)}
						<CheckboxItem
							id="filter-option-{option.value}"
							checkLabel={option.label}
							checked={selectedOptions.includes(option.value)}
							onchange={(checked) =>
								(selectedOptions = checked
									? [...selectedOptions, option.value]
									: selectedOptions.filter((entry) => entry !== option.value))}
						/>
					{/each}
				</div>
			{:else if isList && field?.type === 'belongs_to'}
				<div class="flex flex-col gap-2">
					<PopupLovItem
						id="filter-relation"
						label={t('kit.ir.filter.values')}
						value={null}
						search={relationSearch}
						onchange={(id, label) => {
							if (!id) return;
							if (!relationSelected.some((entry) => entry.id === id)) {
								relationSelected = [...relationSelected, { id, label: label ?? id }];
							}
						}}
					/>
					{#each relationSelected as entry (entry.id)}
						<div class="flex items-center justify-between gap-2 text-sm">
							<span class="truncate">{entry.label}</span>
							<Button
								variant="ghost"
								size="sm"
								onclick={() =>
									(relationSelected = relationSelected.filter((item) => item.id !== entry.id))}
							>
								{t('kit.common.delete')}
							</Button>
						</div>
					{/each}
				</div>
			{:else if isList}
				<TextItem
					id="filter-list"
					label={isList ? t('kit.ir.filter.values') : t('kit.ir.filter.expression')}
					inlineHelp={field?.type === 'number' ? t('kit.ir.filter.list_hint_number') : undefined}
					error={listError}
					bind:value={listText}
				/>
			{:else if needsValue}
				{#if field?.type === 'number'}
					<NumberItem
						id="filter-value"
						label={t('kit.ir.filter.expression')}
						bind:value={numberValue}
						min={field.min}
						max={field.max}
					/>
				{:else if field?.type === 'date'}
					<DatePickerItem id="filter-value" label={t('kit.ir.filter.expression')} bind:value={dateValue} />
				{:else if field?.type === 'select' || field?.type === 'toggle'}
					<SelectListItem
						id="filter-value"
						label={t('kit.ir.filter.expression')}
						options={choiceOptions}
						bind:value={choiceValue}
					/>
				{:else if field?.type === 'belongs_to'}
					<PopupLovItem
						id="filter-value"
						label={t('kit.ir.filter.expression')}
						bind:value={choiceValue}
						valueLabel={relationLabel}
						search={relationSearch}
						onchange={(_id, label) => (relationLabel = label)}
					/>
				{:else}
					<TextItem id="filter-value" label={t('kit.ir.filter.expression')} bind:value={textValue} />
				{/if}
			{:else}
				<p class="text-muted-foreground text-sm">{t('kit.ir.filter.empty')}</p>
			{/if}

			{#if (needsValue || isList || isBetween) && field?.type !== 'belongs_to'}
				<div class="flex flex-col gap-1">
					<Button
						variant="outline"
						size="sm"
						class="self-start"
						aria-label={t('kit.ir.filter.pick_value')}
						onclick={togglePicker}
					>
						{t('kit.ir.filter.pick_value')}
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
					{#if pickerOpen}
						<div class="border-input max-h-40 overflow-y-auto rounded-md border p-1">
							{#if pickerLoading}
								<p class="text-muted-foreground px-2 text-xs">{t('kit.common.loading')}</p>
							{/if}
							{#each pickerValues as item, i (i)}
								<button
									type="button"
									class="hover:bg-muted flex w-full justify-between gap-2 rounded-md px-2 py-1 text-left text-sm"
									onclick={() => pickValue(item.value)}
								>
									<span class="truncate">{item.label}</span>
									<span class="text-muted-foreground text-xs">{item.count}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			{/if}
		</div>
	</DialogContent>
</Dialog>
