<script lang="ts">
	import TextItem from '$lib/kit/molecules/TextItem.svelte';

	let plain = $state<string | null>(null);
	let required = $state<string | null>(null);
	let upper = $state<string | null>('abc');
	let email = $state<string | null>(null);
	let readOnly = $state<string | null>('Fixed value');
</script>

<div class="grid max-w-xl gap-4">
	<TextItem id="text-plain" label="Plain" bind:value={plain} placeholder="Type here" />
	<TextItem
		id="text-required"
		label="Required with error"
		required
		error="This field is required."
		bind:value={required}
	/>
	<TextItem id="text-upper" label="Uppercase" upper bind:value={upper} />
	<TextItem id="text-email" label="Email" type="email" bind:value={email} placeholder="name@example.com" />
	<TextItem id="text-readonly" label="Read only" readOnly bind:value={readOnly} />
</div>
