<script lang="ts">
	import { getFieldInput } from '$lib/kit/fields/registry';
	import type { FieldMeta } from '$lib/kit/fields/types';

	// One cell in edit mode (K5-05): the registry adaptor renders the right
	// control; its label is the column title, hidden visually so the cell keeps
	// the grid's own header (§1.3).
	let {
		field,
		id,
		value,
		oninput,
		oncommit,
		oncancel
	}: {
		field: FieldMeta;
		id: string;
		value: unknown;
		oninput: (value: unknown) => void;
		oncommit: (move: 'down' | 'left' | 'right') => void;
		oncancel: () => void;
	} = $props();

	const Input = $derived(getFieldInput(field.type));
	let root: HTMLElement | null = $state(null);

	$effect(() => {
		root?.querySelector<HTMLElement>('input, textarea, button, [tabindex]')?.focus();
	});

	function onkeydown(event: KeyboardEvent) {
		// The editor owns these keys while it is open: the grid must not see the
		// same Enter and re-open the editor it just closed (K5-07a).
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			oncancel();
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			oncommit('down');
			return;
		}
		if (event.key === 'Tab') {
			event.preventDefault();
			event.stopPropagation();
			oncommit(event.shiftKey ? 'left' : 'right');
		}
	}
</script>

<div bind:this={root} role="presentation" class="h-(--control-h)" onkeydown={onkeydown}>
	<Input {field} {id} {value} labelPosition="hidden" onchange={oninput} />
</div>
