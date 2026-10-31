<script lang="ts">
	import { demoMeta, demoRows, demoSettings } from '$lib/kit/demos/fixtures/customers';
	import Grid from '$lib/kit/organisms/ig/Grid.svelte';
	import InteractiveGrid from '$lib/apex/InteractiveGrid.svelte';
	import {
		addRow,
		applyBatchErrors,
		deleteRow,
		duplicateRow,
		fromRows,
		hasChanges,
		revertRow,
		setCell,
		toOps,
		type GridState
	} from '$lib/kit/organisms/ig/model';

	let demoMode = $state<'apex_ig' | 'organism'>('apex_ig');
	let grid = $state<GridState>(fromRows(demoRows.slice(0, 6)));
	let selection = $state<string[]>([]);
	let activeKey = $state('row-1');
	let activeColumn = $state('code');
	let editable = $state(true);
	let lastAction = $state('');

	function oncellchange(rowKey: string, column: string, value: unknown) {
		grid = setCell(grid, rowKey, column, value);
	}

	// Row Actions and Selection act on the same model the region will use (K5-07).
	function onrowaction(name: string, rowKey: string) {
		lastAction = `${name} ${rowKey}`;
		if (name === 'row_add') grid = addRow(grid, rowKey);
		else if (name === 'row_duplicate') grid = duplicateRow(grid, rowKey);
		else if (name === 'row_delete') grid = deleteRow(grid, rowKey);
		else if (name === 'row_revert') grid = revertRow(grid, rowKey);
	}

	function onselection(name: string) {
		lastAction = `${name} (${selection.length})`;
		if (name === 'selection_delete') grid = selection.reduce(deleteRow, grid);
		else if (name === 'selection_duplicate') grid = selection.reduce(duplicateRow, grid);
		else if (name === 'selection_revert') grid = selection.reduce(revertRow, grid);
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Mode Switcher -->
	<div class="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => (demoMode = 'apex_ig')}
				class="px-3 py-1.5 rounded-lg font-bold transition cursor-pointer {demoMode === 'apex_ig' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}"
			>
				Oracle APEX Interactive Grid (1:1 Enterprise IG)
			</button>
			<button
				type="button"
				onclick={() => (demoMode = 'organism')}
				class="px-3 py-1.5 rounded-lg font-bold transition cursor-pointer {demoMode === 'organism' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}"
			>
				Raw Organism Grid
			</button>
		</div>

		<span class="text-[11px] text-slate-400 font-mono hidden sm:inline">
			{demoMode === 'apex_ig' ? 'Paritas Penuh: 4 Views • 12 Operators • Batch DML' : 'Low-level Grid Primitive'}
		</span>
	</div>

	{#if demoMode === 'apex_ig'}
		<div class="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 shadow-xl">
			<InteractiveGrid title="Oracle APEX Interactive Grid (Enterprise Engine)" />
		</div>
	{:else}
		<p class="text-muted-foreground text-sm">
			Interactive Grid: toolbar (§1.1), row header with row actions (§1.2), cells via displayText, IR highlight,
			density padding. Edit mode: Enter/F2 edits, Escape cancels, Enter/Tab save and move, Space toggles a switch
			cell. {selection.length} row(s) selected, {toOps(grid, demoMeta).length} pending operation(s).
			{#if lastAction}· last action: {lastAction}{/if}
		</p>
		<Grid
			meta={demoMeta}
			{grid}
			highlights={demoSettings.highlights}
			bind:selection
			bind:editable
			{activeKey}
			{activeColumn}
			canEdit
			canCreate
			canSave={hasChanges(grid)}
			pageSize={25}
			onsearch={(text) => (lastAction = `search ${text}`)}
			onaction={(name) => (lastAction = name)}
			{onselection}
			oncellactivate={(rowKey, column) => {
				activeKey = rowKey;
				activeColumn = column;
			}}
			{oncellchange}
			{onrowaction}
			onsave={() => {
				// The region sends these through `_batch` (K5-07).
				grid = applyBatchErrors(grid, [], demoMeta);
				lastAction = `save ${toOps(grid, demoMeta).length}`;
			}}
			onaddrow={() => (grid = addRow(grid))}
			onreset={() => (grid = fromRows(demoRows.slice(0, 6)))}
		/>
	{/if}
</div>
