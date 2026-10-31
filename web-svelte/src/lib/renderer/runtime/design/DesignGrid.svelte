<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { Badge } from '$lib/components/ui/badge';
	import { t } from '$lib/i18n/index.svelte';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import { boxOf, childrenOf, type FreeBox, type Spot } from '../builder';
	import { CONTAINER_TYPES, FREE_ROWS, GRID_COLUMNS, type PageDefinition } from '../page-definition';
	import DesignGrid from './DesignGrid.svelte';
	import DesignRegion from './DesignRegion.svelte';
	import { dragKind, dropMark, dropTarget, MIME_MOVE, MIME_NEW, type Box, type DropTarget, type Mark } from './dnd';
	import { spanFromPointer, spanOf, stepSpan } from './layout';

	// Satu grid saudara di kanvas desain: tingkat atas, atau isi sebuah wadah (panel,
	// atau satu tab dari region tab). Wadah menggambar grid isinya dengan komponen ini
	// lagi. Setiap grid adalah area lepas sendiri; area yang paling dalam menang
	// (peristiwa yang sudah ditangani dilewati grid di atasnya).
	let {
		page,
		parent,
		slot,
		metaOf,
		selected,
		activeTabs,
		ontab,
		onselect,
		oninsert,
		onmove,
		onshift,
		onremove,
		onresize,
		onplace,
		onplacenew,
		onfield
	}: {
		page: PageDefinition;
		parent?: string;
		slot?: string;
		metaOf: (resourceId: string) => ResourceMeta | undefined;
		selected: number | null;
		activeTabs: Record<string, string>;
		ontab: (regionId: string, tabId: string) => void;
		onselect: (index: number | null) => void;
		oninsert: (type: string, spot: Spot) => void;
		onmove: (from: number, spot: Spot) => void;
		onshift: (index: number, delta: -1 | 1) => void;
		onremove: (index: number) => void;
		onresize: (index: number, span: number) => void;
		/** Kanvas bebas: kotak baru region tingkat atas `index` (belum dijepit). */
		onplace?: (index: number, box: FreeBox) => void;
		/** Kanvas bebas: komponen palet dijatuhkan di kolom `col`, baris `row`. */
		onplacenew?: (type: string, col: number, row: number) => void;
		onfield?: (index: number, name: string, before: string | null) => void;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let grid = $state<HTMLElement | null>(null);
	let target = $state<DropTarget | null>(null);
	let mark = $state<Mark | null>(null);

	const siblings = $derived(childrenOf(page, parent, slot));
	// Kanvas bebas: hanya region tingkat atas di halaman `free`; dialog tetap mengalir di bawahnya.
	const free = $derived(parent === undefined && page.mode === 'free');
	const shown = $derived(free ? siblings.filter((r) => !r.dialog) : siblings);
	const dialogs = $derived(free ? siblings.filter((r) => r.dialog) : []);
	const ROW_REM = 3;
	const freeRows = $derived(Math.max(14, ...shown.map((r) => (boxOf(r)?.y ?? 0) + (boxOf(r)?.h ?? 0) + 3)));
	const boxStyle = (r: { layout?: { x?: number; y?: number; span?: number; h?: number } }) =>
		`left: ${((r.layout?.x ?? 0) / GRID_COLUMNS) * 100}%; width: ${((r.layout?.span ?? GRID_COLUMNS) / GRID_COLUMNS) * 100}%; top: ${(r.layout?.y ?? 0) * ROW_REM}rem; height: ${(r.layout?.h ?? 4) * ROW_REM}rem`;
	const spotFor = (before?: string): Spot => ({ ...(parent ? { parent } : {}), ...(slot ? { slot } : {}), ...(before ? { before } : {}) });

	function activeTab(region: { id: string; tabs?: { id: string }[] }): string {
		const ids = (region.tabs ?? []).map((tab) => tab.id);
		const wanted = activeTabs[region.id];
		return wanted && ids.includes(wanted) ? wanted : (ids[0] ?? '');
	}

	/** Kotak semua saudara relatif terhadap grid, jarak antar saudara, dan lebar grid. */
	function measure(): { boxes: Box[]; gap: number; width: number } | null {
		if (!grid) return null;
		const g = grid.getBoundingClientRect();
		const boxes = [...grid.querySelectorAll<HTMLElement>(':scope > [data-region-frame]')].map((frame) => {
			const r = frame.getBoundingClientRect();
			return { left: r.left - g.left, right: r.right - g.left, top: r.top - g.top, bottom: r.bottom - g.top };
		});
		return { boxes, gap: parseFloat(getComputedStyle(grid).columnGap) || 0, width: g.width };
	}

	function clear() {
		target = null;
		mark = null;
	}

	function over(event: DragEvent) {
		const kind = dragKind(event.dataTransfer?.types);
		if (kind !== 'new' && kind !== 'move') return; // kontrol (item) ditangani bilah kontrol
		// Sudah ditangani area yang lebih dalam: lepaskan penanda di sini.
		if (event.defaultPrevented) {
			clear();
			return;
		}
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = kind === 'move' ? 'move' : 'copy';
		if (free) return;
		const m = measure();
		if (!m || !grid) return;
		const g = grid.getBoundingClientRect();
		target = dropTarget(m.boxes, m.width, event.clientX - g.left, event.clientY - g.top);
		mark = dropMark(m.boxes, target, m.gap);
	}

	function leave(event: DragEvent) {
		if (!root?.contains(event.relatedTarget as Node | null)) clear();
	}

	function drop(event: DragEvent) {
		const kind = dragKind(event.dataTransfer?.types);
		if ((kind !== 'new' && kind !== 'move') || event.defaultPrevented) {
			clear();
			return;
		}
		if (free && grid) {
			event.preventDefault();
			clear();
			if (kind === 'new') {
				const type = event.dataTransfer?.getData(MIME_NEW);
				const g = grid.getBoundingClientRect();
				const col = Math.floor(((event.clientX - g.left) / g.width) * GRID_COLUMNS);
				const row = Math.floor((event.clientY - g.top) / rowPx());
				if (type) onplacenew?.(type, col, row);
			} else {
				const from = Number(event.dataTransfer?.getData(MIME_MOVE));
				if (Number.isInteger(from)) onmove(from, spotFor());
			}
			return;
		}
		const at = target?.index;
		if (at === undefined) return;
		event.preventDefault();
		clear();
		const spot = spotFor(siblings[at]?.id);
		if (kind === 'new') {
			const type = event.dataTransfer?.getData(MIME_NEW);
			if (type) oninsert(type, spot);
		} else {
			const from = Number(event.dataTransfer?.getData(MIME_MOVE));
			if (Number.isInteger(from)) onmove(from, spot);
		}
	}

	function startMove(event: DragEvent, index: number) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData(MIME_MOVE, String(index));
		event.dataTransfer.effectAllowed = 'move';
		const frame = (event.currentTarget as HTMLElement).closest('[data-region-frame]');
		if (frame) event.dataTransfer.setDragImage(frame, 16, 16);
	}

	const rowPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) * ROW_REM;

	// Kanvas bebas: seret grip untuk memindah, sudut kanan bawah untuk mengubah ukuran (satuan sel kolom x baris).
	let freeDrag: { index: number; mode: 'move' | 'resize'; x: number; y: number; box: FreeBox; col: number; row: number } | null = null;

	function startFree(event: PointerEvent, index: number, mode: 'move' | 'resize') {
		const box = boxOf(page.regions[index]);
		if (!box || !grid) return;
		event.preventDefault();
		onselect(index);
		freeDrag = { index, mode, x: event.clientX, y: event.clientY, box, col: grid.getBoundingClientRect().width / GRID_COLUMNS, row: rowPx() };
		try {
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		} catch {
			// pointer sintetis (uji) tidak punya capture aktif
		}
	}

	function moveFree(event: PointerEvent) {
		if (!freeDrag) return;
		const dc = Math.round((event.clientX - freeDrag.x) / freeDrag.col);
		const dr = Math.round((event.clientY - freeDrag.y) / freeDrag.row);
		const b = freeDrag.box;
		onplace?.(freeDrag.index, freeDrag.mode === 'move' ? { ...b, x: b.x + dc, y: b.y + dr } : { ...b, span: b.span + dc, h: b.h + dr });
	}

	function endFree() {
		freeDrag = null;
	}

	/** Papan ketik: panah memindah satu sel, Shift+panah mengubah ukuran. */
	function freeKey(event: KeyboardEvent, index: number) {
		const b = boxOf(page.regions[index]);
		const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
		if (!b || !step) return;
		event.preventDefault();
		onplace?.(index, event.shiftKey ? { ...b, span: b.span + step[0], h: b.h + step[1] } : { ...b, x: b.x + step[0], y: b.y + step[1] });
	}

	// Ubah lebar dengan menyeret tepi kanan; lebar mengikuti kolom grid ini.
	let resizing: { index: number; frameLeft: number; pitch: number; gap: number; startColumn: number } | null = null;
	let lastSpan = 0;

	function startResize(event: PointerEvent, index: number) {
		if (!grid) return;
		const frame = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-region-frame]');
		if (!frame) return;
		event.preventDefault();
		const g = grid.getBoundingClientRect();
		const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
		const pitch = (g.width + gap) / GRID_COLUMNS;
		const f = frame.getBoundingClientRect();
		resizing = { index, frameLeft: f.left, pitch, gap, startColumn: Math.max(0, Math.round((f.left - g.left) / pitch)) };
		lastSpan = spanOf(page.regions[index]);
		try {
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		} catch {
			// pointer sintetis (uji) tidak punya capture aktif; seretan tetap berjalan lewat event pada elemen yang sama
		}
	}

	function moveResize(event: PointerEvent) {
		if (!resizing) return;
		const span = spanFromPointer({ x: event.clientX, frameLeft: resizing.frameLeft, pitch: resizing.pitch, gap: resizing.gap, startColumn: resizing.startColumn });
		if (span !== lastSpan) {
			lastSpan = span;
			onresize(resizing.index, span);
		}
	}

	function endResize() {
		resizing = null;
	}

	function resizeKey(event: KeyboardEvent, index: number, span: number) {
		const next = event.key === 'ArrowRight' ? span + 1 : event.key === 'ArrowLeft' ? span - 1 : event.key === 'Home' ? 1 : event.key === 'End' ? GRID_COLUMNS : null;
		if (next === null) return;
		event.preventDefault();
		onresize(index, Math.max(1, Math.min(GRID_COLUMNS, next)));
	}
