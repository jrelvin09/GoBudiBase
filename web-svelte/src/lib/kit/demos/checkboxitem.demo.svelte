<script lang="ts">
	import CheckboxItem from '$lib/kit/molecules/CheckboxItem.svelte';

	let checked = $state(true);
	let unchecked = $state(false);
</script>

<div class="grid max-w-xl gap-4">
	<CheckboxItem id="check-1" label="Checkbox" checkLabel="Enable notifications" bind:checked={checked} />
	<CheckboxItem id="check-2" label="With help" checkLabel="Subscribe" help="Sends a weekly digest." bind:checked={unchecked} />
</div>
