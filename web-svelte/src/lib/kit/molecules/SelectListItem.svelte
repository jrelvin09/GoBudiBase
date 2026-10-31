<script lang="ts" module>
	export type SelectOption = { value: string; label: string };
	const NULL_VALUE = '__bb_null__';
</script>

<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';

	let {
		id,
		value = $bindable(null),
		options,
		nullDisplay,
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
		value?: string | null;
		options: SelectOption[];
		nullDisplay?: string;
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
		onchange?: (value: string | null) => void;
		class?: string;
	} = $props();

	const placeholder = $derived(nullDisplay ?? t('kit.select.null_display'));
	const selectedLabel = $derived(
		value === null || value === undefined
			? placeholder
			: (options.find((option) => option.value === value)?.label ?? value)
	);

	function onValueChange(next: string | undefined) {
		value = !next || next === NULL_VALUE ? null : next;
		onchange?.(value);
	}
</script>

{#if readOnly}
	<DisplayOnly
		{id}
		type="select"
		value={value}
		{options}
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
			<Select type="single" value={value ?? NULL_VALUE} onValueChange={onValueChange} {disabled}>
				<SelectTrigger
					id={ctx.id}
					class="data-[size=default]:h-(--control-h) h-(--control-h) w-full"
					aria-describedby={ctx.describedBy}
					aria-invalid={ctx.invalid}
				>
					<span
						data-slot="select-value"
						class={cn(
							'line-clamp-1 truncate',
							(value === null || value === undefined) && 'text-muted-foreground'
						)}>{selectedLabel}</span
					>
				</SelectTrigger>
				<SelectContent>
					{#if !required}
						<SelectItem value={NULL_VALUE} label={placeholder}>{placeholder}</SelectItem>
					{/if}
					{#each options as option (option.value)}
						<SelectItem value={option.value} label={option.label}>{option.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		{/snippet}
	</Item>
{/if}
