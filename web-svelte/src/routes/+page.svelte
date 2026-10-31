<script lang="ts">
	import DynamicAppRuntime from '$lib/runtime/DynamicAppRuntime.svelte';
	import AppManager from '$lib/studio/AppManager.svelte';
	import PageDesigner from '$lib/studio/PageDesigner.svelte';
	import SqlStudio from '$lib/studio/SqlStudio.svelte';
	import ComponentCatalog from '$lib/studio/ComponentCatalog.svelte';
	import PimsLogin from '$lib/pims/PimsLogin.svelte';
	import PimsPortal from '$lib/pims/PimsPortal.svelte';
	import type { PimsUser } from '$lib/pims/types';
	import {
		Play,
		Edit3,
		Terminal,
		Layers,
		CheckCircle2,
		Puzzle,
		Trees,
		ChevronDown
	} from 'lucide-svelte';

	type MainMode = 'pims' | 'runtime' | 'studio_apps' | 'studio_designer' | 'sql_studio' | 'catalog';

	let currentMode = $state<MainMode>('studio_designer');
	let activeAppSlug = $state<string>('gopimsbase');
	let targetPageSlug = $state<string>('');
	let currentUser = $state<PimsUser | null>(null);

	function handleOpenDesigner(slug: string) {
		activeAppSlug = slug;
		currentMode = 'studio_designer';
	}

	function handleOpenRuntime(slug: string) {
		activeAppSlug = slug;
		currentMode = 'runtime';
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Platform Mode Switcher Bar -->
	<div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 shadow-xl backdrop-blur">
		<div class="flex flex-wrap items-center gap-1.5">
			<!-- Mode Studio Designer (Highlight GoPimsBase Designer) -->
			<button
				type="button"
				onclick={() => (currentMode = 'studio_designer')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer {currentMode === 'studio_designer' ? 'bg-[#026cb6] text-white shadow-lg shadow-[#026cb6]/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Edit3 class="h-4 w-4" />
				<span>Page Designer ({activeAppSlug === 'gopimsbase' ? 'GoPimsBase' : activeAppSlug})</span>
			</button>

			<!-- Mode Studio Apps Catalog -->
			<button
				type="button"
				onclick={() => (currentMode = 'studio_apps')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'studio_apps' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Layers class="h-4 w-4" />
				<span>Katalog Aplikasi</span>
			</button>

			<!-- Mode Runtime (End-User Preview) -->
			<button
				type="button"
				onclick={() => (currentMode = 'runtime')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'runtime' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Play class="h-4 w-4 fill-current" />
				<span>App Runtime</span>
			</button>

			<!-- Mode Harvest Cloud (Oracle APEX Direct Portal) -->
			<button
				type="button"
				onclick={() => (currentMode = 'pims')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'pims' ? 'bg-sky-700 text-white shadow-lg shadow-sky-700/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Trees class="h-4 w-4" />
				<span>PIMS Portal (APEX Clone)</span>
			</button>

			<!-- Mode SQL Studio -->
			<button
				type="button"
				onclick={() => (currentMode = 'sql_studio')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'sql_studio' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Terminal class="h-4 w-4" />
				<span>SQL & Schema Studio</span>
			</button>

			<!-- Mode UI Kit Catalog (71 Komponen) -->
			<button
				type="button"
				onclick={() => (currentMode = 'catalog')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'catalog' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Puzzle class="h-4 w-4" />
				<span>UI Kit (71)</span>
			</button>
		</div>

		<!-- Right Side: Active App Dropdown Switcher & Status -->
		<div class="flex items-center gap-2 pr-2">
			<!-- App Switcher Dropdown -->
			<div class="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 shadow-inner">
				<span class="text-[11px] font-semibold text-slate-400">Aplikasi:</span>
				<select
					value={activeAppSlug}
					onchange={(e) => {
						activeAppSlug = (e.target as HTMLSelectElement).value;
					}}
					class="bg-transparent text-xs font-bold text-sky-400 focus:outline-none cursor-pointer pr-1"
				>
					<option value="gopimsbase" class="bg-slate-900 text-slate-200">Harvest Cloud - PIMS (GoPimsBase)</option>
					<option value="bmn-enterprise" class="bg-slate-900 text-slate-200">Sistem BMN Enterprise</option>
				</select>
			</div>

			<span class="hidden rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] font-mono text-slate-400 border border-slate-700/60 lg:inline-block">
				{#if currentMode === 'pims'}
					Target: <strong class="text-sky-400">PIMS 103 (10.10.1.106:8181)</strong>
				{:else if currentMode === 'runtime'}
					Runtime: <strong class="text-emerald-400">{activeAppSlug}</strong>
				{:else if currentMode === 'studio_designer'}
					Designer: <strong class="text-sky-400">{activeAppSlug}</strong>
				{:else if currentMode === 'studio_apps'}
					Katalog Aplikasi
				{:else if currentMode === 'catalog'}
					UI Kit Catalog (71)
				{:else}
					PostgreSQL 17.11 (schema pims)
				{/if}
			</span>
		</div>
	</div>

	<!-- Mode Content Viewport -->
	<div class="w-full">
		{#if currentMode === 'pims'}
			{#if !currentUser}
				<PimsLogin onLoginSuccess={(user) => (currentUser = user)} />
			{:else}
				<PimsPortal
					{currentUser}
					onLogout={() => (currentUser = null)}
					onOpenStudio={() => {
						activeAppSlug = 'gopimsbase';
						currentMode = 'studio_designer';
					}}
				/>
			{/if}
		{:else if currentMode === 'runtime'}
			<DynamicAppRuntime
				appSlug={activeAppSlug}
				initialPageSlug={targetPageSlug}
				onOpenStudio={() => {
					currentMode = 'studio_designer';
				}}
			/>
		{:else if currentMode === 'studio_apps'}
			<AppManager
				onOpenAppDesigner={handleOpenDesigner}
				onOpenAppRuntime={handleOpenRuntime}
			/>
		{:else if currentMode === 'studio_designer'}
			<PageDesigner
				appSlug={activeAppSlug}
				onBack={() => (currentMode = 'studio_apps')}
				onRun={(slug?: string) => {
					if (slug) targetPageSlug = slug;
					currentMode = 'runtime';
				}}
			/>
		{:else if currentMode === 'sql_studio'}
			<SqlStudio />
		{:else if currentMode === 'catalog'}
			<ComponentCatalog
				onOpenDesigner={(slug) => {
					activeAppSlug = slug;
					currentMode = 'studio_designer';
				}}
				onOpenRuntime={(slug) => {
					activeAppSlug = slug;
					currentMode = 'runtime';
				}}
			/>
		{/if}
	</div>
</div>
