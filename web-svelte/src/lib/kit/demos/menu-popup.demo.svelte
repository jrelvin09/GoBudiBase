<script lang="ts">
	import MenuPopup, { type MenuPopupItem } from '$lib/kit/molecules/MenuPopup.svelte';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let last = $state('—');
	const items: MenuPopupItem[] = [
		{ label: 'Edit', icon: PencilIcon, onselect: () => (last = 'edit') },
		{ label: 'Duplicate', onselect: () => (last = 'duplicate') },
		{ label: 'Disabled item', disabled: true },
		{ label: 'Delete', icon: TrashIcon, danger: true, onselect: () => (last = 'delete') }
	];
</script>

<div class="flex flex-wrap items-center gap-4">
	<MenuPopup {items} ariaLabel="Row actions" />
	<MenuPopup {items} label="Actions" />
	<p class="text-muted-foreground text-sm">Last action: {last}</p>
</div>