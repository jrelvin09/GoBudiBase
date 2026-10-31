<script lang="ts" module>
	export type RadioOption = { value: string; label: string };
</script>

<script lang="ts">
	import { RadioGroup, RadioGroupItem as RadioItem } from '$lib/components/ui/radio-group';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import { cn } from '$lib/utils';

	let {
		id,
		value = $bindable(null),
		options,
		columns = 1,
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
		disabled = false,
		class: className
	}: {
		id: string;
		value?: string | null;
		options: RadioOption[];
		columns?: 1 | 2 | 3 | 4;
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
		disabled?: boolean;
		class?: string;
	} = $props();

	const columnsClass = $derived(
		columns === 2
			? 'grid-cols-2'
			: columns === 3
				? 'grid-cols-3'
				: columns === 4
					? 'grid-cols-4'
					: 'grid-cols-1'
	);
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
	{#snippet children(ctx)}
		{#if readOnly}
			<span class="flex items-center text-sm">{options.find((o) => o.value === value)?.label ?? value ?? ''}</span>
		{:else}
			<RadioGroup
				value={value ?? ''}
				onValueChange={(next) => (value = next || null)}
				{disabled}
				class={cn('grid gap-2', columnsClass)}
				aria-describedby={ctx.describedBy}
				aria-invalid={ctx.invalid}
			>
				{#each options as option (option.value)}
					<label class="flex items-center gap-2 text-sm">
						<RadioItem value={option.value} />
						<span>{option.label}</span>
					</label>
				{/each}
			</RadioGroup>
		{/if}
	{/snippet}
</Item>
