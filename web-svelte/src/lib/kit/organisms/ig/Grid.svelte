<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { displayText, type DisplayType } from '$lib/kit/molecules/display';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import { rowHighlight, type HighlightColor } from '$lib/kit/organisms/ir/highlight';
	import type { ReportHighlight } from '$lib/kit/organisms/ir/types';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import CellEditor from './CellEditor.svelte';
	import GridToolbar from './GridToolbar.svelte';
	import RowActionsMenu from './RowActionsMenu.svelte';
	import ColumnHeaderMenu from '$lib/kit/organisms/ir/ColumnHeaderMenu.svelte';
	import { navKey, nextCell } from './keyboard';
	import { rowStatus, type GridRow, type GridState } from './model';

	// Column widths and the frozen column come from the settings (K5 §1.5).
	const MIN_WIDTH = 60;
	const MAX_WIDTH = 800;
	const DEFAULT_WIDTH = 140;
	// The three leading cells (select, status, row actions) stay fixed together
	// with the frozen columns.
	const LEADING_WIDTH = 104;

	let {
		meta,
		grid,
		columns = meta.fields.filter((field) => field.in_table).map((field) => field.name),
		highlights = [],
		selection = $bindable<string[]>([]),
		editable = $bindable(false),
		activeKey = '',
		activeColumn = '',
		toolbar = true,
		search = $bindable(''),
		onsearch,
		pageSize = 25,
		canEdit = false,
		canCreate = false,
		canDrawerEdit = false,
		canExport = false,
		canSave = false,
		widths = $bindable<Record<string, number>>({}),
		frozen = $bindable<string | null>(null),
		onsave,
		onaddrow,
		onreset,
		onaction,
		onselection,
		bulkActions = [],
		onbulkaction,
		onrowaction,
		oncellactivate,
		oncellchange,
		onpaste,
		onrowselection,
		onsort,
		onwidthchange,
		onfreeze,
		labels,
		fileHref,
		fileNames
	}: {
		meta: { fields: FieldMeta[] };
		grid: GridState;
		columns?: string[];
		highlights?: ReportHighlight[];
		selection?: string[];
		editable?: boolean;
		activeKey?: string;
		activeColumn?: string;
		toolbar?: boolean;
		search?: string;
		onsearch?: (text: string, column: string | null) => void;
		pageSize?: number;
		canEdit?: boolean;
		canCreate?: boolean;
		canDrawerEdit?: boolean;
		canExport?: boolean;
		canSave?: boolean;
		widths?: Record<string, number>;
		frozen?: string | null;
		onsave?: () => void;
		onaddrow?: () => void;
		onreset?: () => void;
		onaction?: (name: string, value?: number) => void;
		onselection?: (name: string) => void;
		bulkActions?: { name: string; label: string; danger?: boolean }[];
		onbulkaction?: (name: string) => void;
		onrowaction?: (name: string, rowKey: string) => void;
		oncellactivate?: (rowKey: string, column: string) => void;
		oncellchange?: (rowKey: string, column: string, value: unknown) => void;
		/** A clipboard paste on the active cell (F8-01); the region applies it. */
		onpaste?: (text: string, rowKey: string, column: string) => void;
		onrowselection?: (keys: string[]) => void;
		onsort?: (column: string, dir: 'asc' | 'desc') => void;
		onwidthchange?: (column: string, width: number) => void;
		onfreeze?: (column: string) => void;
		labels?: Record<string, Record<string, string>>;
		/** Download URL of a file/image cell (F6-03). */
		fileHref?: (row: GridRow, column: string) => string | undefined;
		/** Names of the file cells on this page, keyed by column then value (F6-03). */
		fileNames?: Record<string, Record<string, string>>;
	} = $props();

	// The editor belongs to one cell; moving the active cell closes it (K5 1.3).
	// One cell is always active: without a choice it is the first one, so the
	// grid can be entered with Tab alone.
	let editing = $state<{ key: string; column: string } | null>(null);
	const focusKey = $derived(activeKey || (grid.rows[0]?.key ?? ''));
	const focusColumn = $derived(activeColumn || (columns[0] ?? ''));
	const editingActive = $derived(editing !== null && editing.key === focusKey && editing.column === focusColumn);
	const activeRow = $derived(grid.rows.find((row) => row.key === focusKey));
	const activeField = $derived(activeRow ? fieldOf(focusColumn) : undefined);
	let headerColumn = $state<string | null>(null);
	let headerAnchor = $state<HTMLElement | null>(null);

	const frozenList = $derived.by(() => {
		if (!frozen) return [];
		const index = columns.indexOf(frozen);
		return index < 0 ? [] : columns.slice(0, index + 1);
	});

	function widthOf(column: string): number {
		return widths[column] ?? DEFAULT_WIDTH;
	}

	function widthStyle(column: string): string {
		return widths[column] ? `width: ${widths[column]}px;` : '';
	}

	function setWidth(column: string, next: number) {
		const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(next)));
		if (widths[column] === clamped) return;
		widths = { ...widths, [column]: clamped };
		onwidthchange?.(column, clamped);
	}

	function startResize(event: PointerEvent, column: string) {
		const handle = event.currentTarget as HTMLElement;
		const startX = event.clientX;
		const startWidth = widths[column] ?? handle.parentElement?.getBoundingClientRect().width ?? DEFAULT_WIDTH;
		const move = (moveEvent: PointerEvent) => setWidth(column, startWidth + (moveEvent.clientX - startX));
		const stop = () => {
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', stop);
		};
		handle.setPointerCapture(event.pointerId);
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', stop);
		event.preventDefault();
	}

	// Resizing must work without a mouse: focus the handle and use the arrows
	// (10 px per press, K5 §1.5).
	function resizeKey(event: KeyboardEvent, column: string) {
		const step = event.key === 'ArrowLeft' ? -10 : event.key === 'ArrowRight' ? 10 : 0;
		if (step === 0) return;
		event.preventDefault();
		event.stopPropagation();
		setWidth(column, widthOf(column) + step);
	}

	function stickyStyle(column: string): string {
		const index = frozenList.indexOf(column);
		if (index < 0) return '';
		let left = LEADING_WIDTH;
		for (let i = 0; i < index; i++) left += widthOf(frozenList[i]);
		return `position: sticky; left: ${left}px; z-index: 1;`;
	}

	const leadingStyle = $derived(frozenList.length > 0 ? 'position: sticky; z-index: 2;' : '');

	// Palette classes are spelled out so Tailwind emits them (T0-02).
	const BG_SUBTLE: Record<number, string> = {
		1: 'bg-palette-1-subtle', 2: 'bg-palette-2-subtle', 3: 'bg-palette-3-subtle', 4: 'bg-palette-4-subtle',
		5: 'bg-palette-5-subtle', 6: 'bg-palette-6-subtle', 7: 'bg-palette-7-subtle', 8: 'bg-palette-8-subtle',
		9: 'bg-palette-9-subtle', 10: 'bg-palette-10-subtle', 11: 'bg-palette-11-subtle', 12: 'bg-palette-12-subtle'
	};
	const TEXT_STRONG: Record<number, string> = {
		1: 'text-palette-1', 2: 'text-palette-2', 3: 'text-palette-3', 4: 'text-palette-4',
		5: 'text-palette-5', 6: 'text-palette-6', 7: 'text-palette-7', 8: 'text-palette-8',
		9: 'text-palette-9', 10: 'text-palette-10', 11: 'text-palette-11', 12: 'text-palette-12'
	};

	function colorClass(color: HighlightColor | undefined): string {
		if (!color) return '';
		return cn(color.bg ? BG_SUBTLE[color.bg] : '', color.fg ? TEXT_STRONG[color.fg] : '');
	}

	const today = new Date();
	const selectable = $derived(grid.rows.length > 0);
	const allSelected = $derived(grid.rows.length > 0 && grid.rows.every((row) => selection.includes(row.key)));

	function fieldOf(column: string): FieldMeta | undefined {
		return meta.fields.find((field) => field.name === column);
	}

	// A ReadOnly field shows in the grid but cannot be edited (F8-02).
	function readOnlyColumn(column: string): boolean {
		return fieldOf(column)?.read_only === true;
	}

	function cellText(row: Record<string, unknown>, column: string): string {
		const field = fieldOf(column);
		if (field?.type === 'belongs_to') {
			const raw = row[column];
			if (raw === null || raw === undefined || raw === '') return '';
			return labels?.[column]?.[String(raw)] ?? '—';
		}
		return displayText(field?.type as DisplayType, row[column], field?.options);
	}

	function toggleAll(checked: boolean) {
		selection = checked ? grid.rows.map((row) => row.key) : [];
		onrowselection?.(selection);
	}

	function toggleRow(key: string, checked: boolean) {
		selection = checked ? [...selection, key] : selection.filter((entry) => entry !== key);
		onrowselection?.(selection);
	}

	function statusIcon(status: string): string {
		if (status === 'new') return '+';
		if (status === 'changed') return '✎';
		if (status === 'deleted') return '−';
		return '';
	}

	function statusLabel(status: string): string {
		if (status === 'new') return t('kit.ig.row_new');
		if (status === 'changed') return t('kit.ig.row_changed');
		if (status === 'deleted') return t('kit.ig.row_deleted');
		return '';
	}

	function cellButton(rowKey: string, column: string): HTMLElement | null {
		return document.querySelector<HTMLElement>(`[data-cell="${rowKey}:${column}"] :is(button, a)`);
	}

	function moveFrom(row: number, column: number, key: string) {
		const next = nextCell({ row, column }, key, { rows: grid.rows.length, columns: columns.length });
		if (!next) return false;
		const target = grid.rows[next.row];
		const targetColumn = columns[next.column];
		if (!target || !targetColumn) return false;
		oncellactivate?.(target.key, targetColumn);
		cellButton(target.key, targetColumn)?.focus();
		return true;
	}

	// Roving tabindex: exactly one cell is tabbable, arrows move it (K5 1.3).
	function onkeydown(event: KeyboardEvent) {
		if (editingActive) return; // the editor owns the keyboard while it is open
		const row = grid.rows.findIndex((entry) => entry.key === focusKey);
		const column = columns.indexOf(focusColumn);
		if (row < 0 || column < 0) return;
		// A toggle changes right away, without entering edit mode (K5-05).
		if (editable && activeField?.type === 'toggle' && !activeField.read_only && (event.key === ' ' || event.key === 'Enter')) {
			event.preventDefault();
			oncellchange?.(focusKey, focusColumn, !activeRow?.values[focusColumn]);
			return;
		}
		if (editable && !activeField?.read_only && (event.key === 'Enter' || event.key === 'F2')) {
			event.preventDefault();
			editing = { key: focusKey, column: focusColumn };
			return;
		}
		if (moveFrom(row, column, navKey(event.key, event.shiftKey))) event.preventDefault();
	}

	// Ctrl+V with an active cell (not editing) hands the clipboard to the region,
	// which parses and applies it (F8-01).
	function handlePaste(event: ClipboardEvent) {
		if (!editable || editingActive) return; // the editor handles its own paste
		const text = event.clipboardData?.getData('text/plain') ?? '';
		if (!text || !focusKey || !focusColumn) return;
		event.preventDefault();
		onpaste?.(text, focusKey, focusColumn);
	}

	function commitEditor(move: 'down' | 'left' | 'right') {
		const row = grid.rows.findIndex((entry) => entry.key === focusKey);
		const column = columns.indexOf(focusColumn);
		editing = null;
		const key = move === 'down' ? 'ArrowDown' : move === 'left' ? 'ShiftTab' : 'Tab';
		if (!moveFrom(row, column, key)) cellButton(focusKey, focusColumn)?.focus();
	}

	function cancelEditor() {
		editing = null;
		cellButton(focusKey, focusColumn)?.focus();
	}
