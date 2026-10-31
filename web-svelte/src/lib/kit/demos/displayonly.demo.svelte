<script lang="ts">
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';

	const options = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'active', label: 'Active' }
	];
</script>

<div class="grid max-w-xl gap-4">
	<DisplayOnly id="display-text" type="text" label="Text" value="Hello" />
	<DisplayOnly id="display-textarea" type="textarea" label="Textarea" value={'First line\nSecond line'} />
	<DisplayOnly id="display-email" type="email" label="Email" value="name@example.com" />
	<DisplayOnly id="display-number" type="number" label="Number" value={1234.5} />
	<DisplayOnly id="display-date" type="date" label="Date" value="2026-09-26" />
	<DisplayOnly id="display-select" type="select" label="Select" value="active" {options} />
	<DisplayOnly id="display-toggle" type="toggle" label="Toggle" value={true} />
	<DisplayOnly id="display-empty" type="text" label="Empty value" value={null} />
</div>
