<script lang="ts">
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';
	import type { FieldInputProps } from './types';

	let {
		field,
		id,
		value,
		error,
		readOnly,
		labelPosition,
		onchange
	}: FieldInputProps & { value: string | null } = $props();
</script>

<SelectListItem
	{id}
	label={field.label}
	required={field.required}
	options={field.options ?? []}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>
