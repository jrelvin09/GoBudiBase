<script lang="ts">
	import SwitchItem from '$lib/kit/molecules/SwitchItem.svelte';

	let on = $state(true);
	let off = $state(false);
</script>

<div class="grid max-w-xl gap-4">
	<SwitchItem id="switch-on" label="Switch" bind:value={on} />
	<SwitchItem id="switch-off" label="With custom labels" onLabel="Enabled" offLabel="Disabled" bind:value={off} />
</div>
