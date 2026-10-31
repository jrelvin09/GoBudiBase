<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CommandPalette, { type SearchGroup } from '$lib/kit/organisms/CommandPalette.svelte';

	// Fake data (F5-06): the real groups come from GET /api/v1/search.
	const data: SearchGroup[] = [
		{
			resource: 'sales.customer',
			label: 'Customers',
			more: true,
			items: [
				{ id: 'c1', title: 'Acme Retail' },
				{ id: 'c2', title: 'Acme Wholesale' },
				{ id: 'c3', title: 'Beta Gold' }
			]
		},
		{
			resource: 'sales.order',
			label: 'Orders',
			more: false,
			items: [
				{ id: 'o1', title: 'SO-1001' },
				{ id: 'o2', title: 'SO-1002' }
			]
		}
	];

	async function search(q: string): Promise<SearchGroup[]> {
		const needle = q.toLowerCase();
		return data
			.map((group) => ({
				...group,
				items: group.items.filter((item) => item.title.toLowerCase().includes(needle))
			}))
			.filter((group) => group.items.length > 0);
	}

	let open = $state(false);
</script>

<div class="flex max-w-xl flex-col gap-4">
	<p class="text-muted-foreground text-sm">
		Command palette (Ctrl+K): type at least two characters. Arrow keys move through the grouped
		results, Enter opens a record, and "More in ..." opens the list with the search filled.
	</p>
	<Button onclick={() => (open = true)}>Open command palette</Button>
	<CommandPalette bind:open {search} />
</div>