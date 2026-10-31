<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsUpIcon from '@lucide/svelte/icons/chevrons-up';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ChevronsDownIcon from '@lucide/svelte/icons/chevrons-down';

	export type ShuttleItem = { value: string; label: string };

	let {
		available,
		value = $bindable<string[]>([]),
		max = 0
	}: {
		available: ShuttleItem[];
		value?: string[];
		/** Maximum number of items on the right; 0 means no limit. */
		max?: number;
	} = $props();

	let leftSelected = $state<string[]>([]);
	let rightSelected = $state<string[]>([]);

	const left = $derived(available.filter((item) => !value.includes(item.value)));
	const right = $derived(value.map((name) => available.find((item) => item.value === name)).filter((item): item is ShuttleItem => Boolean(item)));

	/** Room left on the right for n more items (K4 §1.2 bounds). */
	function roomFor(count: number): number {
		if (max <= 0) return count;
		return Math.max(0, Math.min(count, max - value.length));
	}

	function moveRight() {
		value = [...value, ...leftSelected.slice(0, roomFor(leftSelected.length))];
		leftSelected = [];
	}

	function moveAllRight() {
		value = [...value, ...left.slice(0, roomFor(left.length)).map((item) => item.value)];
		leftSelected = [];
	}

	function moveLeft() {
		value = value.filter((name) => !rightSelected.includes(name));
		rightSelected = [];
	}

	function moveOneRight(name: string) {
		if (value.includes(name) || roomFor(1) === 0) return;
		value = [...value, name];
	}

	function moveOneLeft(name: string) {
		value = value.filter((entry) => entry !== name);
	}

	function moveAllLeft() {
		value = [];
		rightSelected = [];
	}

	function reorder(where: 'top' | 'up' | 'down' | 'bottom') {
		if (rightSelected.length !== 1) return;
		const name = rightSelected[0];
		const index = value.indexOf(name);
		if (index === -1) return;
		const next = [...value];
		next.splice(index, 1);
		const target =
			where === 'top' ? 0 : where === 'bottom' ? next.length : where === 'up' ? Math.max(0, index - 1) : Math.min(next.length, index + 1);
		next.splice(target, 0, name);
		value = next;
	}

	function toggle(list: 'left' | 'right', name: string, event: MouseEvent) {
		const selected = list === 'left' ? leftSelected : rightSelected;
		let next: string[];
		if (event.ctrlKey || event.metaKey) {
			next = selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name];
		} else {
			next = [name];
		}
		if (list === 'left') leftSelected = next;
		else rightSelected = next;
	}
</script>

{#snippet listbox(items: ShuttleItem[], selected: string[], side: 'left' | 'right', label: string)}
	<div class="flex flex-col gap-1">
		<span class="text-muted-foreground text-xs font-medium">{label}</span>
		<div
			class="border-input h-48 min-w-0 flex-1 overflow-y-auto rounded-md border p-1"
			role="listbox"
			aria-multiselectable="true"
			aria-label={label}
			tabindex={0}
		>
			{#each items as item (item.value)}
				<button
					type="button"
					role="option"
					aria-selected={selected.includes(item.value)}
					class="hover:bg-muted aria-selected:bg-muted flex w-full rounded-md px-2 py-1 text-left text-sm"
					onclick={(event) => toggle(side, item.value, event)}
					ondblclick={() => (side === 'left' ? moveOneRight(item.value) : moveOneLeft(item.value))}
				>
					{item.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<div class="flex items-start gap-2">
	{@render listbox(left, leftSelected, 'left', t('kit.shuttle.available'))}

	<div class="flex flex-col gap-1 pt-5">
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.move_right')} onclick={moveRight}>
			<ChevronRightIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.move_all_right')} onclick={moveAllRight}>
			<ChevronsRightIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.move_left')} onclick={moveLeft}>
			<ChevronLeftIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.move_all_left')} onclick={moveAllLeft}>
			<ChevronsLeftIcon />
		</Button>
	</div>

	{@render listbox(right, rightSelected, 'right', t('kit.shuttle.display'))}

	<div class="flex flex-col gap-1 pt-5">
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.top')} onclick={() => reorder('top')}>
			<ChevronsUpIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.up')} onclick={() => reorder('up')}>
			<ArrowUpIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.down')} onclick={() => reorder('down')}>
			<ArrowDownIcon />
		</Button>
		<Button variant="outline" size="icon-sm" aria-label={t('kit.shuttle.bottom')} onclick={() => reorder('bottom')}>
			<ChevronsDownIcon />
		</Button>
	</div>
</div>
