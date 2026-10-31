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
		LayoutDashboard,
		Trees,
		Play,
		Search,
		ShieldCheck
	} from 'lucide-svelte';

	let {
		onOpenAppDesigner,
		onOpenAppRuntime
	}: {
		onOpenAppDesigner: (appSlug: string) => void;
		onOpenAppRuntime?: (appSlug: string) => void;
	} = $props();

	let apps = $state<AppListItem[]>([]);
	let loading = $state(false);
	let showCreateModal = $state(false);
	let searchQuery = $state('');

	// New App Form State
	let newAppName = $state('');
	let newAppSlug = $state('');
	let newAppDesc = $state('');
	let creating = $state(false);
	let createError = $state('');

	const filteredApps = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return apps;
		return apps.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.slug.toLowerCase().includes(q) ||
				(a.description || '').toLowerCase().includes(q)
		);
	});

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

		<div class="flex flex-wrap items-center gap-3">
			<div class="relative min-w-[260px]">
				<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari aplikasi (GoPimsBase, PIMS, BMN)..."
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition"
				/>
			</div>

			<button
				type="button"
				onclick={loadApps}
				disabled={loading}
				class="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>

			<button
				type="button"
				onclick={() => (showCreateModal = true)}
				class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition cursor-pointer"
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
	{:else if filteredApps.length === 0}
		<div class="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-8 text-center">
			<Layers class="h-10 w-10 text-slate-600 mb-3" />
			<h4 class="text-sm font-bold text-slate-300">
				{searchQuery ? `Tidak ada aplikasi yang cocok dengan "${searchQuery}"` : 'Belum Ada Aplikasi Terdaftar'}
			</h4>
			<p class="text-xs text-slate-500 mt-1 max-w-sm">
				{searchQuery ? 'Coba kata kunci lain seperti "pims" atau klik refresh.' : 'Klik tombol "Buat Aplikasi Baru" untuk memulai membangun aplikasi low-code pertama Anda.'}
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
			{#each filteredApps as app}
				{@const isPims = app.slug === 'gopimsbase' || app.icon === 'Trees'}
				<div class="group flex flex-col justify-between rounded-2xl border {isPims ? 'border-sky-500/40 bg-slate-900/80 shadow-sky-950/20' : 'border-slate-800 bg-slate-900/60 shadow-xl'} p-6 transition hover:border-slate-700 hover:bg-slate-900/90 backdrop-blur">
					<div>
						<!-- Card Top -->
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div class="flex h-12 w-12 items-center justify-center rounded-xl {isPims ? 'bg-[#026cb6]/20 text-[#38bdf8] border border-sky-500/30' : 'bg-slate-800 text-emerald-400'} group-hover:scale-105 transition">
									{#if isPims}
										<Trees class="h-6 w-6" />
									{:else}
										<Layers class="h-6 w-6" />
									{/if}
								</div>
								<div>
									<div class="flex items-center gap-2">
										<h3 class="text-base font-bold text-slate-100 {isPims ? 'group-hover:text-sky-300' : 'group-hover:text-emerald-300'} transition">
											{app.name}
										</h3>
									</div>
									<span class="font-mono text-[11px] {isPims ? 'text-sky-400' : 'text-emerald-400'}">slug: {app.slug}</span>
								</div>
							</div>
							
							<div class="flex items-center gap-1.5">
								{#if isPims}
									<span class="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-400 border border-sky-500/20">
										APEX CLONE
									</span>
								{/if}
								<span class="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
									v{app.version || '1.0.0'}
								</span>
							</div>
						</div>

						<div class="mt-4">
							<p class="text-xs text-slate-400 leading-relaxed">{app.description || 'Tidak ada deskripsi.'}</p>
						</div>

						<div class="mt-5 flex items-center gap-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
							<div class="flex items-center gap-1.5 font-mono">
								<FileText class="h-3.5 w-3.5 {isPims ? 'text-sky-400' : 'text-slate-400'}" />
								<span><strong class="text-slate-200">{app.page_count}</strong> Halaman Terdaftar</span>
							</div>
							<div class="flex items-center gap-1.5 font-mono">
								<Database class="h-3.5 w-3.5 {isPims ? 'text-sky-400' : 'text-slate-400'}" />
								<span>PostgreSQL 17 {isPims ? '(schema pims)' : '(schema bmn)'}</span>
							</div>
						</div>
					</div>

					<!-- Card Actions -->
					<div class="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
						<button
							type="button"
							onclick={() => onOpenAppDesigner(app.slug)}
							class="flex flex-1 items-center justify-center gap-2 rounded-xl {isPims ? 'bg-[#026cb6] hover:bg-[#025a99] text-white shadow-lg shadow-[#026cb6]/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'} px-4 py-2 text-xs font-bold transition cursor-pointer"
						>
							<Edit3 class="h-4 w-4" />
							<span>Buka Page Designer</span>
						</button>

						{#if onOpenAppRuntime}
							<button
								type="button"
								onclick={() => onOpenAppRuntime?.(app.slug)}
								class="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
								title="Jalankan runtime aplikasi"
							>
								<Play class="h-3.5 w-3.5 fill-current text-slate-400" />
								<span>Run App</span>
							</button>
						{/if}
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
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
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
						class="rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-2 font-semibold text-slate-300 hover:bg-slate-700"
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
							<span>Simpan Aplikasi</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
