<script lang="ts">
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';

	let plain = $state<number | null>(1234.5);
	let bounded = $state<number | null>(5);
	let decimals = $state<number | null>(1234.567);
	let readOnly = $state<number | null>(42);
</script>

<div class="grid max-w-xl gap-4">
	<NumberItem id="num-plain" label="Plain" bind:value={plain} />
	<NumberItem id="num-bounded" label="Min 10, max 100" min={10} max={100} required bind:value={bounded} />
	<NumberItem id="num-decimals" label="Two decimals" decimals={2} bind:value={decimals} />
	<NumberItem id="num-readonly" label="Read only" readOnly bind:value={readOnly} />
</div>
