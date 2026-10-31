<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { t } from '$lib/i18n/index.svelte';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import XIcon from '@lucide/svelte/icons/x';
	import type { FreeBox, Spot } from '../builder';
	import type { PageDefinition } from '../page-definition';
	import DesignGrid from './DesignGrid.svelte';
	import { dragKind, dropMark, dropTarget, MIME_ITEM_MOVE, MIME_ITEM_NEW, type Box, type DropTarget, type Mark } from './dnd';

	// Kanvas desain: gambar halaman yang sedang diedit (data contoh) pada grid 12
	// kolom yang sama dengan runtime. Region dipilih dengan klik, disusun ulang dengan
	// seret-lepas (juga berdampingan dan masuk ke wadah tab/panel), diubah lebarnya
	// dengan menyeret tepi kanan, dan diterima dari palet. Kontrol halaman (item dan
	// tombol) ada di bilah atas. Kolom daftar dan field form bisa diseret di dalam
	// regionnya. Semua perubahan dilaporkan ke pemanggil; kanvas tidak menyimpan state
	// definisi (hanya tab yang sedang dilihat).
	let {
		page,
		metaOf,
		selected,
		selectedItem = null,
		onselect,
		onselectitem,
		oninsert,
		oninsertitem,
		onmove,
		onmoveitem,
		onshift,
		onremove,
		onremoveitem,
		onresize,
		onplace,
		onplacenew,
		onfield
	}: {
		page: PageDefinition;
		metaOf: (resourceId: string) => ResourceMeta | undefined;
		selected: number | null;
		selectedItem?: number | null;
		onselect: (index: number | null) => void;
		onselectitem?: (index: number) => void;
		oninsert: (type: string, spot: Spot) => void;
		oninsertitem?: (type: string, index: number) => void;
		onmove: (from: number, spot: Spot) => void;
		onmoveitem?: (from: number, to: number) => void;
		onshift: (index: number, delta: -1 | 1) => void;
		onremove: (index: number) => void;
		onremoveitem?: (index: number) => void;
		onresize: (index: number, span: number) => void;
		onplace?: (index: number, box: FreeBox) => void;
		onplacenew?: (type: string, col: number, row: number) => void;
		/** Field diseret di dalam region `index`: taruh `name` di depan `before` (null = di akhir). */
		onfield?: (index: number, name: string, before: string | null) => void;
	} = $props();

	let container = $state<HTMLElement | null>(null);
	let itemsBar = $state<HTMLElement | null>(null);
	let itemTarget = $state<DropTarget | null>(null);
	let itemMark = $state<Mark | null>(null);
	let itemDragging = $state(false);
	let activeTabs = $state<Record<string, string>>({});

	/** Kotak semua anak berpenanda `selector` relatif terhadap `host`, jarak antar anak, dan lebar host. */
	function measure(host: HTMLElement | null, selector: string): { boxes: Box[]; gap: number; width: number; left: number; top: number } | null {
		if (!host) return null;
		const g = host.getBoundingClientRect();
		const boxes = [...host.querySelectorAll<HTMLElement>(`:scope > ${selector}`)].map((frame) => {
			const r = frame.getBoundingClientRect();
			return { left: r.left - g.left, right: r.right - g.left, top: r.top - g.top, bottom: r.bottom - g.top };
		});
		return { boxes, gap: parseFloat(getComputedStyle(host).columnGap) || 0, width: g.width, left: g.left, top: g.top };
	}

	// Region ditangani grid masing-masing; di sini hanya seretan kontrol ke bilah kontrol.
	function over(event: DragEvent) {
		const kind = dragKind(event.dataTransfer?.types);
		if (kind !== 'item-new' && kind !== 'item-move') return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = kind === 'item-move' ? 'move' : 'copy';
		itemDragging = true;
		const m = measure(itemsBar, '[data-item-frame]');
		if (!m) return;
		// Lebar tak terbatas: kontrol tidak pernah "selebar penuh", jadi sisip selalu di kiri/kanan kontrol lain.
		itemTarget = dropTarget(m.boxes, Number.POSITIVE_INFINITY, event.clientX - m.left, event.clientY - m.top);
		itemMark = dropMark(m.boxes, itemTarget, m.gap);
	}

	function clear() {
		itemTarget = null;
		itemMark = null;
		itemDragging = false;
	}

	function leave(event: DragEvent) {
		if (!container?.contains(event.relatedTarget as Node | null)) clear();
	}

	function drop(event: DragEvent) {
		const kind = dragKind(event.dataTransfer?.types);
		const at = itemTarget?.index;
		if ((kind !== 'item-new' && kind !== 'item-move') || at === undefined) return;
		event.preventDefault();
		clear();
		if (kind === 'item-new') {
			const type = event.dataTransfer?.getData(MIME_ITEM_NEW);
			if (type) oninsertitem?.(type, at);
		} else {
			const from = Number(event.dataTransfer?.getData(MIME_ITEM_MOVE));
			if (Number.isInteger(from)) onmoveitem?.(from, at);
		}
	}

	function startMoveItem(event: DragEvent, index: number) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData(MIME_ITEM_MOVE, String(index));
		event.dataTransfer.effectAllowed = 'move';
		const frame = (event.currentTarget as HTMLElement).closest('[data-item-frame]');
		if (frame) event.dataTransfer.setDragImage(frame, 12, 12);
	}
