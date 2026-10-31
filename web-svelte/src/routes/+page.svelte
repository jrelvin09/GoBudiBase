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
		Trees
	} from 'lucide-svelte';

	type MainMode = 'pims' | 'runtime' | 'studio_apps' | 'studio_designer' | 'sql_studio' | 'catalog';

	let currentMode = $state<MainMode>('pims');
	let activeAppSlug = $state<string>('bmn-enterprise');
	let targetPageSlug = $state<string>('');
	let currentUser = $state<PimsUser | null>(null);

	function handleOpenDesigner(slug: string) {
		activeAppSlug = slug;
		currentMode = 'studio_designer';
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Platform Mode Switcher Bar -->
	<div class="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow-xl backdrop-blur">
		<div class="flex flex-wrap items-center gap-1.5">
			<!-- Mode Harvest Cloud (Oracle APEX Clone) -->
			<button
				type="button"
				onclick={() => (currentMode = 'pims')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer {currentMode === 'pims' ? 'bg-[#026cb6] text-white shadow-lg shadow-[#026cb6]/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Trees class="h-4 w-4" />
				<span>Harvest Cloud (PIMS APEX)</span>
			</button>

			<!-- Mode Runtime (End-User) -->
			<button
				type="button"
				onclick={() => (currentMode = 'runtime')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'runtime' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Play class="h-4 w-4 fill-current" />
				<span>App Runtime</span>
			</button>

			<!-- Mode Studio (Developer / App Builder) -->
			<button
				type="button"
				onclick={() => (currentMode = 'studio_apps')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer {currentMode === 'studio_apps' || currentMode === 'studio_designer' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Edit3 class="h-4 w-4" />
				<span>Page Designer Studio</span>
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

		<!-- Status Label -->
		<div class="hidden items-center gap-2 pr-3 sm:flex">
			<span class="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-400 border border-slate-700/60">
				{#if currentMode === 'pims'}
					Target: <strong class="text-sky-400">PIMS 103 (10.10.1.106:8181)</strong>
				{:else if currentMode === 'runtime'}
					Active App: <strong class="text-emerald-400">{activeAppSlug}</strong>
				{:else if currentMode === 'studio_designer'}
					Designer: <strong class="text-emerald-400">{activeAppSlug}</strong>
				{:else if currentMode === 'studio_apps'}
					App Catalog
				{:else if currentMode === 'catalog'}
					UI Kit Catalog (71)
				{:else}
					PostgreSQL 17.11
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
					onOpenStudio={() => (currentMode = 'studio_designer')}
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
			<AppManager onOpenAppDesigner={handleOpenDesigner} />
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
