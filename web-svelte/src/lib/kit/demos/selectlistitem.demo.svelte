<script lang="ts">
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';

	const options = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'active', label: 'Active' },
		{ value: 'archived', label: 'Archived' }
	];

	let plain = $state<string | null>(null);
	let required = $state<string | null>('active');
	let readOnly = $state<string | null>('draft');
</script>

<div class="grid max-w-xl gap-4">
	<SelectListItem id="select-plain" label="Select list" {options} bind:value={plain} />
	<SelectListItem id="select-required" label="Required (no null option)" required {options} bind:value={required} />
	<SelectListItem id="select-readonly" label="Read only" readOnly {options} bind:value={readOnly} />
</div>
