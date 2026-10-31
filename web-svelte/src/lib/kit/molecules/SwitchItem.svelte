<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let {
		id,
		value = $bindable(false),
		onLabel,
		offLabel,
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
		value?: boolean;
		onLabel?: string;
		offLabel?: string;
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

	const on = $derived(onLabel ?? t('kit.common.yes'));
	const off = $derived(offLabel ?? t('kit.common.no'));
</script>

{#if readOnly}
	<DisplayOnly
		{id}
		type="toggle"
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
			<div class="flex h-(--control-h) items-center gap-2">
				<Switch
					id={ctx.id}
					checked={value}
					onCheckedChange={(checked) => {
						value = checked;
						onchange?.(checked);
					}}
					disabled={disabled}
					aria-describedby={ctx.describedBy}
					aria-invalid={ctx.invalid}
				/>
				<span class="text-sm text-muted-foreground">{value ? on : off}</span>
			</div>
		{/snippet}
	</Item>
{/if}
