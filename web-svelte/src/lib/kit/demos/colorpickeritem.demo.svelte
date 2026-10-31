<script lang="ts">
	import ColorPickerItem from '$lib/kit/molecules/ColorPickerItem.svelte';

	let plain = $state<string | null>('#1f6f43');
	let empty = $state<string | null>(null);
	let invalid = $state<string | null>('#777777');
	let required = $state<string | null>('#111111');
</script>

<div class="flex flex-col gap-3">
	<p class="text-muted-foreground text-sm">
		APEX colour picker: the native swatch, the hex box and the preview stay in sync. A half-typed
		hex is kept as typed until it is complete.
	</p>
	<ColorPickerItem id="color-plain" label="Primary colour" bind:value={plain} />
	<ColorPickerItem id="color-empty" label="Optional colour" bind:value={empty} inlineHelp="Clear removes it." />
	<ColorPickerItem
		id="color-invalid"
		label="Rejected colour"
		bind:value={invalid}
		error="This colour is too close to the text on top of it."
	/>
	<ColorPickerItem id="color-required" label="Required colour" required bind:value={required} />
	<ColorPickerItem id="color-readonly" label="Read only" readOnly bind:value={plain} />
</div>
