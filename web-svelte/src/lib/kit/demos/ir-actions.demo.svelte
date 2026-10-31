<script lang="ts">
	import ActionsMenu from '$lib/kit/organisms/ir/ActionsMenu.svelte';

	let last = $state('—');
	let pageSize = $state(15);
</script>

<div class="flex flex-col gap-4">
	<ActionsMenu
		canExport={true}
		canDeleteReport={true}
		{pageSize}
		onaction={(name, value) => {
			if (name === 'rows' && value) pageSize = value;
			last = value === undefined ? name : `${name}:${value}`;
		}}
	/>
	<p class="text-muted-foreground text-sm">last action: {last}</p>
</div>
