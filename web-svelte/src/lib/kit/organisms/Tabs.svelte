<script lang="ts" module>
	import type { Snippet } from 'svelte';
	export type TabsVariant = 'tabs' | 'pills';
	export type TabItem = { value: string; label: string; invalid?: boolean; content?: Snippet };
</script>

<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';

	// Tabs + Region Display Selector (K6-06): pola WAI-ARIA Tabs dengan aktivasi
	// otomatis saat panah/Home/End dipakai.
	const ALL = '__all__';

	let {
		items,
		value = $bindable(),
		variant = 'tabs',
		showAll = false,
		ariaLabel,
		class: className
	}: {
		items: TabItem[];
		value?: string;
		variant?: TabsVariant;
		showAll?: boolean;
		ariaLabel?: string;
		class?: string;
	} = $props();

	const tabs = $derived<TabItem[]>(
		showAll ? [{ value: ALL, label: t('kit.tabs.show_all') }, ...items] : items
	);
	const active = $derived(value && tabs.some((tab) => tab.value === value) ? value : (tabs[0]?.value ?? ''));

	let tablistEl = $state<HTMLDivElement | null>(null);

	function select(next: string) {
		value = next;
	}
	function focusTab(index: number) {
		if (tabs.length === 0) return;
		const next = ((index % tabs.length) + tabs.length) % tabs.length;
		select(tabs[next].value);
		tablistEl?.querySelector<HTMLElement>(`[data-tab-index="${next}"]`)?.focus();
	}
	function onKeydown(event: KeyboardEvent, index: number) {
		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				focusTab(index - 1);
				break;
			case 'ArrowRight':
				event.preventDefault();
				focusTab(index + 1);
				break;
			case 'Home':
				event.preventDefault();
				focusTab(0);
				break;
			case 'End':
				event.preventDefault();
				focusTab(tabs.length - 1);
				break;
		}
	}
</script>
<div class={cn('flex flex-col gap-4', className)}>
	<div
		bind:this={tablistEl}
		role="tablist"
		aria-label={ariaLabel}
		class={cn(
			'flex items-center',
			variant === 'tabs' ? 'border-border gap-4 border-b' : 'bg-muted w-fit gap-1 rounded-lg p-1'
		)}
	>
		{#each tabs as tab, index (tab.value)}
			{@const selected = active === tab.value}
			<button
				type="button"
				role="tab"
				id="tab-{tab.value}"
				data-tab-index={index}
				aria-selected={selected}
				aria-controls={selected ? (tab.value === ALL ? items.map((i) => 'panel-' + i.value).join(' ') : 'panel-' + tab.value) : undefined}
				tabindex={selected ? 0 : -1}
				onclick={() => select(tab.value)}
				onkeydown={(event) => onKeydown(event, index)}
				class={cn(
					'focus-visible:ring-ring inline-flex items-center gap-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
					variant === 'tabs' ? 'border-b-2 px-1 py-2' : 'rounded-md px-3 py-1',
					selected
						? variant === 'tabs'
							? 'border-primary text-foreground'
							: 'bg-background text-foreground shadow-sm'
						: variant === 'tabs'
							? 'text-muted-foreground border-transparent hover:text-foreground'
							: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{#if tab.invalid}
					<span class="bg-destructive size-1.5 shrink-0 rounded-full" aria-hidden="true"></span>
					<span class="sr-only">{t('kit.tabs.has_errors')}</span>
				{/if}
				{tab.label}
			</button>
		{/each}
	</div>

	{#each tabs as tab (tab.value)}
		{#if tab.content && (active === tab.value || (active === ALL && tab.value !== ALL))}
			<div
				role="tabpanel"
				id="panel-{tab.value}"
				aria-labelledby="tab-{tab.value}"
				tabindex="0"
				class="focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
			>
				{@render tab.content()}
			</div>
		{/if}
	{/each}
</div>