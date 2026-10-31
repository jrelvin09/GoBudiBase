<script lang="ts">
	import ImageItem from '$lib/kit/molecules/ImageItem.svelte';
	import type { FieldInputProps } from './types';

	let { field, id, value, error, readOnly, labelPosition, onchange }: FieldInputProps & {
		value: string | null;
	} = $props();
</script>

<ImageItem
	{id}
	fieldName={field.name}
	label={field.label}
	required={field.required}
	maxSize={field.max_size}
	accept={field.accept}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{onchange}
/>