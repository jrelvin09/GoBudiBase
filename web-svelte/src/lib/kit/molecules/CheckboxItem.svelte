<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';

	let {
		id,
		checked = $bindable(false),
		checkLabel,
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
		onchange,
		class: className
	}: {
		id: string;
		checked?: boolean;
		checkLabel?: string;
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
		onchange?: (value: boolean) => void;
		class?: string;
	} = $props();
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
		<label class="flex items-center gap-2 text-sm">
			<Checkbox
				id={ctx.id}
				checked={checked}
				onCheckedChange={(next) => {
					checked = next;
					onchange?.(next);
				}}
				disabled={disabled || readOnly}
				aria-describedby={ctx.describedBy}
				aria-invalid={ctx.invalid}
			/>
			{#if checkLabel}
				<span>{checkLabel}</span>
			{/if}
		</label>
	{/snippet}
</Item>
