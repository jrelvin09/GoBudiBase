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
	label={field.label}
	required={field.required}
	maxLength={field.max_length}
	upper={field.upper}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>
