<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import SelectListItem from '$lib/kit/molecules/SelectListItem.svelte';

	// K4-10a repro: a SelectListItem inside a Dialog. Picking an option must not
	// leave the dialog unresponsive to Apply/Cancel/Escape.
	const options = [
		{ value: 'regular', label: 'Regular' },
		{ value: 'gold', label: 'Gold' },
		{ value: 'platinum', label: 'Platinum' }
	];

	let open = $state(false);
	let value = $state<string | null>('regular');
	let log = $state('');
</script>

<div class="flex flex-col gap-2">
	<p class="text-muted-foreground text-sm">
		Open the dialog, pick a value in the select, then use Apply, Cancel and Escape: all three must work and the
		last action is reported below.
	</p>
	<Button class="self-start" onclick={() => (open = true)}>Open dialog</Button>
	{#if log}
		<p class="text-sm">Last action: {log}</p>
	{/if}
</div>

<Dialog bind:open>
	<DialogContent title="Select inside a dialog">
		{#snippet footer()}
			<Button
				variant="outline"
				onclick={() => {
					log = 'cancel';
					open = false;
				}}>Cancel</Button
			>
			<Button
				onclick={() => {
					log = `apply ${value}`;
					open = false;
				}}>Apply</Button
			>
		{/snippet}
		<SelectListItem id="demo-select" label="Choice" {options} bind:value />
	</DialogContent>
</Dialog>
