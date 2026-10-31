<script lang="ts">
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import { displayText, type DisplayOption, type DisplayType } from './display';

	let {
		id,
		type,
		value,
		options,
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
		class: className
	}: {
		id: string;
		type: DisplayType;
		value: unknown;
		options?: DisplayOption[];
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
		class?: string;
	} = $props();

	const text = $derived(displayText(type, value, options));
</script>

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
	{#snippet children()}
		<span data-slot="display-only" class="flex min-h-(--control-h) items-center py-1 text-sm">
			{#if type === 'email' && text}
				<a class="text-primary underline-offset-4 hover:underline" href="mailto:{text}">{text}</a>
			{:else if type === 'textarea'}
				<span class="whitespace-pre-wrap">{text}</span>
			{:else}
				{text}
			{/if}
		</span>
	{/snippet}
</Item>
