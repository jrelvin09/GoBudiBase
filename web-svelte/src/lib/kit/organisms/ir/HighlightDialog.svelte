<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import CheckboxItem from '$lib/kit/molecules/CheckboxItem.svelte';
	import DatePickerItem from '$lib/kit/molecules/DatePickerItem.svelte';
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';
	import PalettePicker from '$lib/kit/molecules/PalettePicker.svelte';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import { newId, singleValueOperatorsFor } from './model';
	import type { ReportHighlight, ReportMeta } from './types';

	let {
		open = $bindable(false),
		meta,
		highlight,
		highlights,
		onapply,
		ondelete
	}: {
		open?: boolean;
		meta: ReportMeta;
		highlight?: ReportHighlight | null;
		highlights: ReportHighlight[];
		onapply: (highlight: ReportHighlight) => void;
		ondelete?: (id: string) => void;
	} = $props();

	const firstColumn = $derived(meta.fields[0]?.name ?? '');

	let name = $state('');
	let seq = $state<number | null>(10);
	let enabled = $state(true);
	let type = $state('row');
	let bg = $state<number | null>(null);
	let fg = $state<number | null>(null);
	let column = $state('');
	let op = $state('eq');
	let textValue = $state<string | null>(null);
	let numberValue = $state<number | null>(null);
	let dateValue = $state<string | null>(null);
	let choiceValue = $state<string | null>(null);

	const field = $derived(meta.fields.find((entry) => entry.name === column));
	const operators = $derived(singleValueOperatorsFor(field?.type ?? 'text'));
	const needsValue = $derived(op !== 'is_null' && op !== 'not_null');
	const choiceOptions = $derived(
		field?.type === 'toggle'
			? [
					{ value: 'true', label: t('kit.common.yes') },
					{ value: 'false', label: t('kit.common.no') }
				]
			: (field?.options ?? [])
	);

	// Pratinjau kecil dengan warna terpilih (K3-F14).
	const BG: Record<number, string> = {
		1: 'bg-palette-1-subtle', 2: 'bg-palette-2-subtle', 3: 'bg-palette-3-subtle', 4: 'bg-palette-4-subtle',
		5: 'bg-palette-5-subtle', 6: 'bg-palette-6-subtle', 7: 'bg-palette-7-subtle', 8: 'bg-palette-8-subtle',
		9: 'bg-palette-9-subtle', 10: 'bg-palette-10-subtle', 11: 'bg-palette-11-subtle', 12: 'bg-palette-12-subtle'
	};
	const FG: Record<number, string> = {
		1: 'text-palette-1', 2: 'text-palette-2', 3: 'text-palette-3', 4: 'text-palette-4',
		5: 'text-palette-5', 6: 'text-palette-6', 7: 'text-palette-7', 8: 'text-palette-8',
		9: 'text-palette-9', 10: 'text-palette-10', 11: 'text-palette-11', 12: 'text-palette-12'
	};

	$effect(() => {
		if (!operators.includes(op)) op = operators[0] ?? 'eq';
	});

	// `seq` default is max(existing) + 10 (K3-F14).
	$effect(() => {
		if (!open) return;
		if (highlight) {
			name = highlight.name;
			seq = highlight.seq;
			enabled = highlight.enabled;
			type = highlight.type;
			bg = highlight.bg;
			fg = highlight.fg;
			column = highlight.column;
			op = highlight.op;
			seedValue(highlight.value);
		} else {
			name = '';
			seq = highlights.reduce((max, entry) => Math.max(max, entry.seq), 0) + 10;
			enabled = true;
			type = 'row';
			bg = null;
			fg = null;
			column = firstColumn;
			op = 'eq';
			seedValue(null);
		}
	});

	// One editor per value kind: the value must be typed like the column
	// (a number compares as a number, not as the string "1.000,5").
	function seedValue(value: unknown) {
		textValue = null;
		numberValue = null;
		dateValue = null;
		choiceValue = null;
		if (value === null || value === undefined) return;
		if (typeof value === 'number') numberValue = value;
		else if (typeof value === 'boolean') choiceValue = String(value);
		else {
			textValue = String(value);
			dateValue = String(value);
			choiceValue = String(value);
		}
	}

	function buildValue(): unknown {
		if (!needsValue) return null;
		if (field?.type === 'number') return numberValue;
		if (field?.type === 'date') return dateValue;
		if (field?.type === 'select') return choiceValue;
		if (field?.type === 'toggle') return choiceValue === 'true';
		return textValue;
	}

	function commit() {
		onapply({
			id: highlight?.id ?? newId('h'),
			name: name.trim() === '' ? t('kit.ir.highlight.title') : name.trim(),
			seq: seq ?? 0,
			enabled,
			type: type === 'cell' ? 'cell' : 'row',
			bg,
			fg,
			column,
			op,
			value: buildValue()
		});
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.highlight.title')}>
		{#snippet footer()}
			{#if highlight && ondelete}
				<Button
					variant="destructive"
					class="mr-auto"
					onclick={() => {
						ondelete(highlight.id);
						open = false;
					}}>{t('kit.common.delete')}</Button
				>
			{/if}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button onclick={commit}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="flex flex-col gap-3">
			<TextItem id="hl-name" label={t('kit.ir.highlight.name')} bind:value={name} />
			<NumberItem id="hl-seq" label={t('kit.ir.highlight.sequence')} bind:value={seq} />
			<CheckboxItem id="hl-enabled" label={t('kit.ir.highlight.enabled')} checkLabel={t('kit.ir.highlight.enabled')} bind:checked={enabled} />
			<SelectListItem
				id="hl-type"
				label={t('kit.ir.highlight.type')}
				options={[
					{ value: 'row', label: t('kit.ir.highlight.type_row') },
					{ value: 'cell', label: t('kit.ir.highlight.type_cell') }
				]}
				bind:value={type}
				required
			/>
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.highlight.bg')}</span>
				<PalettePicker bind:value={bg} mode="subtle" />
			</div>
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.highlight.fg')}</span>
				<PalettePicker bind:value={fg} mode="strong" />
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.highlight.condition')}</span>
				<SelectListItem
					id="hl-column"
					label={t('kit.ir.filter.column')}
					options={meta.fields.map((entry) => ({ value: entry.name, label: entry.label }))}
					bind:value={column}
					required
				/>
				<SelectListItem
					id="hl-op"
					label={t('kit.ir.filter.operator')}
					options={operators.map((entry) => ({ value: entry, label: t(`kit.ir.op.${entry}`) }))}
					bind:value={op}
					required
				/>
				{#if needsValue}
					{#if field?.type === 'number'}
						<NumberItem id="hl-value" label={t('kit.ir.filter.expression')} bind:value={numberValue} />
					{:else if field?.type === 'date'}
						<DatePickerItem id="hl-value" label={t('kit.ir.filter.expression')} bind:value={dateValue} />
					{:else if field?.type === 'select' || field?.type === 'toggle'}
						<SelectListItem
							id="hl-value"
							label={t('kit.ir.filter.expression')}
							options={choiceOptions}
							bind:value={choiceValue}
						/>
					{:else}
						<TextItem id="hl-value" label={t('kit.ir.filter.expression')} bind:value={textValue} />
					{/if}
				{/if}
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{t('kit.ir.highlight.preview')}</span>
				<div class={cn('border-border rounded-md border px-3 py-2 text-sm', bg ? BG[bg] : '', fg ? FG[fg] : '')}>
					{name.trim() === '' ? t('kit.ir.highlight.title') : name}
				</div>
			</div>
		</div>
	</DialogContent>
</Dialog>