</script>

<!-- Area lepas untuk kontrol: tidak ada padanan papan ketik untuk seretan; tombol palet dan inspector menggantikannya. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={container}
	class="bg-muted/30 flex min-h-48 flex-col gap-2 rounded-lg border p-3"
	aria-label={t('kit.builder.canvas')}
	data-testid="design-canvas"
	ondragover={over}
	ondragleave={leave}
	ondrop={drop}
>
	<div class="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
		<button type="button" class="hover:text-foreground font-medium underline-offset-2 hover:underline" onclick={() => onselect(null)}>{page.title}</button>
		<span>{t('kit.design.sample_note')}</span>
	</div>

	<div
		bind:this={itemsBar}
		class="bg-background relative flex min-h-14 flex-wrap items-end gap-3 rounded-md border p-3 {itemDragging ? 'border-primary ring-primary ring-1' : 'border-dashed'}"
		data-testid="design-items"
		aria-label={t('kit.design.items_bar')}
	>
		{#each page.items ?? [] as item, i (item.id)}
			<div
				data-item-frame
				data-item-index={i}
				class="relative flex items-end gap-1 rounded-md border p-1 {selectedItem === i ? 'border-primary ring-primary ring-2' : 'border-transparent'}"
			>
				<span
					draggable="true"
					role="img"
					class="text-muted-foreground relative z-20 cursor-grab self-center"
					title={t('kit.design.drag_item')}
					aria-label={t('kit.design.drag_item')}
					data-testid="item-handle"
					ondragstart={(e) => startMoveItem(e, i)}
					ondragend={clear}
				>
					<GripVerticalIcon class="size-4" />
				</span>
				<div inert class="flex flex-wrap items-end gap-3">
					{#if item.type === 'button'}
						<span class="bg-primary text-primary-foreground flex h-9 items-center rounded-md px-3 text-sm">{item.label}</span>
					{:else}
						<span class="flex flex-col gap-1 text-sm">
							{item.label}
							<span class="border-input text-muted-foreground flex h-9 min-w-32 items-center justify-between gap-2 rounded-md border px-3">
								<span>{item.lov ? `⛁ ${item.lov}` : item.type === 'date' ? 'yyyy-mm-dd' : ''}</span>
								{#if item.type === 'select' || item.type === 'switch'}<span aria-hidden="true">▾</span>{/if}
							</span>
						</span>
					{/if}
				</div>
				<button
					type="button"
					class="absolute inset-0 z-10 rounded-md"
					aria-label={t('kit.design.select_item', { id: item.id })}
					aria-pressed={selectedItem === i}
					onclick={() => onselectitem?.(i)}
				></button>
				{#if onremoveitem}
					<button type="button" class="bg-background hover:bg-muted absolute -end-2 -top-2 z-20 rounded-full border p-0.5" aria-label={t('kit.builder.remove')} onclick={() => onremoveitem(i)}>
						<XIcon class="size-3" />
					</button>
				{/if}
			</div>
		{/each}
		{#if !page.items?.length}
			<span class="text-muted-foreground text-xs" data-testid="items-drop-hint">{t('kit.design.items_drop')}</span>
		{/if}
		{#if itemMark}
			<div class="bg-primary pointer-events-none absolute z-40 rounded-full" role="presentation" data-drop-line style="left: {itemMark.left}px; top: {itemMark.top}px; width: {itemMark.width}px; height: {itemMark.height}px"></div>
		{/if}
	</div>

	<DesignGrid
		{page}
		{metaOf}
		{selected}
		{activeTabs}
		ontab={(id, tab) => (activeTabs = { ...activeTabs, [id]: tab })}
		{onselect}
		{oninsert}
		{onmove}
		{onshift}
		{onremove}
		{onresize}
		{onplace}
		{onplacenew}
		{onfield}
	/>
</div>
