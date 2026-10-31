<script lang="ts">
	import DatePickerItem from '$lib/kit/molecules/DatePickerItem.svelte';
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import { t } from '$lib/i18n/index.svelte';

	let {
		id,
		field,
		low,
		high,
		onchange
	}: {
		id: string;
		field: FieldMeta;
		low: number | string | null;
		high: number | string | null;
		onchange: (low: number | string | null, high: number | string | null) => void;
	} = $props();

	// Satu editor per jenis agar setiap binding tetap bertipe tepat.
	let numberLow = $state<number | null>(null);
	let numberHigh = $state<number | null>(null);
	let dateLow = $state<string | null>(null);
	let dateHigh = $state<string | null>(null);

	$effect(() => {
		numberLow = typeof low === 'number' ? low : null;
		numberHigh = typeof high === 'number' ? high : null;
		dateLow = typeof low === 'string' ? low : null;
		dateHigh = typeof high === 'string' ? high : null;
	});
</script>

<div class="flex flex-col gap-2">
	{#if field.type === 'date'}
		<DatePickerItem
			id="{id}-low"
			label={t('kit.facets.min')}
			bind:value={dateLow}
			onchange={() => onchange(dateLow, dateHigh)}
		/>
		<DatePickerItem
			id="{id}-high"
			label={t('kit.facets.max')}
			bind:value={dateHigh}
			onchange={() => onchange(dateLow, dateHigh)}
		/>
	{:else}
		<NumberItem
			id="{id}-low"
			label={t('kit.facets.min')}
			bind:value={numberLow}
			onchange={() => onchange(numberLow, numberHigh)}
		/>
		<NumberItem
			id="{id}-high"
			label={t('kit.facets.max')}
			bind:value={numberHigh}
			onchange={() => onchange(numberLow, numberHigh)}
		/>
	{/if}
</div>
