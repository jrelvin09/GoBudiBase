<script lang="ts">
	import SearchBar from '$lib/kit/organisms/ir/SearchBar.svelte';

	const columns = [
		{ value: 'code', label: 'Code' },
		{ value: 'name', label: 'Name' },
		{ value: 'tier', label: 'Tier' }
	];
	const reports = [
		{
			id: 'primary', kind: 'primary' as const, name: '1. Primary Report', settings: {} as never,
			version: 0, can_edit: false
		},
		{
			id: 'r2', kind: 'private' as const, name: 'Private: mine', settings: {} as never,
			version: 1, can_edit: true
		}
	];

	let searchColumn = $state<string | null>(null);
	let last = $state('—');
</script>

<div class="flex flex-col gap-4">
	<SearchBar
		{columns}
		bind:searchColumn
		{reports}
		currentReportId="primary"
		onsearch={(text, column) => (last = `${column ?? 'all'}: ${text}`)}
	>
		{#snippet right()}
			<span class="text-muted-foreground text-sm">Create button slot</span>
		{/snippet}
	</SearchBar>
	<p class="text-muted-foreground text-sm">last search: {last}</p>
</div>
