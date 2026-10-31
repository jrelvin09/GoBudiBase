<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { RuntimePage } from '$lib/api/builderClient';
	import {
		Layers,
		FileText,
		ChevronDown,
		ChevronRight,
		Folder,
		FolderOpen,
		Search,
		Menu,
		X,
		PanelLeftClose,
		PanelLeftOpen,
		Compass,
		Layout,
		Edit3,
		Sparkles,
		TableProperties,
		Grid3X3,
		Calendar,
		MapPin,
		FolderTree,
		Filter,
		ShieldCheck,
		Database,
		SquareKanban,
		ExternalLink,
		RefreshCw
	} from 'lucide-svelte';

	let {
		pages = [],
		activeSlug = '',
		appName = 'GoBudiBase Application',
		appVersion = '2.0.0',
		onSelectPage,
		onOpenStudio,
		onRefresh,
		children
	}: {
		pages: RuntimePage[];
		activeSlug: string;
		appName?: string;
		appVersion?: string;
		onSelectPage: (slug: string) => void;
		onOpenStudio?: () => void;
		onRefresh?: () => void;
		children?: Snippet;
	} = $props();

	// Navigation Preferences
	let navMode = $state<'side' | 'top'>('side');
	let isCollapsed = $state(false);
	let mobileDrawerOpen = $state(false);
	let menuSearch = $state('');

	// Accordion state for group sections & parent menus
	let expandedGroups = $state<Record<string, boolean>>({});
	let expandedParents = $state<Record<string, boolean>>({});

	// Dynamic Icon resolver based on page icon or slug keywords
	function getPageIcon(page: RuntimePage) {
		const s = (page.slug || '').toLowerCase();
		const t = (page.title || '').toLowerCase();
		if (s.includes('kanban') || t.includes('kanban')) return SquareKanban;
		if (s.includes('grid') || s.includes('registry') || t.includes('inventaris')) return TableProperties;
		if (s.includes('pivot') || s.includes('analytics') || t.includes('analitik')) return Grid3X3;
		if (s.includes('sla') || s.includes('calendar') || t.includes('kalender')) return Calendar;
		if (s.includes('gis') || s.includes('map') || t.includes('peta')) return MapPin;
		if (s.includes('tree') || t.includes('pohon')) return FolderTree;
		if (s.includes('bast') || t.includes('pengesahan')) return ShieldCheck;
		if (s.includes('alloc') || s.includes('shuttle')) return Filter;
		return FileText;
	}

	// Group pages by group_name, and identify top-level vs sub-menu children
	interface MenuGroup {
		name: string;
		parents: RuntimePage[];
		childrenMap: Record<string, RuntimePage[]>; // parent_slug -> children
	}

	const menuGroups = $derived.by<MenuGroup[]>(() => {
		const groups: Record<string, MenuGroup> = {};

		// 1. Filter by search query if any
		const filtered = menuSearch.trim()
			? pages.filter(
					(p) =>
						p.title.toLowerCase().includes(menuSearch.toLowerCase()) ||
						p.slug.toLowerCase().includes(menuSearch.toLowerCase()) ||
						(p.group_name || '').toLowerCase().includes(menuSearch.toLowerCase())
				)
			: pages;

		for (const page of filtered) {
			const groupName = page.group_name || 'Menu Utama';
			if (!groups[groupName]) {
				groups[groupName] = {
					name: groupName,
					parents: [],
					childrenMap: {}
				};
			}

			if (page.parent_slug) {
				if (!groups[groupName].childrenMap[page.parent_slug]) {
					groups[groupName].childrenMap[page.parent_slug] = [];
				}
				groups[groupName].childrenMap[page.parent_slug].push(page);
			} else {
				groups[groupName].parents.push(page);
			}
		}

		return Object.values(groups);
	});

	// Auto-expand groups by default
	$effect(() => {
		for (const g of menuGroups) {
			if (expandedGroups[g.name] === undefined) {
				expandedGroups[g.name] = true;
			}
		}
	});

	function toggleGroup(groupName: string) {
		expandedGroups[groupName] = !expandedGroups[groupName];
	}

	function toggleParent(slug: string) {
		expandedParents[slug] = !expandedParents[slug];
	}
</script>

