<script lang="ts">
	import type { FilterOperator, IgColumnMeta, IgHighlight } from './types';
	import { Highlighter, X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		columns = [],
		highlightToEdit = null,
		onApply
	}: {
		open: boolean;
		columns: IgColumnMeta[];
		highlightToEdit: IgHighlight | null;
		onApply: (hl: IgHighlight) => void;
	} = $props();

	let name = $state('Highlight Baru');
	let selectedCol = $state('status');
	let selectedOp = $state<FilterOperator>('equals');
	let filterValue = $state('maintenance');
	let selectedColor = $state('#fee2e2'); // red-100
	let target = $state<'row' | 'cell'>('row');

	const PRESET_COLORS = [
		{ bg: '#fee2e2', text: '#991b1b', label: 'Merah Muda (Warning/Alert)' },
		{ bg: '#dcfce7', text: '#166534', label: 'Hijau Muda (Success/Approved)' },
		{ bg: '#fef3c7', text: '#92400e', label: 'Kuning (Pending/Warning)' },
		{ bg: '#e0f2fe', text: '#075985', label: 'Biru Muda (Info/Active)' },
		{ bg: '#f3e8ff', text: '#6b21a8', label: 'Ungu (Special/Priority)' }
	];

	$effect(() => {
		if (open) {
			if (highlightToEdit) {
				name = highlightToEdit.name;
				selectedCol = highlightToEdit.column;
				selectedOp = highlightToEdit.op;
				filterValue = highlightToEdit.value;
				selectedColor = highlightToEdit.bgColor;
				target = highlightToEdit.target;
			} else {
				name = 'Highlight Status';
				selectedCol = 'status';
				selectedOp = 'equals';
				filterValue = 'maintenance';
				selectedColor = '#fee2e2';
				target = 'row';
			}
		}
	});

	function handleSave() {
		const matchedColor = PRESET_COLORS.find((c) => c.bg === selectedColor) || PRESET_COLORS[0];
		onApply({
			id: highlightToEdit?.id || `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			name,
			column: selectedCol,
			op: selectedOp,
			value: filterValue,
			bgColor: matchedColor.bg,
			textColor: matchedColor.text,
			target,
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
					<div class="p-1.5 rounded-lg bg-amber-50 text-amber-600">
						<Highlighter class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						Highlight (Pewarnaan Bersyarat / Conditional Format)
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

			<div class="py-4 space-y-3 text-xs">
				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nama Aturan Highlight</label>
					<input
						type="text"
						bind:value={name}
						placeholder="Misal: Aset Perlu Perbaikan"
						class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Kolom</label>
						<select
							bind:value={selectedCol}
							class="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium cursor-pointer"
						>
							{#each columns as col}
								<option value={col.name}>{col.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Kondisi</label>
						<select
							bind:value={selectedOp}
							class="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium cursor-pointer"
						>
							<option value="equals">Equals (=)</option>
							<option value="not_equals">Not Equals (!=)</option>
							<option value="contains">Contains</option>
							<option value="greater_than">Greater Than (&gt;)</option>
							<option value="less_than">Less Than (&lt;)</option>
						</select>
					</div>
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nilai Kriteria</label>
					<input
						type="text"
						bind:value={filterValue}
						placeholder="Nilai yang dicocokkan..."
						class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
					/>
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Pilihan Warna Sorotan</label>
					<div class="flex items-center gap-2">
						{#each PRESET_COLORS as c}
							<button
								type="button"
								onclick={() => (selectedColor = c.bg)}
								class="w-7 h-7 rounded-lg border transition cursor-pointer flex items-center justify-center {selectedColor === c.bg ? 'ring-2 ring-slate-800 scale-110' : 'opacity-80'}"
								style="background-color: {c.bg}; border-color: {c.text};"
								title={c.label}
							>
								{#if selectedColor === c.bg}
									<span class="w-1.5 h-1.5 rounded-full" style="background-color: {c.text};"></span>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex items-center gap-4 pt-1">
					<label class="flex items-center gap-1.5 cursor-pointer">
						<input type="radio" name="hl-target" value="row" bind:group={target} class="text-amber-600" />
						<span class="font-medium text-slate-700">Warnai Seluruh Baris</span>
					</label>
					<label class="flex items-center gap-1.5 cursor-pointer">
						<input type="radio" name="hl-target" value="cell" bind:group={target} class="text-amber-600" />
						<span class="font-medium text-slate-700">Warnai Sel Kolom Saja</span>
					</label>
				</div>
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
					class="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Simpan Highlight
				</button>
			</div>
		</div>
	</div>
{/if}