</script>

<div class="flex flex-col gap-2">
	{#if toolbar}
		<GridToolbar
			columns={meta.fields.map((field) => ({ value: field.name, label: field.label }))}
			bind:search
			onsearch={(text, column) => onsearch?.(text, column)}
			{pageSize}
			bind:editable
			{canEdit}
			{canCreate}
			{canExport}
			{canSave}
			selectionCount={selection.length}
			onaction={(name, value) => {
				if (name.startsWith('selection_')) onselection?.(name);
				else onaction?.(name, value);
			}}
			{onselection}
			{bulkActions}
			{onbulkaction}
			{onsave}
			{onaddrow}
			{onreset}
		/>
	{/if}
	<div class="overflow-x-auto">
		<Table
			role="grid"
			aria-multiselectable={selectable ? 'true' : undefined}
			onkeydown={onkeydown}
			onpaste={handlePaste}
		>
			<TableHeader>
				<TableRow>
					<TableHead class="px-(--cell-px) py-(--cell-py) bg-card w-10" style={leadingStyle}>
						<Checkbox
							checked={allSelected}
							aria-label={t('kit.ig.select_all')}
							onCheckedChange={(next) => toggleAll(next === true)}
						/>
					</TableHead>
					<TableHead class="px-(--cell-px) py-(--cell-py) bg-card w-6" style={leadingStyle}>
						<span class="sr-only">{t('kit.ig.row_status')}</span>
					</TableHead>
					{#if onrowaction}
						<TableHead class="px-(--cell-px) py-(--cell-py) bg-card w-10" style={leadingStyle}>
							<span class="sr-only">{t('kit.ig.row_actions')}</span>
						</TableHead>
					{/if}
					{#each columns as column (column)}
						{@const frozenColumn = frozenList.includes(column)}
						<TableHead
							class={cn(
								'relative px-(--cell-px) py-(--cell-py) font-medium',
								frozenColumn && 'bg-card',
								fieldOf(column)?.type === 'number' && 'text-right'
							)}
							style="{widthStyle(column)}{stickyStyle(column)}"
						>
							<button
								type="button"
								class="flex w-full items-center gap-1 hover:text-foreground"
								onclick={(event) => {
									headerColumn = column;
									headerAnchor = event.currentTarget;
								}}
							>
								{fieldOf(column)?.label ?? column}
								{#if frozenColumn}
									<span aria-hidden="true">📌</span>
								{/if}
							</button>
							<button
								type="button"
								aria-label={t('kit.ig.resize_column')}
								class="hover:bg-border absolute inset-y-0 right-0 w-1 cursor-col-resize"
								onpointerdown={(event) => startResize(event, column)}
								onkeydown={(event) => resizeKey(event, column)}
							></button>
						</TableHead>
					{/each}
				</TableRow>
			</TableHeader>
		<TableBody>
			{#each grid.rows as row, rowIndex (row.key)}
				{@const status = rowStatus(row)}
				{@const highlight = rowHighlight(row.values, highlights, today)}
				<TableRow
					class={cn(
						'hover:bg-muted/50',
						colorClass(highlight.row),
						status === 'deleted' && 'text-muted-foreground line-through'
					)}
					aria-rowindex={rowIndex + 2}
				>
					<TableCell class="px-(--cell-px) py-(--cell-py) bg-card" style={leadingStyle}>
						<Checkbox
							checked={selection.includes(row.key)}
							aria-label={t('kit.ig.select_row')}
							onCheckedChange={(next) => toggleRow(row.key, next === true)}
						/>
					</TableCell>
					<TableCell class="px-(--cell-px) py-(--cell-py) bg-card" style={leadingStyle}>
						<span aria-hidden="true">{statusIcon(status)}</span>
						<span class="sr-only">{statusLabel(status)}</span>
					</TableCell>
					{#if onrowaction}
						<TableCell class="px-(--cell-px) py-(--cell-py) bg-card" style={leadingStyle}>
							<RowActionsMenu
								{canCreate}
								canEdit={canDrawerEdit}
								onaction={(name) => onrowaction(name, row.key)}
							/>
						</TableCell>
					{/if}
					{#each columns as column (column)}
						{@const field = fieldOf(column)}
						{@const active = focusKey === row.key && focusColumn === column}
						{@const frozenCell = frozenList.includes(column)}
						<TableCell
							role="gridcell"
							aria-readonly={field?.read_only ? 'true' : undefined}
							class={cn(
								'px-(--cell-px) py-(--cell-py)',
								frozenCell && 'bg-card',
								field?.type === 'number' && 'text-right',
								field?.read_only && 'text-muted-foreground',
								colorClass(highlight.cells[column]),
								row.errors[column] && 'border-destructive border'
							)}
							style={stickyStyle(column)}
							data-cell={`${row.key}:${column}`}
							title={row.errors[column]}
						>
							{#if active && editingActive && field && !field.read_only}
								<CellEditor
									{field}
									id={`ig-${row.key}-${column}`}
									value={row.values[column]}
									oninput={(next) => oncellchange?.(row.key, column, next)}
									oncommit={commitEditor}
									oncancel={cancelEditor}
								/>
							{:else if fileHref && field && (field.type === 'file' || field.type === 'image') && row.values[column]}
								{#if field.type === 'image'}
									<a href={fileHref(row, column)} aria-label={field.label}>
										<img src={fileHref(row, column)} alt="" class="h-8 w-8 rounded object-cover" />
									</a>
								{:else}
									<a class="text-primary underline-offset-4 hover:underline" href={fileHref(row, column)}>
										{fileNames?.[column]?.[String(row.values[column])] ?? String(row.values[column])}
									</a>
								{/if}
							{:else}
								<button
									type="button"
									tabindex={active ? 0 : -1}
									class={cn('w-full text-left', active && editable && 'outline-primary rounded-sm outline-2')}
									onclick={() => oncellactivate?.(row.key, column)}
								>
									{cellText(row.values, column)}
								</button>
							{/if}
						</TableCell>
					{/each}
				</TableRow>
			{/each}
		</TableBody>
		</Table>
	</div>

	{#if headerColumn}
		{@const column = fieldOf(headerColumn)}
		{#if column}
			<ColumnHeaderMenu
				{column}
				anchor={headerAnchor}
				onclose={() => (headerColumn = null)}
				onsort={(dir) => {
					onsort?.(headerColumn!, dir);
					headerColumn = null;
				}}
				onfreeze={() => {
					onfreeze?.(headerColumn!);
					frozen = frozen === headerColumn ? null : headerColumn;
					headerColumn = null;
				}}
				frozen={frozen === headerColumn}
			/>
		{/if}
	{/if}
</div>