<div class="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
	<!-- TOP APP HEADER BAR -->
	<header class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur shadow-md">
		<div class="flex items-center gap-3">
			<!-- Mobile Hamburger Toggle -->
			<button
				type="button"
				onclick={() => (mobileDrawerOpen = !mobileDrawerOpen)}
				class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
				title="Toggle Navigation Menu"
			>
				{#if mobileDrawerOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>

			<!-- Desktop Sidebar Collapse Toggle -->
			{#if navMode === 'side'}
				<button
					type="button"
					onclick={() => (isCollapsed = !isCollapsed)}
					class="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition lg:flex"
					title={isCollapsed ? 'Perlebar Sidebar (Expand)' : 'Kecilkan Sidebar (Collapse)'}
				>
					{#if isCollapsed}
						<PanelLeftOpen class="h-4 w-4" />
					{:else}
						<PanelLeftClose class="h-4 w-4" />
					{/if}
				</button>
			{/if}

			<!-- App Logo & Branding -->
			<div class="flex items-center gap-2.5 select-none">
				<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 font-black text-xs text-white shadow-md shadow-emerald-600/30">
					GB
				</div>
				<div class="flex flex-col leading-tight">
					<div class="flex items-center gap-2">
						<span class="text-xs font-bold text-slate-100 tracking-wide">{appName}</span>
						<span class="rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
							v{appVersion}
						</span>
					</div>
					<span class="text-[10px] text-slate-400 hidden sm:inline">Oracle APEX & Budibase Enterprise Parity</span>
				</div>
			</div>
		</div>

		<!-- Right Controls & Navigation Mode Switcher -->
		<div class="flex items-center gap-2">
			<!-- Mode Selector: Side Menu vs Top Menu -->
			<div class="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 text-xs font-medium">
				<button
					type="button"
					onclick={() => (navMode = 'side')}
					class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition {navMode === 'side' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'}"
					title="Tampilan Navigasi Sidebar Kiri"
				>
					<Layout class="h-3 w-3" />
					<span>Side Menu</span>
				</button>
				<button
					type="button"
					onclick={() => (navMode = 'top')}
					class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition {navMode === 'top' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'}"
					title="Tampilan Navigasi Top Bar Dropdown"
				>
					<Compass class="h-3 w-3" />
					<span>Top Menu</span>
				</button>
			</div>

			<!-- Open Studio Builder Button -->
			{#if onOpenStudio}
				<button
					type="button"
					onclick={onOpenStudio}
					class="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-300 transition shadow-sm"
					title="Buka Halaman ini di Visual Basic RAD Studio Designer"
				>
					<Edit3 class="h-3.5 w-3.5 text-emerald-400" />
					<span class="hidden md:inline">Edit in Studio</span>
				</button>
			{/if}

			{#if onRefresh}
				<button
					type="button"
					onclick={onRefresh}
					class="rounded-xl border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
					title="Refresh Runtime Metadata"
				>
					<RefreshCw class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	</header>

	<!-- TOP NAVIGATION BAR (IF TOP MENU MODE ACTIVE) -->
	{#if navMode === 'top'}
		<nav class="sticky top-14 z-30 flex items-center gap-1 border-b border-slate-800 bg-slate-900/90 px-4 py-1.5 shadow-md backdrop-blur overflow-x-auto text-xs">
			{#each menuGroups as group}
				<!-- Dropdown Group Button -->
				<div class="relative group/topmenu shrink-0">
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition"
					>
						<span>{group.name}</span>
						<ChevronDown class="h-3 w-3 text-slate-400 group-hover/topmenu:rotate-180 transition-transform" />
					</button>

					<!-- Dropdown Sub-menu Popover -->
					<div class="invisible group-hover/topmenu:visible absolute top-full left-0 mt-1 min-w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur flex flex-col gap-0.5 z-50 transition-all opacity-0 group-hover/topmenu:opacity-100">
						{#each group.parents as parent}
							{@const Icon = getPageIcon(parent)}
							{@const isActive = activeSlug === parent.slug}
							{@const hasChildren = group.childrenMap[parent.slug]?.length > 0}

							<button
								type="button"
								onclick={() => onSelectPage(parent.slug)}
								class="flex items-center justify-between rounded-lg px-3 py-2 text-xs transition text-left {isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}"
							>
								<div class="flex items-center gap-2">
									<Icon class="h-3.5 w-3.5 {isActive ? 'text-white' : 'text-emerald-400'}" />
									<span>{parent.title}</span>
								</div>
								{#if hasChildren}
									<span class="text-[9px] font-mono text-slate-400 font-normal">sub-menu</span>
								{/if}
							</button>

							<!-- Render Children sub-items -->
							{#if hasChildren}
								{#each group.childrenMap[parent.slug] as child}
									{@const isChildActive = activeSlug === child.slug}
									<button
										type="button"
										onclick={() => onSelectPage(child.slug)}
										class="flex items-center gap-2 rounded-lg pl-7 pr-3 py-1.5 text-[11px] transition text-left {isChildActive ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
									>
										<span class="text-slate-500">↳</span>
										<span>{child.title}</span>
									</button>
								{/each}
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</nav>
	{/if}

	<!-- MAIN WORKSPACE: SIDEBAR + CONTENT CONTAINER -->
	<div class="flex flex-1 overflow-hidden">
		<!-- SIDEBAR NAVIGATION MENU (IF SIDE MENU MODE) -->
		{#if navMode === 'side'}
			<aside
				class="sticky top-14 h-[calc(100vh-3.5rem)] flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur transition-all duration-300 select-none {isCollapsed ? 'w-16' : 'w-64'} {mobileDrawerOpen ? 'flex fixed inset-y-0 left-0 z-50 w-72 bg-slate-950' : 'hidden lg:flex'}"
			>
				<!-- Menu Search Input (when not collapsed) -->
				{#if !isCollapsed}
					<div class="p-3 border-b border-slate-800/80">
						<div class="relative">
							<Search class="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
							<input
								type="text"
								placeholder="Cari menu & sub-menu..."
								bind:value={menuSearch}
								class="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
							/>
						</div>
					</div>
				{/if}

				<!-- Hierarchical Menu Navigation List -->
				<div class="flex-1 overflow-y-auto p-2 space-y-4">
					{#each menuGroups as group}
						{@const isGroupExpanded = !!expandedGroups[group.name]}
						<div class="flex flex-col">
							<!-- Group Section Header -->
							{#if !isCollapsed}
								<button
									type="button"
									onclick={() => toggleGroup(group.name)}
									class="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition cursor-pointer"
								>
									<span>{group.name}</span>
									<div class="flex items-center gap-1">
										<span class="rounded bg-slate-800 px-1 py-0.2 text-[9px] font-mono text-slate-400">
											{group.parents.length}
										</span>
										<ChevronDown class="h-3 w-3 transition-transform duration-200 {isGroupExpanded ? '' : '-rotate-90'}" />
									</div>
								</button>
							{/if}

							<!-- Group Items -->
							{#if isGroupExpanded || isCollapsed}
								<div class="mt-1 flex flex-col gap-0.5">
									{#each group.parents as parent}
										{@const Icon = getPageIcon(parent)}
										{@const isActive = activeSlug === parent.slug}
										{@const children = group.childrenMap[parent.slug] || []}
										{@const hasChildren = children.length > 0}
										{@const isParentExpanded = !!expandedParents[parent.slug]}

										<!-- Parent Menu Link Button -->
										<div class="flex flex-col">
											<div class="flex items-center justify-between rounded-xl transition {isActive ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}">
												<button
													type="button"
													onclick={() => onSelectPage(parent.slug)}
													class="flex flex-1 items-center gap-2.5 px-3 py-2 text-xs text-left truncate cursor-pointer"
													title={parent.title}
												>
													<Icon class="h-4 w-4 shrink-0 {isActive ? 'text-white' : 'text-emerald-400'}" />
													{#if !isCollapsed}
														<span class="truncate">{parent.title}</span>
													{/if}
												</button>

												<!-- Submenu Accordion Toggle Chevron -->
												{#if hasChildren && !isCollapsed}
													<button
														type="button"
														onclick={() => toggleParent(parent.slug)}
														class="p-2 text-slate-400 hover:text-white cursor-pointer"
														title="Buka / Tutup Sub-menu"
													>
														<ChevronDown class="h-3.5 w-3.5 transition-transform duration-200 {isParentExpanded ? '' : '-rotate-90'}" />
													</button>
												{/if}
											</div>

											<!-- Sub-menu Nested Children (Indented) -->
											{#if hasChildren && isParentExpanded && !isCollapsed}
												<div class="ml-4 pl-2 border-l border-slate-800/80 mt-0.5 flex flex-col gap-0.5">
													{#each children as child}
														{@const isChildActive = activeSlug === child.slug}
														{@const ChildIcon = getPageIcon(child)}
														<button
															type="button"
															onclick={() => onSelectPage(child.slug)}
															class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition {isChildActive ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}"
															title={child.title}
														>
															<ChildIcon class="h-3 w-3 {isChildActive ? 'text-emerald-400' : 'text-slate-500'}" />
															<span class="truncate">{child.title}</span>
														</button>
													{/each}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Sidebar Footer Info -->
				<div class="border-t border-slate-800 p-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
					{#if !isCollapsed}
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
							<span>{pages.length} Pages Live</span>
						</div>
					{:else}
						<div class="w-full flex justify-center">
							<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						</div>
					{/if}
				</div>
			</aside>
		{/if}

		<!-- MAIN PAGE CONTENT VIEWPORT -->
		<main class="flex-1 overflow-y-auto p-6 lg:p-8">
			{@render children?.()}
		</main>
	</div>
</div>
