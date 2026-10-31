<script lang="ts">
	import CheckboxItem from '$lib/kit/molecules/CheckboxItem.svelte';
	import type { FacetCount } from './facets';

	let {
		id,
		values,
		options,
		onchange
	}: {
		id: string;
		values: string[];
		options: FacetCount[];
		onchange: (values: string[]) => void;
	} = $props();
</script>

<div class="flex flex-col gap-1">
	{#each options as option (option.value)}
		<CheckboxItem
			id="{id}-{option.value}"
			checkLabel="{option.label} ({option.count})"
			checked={values.includes(option.value)}
			onchange={(checked) =>
				onchange(
					checked ? [...values, option.value] : values.filter((value) => value !== option.value)
				)}
		/>
	{/each}
</div>
