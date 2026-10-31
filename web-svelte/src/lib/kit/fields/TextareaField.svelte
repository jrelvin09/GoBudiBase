<script lang="ts">
	import TextareaItem from '$lib/kit/molecules/TextareaItem.svelte';
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

<TextareaItem
	{id}
	label={field.label}
	required={field.required}
	maxLength={field.max_length}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>
