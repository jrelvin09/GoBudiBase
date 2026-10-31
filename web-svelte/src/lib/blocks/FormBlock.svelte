<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchTableColumns, executeSqlStudio, executeBatch, type TableColumn } from '$lib/api/builderClient';
	import { Save, X, CheckCircle2, AlertCircle, RefreshCw, LayoutTemplate } from 'lucide-svelte';

	let {
		table = 'bmn_items',
		schema = 'app',
		mode = 'create', // 'create' | 'edit'
		recordId = null,
		title = '',
		onSuccess,
		onCancel
	}: {
		table?: string;
		schema?: string;
		mode?: 'create' | 'edit';
		recordId?: any;
		title?: string;
		onSuccess?: (savedData: any) => void;
		onCancel?: () => void;
	} = $props();

	let columns = $state<TableColumn[]>([]);
	let formData = $state<Record<string, any>>({});
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let successMsg = $state<string | null>(null);

	const fullTableName = $derived(table.includes('.') ? table : `${schema}.${table}`);
	const displayTitle = $derived(title || (mode === 'create' ? `Tambah Data ${table}` : `Edit Data ${table} #${recordId || ''}`));

	async function initForm() {
		loading = true;
		error = null;
		try {
			// 1. Fetch column definitions
			const s = table.includes('.') ? table.split('.')[0] : schema;
			const t = table.includes('.') ? table.split('.')[1] : table;
			const colDefs = await fetchTableColumns(s, t);
			columns = colDefs || [];

			// 2. If edit mode and recordId provided, load existing record
			if (mode === 'edit' && recordId != null) {
				const query = `SELECT * FROM ${fullTableName} WHERE id = ${recordId} LIMIT 1`;
				const res = await executeSqlStudio(query, 1);
				if (res.rows && res.rows.length > 0) {
					formData = { ...res.rows[0] };
				}
			} else {
				// Init default empty values
				const init: Record<string, any> = {};
				columns.forEach((c) => {
					if (c.name !== 'id') {
						if (c.type.includes('bool')) init[c.name] = false;
						else if (c.type.includes('int') || c.type.includes('num')) init[c.name] = 0;
						else init[c.name] = '';
					}
				});
				formData = init;
			}
		} catch (e: any) {
			error = e.message || 'Gagal menyiapkan form';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		initForm();
	});

	async function handleSubmit() {
		saving = true;
		error = null;
		successMsg = null;
		try {
			// Remove id from insert payload
			const payload = { ...formData };
			delete payload.id;

			if (mode === 'create') {
				const res = await executeBatch(fullTableName, [
					{ op: 'create', values: payload }
				]);
				successMsg = 'Data berhasil disimpan!';
				onSuccess?.(res);
				// Reset form
				initForm();
			} else {
				await executeBatch(fullTableName, [
					{ op: 'update', id: recordId, values: payload }
				]);
				successMsg = 'Perubahan data berhasil disimpan!';
				onSuccess?.(formData);
			}

			setTimeout(() => {
				successMsg = null;
			}, 3000);
		} catch (e: any) {
			error = e.message || 'Gagal menyimpan perubahan';
		} finally {
			saving = false;
		}
	}
</script>

<div class="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur max-w-2xl">
	<!-- Form Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
		<div class="flex items-center gap-2.5">
			<div class="rounded-lg bg-purple-500/20 p-2 text-purple-400 border border-purple-500/30">
				<LayoutTemplate class="h-4 w-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-slate-100">{displayTitle}</h3>
				<span class="font-mono text-[11px] text-slate-400">{fullTableName}</span>
			</div>
		</div>

		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>

	{#if error}
		<div class="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
			<AlertCircle class="h-4 w-4 shrink-0" />
			<span>{error}</span>
		</div>
	{/if}

	{#if successMsg}
		<div class="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
			<CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-400" />
			<span>{successMsg}</span>
		</div>
	{/if}

	{#if loading}
		<div class="flex h-36 items-center justify-center text-xs text-slate-400 gap-2">
			<RefreshCw class="h-4 w-4 animate-spin text-purple-400" />
			<span>Memuat struktur kolom form...</span>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-4 text-xs">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each columns as col}
					{#if col.name !== 'id' && !col.name.startsWith('created_') && !col.name.startsWith('updated_')}
						<div class="flex flex-col gap-1 {col.type.includes('text') && (col.name.includes('desc') || col.name.includes('catatan')) ? 'md:col-span-2' : ''}">
							<label class="font-semibold text-slate-300 flex items-center justify-between">
								<span>{col.name}</span>
								<span class="font-mono text-[9px] text-slate-500 uppercase">{col.type}</span>
							</label>

							{#if col.type.includes('bool')}
								<div class="flex items-center gap-3 py-1">
									<input
										type="checkbox"
										bind:checked={formData[col.name]}
										class="h-4 w-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-0 cursor-pointer"
									/>
									<span class="text-slate-400 text-xs">Aktif / Ya</span>
								</div>
							{:else if col.type.includes('int') || col.type.includes('num') || col.type.includes('double')}
								<input
									type="number"
									bind:value={formData[col.name]}
									class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
								/>
							{:else if col.type.includes('date') || col.type.includes('time')}
								<input
									type="date"
									bind:value={formData[col.name]}
									class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
								/>
							{:else if col.name.includes('desc') || col.name.includes('alamat') || col.name.includes('catatan')}
								<textarea
									bind:value={formData[col.name]}
									rows="3"
									class="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-slate-200 focus:border-purple-500 focus:outline-none"
								></textarea>
							{:else}
								<input
									type="text"
									bind:value={formData[col.name]}
									placeholder={`Masukkan ${col.name}...`}
									class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
								/>
							{/if}
						</div>
					{/if}
				{/each}
			</div>

			<!-- Action Buttons -->
			<div class="mt-4 flex items-center justify-end gap-2.5 border-t border-slate-800 pt-3">
				{#if onCancel}
					<button
						type="button"
						onclick={onCancel}
						class="rounded-lg px-4 py-2 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
					>
						Batal
					</button>
				{/if}
				<button
					type="submit"
					disabled={saving}
					class="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition disabled:opacity-50"
				>
					<Save class="h-4 w-4" />
					<span>{saving ? 'Menyimpan...' : 'Simpan Data'}</span>
				</button>
			</div>
		</form>
	{/if}
</div>
