<script lang="ts">
	import type { FilterOperator, IgColumnMeta, IgFilter } from './types';
	import { Filter, X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		columns = [],
		filterToEdit = null,
		onApply
	}: {
		open: boolean;
		columns: IgColumnMeta[];
		filterToEdit: IgFilter | null;
		onApply: (filter: IgFilter) => void;
	} = $props();

	let selectedCol = $state('name');
	let selectedOp = $state<FilterOperator>('contains');
	let filterValue = $state('');
	let filterValue2 = $state('');

	$effect(() => {
		if (open) {
			if (filterToEdit) {
				selectedCol = filterToEdit.column;
				selectedOp = filterToEdit.op;
				filterValue = filterToEdit.value;
				filterValue2 = filterToEdit.value2 || '';
			} else {
				selectedCol = columns[0]?.name || 'name';
				selectedOp = 'contains';
				filterValue = '';
				filterValue2 = '';
			}
		}
	});

	const OPERATORS: { value: FilterOperator; label: string }[] = [
		{ value: 'contains', label: 'Contains (Mengandung teks)' },
		{ value: 'does_not_contain', label: 'Does Not Contain (Tidak mengandung)' },
		{ value: 'equals', label: 'Equals (= Sama dengan)' },
		{ value: 'not_equals', label: 'Not Equals (!= Tidak sama)' },
		{ value: 'starts_with', label: 'Starts With (Diawali dengan)' },
		{ value: 'ends_with', label: 'Ends With (Diakhiri dengan)' },
		{ value: 'greater_than', label: 'Greater Than (> Lebih besar)' },
		{ value: 'less_than', label: 'Less Than (< Lebih kecil)' },
		{ value: 'between', label: 'Between (Di antara dua nilai)' },
		{ value: 'in', label: 'In (Termasuk dalam daftar dipisah koma)' },
		{ value: 'is_null', label: 'Is Null (Kosong / NULL)' },
		{ value: 'is_not_null', label: 'Is Not Null (Tidak kosong)' }
	];

	function handleSave() {
		onApply({
			id: filterToEdit?.id || `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			column: selectedCol,
			op: selectedOp,
			value: filterValue,
			value2: selectedOp === 'between' ? filterValue2 : undefined,
			enabled: true
		});
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 text-slate-800">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2">
					<div class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
						<Filter class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						{filterToEdit ? 'Ubah Filter Kolom' : 'Tambah Filter Kolom (12 Operator APEX)'}
					</h3>
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<div class="space-y-4 py-4 text-xs">
				<!-- Kolom -->
				<div>
					<label class="block font-semibold text-slate-700 mb-1">Kolom Target</label>
					<select
						bind:value={selectedCol}
						class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
					>
						{#each columns as col}
							<option value={col.name}>{col.label} ({col.type})</option>
						{/each}
					</select>
				</div>

				<!-- Operator (12 APEX Operators) -->
				<div>
					<label class="block font-semibold text-slate-700 mb-1">Operator Evaluasi</label>
					<select
						bind:value={selectedOp}
						class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
					>
						{#each OPERATORS as op}
							<option value={op.value}>{op.label}</option>
						{/each}
					</select>
				</div>

				<!-- Nilai -->
				{#if selectedOp !== 'is_null' && selectedOp !== 'is_not_null'}
					<div>
						<label class="block font-semibold text-slate-700 mb-1">
							{selectedOp === 'between' ? 'Nilai Minimum / Awal' : selectedOp === 'in' ? 'Daftar Nilai (Pisahkan dengan koma)' : 'Nilai Kriteria'}
						</label>
						<input
							type="text"
							placeholder={selectedOp === 'in' ? 'Furniture, Vehicle, Electronic' : 'Masukkan nilai filter...'}
							bind:value={filterValue}
							class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
						/>
					</div>

					{#if selectedOp === 'between'}
						<div>
							<label class="block font-semibold text-slate-700 mb-1">Nilai Maksimum / Akhir</label>
							<input
								type="text"
								placeholder="Nilai batas atas..."
								bind:value={filterValue2}
								class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
							/>
						</div>
					{/if}
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
				<button
					type="button"
					onclick={() => (open = false)}
					class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleSave}
					class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Terapkan Filter
				</button>
			</div>
		</div>
	</div>
{/if}
