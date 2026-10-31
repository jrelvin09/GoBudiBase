<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import { formatNumber } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import { fromEditText, toEditText, type NumberError } from './number-input';

	let {
		id,
		value = $bindable(null),
		min,
		max,
		decimals,
		label,
		required = false,
		help,
		inlineHelp,
		error,
		labelPosition = 'above',
		preText,
		postText,
		size = 'md',
		stretch = false,
		readOnly = false,
		placeholder,
		disabled = false,
		onchange,
		class: className
	}: {
		id: string;
		value?: number | null;
		min?: number;
		max?: number;
		decimals?: number;
		label?: string;
		required?: boolean;
		help?: string;
		inlineHelp?: string;
		error?: string;
		labelPosition?: ItemLabelPosition;
		preText?: string;
		postText?: string;
		size?: ItemSize;
		stretch?: boolean;
		readOnly?: boolean;
		placeholder?: string;
		disabled?: boolean;
		onchange?: (value: number | null) => void;
		class?: string;
	} = $props();

	let editing = $state(false);
	let text = $state('');
	let localError = $state<NumberError>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (!editing && localError !== 'invalid') {
			text = value === null || value === undefined ? '' : formatNumber(value, { decimals });
		}
	});

	function localErrorMessage(kind: NumberError): string | null {
		switch (kind) {
			case 'invalid':
				return t('kit.item.invalid_number');
			case 'min':
				return t('kit.item.min_value', { min: min ?? '' });
			case 'max':
				return t('kit.item.max_value', { max: max ?? '' });
			default:
				return null;
		}
	}

	const shownError = $derived(error ?? localErrorMessage(localError) ?? undefined);

	function setValidity(kind: NumberError) {
		inputEl?.setCustomValidity(localErrorMessage(kind) ?? '');
	}

	function onFocus() {
		editing = true;
		text = toEditText(value);
	}

	function onInput(event: Event) {
		text = (event.currentTarget as HTMLInputElement).value;
		setValidity(null);
	}

	function onBlur() {
		const result = fromEditText(text, { min, max });
		if (result.error === 'invalid') {
			// Pertahankan teks yang tidak valid; jangan sentuh value/onchange.
			localError = 'invalid';
			editing = false;
			setValidity('invalid');
			return;
		}
		const previous = value;
		value = result.value;
		localError = result.error;
		editing = false;
		text = value === null ? '' : formatNumber(value, { decimals });
		setValidity(result.error);
		if (value !== previous) onchange?.(value);
	}
</script>

{#if readOnly}
	<DisplayOnly
		{id}
		type="number"
		value={value}
		{label}
		{required}
		{help}
		{inlineHelp}
		{error}
		{labelPosition}
		{preText}
		{postText}
		{size}
		{stretch}
		class={className}
	/>
{:else}
	<Item
		{id}
		{label}
		{required}
		{help}
		{inlineHelp}
		error={shownError}
		{labelPosition}
		{preText}
		{postText}
		{size}
		{stretch}
		class={className}
	>
		{#snippet children(ctx)}
			<Input
				bind:ref={inputEl}
				id={ctx.id}
				type="text"
				inputmode="decimal"
				class="h-(--control-h) text-right"
				value={text}
				onfocus={onFocus}
				oninput={onInput}
				onblur={onBlur}
				aria-describedby={ctx.describedBy}
				aria-invalid={ctx.invalid}
				{placeholder}
				{disabled}
			/>
		{/snippet}
	</Item>
{/if}
