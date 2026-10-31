<script lang="ts">
	import Shuttle from '$lib/kit/molecules/Shuttle.svelte';

	const available = [
		{ value: 'code', label: 'Code' },
		{ value: 'name', label: 'Name' },
		{ value: 'email', label: 'Email' },
		{ value: 'phone', label: 'Phone' },
		{ value: 'tier', label: 'Tier' },
		{ value: 'credit_limit', label: 'Credit Limit' }
	];

	let displayed = $state<string[]>(['code', 'name', 'tier']);
</script>

<div class="max-w-2xl">
	<Shuttle {available} bind:value={displayed} />
	<p class="text-muted-foreground mt-2 text-sm">displayed: {displayed.join(', ')}</p>
</div>
