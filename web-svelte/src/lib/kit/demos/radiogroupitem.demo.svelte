<script lang="ts">
	import RadioGroupItem from '$lib/kit/molecules/RadioGroupItem.svelte';

	const options = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	];

	let oneColumn = $state<string | null>('low');
	let twoColumns = $state<string | null>(null);
</script>

<div class="grid max-w-xl gap-4">
	<RadioGroupItem id="radio-1" label="One column" {options} bind:value={oneColumn} />
	<RadioGroupItem id="radio-2" label="Two columns" {options} columns={2} bind:value={twoColumns} />
</div>
