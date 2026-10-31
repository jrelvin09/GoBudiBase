<script lang="ts" module>
	import type { Component } from 'svelte';
	export type ButtonGroupMode = 'action' | 'toggle';
	export type ButtonGroupItem = { label: string; value: string; icon?: Component; disabled?: boolean };
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	// Button Group (K6-07): tombol berdempet, radius hanya di ujung. Mode `action`
	// menjalankan aksi; mode `toggle` memilih satu (role radiogroup).
	let {
		items,
		mode = 'action',
		value = $bindable(),
		ariaLabel,
		onselect
	}: {
		items: ButtonGroupItem[];
		mode?: ButtonGroupMode;
		value?: string;
		ariaLabel?: string;
		onselect?: (value: string) => void;
	} = $props();

	function radius(index: number): string {
		if (items.length === 1) return '';
		if (index === 0) return 'rounded-r-none';
		if (index === items.length - 1) return 'rounded-l-none';
		return 'rounded-none';
	}
	function click(item: ButtonGroupItem) {
		if (item.disabled) return;
		if (mode === 'toggle') value = item.value;
		onselect?.(item.value);
	}
</script>

<div role={mode === 'toggle' ? 'radiogroup' : 'group'} aria-label={ariaLabel} class="inline-flex">
	{#each items as item, index (item.value)}
		{@const Icon = item.icon}
		<Button
			variant={mode === 'toggle' && value === item.value ? 'default' : 'outline'}
			size="sm"
			disabled={item.disabled}
			role={mode === 'toggle' ? 'radio' : undefined}
			aria-checked={mode === 'toggle' ? value === item.value : undefined}
			class={cn(radius(index), index > 0 && '-ml-px')}
			onclick={() => click(item)}
		>
			{#if Icon}
				<Icon />
			{/if}
			{item.label}
		</Button>
	{/each}
</div>