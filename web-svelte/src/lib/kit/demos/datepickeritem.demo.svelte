<script lang="ts">
	import DatePickerItem from '$lib/kit/molecules/DatePickerItem.svelte';

	let plain = $state<string | null>('2026-09-26');
	let bounded = $state<string | null>(null);
	let readOnly = $state<string | null>('2026-01-01');
</script>

<div class="grid max-w-xl gap-4">
	<DatePickerItem id="date-plain" label="Date" bind:value={plain} />
	<DatePickerItem
		id="date-bounded"
		label="Between 2026-01-01 and 2026-12-31"
		required
		min="2026-01-01"
		max="2026-12-31"
		bind:value={bounded}
	/>
	<DatePickerItem id="date-readonly" label="Read only" readOnly bind:value={readOnly} />
</div>
