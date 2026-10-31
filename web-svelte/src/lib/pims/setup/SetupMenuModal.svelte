<script lang="ts">
	import { X, Folder, FileText, Hash, Image, Shield, Info, Trash2 } from 'lucide-svelte';

	interface MenuRecord {
		rowNo: number;
		parentMenu: string | null;
		namaMenu: string;
		menuLink: string | null;
		aktif: string;
		dibuatOleh: string | null;
		tglDibuat: string | null;
		diubahOleh: string | null;
		tglDiubah: string | null;
		rid?: number;
		sortOrder?: number;
		icon?: string;
	}

	let {
		menu,
		isNew = false,
		onSave,
		onDelete,
		onCancel
	}: {
		menu: Partial<MenuRecord>;
		isNew?: boolean;
		onSave: (updated: MenuRecord) => void;
		onDelete?: (rowNo: number) => void;
		onCancel: () => void;
	} = $props();

	let parentMenu = $state(menu.parentMenu || 'Konfigurasi Setup');
	let namaMenu = $state(menu.namaMenu || '');
	let menuLink = $state(menu.menuLink || '');
	let sortOrder = $state(menu.sortOrder || menu.rowNo || 1);
	let iconName = $state(menu.icon || 'fa fa-list');
	let isActive = $state(menu.aktif === 'Ya' || isNew);

	const parentMenuOptions = [
		'Konfigurasi Setup',
		'Master Data',
		'Transaction',
		'Report',
		'Inquiries',
		'Data Integrations',
		'Org Development'
	];

	let errorMsg = $state('');

	function handleSave() {
		if (!namaMenu.trim()) {
			errorMsg = 'Nama Menu wajib diisi.';
			return;
		}

		const updatedRecord: MenuRecord = {
			rowNo: menu.rowNo || 9999,
			parentMenu: parentMenu || null,
			namaMenu: namaMenu.trim(),
			menuLink: menuLink.trim() || null,
			aktif: isActive ? 'Ya' : 'Tidak',
			dibuatOleh: menu.dibuatOleh || 'IT000002',
			tglDibuat: menu.tglDibuat || new Date().toLocaleString('id-ID'),
			diubahOleh: 'IT000002 (MUKTI ASSARY)',
			tglDiubah: new Date().toLocaleString('id-ID'),
			rid: menu.rid || menu.rowNo || 9999,
			sortOrder: Number(sortOrder) || 1,
			icon: iconName
		};

		onSave(updatedRecord);
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
	<div
		class="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
	>
		<!-- Modal Header: Oracle APEX Page 453 Redwood style -->
		<div
			class="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-6 py-4"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#026cb6]/10 text-[#026cb6]"
				>
					<Folder class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-base font-bold text-slate-900">
						{isNew ? 'Buat Menu User Baru' : 'SETUP Menu User - Ubah Data'}
					</h3>
					<p class="text-xs text-slate-500">
						Page 453 &bull; Alias: <span class="font-mono">setup-user-menus-create</span>
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={onCancel}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
				title="Tutup Modal"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- Modal Body -->
		<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
			{#if errorMsg}
				<div class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
					{errorMsg}
				</div>
			{/if}

			<!-- Menu Utama (Parent Menu) -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
					<Folder class="h-3.5 w-3.5 text-slate-500" />
					Menu Utama (Parent Menu LOV)
				</label>
				<select
					bind:value={parentMenu}
					class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
				>
					<option value="">-- Menu Tingkat Atas (Root) --</option>
					{#each parentMenuOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>

			<!-- Nama Menu -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1">
					Nama Menu <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					bind:value={namaMenu}
					placeholder="contoh: SETUP Master Barang"
					class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
				/>
			</div>

			<!-- Halaman Menu (Target Link / Alias) -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
					<FileText class="h-3.5 w-3.5 text-slate-500" />
					Halaman Menu (Page Link / Alias)
				</label>
				<input
					type="text"
					bind:value={menuLink}
					placeholder="contoh: MD_CUSTOM_ITEMS_LANDING (P-250)"
					class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
				/>
			</div>

			<!-- Nomor Urutan & Gambar Ikon Menu -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
						<Hash class="h-3.5 w-3.5 text-slate-500" />
						Nomor Urutan Menu
					</label>
					<input
						type="number"
						bind:value={sortOrder}
						min="1"
						class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
						<Image class="h-3.5 w-3.5 text-slate-500" />
						Gambar Ikon Menu
					</label>
					<input
						type="text"
						bind:value={iconName}
						placeholder="fa fa-folder, fa fa-users"
						class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono transition focus:border-[#026cb6] focus:outline-none focus:ring-2 focus:ring-[#026cb6]/20"
					/>
				</div>
			</div>

			<!-- Status Data Aktif -->
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1"> Status Menu </label>
				<div class="flex items-center gap-2 pt-1">
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={isActive} class="sr-only peer" />
						<div
							class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
						></div>
						<span class="ml-3 text-xs font-medium {isActive ? 'text-emerald-700' : 'text-slate-500'}">
							{isActive ? 'Data Aktif (Ya)' : 'Non-Aktif (Tidak)'}
						</span>
					</label>
				</div>
			</div>

			<!-- Audit Trail Section -->
			{#if !isNew}
				<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
					<div class="mb-2 font-semibold text-slate-700 flex items-center gap-1.5">
						<Info class="h-3.5 w-3.5 text-slate-400" />
						Informasi Audit
					</div>
					<div class="grid grid-cols-2 gap-2 text-[11px]">
						<div>
							<span class="text-slate-400">Dibuat Oleh:</span>
							<strong class="text-slate-700 ml-1">{menu.dibuatOleh || '-'}</strong>
						</div>
						<div>
							<span class="text-slate-400">Tgl Dibuat:</span>
							<span class="text-slate-700 ml-1 font-mono">{menu.tglDibuat || '-'}</span>
						</div>
						<div>
							<span class="text-slate-400">Diubah Oleh:</span>
							<strong class="text-slate-700 ml-1">{menu.diubahOleh || '-'}</strong>
						</div>
						<div>
							<span class="text-slate-400">Tgl Diubah:</span>
							<span class="text-slate-700 ml-1 font-mono">{menu.tglDiubah || '-'}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Modal Footer -->
		<div
			class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5"
		>
			<!-- Delete button -->
			<div>
				{#if !isNew && onDelete && menu.rowNo}
					<button
						type="button"
						onclick={() => onDelete(menu.rowNo!)}
						class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
					>
						<Trash2 class="h-3.5 w-3.5" />
						Hapus Menu
					</button>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={onCancel}
					class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSave}
					class="rounded-lg bg-[#026cb6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#025691] transition cursor-pointer shadow-xs"
				>
					{isNew ? 'Create' : 'Apply Changes'}
				</button>
			</div>
		</div>
	</div>
</div>
