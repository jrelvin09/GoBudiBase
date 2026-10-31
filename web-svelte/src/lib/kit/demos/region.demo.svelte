<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Region from '$lib/kit/organisms/Region.svelte';
	import UsersIcon from '@lucide/svelte/icons/users';
	import CircleIcon from '@lucide/svelte/icons/circle';

	let collapsed = $state(false);
</script>

<div class="flex flex-col gap-6">
	<Region title="Standard" icon={UsersIcon}>
		{#snippet buttonsRight()}
			<Button variant="outline" size="sm">Action</Button>
		{/snippet}
		<p class="text-sm text-muted-foreground">Standard region body.</p>
	</Region>

	<Region title="Collapsible" collapsible bind:collapsed>
		<p class="text-sm text-muted-foreground">Body is {collapsed ? 'collapsed' : 'expanded'}.</p>
	</Region>

	<Region title="Hidden header" variant="hidden-header">
		{#snippet buttonsLeft()}
			<Button variant="ghost" size="sm">Left</Button>
		{/snippet}
		{#snippet buttonsRight()}
			<Button variant="outline" size="sm">Right</Button>
		{/snippet}
		<p class="text-sm text-muted-foreground">Only the button row is shown.</p>
	</Region>

	<Region title="Plain">
		<p class="text-sm text-muted-foreground">Blank with attributes.</p>
	</Region>

	<Region title="Accent 3" accent={3}>
		<p class="text-sm text-muted-foreground">Top accent line.</p>
	</Region>

	<Region title="Fixed height (240, scrolls)" bodyHeight="240">
		<div class="flex flex-col gap-2">
			{#each Array(20) as _, i (i)}
				<p class="text-sm text-muted-foreground">Row {i + 1}</p>
			{/each}
		</div>
	</Region>

	<Region title="No body padding" noBodyPadding>
		<div class="rounded-md bg-muted p-2 text-sm text-muted-foreground">Edge-to-edge content.</div>
	</Region>

	<Region title="Accent with icon" icon={CircleIcon} accent={9}>
		<p class="text-sm text-muted-foreground">Icon plus accent.</p>
	</Region>
</div>
