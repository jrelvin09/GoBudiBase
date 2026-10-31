<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let {
		id,
		value = $bindable(null),
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
		maxLength,
		rows = 4,
		autoHeight = true,
		counter,
		placeholder,
		disabled = false,
		onchange,
		class: className
	}: {
		id: string;
		value?: string | null;
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
		maxLength?: number;
		rows?: number;
		autoHeight?: boolean;
		counter?: boolean;
		placeholder?: string;
		disabled?: boolean;
		onchange?: (value: string | null) => void;
		class?: string;
	} = $props();

	let el = $state<HTMLTextAreaElement | null>(null);

	const showCounter = $derived(counter ?? Boolean(maxLength));
	const count = $derived(value?.length ?? 0);

	function resize() {
		if (!el || !autoHeight || readOnly) return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}

	$effect(() => {
		value;
		resize();
	});

	function onInput(event: Event) {
		const target = event.currentTarget as HTMLTextAreaElement;
		value = target.value === '' ? null : target.value;
		onchange?.(value);
		resize();
	}
</script>

{#if readOnly}
	<DisplayOnly
		{id}
		type="textarea"
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
		{error}
		{labelPosition}
		{preText}
		{postText}
		{size}
		{stretch}
		class={className}
	>
		{#snippet children(ctx)}
			<div class="flex flex-col gap-1">
				<Textarea
					bind:ref={el}
					id={ctx.id}
					{rows}
					value={value ?? ''}
					oninput={onInput}
					aria-describedby={ctx.describedBy}
					aria-invalid={ctx.invalid}
					maxlength={maxLength}
					{placeholder}
					{disabled}
					class={autoHeight ? 'resize-none' : ''}
				/>
				{#if showCounter && maxLength}
					<div class="text-right text-xs text-muted-foreground">
						{t('kit.item.char_counter', { count, max: maxLength })}
					</div>
				{/if}
			</div>
		{/snippet}
	</Item>
{/if}
