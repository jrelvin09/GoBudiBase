<script lang="ts">
	import Tabs, { type TabsVariant } from '$lib/kit/organisms/Tabs.svelte';
</script>

{#snippet overviewPanel()}
	<p class="bg-card border-border rounded-md border p-3 text-sm">Overview: ringkasan singkat data ini.</p>
{/snippet}

{#snippet detailsPanel()}
	<p class="bg-card border-border rounded-md border p-3 text-sm">Details: kolom dan nilainya.</p>
{/snippet}

{#snippet historyPanel()}
	<p class="bg-card border-border rounded-md border p-3 text-sm">History: siapa mengubah apa dan kapan.</p>
{/snippet}

{#snippet demoTabs(variant: TabsVariant, showAll: boolean)}
	{@const items = [
		{ value: 'overview', label: 'Overview', content: overviewPanel },
		{ value: 'details', label: 'Details', content: detailsPanel },
		{ value: 'history', label: 'History', content: historyPanel }
	]}
	<Tabs {items} {variant} {showAll} ariaLabel="Tabs demo" />
{/snippet}

<div class="flex flex-col gap-8">
	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">variant: tabs</h2>
		{@render demoTabs('tabs', false)}
	</section>
	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">variant: pills</h2>
		{@render demoTabs('pills', false)}
	</section>
	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">Region Display Selector (Show All)</h2>
		{@render demoTabs('tabs', true)}
	</section>
</div>