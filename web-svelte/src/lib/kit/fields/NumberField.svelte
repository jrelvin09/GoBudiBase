<script lang="ts">
	import NumberItem from '$lib/kit/molecules/NumberItem.svelte';
	import type { FieldInputProps } from './types';

	let {
		field,
		id,
		value,
		error,
		readOnly,
		labelPosition,
		onchange
	}: FieldInputProps & { value: number | null } = $props();
</script>

<NumberItem
	{id}
	label={field.label}
	required={field.required}
	min={field.min}
	max={field.max}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>
