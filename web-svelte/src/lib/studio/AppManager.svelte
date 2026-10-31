<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchAppsList, createNewApp, type AppListItem } from '$lib/api/builderClient';
	import {
		Plus,
		Layers,
		ExternalLink,
		Edit3,
		Database,
		FileText,
		CheckCircle2,
		RefreshCw,
		Sparkles,
		LayoutDashboard
	} from 'lucide-svelte';

	let {
		onOpenAppDesigner
	}: {
		onOpenAppDesigner: (appSlug: string) => void;
	} = $props();

	let apps = $state<AppListItem[]>([]);
	let loading = $state(false);
	let showCreateModal = $state(false);

	// New App Form State
	let newAppName = $state('');
	let newAppSlug = $state('');
	let newAppDesc = $state('');
	let creating = $state(false);
	let createError = $state('');

	async function loadApps() {
		loading = true;
		try {
			apps = await fetchAppsList();
		} catch (e: any) {
			console.error('Failed to load apps:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadApps();
	});

	function handleNameChange(name: string) {
		newAppName = name;
		// auto-generate slug
		newAppSlug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}

	async function handleCreateApp() {
		if (!newAppName.trim() || !newAppSlug.trim()) {
			createError = 'Nama dan Slug aplikasi wajib diisi!';
			return;
		}
		creating = true;
		createError = '';
		try {
			await createNewApp({
				name: newAppName,
				slug: newAppSlug,
				description: newAppDesc,
				icon: 'Layers',
				theme: 'dark'
			});
			showCreateModal = false;
			newAppName = '';
			newAppSlug = '';
			newAppDesc = '';
			await loadApps();
		} catch (e: any) {
			createError = e.message || 'Gagal membuat aplikasi baru';
		} finally {
			creating = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Header Bar -->
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
				<LayoutDashboard class="h-6 w-6" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-bold text-slate-100">GoBudiBase Studio & App Builder</h2>
					<span class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
						LOW-CODE PLATFORM
					</span>
				</div>
				<p class="text-xs text-slate-400">Buat & kelola aplikasi enterprise level berbasis PostgreSQL 17 tanpa menulis kode ulang</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={loadApps}
				disabled={loading}
				class="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>

			<button
				type="button"
				onclick={() => (showCreateModal = true)}
				class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
			>
				<Plus class="h-4 w-4" />
				<span>Buat Aplikasi Baru</span>
			</button>
		</div>
	</div>

	<!-- Applications Cards Grid -->
	{#if loading && apps.length === 0}
		<div class="flex h-64 items-center justify-center text-sm text-slate-500">
			<RefreshCw class="mr-2 h-5 w-5 animate-spin text-emerald-500" />
			Memuat katalog aplikasi enterprise...
		</div>
	{:else if apps.length === 0}
		<div class="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-8 text-center">
			<Layers class="h-10 w-10 text-slate-600 mb-3" />
			<h4 class="text-sm font-bold text-slate-300">Belum Ada Aplikasi Terdaftar</h4>
			<p class="text-xs text-slate-500 mt-1 max-w-sm">Klik tombol "Buat Aplikasi Baru" untuk memulai membangun aplikasi low-code pertama Anda.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
			{#each apps as app}
				<div class="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition hover:border-slate-700 hover:bg-slate-900/90 backdrop-blur">
					<div>
						<!-- Card Top -->
						<div class="flex items-start justify-between">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-950/60 group-hover:text-emerald-300 transition">
								<Layers class="h-5 w-5" />
							</div>
							<span class="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
								v{app.version || '1.0.0'}
							</span>
						</div>

						<div class="mt-4">
							<h3 class="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition">{app.name}</h3>
							<p class="mt-1 line-clamp-2 text-xs text-slate-400 leading-relaxed">{app.description || 'Tidak ada deskripsi.'}</p>
						</div>

						<div class="mt-4 flex items-center gap-3 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
							<div class="flex items-center gap-1 font-mono">
								<FileText class="h-3.5 w-3.5 text-slate-400" />
								<span>{app.page_count} Halaman</span>
							</div>
							<div class="flex items-center gap-1 font-mono">
								<Database class="h-3.5 w-3.5 text-slate-400" />
								<span>PostgreSQL 17</span>
							</div>
						</div>
					</div>

					<!-- Card Actions -->
					<div class="mt-5 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
						<button
							type="button"
							onclick={() => onOpenAppDesigner(app.slug)}
							class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
						>
							<Edit3 class="h-3.5 w-3.5 text-emerald-400" />
							<span>Buka Page Designer</span>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Create New App -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<div class="flex items-center gap-2">
					<Sparkles class="h-4 w-4 text-emerald-400" />
					<h3 class="text-base font-bold text-slate-100">Buat Aplikasi Low-Code Baru</h3>
				</div>
				<button
					type="button"
					onclick={() => (showCreateModal = false)}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
				>
					&times;
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleCreateApp(); }} class="mt-4 flex flex-col gap-4 text-xs">
				{#if createError}
					<div class="rounded-lg bg-rose-500/10 p-2.5 text-rose-400 border border-rose-500/30">
						{createError}
					</div>
				{/if}

				<div class="flex flex-col gap-1">
					<label for="app-name-input" class="font-semibold text-slate-300">Nama Aplikasi Enterprise</label>
					<input
						id="app-name-input"
						type="text"
						placeholder="contoh: Sistem Pengadaan Barang & Jasa"
						value={newAppName}
						oninput={(e) => handleNameChange((e.target as HTMLInputElement).value)}
						required
						class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="app-slug-input" class="font-semibold text-slate-300">Slug URL Unik</label>
					<input
						id="app-slug-input"
						type="text"
						bind:value={newAppSlug}
						required
						class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
					/>
					<span class="text-[10px] text-slate-500 font-mono">URL akses: /app/{newAppSlug || 'nama-slug'}</span>
				</div>

				<div class="flex flex-col gap-1">
					<label for="app-desc-input" class="font-semibold text-slate-300">Deskripsi / Ruang Lingkup</label>
					<textarea
						id="app-desc-input"
						bind:value={newAppDesc}
						rows="3"
						placeholder="Jelaskan tujuan dan modul aplikasi..."
						class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none resize-none"
					></textarea>
				</div>

				<div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="rounded-lg px-4 py-2 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
					>
						Batal
					</button>

					<button
						type="submit"
						disabled={creating}
						class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50"
					>
						{#if creating}
							<RefreshCw class="h-3.5 w-3.5 animate-spin" />
							<span>Menyimpan...</span>
						{:else}
							<span>Buat Aplikasi</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
