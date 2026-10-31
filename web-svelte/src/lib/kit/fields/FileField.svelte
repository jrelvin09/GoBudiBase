<script lang="ts">
	import FileItem from '$lib/kit/molecules/FileItem.svelte';
	import type { FieldInputProps } from './types';

	let { field, id, value, error, readOnly, labelPosition, onchange }: FieldInputProps & {
		value: string | null;
	} = $props();
</script>

<FileItem
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