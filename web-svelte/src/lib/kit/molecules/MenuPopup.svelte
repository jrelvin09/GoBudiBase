<script lang="ts" module>
	import type { Component } from 'svelte';
	export type MenuPopupItem = {
		label: string;
		icon?: Component;
		danger?: boolean;
		disabled?: boolean;
		onselect?: () => void;
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { t } from '$lib/i18n/index.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';

	// Menu popup (K6-07): tombol ikon ⋮ atau berlabel membuka dropdown dari
	// prop `items`, memakai atom dropdown-menu.
	let {
		label,
		icon = EllipsisIcon,
		items,
		ariaLabel
	}: {
		label?: string;
		icon?: Component;
		items: MenuPopupItem[];
		ariaLabel?: string;
	} = $props();
</script>
<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size={label ? 'sm' : 'icon'} aria-label={ariaLabel ?? label ?? t('kit.menu.more')}>
				{#if label}
					{label}
					<ChevronDownIcon data-icon="inline-end" />
				{:else}
					{@const Icon = icon}
					<Icon />
				{/if}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-48">
		{#each items as item, index (index)}
			<DropdownMenu.Item
				variant={item.danger ? 'destructive' : 'default'}
				disabled={item.disabled}
				onclick={() => item.onselect?.()}
			>
				{#if item.icon}
					{@const ItemIcon = item.icon}
					<ItemIcon />
				{/if}
				{item.label}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>