</script>

{#snippet frame(region: PageDefinition["regions"][number], position: number, placed: boolean)}
				{@const index = page.regions.indexOf(region)}
				{@const span = region.dialog ? GRID_COLUMNS : spanOf(region)}
				{@const container = CONTAINER_TYPES.includes(region.type)}
				<div
					data-region-frame
					data-region-index={index}
					data-span={placed ? undefined : ''}
					style={placed ? boxStyle(region) : `--span: ${span}`}
					data-new-row={!placed && !region.dialog && region.layout?.newRow ? '' : undefined}
					class="bg-background min-w-0 rounded-md border {placed ? 'absolute flex flex-col overflow-hidden' : 'relative'} {selected === index ? 'border-primary ring-primary ring-2' : ''}"
				>
					<div class="bg-muted/60 relative z-20 flex flex-wrap items-center gap-x-1 gap-y-0.5 rounded-t-md border-b px-2 py-1 text-xs">
						{#if placed}
							<span
								role="button"
								tabindex="0"
								class="text-muted-foreground cursor-move touch-none"
								title={t('kit.design.free_move')}
								aria-label={t('kit.design.free_move')}
								data-testid="free-move"
								onpointerdown={(e) => startFree(e, index, 'move')}
								onpointermove={moveFree}
								onpointerup={endFree}
								onpointercancel={endFree}
								onkeydown={(e) => freeKey(e, index)}
							>
								<GripVerticalIcon class="size-4" />
							</span>
						{:else}
							<span
								draggable="true"
								role="img"
								class="text-muted-foreground cursor-grab"
								title={t('kit.design.drag_handle')}
								aria-label={t('kit.design.drag_handle')}
								data-testid="drag-handle"
								ondragstart={(e) => startMove(e, index)}
								ondragend={clear}
							>
								<GripVerticalIcon class="size-4" />
							</span>
						{/if}
						{#if container}
							<button type="button" class="min-w-0 flex-1 truncate text-start font-medium" aria-pressed={selected === index} onclick={() => onselect(index)}>{region.id}</button>
						{:else}
							<span class="min-w-0 flex-1 truncate font-medium">{region.id}</span>
						{/if}
						<Badge variant="outline">{region.type}</Badge>
						{#if placed}
							<span class="text-muted-foreground tabular-nums" data-testid="free-box">{region.layout?.x},{region.layout?.y} · {region.layout?.span}×{region.layout?.h}</span>
						{:else if !region.dialog}
							<button type="button" class="hover:bg-muted rounded p-1 disabled:opacity-40" aria-label={t('kit.design.narrower')} disabled={span <= 1} onclick={() => onresize(index, stepSpan(span, -1))}>
								<MinusIcon class="size-3.5" />
							</button>
							<span class="text-muted-foreground tabular-nums" data-testid="span-badge">{t('kit.design.columns', { n: String(span) })}</span>
							<button type="button" class="hover:bg-muted rounded p-1 disabled:opacity-40" aria-label={t('kit.design.wider')} disabled={span >= GRID_COLUMNS} onclick={() => onresize(index, stepSpan(span, 1))}>
								<PlusIcon class="size-3.5" />
							</button>
						{/if}
						{#if !placed}
							<button type="button" class="hover:bg-muted rounded p-1 disabled:opacity-40" aria-label={t('kit.builder.move_up')} disabled={position === 0} onclick={() => onshift(index, -1)}>
								<ArrowUpIcon class="size-3.5" />
							</button>
							<button type="button" class="hover:bg-muted rounded p-1 disabled:opacity-40" aria-label={t('kit.builder.move_down')} disabled={position === siblings.length - 1} onclick={() => onshift(index, 1)}>
								<ArrowDownIcon class="size-3.5" />
							</button>
						{/if}
						<button type="button" class="hover:bg-muted rounded p-1" aria-label={t('kit.builder.remove')} onclick={() => onremove(index)}>
							<XIcon class="size-3.5" />
						</button>
					</div>

					{#if region.type === 'tabs'}
						{@const active = activeTab(region)}
						<div class="flex flex-col gap-2 p-3 {placed ? 'min-h-0 flex-1 overflow-auto' : ''}" data-testid="design-tabs">
							<div role="tablist" class="border-border flex flex-wrap gap-3 border-b text-xs">
								{#each region.tabs ?? [] as tab (tab.id)}
									<button
										type="button"
										role="tab"
										aria-selected={active === tab.id}
										aria-label={t('kit.design.tab_select', { label: tab.label })}
										class="-mb-px border-b-2 px-1 py-1.5 {active === tab.id ? 'border-primary font-medium' : 'text-muted-foreground border-transparent'}"
										onclick={() => ontab(region.id, tab.id)}>{tab.label}</button
									>
								{/each}
							</div>
							<DesignGrid {page} parent={region.id} slot={active} {metaOf} {selected} {activeTabs} {ontab} {onselect} {oninsert} {onmove} {onshift} {onremove} {onresize} {onplace} {onplacenew} {onfield} />
						</div>
					{:else if region.type === 'panel'}
						<div class="flex flex-col gap-2 p-3 {placed ? 'min-h-0 flex-1 overflow-auto' : ''}" data-testid="design-panel">
							{#if region.title}<span class="text-sm font-semibold">{region.title}{region.collapsible ? ' ▾' : ''}</span>{/if}
							<DesignGrid {page} parent={region.id} {metaOf} {selected} {activeTabs} {ontab} {onselect} {oninsert} {onmove} {onshift} {onremove} {onresize} {onplace} {onplacenew} {onfield} />
						</div>
					{:else}
						<div class="p-3 {placed ? 'min-h-0 flex-1 overflow-auto' : ''}" class:border-dashed={region.dialog}>
							<DesignRegion {region} {index} meta={metaOf(region.resourceId)} onfield={(name, before) => onfield?.(index, name, before)} onpick={() => onselect(index)} />
						</div>
						<button
							type="button"
							class="absolute inset-0 z-10 rounded-md"
							aria-label={t('kit.design.select_region', { id: region.id })}
							aria-pressed={selected === index}
							onclick={() => onselect(index)}
						></button>
					{/if}

					{#if placed}
						<div
							role="presentation"
							data-testid="free-resize"
							class="bg-border hover:bg-primary absolute -bottom-0.5 -right-0.5 z-30 size-4 cursor-nwse-resize touch-none rounded-tl-md"
							onpointerdown={(e) => startFree(e, index, 'resize')}
							onpointermove={moveFree}
							onpointerup={endFree}
							onpointercancel={endFree}
						></div>
					{:else if !region.dialog}
						<div
							role="slider"
							tabindex="0"
							aria-orientation="horizontal"
							aria-valuetext={t('kit.design.columns', { n: String(span) })}
							aria-valuemin={1}
							aria-valuemax={GRID_COLUMNS}
							aria-valuenow={span}
							aria-label={t('kit.design.resize', { id: region.id })}
							data-testid="resize-handle"
							class="group absolute inset-y-2 -right-2.5 z-30 flex w-3 cursor-col-resize touch-none items-center justify-center"
							onpointerdown={(e) => startResize(e, index)}
							onpointermove={moveResize}
							onpointerup={endResize}
							onpointercancel={endResize}
							onkeydown={(e) => resizeKey(e, index, span)}
						>
							<span class="bg-border group-hover:bg-primary group-focus-visible:bg-primary h-10 w-1 rounded-full"></span>
						</div>
					{/if}
				</div>
			{/snippet}

<!-- Area lepas: tidak ada padanan papan ketik untuk seretan; ↑/↓, lebar, dan pemilih "Di dalam" di inspector serta tombol palet menggantikannya. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={root} class="flex min-h-12 flex-1 flex-col" data-testid="design-zone" data-parent={parent} data-slot={slot} ondragover={over} ondragleave={leave} ondrop={drop}>
	<div class="page-grid-design-host">
		<div
			bind:this={grid}
			class="relative {free ? 'bg-muted/20 border-border rounded-md border border-dashed' : 'page-grid-design'}"
			style={free ? `height: ${freeRows * ROW_REM}rem; background-image: linear-gradient(to right, var(--border) 1px, transparent 1px); background-size: calc(100% / ${GRID_COLUMNS}) 100%` : undefined}
			data-testid={parent ? 'design-subgrid' : free ? 'design-free' : 'design-grid'}
		>
			{#each shown as region, position (region.id)}
				{@render frame(region, position, free)}
			{/each}
			{#if mark}
				<div
					class="bg-primary pointer-events-none absolute z-40 rounded-full"
					role="presentation"
					data-drop-line
					style="left: {mark.left}px; top: {mark.top}px; width: {mark.width}px; height: {mark.height}px"
				></div>
			{/if}
		</div>
	</div>
	{#if dialogs.length > 0}
		<div class="mt-3 flex flex-col gap-2" data-testid="design-dialogs">
			{#each dialogs as region, position (region.id)}
				{@render frame(region, position, false)}
			{/each}
		</div>
	{/if}
	{#if siblings.length === 0}
		<div class="text-muted-foreground flex min-h-12 flex-1 items-center justify-center rounded-md border border-dashed text-xs" data-testid="zone-empty">
			{parent ? t('kit.design.container_drop') : t('kit.design.drop_here')}
		</div>
	{/if}
</div>
