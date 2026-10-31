<script lang="ts">
	import TextareaItem from '$lib/kit/molecules/TextareaItem.svelte';

	let plain = $state<string | null>(null);
	let counted = $state<string | null>(null);
	let fixed = $state<string | null>('Line one\nLine two');
	let readOnly = $state<string | null>('Read only\ntext block');
</script>

<div class="grid max-w-xl gap-4">
	<TextareaItem id="ta-plain" label="Plain" bind:value={plain} placeholder="Type a longer text" />
	<TextareaItem
		id="ta-counted"
		label="With character counter"
		maxLength={200}
		bind:value={counted}
		placeholder="Max 200 characters"
	/>
	<TextareaItem id="ta-fixed" label="Fixed rows" autoHeight={false} rows={3} bind:value={fixed} />
	<TextareaItem id="ta-readonly" label="Read only" readOnly bind:value={readOnly} />
</div>
