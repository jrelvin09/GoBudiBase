<script lang="ts">
	import { Bookmark, X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		onSave
	}: {
		open: boolean;
		onSave: (name: string, isDefault: boolean, isPublic: boolean) => void;
	} = $props();

	let reportName = $state('Laporan Kustom Saya');
	let isDefault = $state(false);
	let isPublic = $state(true);

	function handleConfirm() {
		if (!reportName.trim()) return;
		onSave(reportName.trim(), isDefault, isPublic);
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 text-slate-800">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2">
					<div class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
						<Bookmark class="w-4 h-4" />
					</div>
					<h3 class="font-bold text-sm text-slate-900">
						Simpan Konfigurasi Laporan (Saved Report)
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

			<div class="py-4 space-y-4 text-xs">
				<p class="text-slate-500">
					Simpan tampilan kolom, penyaringan, pengurutan, pengelompokan, dan penyorotan saat ini agar dapat dibuka kembali kapan saja:
				</p>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nama Laporan</label>
					<input
						type="text"
						bind:value={reportName}
						placeholder="Misal: Aset Rusak & Perlu Perbaikan"
						class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
					/>
				</div>

				<div class="space-y-2 pt-1">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={isDefault}
							class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
						/>
						<span class="font-medium text-slate-700">Jadikan sebagai Laporan Utama (Default View)</span>
					</label>

					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={isPublic}
							class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
						/>
						<span class="font-medium text-slate-700">Dapat diakses seluruh pengguna (Public Report)</span>
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
					onclick={handleConfirm}
					class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
				>
					Simpan Laporan
				</button>
			</div>
		</div>
	</div>
{/if}
