<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import TextareaItem from '$lib/kit/molecules/TextareaItem.svelte';
	import ExpressionPanels from './ExpressionPanels.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { newId } from './model';
	import type { ComputationFormat, ReportComputation, ReportMeta } from './types';

	const NEW = '__bb_new__';

	let {
		open = $bindable(false),
		meta,
		computations,
		computation,
		onapply
	}: {
		open?: boolean;
		meta: ReportMeta;
		computations: ReportComputation[];
		computation?: ReportComputation | null;
		onapply: (computation: ReportComputation) => void;
	} = $props();

	let selectedId = $state(NEW);
	let editingId = $state<string | null>(null);
	let label = $state('');
	let format = $state<ComputationFormat>('number');
	let expression = $state('');

	const canApply = $derived(label.trim() !== '' && expression.trim() !== '');

	function load(entry: ReportComputation | null) {
		if (entry) {
			editingId = entry.id;
			selectedId = entry.id;
			label = entry.label;
			format = entry.format;
			expression = entry.expr;
			return;
		}
		editingId = null;
		selectedId = NEW;
		label = '';
		format = 'number';
		expression = '';
	}

	$effect(() => {
		if (!open) return;
		load(computation ?? computations[0] ?? null);
	});

	// The Columns and Keypad panels insert at the end of the expression (K4-09).
	function insert(text: string) {
		expression = `${expression}${text}`;
	}
</script>

<Dialog bind:open>
	<DialogContent title={t('kit.ir.compute.title')} class="max-w-3xl">
		{#snippet footer()}
			<Button variant="outline" onclick={() => (open = false)}>{t('kit.common.cancel')}</Button>
			<Button disabled={!canApply} onclick={() => {
				onapply({ id: editingId ?? newId('c'), label: label.trim(), expr: expression.trim(), format });
				open = false;
			}}>{t('kit.common.apply')}</Button>
		{/snippet}

		<div class="flex flex-col gap-3">
			<SelectListItem
				id="compute-select"
				label={t('kit.ir.compute.title')}
				options={[
					{ value: NEW, label: t('kit.ir.compute.new') },
					...computations.map((entry) => ({ value: entry.id, label: entry.label }))
				]}
				bind:value={selectedId}
				onchange={(value) => load(computations.find((entry) => entry.id === value) ?? null)}
			/>
			<TextItem id="compute-label" label={t('kit.ir.compute.label')} bind:value={label} required />
			<SelectListItem
				id="compute-format"
				label={t('kit.ir.compute.format')}
				options={[
					{ value: 'number', label: t('kit.ir.compute.format_number') },
					{ value: 'text', label: t('kit.ir.compute.format_text') },
					{ value: 'date', label: t('kit.ir.compute.format_date') }
				]}
				bind:value={format}
				required
			/>
			<TextareaItem
				id="compute-expr"
				label={t('kit.ir.compute.expression')}
				bind:value={expression}
				rows={3}
			/>

			<div class="grid grid-cols-2 gap-3">
				<ExpressionPanels {meta} oninsert={insert} />
			</div>
		</div>
	</DialogContent>
</Dialog>
