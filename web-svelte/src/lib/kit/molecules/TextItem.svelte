<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import type { FullAutoFill } from 'svelte/elements';

	let {
		id,
		value = $bindable(null),
		type = 'text',
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
		upper = false,
		placeholder,
		autocomplete,
		disabled = false,
		onchange,
		class: className
	}: {
		id: string;
		value?: string | null;
		type?: 'text' | 'email' | 'password';
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
		upper?: boolean;
		placeholder?: string;
		autocomplete?: FullAutoFill;
		disabled?: boolean;
		onchange?: (value: string | null) => void;
		class?: string;
	} = $props();

	function onInput(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		const raw = upper ? el.value.toUpperCase() : el.value;
		if (raw !== el.value) el.value = raw;
		value = raw === '' ? null : raw;
		onchange?.(value);
	}
</script>

{#if readOnly}
	<DisplayOnly
		{id}
		type={type === 'password' ? 'text' : type}
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
			<Input
				id={ctx.id}
				{type}
				value={value ?? ''}
				oninput={onInput}
				aria-describedby={ctx.describedBy}
				aria-invalid={ctx.invalid}
				maxlength={maxLength}
				{placeholder}
				{autocomplete}
				{disabled}
				class="h-(--control-h)"
			/>
		{/snippet}
	</Item>
{/if}
