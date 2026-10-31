<script lang="ts">
	import type { IgAggregate, IgColumnMeta, IgGroup, IgHighlight, IgRecord } from './types';
	import {
		ChevronDown,
		ChevronRight,
		MoreHorizontal,
		ArrowUp,
		ArrowDown,
		Filter,
		Lock,
		EyeOff,
		Copy,
		Trash2,
		RotateCcw,
		ExternalLink,
		Check,
		AlertCircle
	} from 'lucide-svelte';

	let {
		records = $bindable<IgRecord[]>([]),
		columns = $bindable<IgColumnMeta[]>([]),
		selectedIds = $bindable<number[]>([]),
		group = null,
		highlights = [],
		aggregates = [],
		editable = false,
		activeCell = $bindable<{ rowId: number; col: string } | null>(null),
		onCellChange,
		onRowAction,
		onOpenSingleRow,
		onColumnFilter
	}: {
		records: IgRecord[];
		columns: IgColumnMeta[];
		selectedIds: number[];
		group: IgGroup | null;
		highlights: IgHighlight[];
		aggregates: IgAggregate[];
		editable: boolean;
		activeCell: { rowId: number; col: string } | null;
		onCellChange: (rowId: number, col: string, val: any) => void;
		onRowAction: (action: 'duplicate' | 'delete' | 'revert', rowId: number) => void;
		onOpenSingleRow: (rowId: number) => void;
		onColumnFilter: (column: string) => void;
	} = $props();

	let headerMenuCol = $state<string | null>(null);
	let rowMenuId = $state<number | null>(null);
	let collapsedGroups = $state<Record<string, boolean>>({});

	// Active editing cell
	let editingCell = $state<{ rowId: number; col: string } | null>(null);

	const visibleColumns = $derived(columns.filter((c) => c.visible));

	function toggleSelectAll(checked: boolean) {
		if (checked) {
			selectedIds = records.map((r) => r.id);
		} else {
			selectedIds = [];
		}
	}

	function toggleSelectRow(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function isRowSelected(id: number) {
		return selectedIds.includes(id);
	}

	function closeMenus() {
		headerMenuCol = null;
		rowMenuId = null;
	}

	function toggleGroupCollapse(groupVal: string) {
		collapsedGroups[groupVal] = !collapsedGroups[groupVal];
	}

	// Grouping data computation
	const groupedRecords = $derived.by(() => {
		if (!group || !group.enabled || !group.column) {
			return [{ groupKey: '', records }];
		}
		const map = new Map<string, IgRecord[]>();
		for (const r of records) {
			const k = String(r[group.column] ?? 'Tidak Berkategori');
			if (!map.has(k)) map.set(k, []);
			map.get(k)!.push(r);
		}
		return Array.from(map.entries()).map(([groupKey, recs]) => ({
			groupKey,
			records: recs
		}));
	});

	// Aggregation calculation
	function computeAggregate(col: string, func: string): string {
		const validRecs = records.filter((r) => r._status !== 'deleted');
		if (func === 'count') return validRecs.length.toLocaleString('id-ID');
		const values = validRecs
			.map((r) => Number(r[col]))
			.filter((v) => !isNaN(v));
		if (values.length === 0) return '-';

		if (func === 'sum') {
			const total = values.reduce((a, b) => a + b, 0);
			return col === 'value' ? `Rp ${total.toLocaleString('id-ID')}` : total.toLocaleString('id-ID');
		}
		if (func === 'avg') {
			const avg = values.reduce((a, b) => a + b, 0) / values.length;
			return col === 'value' ? `Rp ${Math.round(avg).toLocaleString('id-ID')}` : avg.toFixed(2);
		}
		if (func === 'min') {
			const min = Math.min(...values);
			return col === 'value' ? `Rp ${min.toLocaleString('id-ID')}` : min.toLocaleString('id-ID');
		}
		if (func === 'max') {
			const max = Math.max(...values);
			return col === 'value' ? `Rp ${max.toLocaleString('id-ID')}` : max.toLocaleString('id-ID');
		}
		return '-';
	}

	// Highlighting lookup
	function getRowHighlightStyle(record: IgRecord): string {
		for (const hl of highlights) {
			if (!hl.enabled || hl.target !== 'row') continue;
			const raw = record[hl.column];
			if (String(raw).toLowerCase() === hl.value.toLowerCase()) {
				return `background-color: ${hl.bgColor}; color: ${hl.textColor};`;
			}
		}
		return '';
	}

	function getCellHighlightStyle(record: IgRecord, col: string): string {
		for (const hl of highlights) {
			if (!hl.enabled || hl.target !== 'cell' || hl.column !== col) continue;
			const raw = record[col];
			if (String(raw).toLowerCase() === hl.value.toLowerCase()) {
				return `background-color: ${hl.bgColor}; color: ${hl.textColor}; font-weight: bold;`;
			}
		}
		return '';
	}

	// Keyboard navigation handler
	function handleKeydown(e: KeyboardEvent, record: IgRecord, col: string) {
		const colIndex = visibleColumns.findIndex((c) => c.name === col);
		const rowIndex = records.findIndex((r) => r.id === record.id);

		if (e.key === 'ArrowRight') {
			if (colIndex < visibleColumns.length - 1) {
				activeCell = { rowId: record.id, col: visibleColumns[colIndex + 1].name };
				e.preventDefault();
			}
		} else if (e.key === 'ArrowLeft') {
			if (colIndex > 0) {
				activeCell = { rowId: record.id, col: visibleColumns[colIndex - 1].name };
				e.preventDefault();
			}
		} else if (e.key === 'ArrowDown') {
			if (rowIndex < records.length - 1) {
				activeCell = { rowId: records[rowIndex + 1].id, col };
				e.preventDefault();
			}
		} else if (e.key === 'ArrowUp') {
			if (rowIndex > 0) {
				activeCell = { rowId: records[rowIndex - 1].id, col };
				e.preventDefault();
			}
		} else if (e.key === 'Enter' || e.key === 'F2') {
			if (editable && record._status !== 'deleted') {
				editingCell = { rowId: record.id, col };
				e.preventDefault();
			}
		} else if (e.key === 'Escape') {
			editingCell = null;
			e.preventDefault();
		} else if (e.key === 'Tab') {
			e.preventDefault();
			if (e.shiftKey) {
				if (colIndex > 0) {
					activeCell = { rowId: record.id, col: visibleColumns[colIndex - 1].name };
				} else if (rowIndex > 0) {
					activeCell = { rowId: records[rowIndex - 1].id, col: visibleColumns[visibleColumns.length - 1].name };
				}
			} else {
				if (colIndex < visibleColumns.length - 1) {
					activeCell = { rowId: record.id, col: visibleColumns[colIndex + 1].name };
				} else if (rowIndex < records.length - 1) {
					activeCell = { rowId: records[rowIndex + 1].id, col: visibleColumns[0].name };
				}
			}
		}
	}

	// Clipboard Excel Paste handler (F8-01 / 1:1 APEX IG)
	function handlePaste(e: ClipboardEvent, startRecord: IgRecord, startCol: string) {
		const text = e.clipboardData?.getData('text');
		if (!text) return;
		e.preventDefault();

		const rowsData = text.split(/\r?\n/).filter((r) => r.length > 0);
		if (rowsData.length === 0) return;

		const startRowIdx = records.findIndex((r) => r.id === startRecord.id);
		const startColIdx = visibleColumns.findIndex((c) => c.name === startCol);

		rowsData.forEach((rowStr, rOffset) => {
			const targetRowIdx = startRowIdx + rOffset;
			if (targetRowIdx >= records.length) return;
			const targetRec = records[targetRowIdx];

			const cells = rowStr.split('\t');
			cells.forEach((val, cOffset) => {
				const targetColIdx = startColIdx + cOffset;
				if (targetColIdx >= visibleColumns.length) return;
				const colMeta = visibleColumns[targetColIdx];
				if (colMeta.name === 'id') return; // Read-only PK

				const cleanVal = colMeta.type === 'number' || colMeta.type === 'currency' ? Number(val.replace(/[^\d.-]/g, '')) : val;
				onCellChange(targetRec.id, colMeta.name, cleanVal);
			});
		});
	}

	function freezeColumn(col: string) {
		const colMeta = columns.find((c) => c.name === col);
		if (colMeta) colMeta.frozen = !colMeta.frozen;
		headerMenuCol = null;
	}

	function hideColumn(col: string) {
		const colMeta = columns.find((c) => c.name === col);
		if (colMeta) colMeta.visible = false;
		headerMenuCol = null;
	}
</script>

<svelte:window onclick={closeMenus} />

<div class="relative bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs text-xs font-sans">
	<table class="w-full border-collapse text-left">
		<!-- Table Header (1:1 APEX IG Header) -->
		<thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none sticky top-0 z-20">
			<tr>
				<!-- Row Selector Checkbox -->
				<th class="w-10 px-3 py-2.5 text-center bg-slate-100 sticky left-0 z-30 border-r border-slate-200">
					<input
						type="checkbox"
						checked={selectedIds.length === records.length && records.length > 0}
						onchange={(e) => toggleSelectAll(e.currentTarget.checked)}
						class="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
					/>
				</th>

				<!-- Row Status & Actions Lead -->
				<th class="w-12 px-2 py-2.5 text-center bg-slate-100 sticky left-10 z-30 border-r border-slate-200">
					<span class="text-[10px] text-slate-400 font-mono">Row</span>
				</th>

				<!-- Visible Columns -->
				{#each visibleColumns as col (col.name)}
					<th
						class="px-3 py-2.5 border-r border-slate-200 font-bold tracking-tight text-slate-700 hover:bg-slate-200/60 transition group {col.frozen ? 'sticky bg-slate-100 z-20' : ''}"
						style="{col.width ? `width: ${col.width}px; min-width: ${col.width}px;` : ''} {col.align ? `text-align: ${col.align};` : ''}"
					>
						<div class="flex items-center justify-between gap-1.5">
							<span class="truncate">{col.label}</span>

							<!-- Column Header Popup Menu Trigger -->
							<div class="relative" onclick={(e) => e.stopPropagation()}>
								<button
									type="button"
									onclick={() => (headerMenuCol = headerMenuCol === col.name ? null : col.name)}
									class="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-white transition cursor-pointer"
									title="Menu Kolom {col.label}"
								>
									<ChevronDown class="w-3 h-3" />
								</button>

								<!-- Column Heading Menu Dropdown (1:1 APEX) -->
								{#if headerMenuCol === col.name}
									<div class="absolute left-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl z-50 text-xs font-normal text-slate-800">
										<button
											type="button"
											onclick={() => { onCellChange(0, '_sort_asc', col.name); headerMenuCol = null; }}
											class="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50 transition cursor-pointer"
										>
											<ArrowUp class="w-3.5 h-3.5 text-slate-500" />
											<span>Sort Ascending</span>
										</button>
										<button
											type="button"
											onclick={() => { onCellChange(0, '_sort_desc', col.name); headerMenuCol = null; }}
											class="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50 transition cursor-pointer"
										>
											<ArrowDown class="w-3.5 h-3.5 text-slate-500" />
											<span>Sort Descending</span>
										</button>
										<div class="my-1 border-t border-slate-100"></div>
										<button
											type="button"
											onclick={() => { onColumnFilter(col.name); headerMenuCol = null; }}
											class="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50 transition cursor-pointer"
										>
											<Filter class="w-3.5 h-3.5 text-blue-600" />
											<span>Filter Kolom Ini...</span>
										</button>
										<button
											type="button"
											onclick={() => freezeColumn(col.name)}
											class="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50 transition cursor-pointer"
										>
											<Lock class="w-3.5 h-3.5 text-slate-500" />
											<span>{col.frozen ? 'Lepas Beku (Unfreeze)' : 'Bekukan Kolom (Freeze)'}</span>
										</button>
										<button
											type="button"
											onclick={() => hideColumn(col.name)}
											class="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 transition cursor-pointer"
										>
											<EyeOff class="w-3.5 h-3.5" />
											<span>Sembunyikan Kolom</span>
										</button>
									</div>
								{/if}
							</div>
						</div>
					</th>
				{/each}
			</tr>
		</thead>

		<!-- Table Body -->
		<tbody class="divide-y divide-slate-100">
			{#each groupedRecords as grp}
				<!-- Control Break / Group Header Band -->
				{#if grp.groupKey}
					<tr class="bg-indigo-50/80 font-bold text-indigo-950 border-t border-indigo-200">
						<td colspan={visibleColumns.length + 2} class="px-4 py-2">
							<button
								type="button"
								onclick={() => toggleGroupCollapse(grp.groupKey)}
								class="flex items-center gap-2 text-xs text-indigo-900 font-bold cursor-pointer hover:text-indigo-700"
							>
								{#if collapsedGroups[grp.groupKey]}
									<ChevronRight class="w-4 h-4" />
								{:else}
									<ChevronDown class="w-4 h-4" />
								{/if}
								<span>{grp.groupKey}</span>
								<span class="px-2 py-0.5 rounded-full bg-indigo-200/70 text-[10px] text-indigo-800 font-mono">
									{grp.records.length} records
								</span>
							</button>
						</td>
					</tr>
				{/if}

				{#if !collapsedGroups[grp.groupKey]}
					{#each grp.records as item (item.id)}
						{@const isSelected = isRowSelected(item.id)}
						{@const isDeleted = item._status === 'deleted'}
						{@const isInserted = item._status === 'inserted'}
						{@const rowCustomStyle = getRowHighlightStyle(item)}

						<tr
							class="transition-colors group {isDeleted ? 'bg-rose-50/40 text-slate-400 line-through' : isInserted ? 'bg-emerald-50/40' : isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'}"
							style={rowCustomStyle}
						>
							<!-- Checkbox -->
							<td class="w-10 px-3 py-2 text-center sticky left-0 bg-inherit border-r border-slate-200 z-10">
								<input
									type="checkbox"
									checked={isSelected}
									onchange={() => toggleSelectRow(item.id)}
									class="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
								/>
							</td>

							<!-- Row Status Indicator & Row Actions Menu -->
							<td class="w-12 px-2 py-2 text-center sticky left-10 bg-inherit border-r border-slate-200 z-10 relative">
								<div class="flex items-center justify-center gap-1" onclick={(e) => e.stopPropagation()}>
									{#if isInserted}
										<span class="w-2 h-2 rounded-full bg-emerald-500" title="Baris Baru (Belum Disimpan)"></span>
									{:else if isDeleted}
										<span class="w-2 h-2 rounded-full bg-rose-500" title="Ditandai untuk Dihapus"></span>
									{:else if item._dirtyCols && Object.keys(item._dirtyCols).length > 0}
										<span class="w-2 h-2 rounded-full bg-amber-500" title="Ada Perubahan Sel"></span>
									{/if}

									<button
										type="button"
										onclick={() => (rowMenuId = rowMenuId === item.id ? null : item.id)}
										class="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
										title="Opsi Baris"
									>
										<MoreHorizontal class="w-3.5 h-3.5" />
									</button>

									<!-- Row Actions Popup Menu (1:1 APEX) -->
									{#if rowMenuId === item.id}
										<div class="absolute left-full top-0 ml-1 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl z-50 text-xs text-left text-slate-800">
											<button
												type="button"
												onclick={() => { onOpenSingleRow(item.id); rowMenuId = null; }}
												class="w-full flex items-center gap-2 px-3 py-1.5 text-blue-600 font-semibold hover:bg-blue-50 transition cursor-pointer"
											>
												<ExternalLink class="w-3.5 h-3.5" />
												<span>Single Row View</span>
											</button>
											<button
												type="button"
												onclick={() => { onRowAction('duplicate', item.id); rowMenuId = null; }}
												class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition cursor-pointer"
											>
												<Copy class="w-3.5 h-3.5 text-slate-500" />
												<span>Duplicate Row</span>
											</button>
											{#if isDeleted}
												<button
													type="button"
													onclick={() => { onRowAction('revert', item.id); rowMenuId = null; }}
													class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-emerald-600 font-semibold transition cursor-pointer"
												>
													<RotateCcw class="w-3.5 h-3.5" />
													<span>Batal Hapus</span>
												</button>
											{:else}
												<button
													type="button"
													onclick={() => { onRowAction('delete', item.id); rowMenuId = null; }}
													class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
												>
													<Trash2 class="w-3.5 h-3.5" />
													<span>Delete Row</span>
												</button>
											{/if}
											{#if item._dirtyCols && Object.keys(item._dirtyCols).length > 0}
												<button
													type="button"
													onclick={() => { onRowAction('revert', item.id); rowMenuId = null; }}
													class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-amber-700 transition cursor-pointer"
												>
													<RotateCcw class="w-3.5 h-3.5" />
													<span>Revert Changes</span>
												</button>
											{/if}
										</div>
									{/if}
								</div>
							</td>

							<!-- Column Cells -->
							{#each visibleColumns as col (col.name)}
								{@const isCellActive = activeCell?.rowId === item.id && activeCell?.col === col.name}
								{@const isCellEditing = editingCell?.rowId === item.id && editingCell?.col === col.name}
								{@const isDirty = item._dirtyCols?.[col.name]}
								{@const cellCustomStyle = getCellHighlightStyle(item, col.name)}

								<td
									tabindex="0"
									onclick={() => { activeCell = { rowId: item.id, col: col.name }; }}
									ondblclick={() => { if (editable && !isDeleted) editingCell = { rowId: item.id, col: col.name }; }}
									onkeydown={(e) => handleKeydown(e, item, col.name)}
									onpaste={(e) => handlePaste(e, item, col.name)}
									class="p-2 border-r border-slate-200 outline-none relative transition-all {isCellActive ? 'ring-2 ring-blue-500 ring-inset z-10' : ''} {col.frozen ? 'sticky bg-inherit z-10' : ''}"
									style="{cellCustomStyle} {col.align ? `text-align: ${col.align};` : ''}"
								>
									<!-- Dirty Cell Visual Marker (Blue/Amber Corner Triangle 1:1 APEX IG) -->
									{#if isDirty}
										<div class="absolute top-0 right-0 w-0 h-0 border-t-6 border-t-amber-500 border-l-6 border-l-transparent" title="Sel diubah"></div>
									{/if}

									<!-- Cell Editor or Display -->
									{#if isCellEditing}
										{#if col.type === 'select' && col.options}
											<select
												autofocus
												value={item[col.name]}
												onchange={(e) => {
													onCellChange(item.id, col.name, e.currentTarget.value);
													editingCell = null;
												}}
												onblur={() => (editingCell = null)}
												class="w-full px-2 py-1 bg-white border border-blue-500 rounded text-xs font-medium outline-none shadow-xs"
											>
												{#each col.options as opt}
													<option value={opt}>{opt}</option>
												{/each}
											</select>
										{:else if col.type === 'number' || col.type === 'currency'}
											<input
												type="number"
												autofocus
												value={item[col.name]}
												onchange={(e) => onCellChange(item.id, col.name, Number(e.currentTarget.value))}
												onblur={() => (editingCell = null)}
												onkeydown={(e) => { if (e.key === 'Enter') editingCell = null; }}
												class="w-full px-2 py-1 bg-white border border-blue-500 rounded text-xs font-mono outline-none shadow-xs"
											/>
										{:else if col.type === 'date'}
											<input
												type="date"
												autofocus
												value={item[col.name]}
												onchange={(e) => onCellChange(item.id, col.name, e.currentTarget.value)}
												onblur={() => (editingCell = null)}
												onkeydown={(e) => { if (e.key === 'Enter') editingCell = null; }}
												class="w-full px-2 py-1 bg-white border border-blue-500 rounded text-xs outline-none shadow-xs"
											/>
										{:else}
											<input
												type="text"
												autofocus
												value={item[col.name]}
												onchange={(e) => onCellChange(item.id, col.name, e.currentTarget.value)}
												onblur={() => (editingCell = null)}
												onkeydown={(e) => { if (e.key === 'Enter') editingCell = null; }}
												class="w-full px-2 py-1 bg-white border border-blue-500 rounded text-xs outline-none shadow-xs"
											/>
										{/if}
									{:else}
										<!-- Render Mode (Read / Normal) -->
										{#if col.type === 'currency'}
											<span class="font-bold text-slate-900 font-mono">
												Rp {(item[col.name] || 0).toLocaleString('id-ID')}
											</span>
										{:else if col.type === 'badge'}
											<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider {item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : item.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
												{item[col.name]}
											</span>
										{:else if col.name === 'code'}
											<span class="font-bold text-blue-600 font-mono">{item[col.name]}</span>
										{:else}
											<span class="text-slate-800">{item[col.name] ?? '-'}</span>
										{/if}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			{/each}
		</tbody>

		<!-- Aggregation Summary Footer Row (1:1 APEX IG Aggregation) -->
		{#if aggregates.length > 0}
			<tfoot class="bg-slate-100 text-slate-800 font-bold border-t-2 border-slate-300 sticky bottom-0 z-20">
				<tr>
					<td colspan="2" class="px-3 py-2.5 text-center font-bold uppercase tracking-wider text-[11px] text-slate-500 border-r border-slate-200">
						Ringkasan
					</td>
					{#each visibleColumns as col}
						{@const agg = aggregates.find((a) => a.column === col.name)}
						<td class="px-3 py-2.5 border-r border-slate-200 {col.align ? `text-align: ${col.align};` : ''}">
							{#if agg}
								<div class="flex flex-col">
									<span class="text-[9px] uppercase tracking-wider text-blue-700 font-bold">{agg.func}</span>
									<span class="font-bold font-mono text-slate-900">{computeAggregate(col.name, agg.func)}</span>
								</div>
							{:else}
								<span class="text-slate-300">-</span>
							{/if}
						</td>
					{/each}
				</tr>
			</tfoot>
		{/if}
	</table>
</div>
