<script lang="ts">
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
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

<TextItem
	{id}
	type="email"
	label={field.label}
	required={field.required}
	maxLength={field.max_length}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>
