<script lang="ts">
	import PopupLovItem from '$lib/kit/molecules/PopupLovItem.svelte';
	import type { FieldInputProps } from './types';
	import { getRelationSource } from './relation';

	let {
		field,
		id,
		value,
		error,
		readOnly,
		labelPosition,
		onchange
	}: FieldInputProps & { value: string | null } = $props();

	const source = getRelationSource();
	let valueLabel = $state<string | null>(null);
	let loadedId = $state<string | null>(null);

	// Resolve the label of the current value once (F2-06).
	$effect(() => {
		const current = value ?? null;
		if (!current) {
			valueLabel = null;
			loadedId = null;
			return;
		}
		if (current === loadedId || !source) return;
		let cancelled = false;
		void source
			.labels(field.name, [current])
			.then((map) => {
				if (cancelled) return;
				valueLabel = map[current] ?? null;
				loadedId = current;
			})
			.catch(() => {
				if (!cancelled) valueLabel = null;
			});
		return () => {
			cancelled = true;
		};
	});

	const search = (q: string, page: number) =>
		source ? source.search(field.name, q, page) : Promise.resolve({ items: [], total: 0 });

	function onValueChange(next: string | null, label: string | null) {
		valueLabel = label;
		loadedId = next;
		onchange(next);
	}
</script>

<PopupLovItem
	{id}
	label={field.label}
	required={field.required}
	{error}
	{readOnly}
	{labelPosition}
	value={value ?? null}
	{valueLabel}
	{search}
	onchange={onValueChange}
/>
