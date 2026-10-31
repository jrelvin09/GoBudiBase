<script lang="ts">
	import ButtonGroup from '$lib/kit/molecules/ButtonGroup.svelte';

	let mode = $state('day');
	let action = $state('');
	const items = [
		{ label: 'Day', value: 'day' },
		{ label: 'Week', value: 'week' },
		{ label: 'Month', value: 'month' }
	];
</script>

<div class="flex flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">toggle tunggal (radiogroup)</h2>
		<ButtonGroup {items} mode="toggle" bind:value={mode} ariaLabel="Rentang" />
		<p class="text-muted-foreground text-sm">Dipilih: {mode}</p>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">aksi</h2>
		<ButtonGroup {items} mode="action" ariaLabel="Aksi" onselect={(value) => (action = value)} />
		<p class="text-muted-foreground text-sm">Aksi terakhir: {action || '—'}</p>
	</section>
</div>