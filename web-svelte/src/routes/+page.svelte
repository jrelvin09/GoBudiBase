<script lang="ts">
	import DynamicAppRuntime from '$lib/runtime/DynamicAppRuntime.svelte';
	import AppManager from '$lib/studio/AppManager.svelte';
	import PageDesigner from '$lib/studio/PageDesigner.svelte';
	import SqlStudio from '$lib/studio/SqlStudio.svelte';
	import ComponentCatalog from '$lib/studio/ComponentCatalog.svelte';
	import {
		LayoutDashboard,
		Play,
		Edit3,
		Terminal,
		Layers,
		CheckCircle2,
		Puzzle
	} from 'lucide-svelte';

	type MainMode = 'runtime' | 'studio_apps' | 'studio_designer' | 'sql_studio' | 'catalog';

	let currentMode = $state<MainMode>('runtime');
	let activeAppSlug = $state<string>('bmn-enterprise');

	function handleOpenDesigner(slug: string) {
		activeAppSlug = slug;
		currentMode = 'studio_designer';
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Platform Mode Switcher Bar -->
	<div class="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow-xl backdrop-blur">
		<div class="flex items-center gap-1.5">
			<!-- Mode Runtime (End-User) -->
			<button
				type="button"
				onclick={() => (currentMode = 'runtime')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition {currentMode === 'runtime' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Play class="h-4 w-4 fill-current" />
				<span>App Runtime</span>
			</button>

			<!-- Mode Studio (Developer / App Builder) -->
			<button
				type="button"
				onclick={() => (currentMode = 'studio_apps')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition {currentMode === 'studio_apps' || currentMode === 'studio_designer' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Edit3 class="h-4 w-4" />
				<span>Page Designer Studio</span>
			</button>

			<!-- Mode SQL Studio -->
			<button
				type="button"
				onclick={() => (currentMode = 'sql_studio')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition {currentMode === 'sql_studio' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Terminal class="h-4 w-4" />
				<span>SQL & Schema Studio</span>
			</button>

			<!-- Mode UI Kit Catalog (71 Komponen) -->
			<button
				type="button"
				onclick={() => (currentMode = 'catalog')}
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition {currentMode === 'catalog' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
			>
				<Puzzle class="h-4 w-4" />
				<span>UI Kit (71 Komponen)</span>
			</button>
		</div>

		<!-- Status Label -->
		<div class="hidden items-center gap-2 pr-3 sm:flex">
			<span class="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-400 border border-slate-700/60">
				{#if currentMode === 'runtime'}
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
		{#if currentMode === 'runtime'}
			<DynamicAppRuntime
				appSlug={activeAppSlug}
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
			/>
		{:else if currentMode === 'sql_studio'}
			<SqlStudio />
		{:else if currentMode === 'catalog'}
			<ComponentCatalog />
		{/if}
	</div>
</div>
