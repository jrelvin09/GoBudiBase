<script lang="ts">
	import DatePickerItem from '$lib/kit/molecules/DatePickerItem.svelte';
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

<DatePickerItem
	{id}
	label={field.label}
	required={field.required}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>
