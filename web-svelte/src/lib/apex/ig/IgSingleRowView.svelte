<script lang="ts">
	import type { IgColumnMeta, IgRecord } from './types';
	import {
		ChevronLeft,
		ChevronRight,
		ChevronsLeft,
		ChevronsRight,
		ArrowLeft,
		Plus,
		Copy,
		Trash2,
		RotateCcw,
		Save,
		CheckCircle2,
		FileText
	} from 'lucide-svelte';

	let {
		records = $bindable<IgRecord[]>([]),
		columns = [],
		activeRecordId = $bindable<number>(0),
		onClose,
		onCellChange,
		onRowAction,
		onSave,
		hasDirty = false,
		saving = false
	}: {
		records: IgRecord[];
		columns: IgColumnMeta[];
		activeRecordId: number;
		onClose: () => void;
		onCellChange: (rowId: number, col: string, val: any) => void;
		onRowAction: (action: 'duplicate' | 'delete' | 'revert', rowId: number) => void;
		onSave: () => void;
		hasDirty: boolean;
		saving: boolean;
	} = $props();

	const currentIndex = $derived(
		Math.max(0, records.findIndex((r) => r.id === activeRecordId))
	);

	const activeRecord = $derived(
		records[currentIndex] || records[0]
	);

	function goToFirst() {
		if (records.length > 0) activeRecordId = records[0].id;
	}

	function goToPrev() {
		if (currentIndex > 0) activeRecordId = records[currentIndex - 1].id;
	}

	function goToNext() {
		if (currentIndex < records.length - 1) activeRecordId = records[currentIndex + 1].id;
	}

	function goToLast() {
		if (records.length > 0) activeRecordId = records[records.length - 1].id;
	}
</script>

<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
	<!-- Navigation & Action Header (1:1 APEX Single Row View) -->
	<div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={onClose}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
			>
				<ArrowLeft class="w-3.5 h-3.5 text-blue-600" />
				<span>Kembali ke Grid View</span>
			</button>

			<div class="h-5 w-px bg-slate-300 mx-1"></div>

			<!-- Record Navigator -->
			<div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
				<button
					type="button"
					onclick={goToFirst}
					disabled={currentIndex === 0}
					class="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
					title="First Record"
				>
					<ChevronsLeft class="w-4 h-4" />
				</button>
				<button
					type="button"
					onclick={goToPrev}
					disabled={currentIndex === 0}
					class="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
					title="Previous Record"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>

				<span class="px-3 text-xs font-bold font-mono text-slate-700">
					Record {currentIndex + 1} of {records.length}
				</span>

				<button
					type="button"
					onclick={goToNext}
					disabled={currentIndex >= records.length - 1}
					class="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
					title="Next Record"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
				<button
					type="button"
					onclick={goToLast}
					disabled={currentIndex >= records.length - 1}
					class="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
					title="Last Record"
				>
					<ChevronsRight class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Single Row Action Controls -->
		<div class="flex items-center gap-2">
			{#if activeRecord}
				<button
					type="button"
					onclick={() => onRowAction('duplicate', activeRecord.id)}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
				>
					<Copy class="w-3.5 h-3.5 text-slate-500" />
					<span>Duplicate</span>
				</button>

				<button
					type="button"
					onclick={() => onRowAction('delete', activeRecord.id)}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
				>
					<Trash2 class="w-3.5 h-3.5 text-rose-600" />
					<span>Delete</span>
				</button>

				{#if activeRecord._dirtyCols && Object.keys(activeRecord._dirtyCols).length > 0}
					<button
						type="button"
						onclick={() => onRowAction('revert', activeRecord.id)}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition cursor-pointer"
					>
						<RotateCcw class="w-3.5 h-3.5" />
						<span>Revert</span>
					</button>
				{/if}
			{/if}

			<button
				type="button"
				onclick={onSave}
				disabled={!hasDirty || saving}
				class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs"
			>
				<Save class="w-3.5 h-3.5" />
				<span>{saving ? 'Menyimpan...' : 'Save'}</span>
			</button>
		</div>
	</div>

	<!-- Vertical Record Form Body (1:1 APEX Vertical Layout) -->
	{#if activeRecord}
		<div class="p-6 max-w-4xl mx-auto space-y-6">
			<!-- Record Header Summary Card -->
			<div class="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50/40">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
						#{activeRecord.id}
					</div>
					<div>
						<h3 class="font-bold text-base text-slate-900">{activeRecord.name || 'Tanpa Nama'}</h3>
						<p class="text-xs font-mono text-blue-700 font-semibold">{activeRecord.code} • Kategori: {activeRecord.category}</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider {activeRecord.status === 'active' ? 'bg-emerald-100 text-emerald-800' : activeRecord.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
						{activeRecord.status}
					</span>
					<div class="text-right">
						<span class="text-[10px] text-slate-400 block font-semibold uppercase">Nilai Aset</span>
						<span class="font-bold font-mono text-sm text-slate-900">
							Rp {(activeRecord.value || 0).toLocaleString('id-ID')}
						</span>
					</div>
				</div>
			</div>

			<!-- Dynamic Form Field Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
				{#each columns as col (col.name)}
					{@const isDirty = activeRecord._dirtyCols?.[col.name]}
					<div class="space-y-1.5 {col.name === 'name' ? 'md:col-span-2' : ''}">
						<div class="flex items-center justify-between">
							<label class="font-semibold text-slate-700">
								{col.label}
								{#if isDirty}
									<span class="ml-1 text-amber-600 font-bold">• diubah</span>
								{/if}
							</label>
							<span class="text-[10px] text-slate-400 font-mono">[{col.name}]</span>
						</div>

						{#if col.name === 'id'}
							<input
								type="text"
								disabled
								value={activeRecord.id}
								class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
							/>
						{:else if col.type === 'select' && col.options}
							<select
								value={activeRecord[col.name]}
								onchange={(e) => onCellChange(activeRecord.id, col.name, e.currentTarget.value)}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
							>
								{#each col.options as opt}
									<option value={opt}>{opt}</option>
								{/each}
							</select>
						{:else if col.type === 'currency' || col.type === 'number'}
							<input
								type="number"
								value={activeRecord[col.name]}
								onchange={(e) => onCellChange(activeRecord.id, col.name, Number(e.currentTarget.value))}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
							/>
						{:else if col.type === 'date'}
							<input
								type="date"
								value={activeRecord[col.name] ? String(activeRecord[col.name]).substring(0, 10) : ''}
								onchange={(e) => onCellChange(activeRecord.id, col.name, e.currentTarget.value)}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
							/>
						{:else}
							<input
								type="text"
								value={activeRecord[col.name] ?? ''}
								onchange={(e) => onCellChange(activeRecord.id, col.name, e.currentTarget.value)}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
							/>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="p-12 text-center text-slate-400">
			Tidak ada record yang dipilih.
		</div>
	{/if}
</div>
