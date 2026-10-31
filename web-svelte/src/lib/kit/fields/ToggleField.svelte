<script lang="ts">
	import SwitchItem from '$lib/kit/molecules/SwitchItem.svelte';
	import type { FieldInputProps } from './types';

	let {
		field,
		id,
		value,
		error,
		readOnly,
		labelPosition,
		onchange
	}: FieldInputProps & { value: boolean } = $props();
</script>

<SwitchItem
	{id}
	label={field.label}
	required={field.required}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? false}
	{onchange}
/>
