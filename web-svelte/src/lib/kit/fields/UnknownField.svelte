<script lang="ts">
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import type { FieldInputProps } from './types';

	let { field, id, value }: FieldInputProps = $props();
</script>

{#if import.meta.env.DEV}
	<div
		data-slot="unknown-field"
		class="rounded-md border border-dashed border-destructive p-2 text-xs text-destructive"
	>
		Unknown field type: {field.type}
	</div>
{:else}
	<DisplayOnly {id} type="text" value={value} label={field.label} />
{/if}
