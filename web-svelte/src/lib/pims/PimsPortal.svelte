<script lang="ts">
	import { onMount } from 'svelte';
	import type { PimsNavNode, PimsUser } from './types';
	import { fetchRuntimeApp, type RuntimePage } from '$lib/api/builderClient';
	import navNodesRaw from '$lib/assets/pims_nav_tree.json';
	import PimsDashboard from './PimsDashboard.svelte';
	import PimsGridPage from './PimsGridPage.svelte';
	import PimsProfileModal from './PimsProfileModal.svelte';
	import SetupUserInformations from './setup/SetupUserInformations.svelte';
	import SetupUserMenus from './setup/SetupUserMenus.svelte';
	import SetupRoleManagement from './setup/SetupRoleManagement.svelte';
	import SetupApprovalHierarchy from './setup/SetupApprovalHierarchy.svelte';
	import SetupResetPassword from './setup/SetupResetPassword.svelte';
	import KonfigurasiSetupHub from './setup/KonfigurasiSetupHub.svelte';
	import harvestLogo from '$lib/assets/HarvestCloud512.png';
	import {
		Menu,
		X,
		Search,
		ChevronDown,
		ChevronRight,
		Folder,
		FolderOpen,
		FileText,
		Home,
		List,
		Calendar,
		Settings,
		RotateCcw,
		Users,
		Database,
		Network,
		Globe,
		Sliders,
		HelpCircle,
		LogOut,
		User as UserIcon,
		Building2,
		Sparkles,
		PanelLeftClose,
		PanelLeftOpen,
		ArrowRight
	} from 'lucide-svelte';

	let {
		currentUser,
		onLogout,
		onOpenStudio
	}: {
		currentUser: PimsUser;
		onLogout: () => void;
		onOpenStudio?: () => void;
	} = $props();

	// Parse & organize nav nodes tree from JSON
	const rawNodes = navNodesRaw as PimsNavNode[];

	// Build tree hierarchy
	function buildNavTree(nodes: PimsNavNode[]): PimsNavNode[] {
		const nodeMap = new Map<string, PimsNavNode>();
		const roots: PimsNavNode[] = [];

		nodes.forEach((n) => {
			nodeMap.set(n.label, { ...n, children: [] });
		});

		nodes.forEach((n) => {
			const item = nodeMap.get(n.label);
			if (!item) return;

			if (!n.parent || n.depth === 0) {
				roots.push(item);
			} else {
				const parent = nodeMap.get(n.parent);
				if (parent) {
					if (!parent.children) parent.children = [];
					parent.children.push(item);
				} else {
					roots.push(item);
				}
			}
		});

		return roots;
	}

	const navTree = buildNavTree(rawNodes);

	// State
	let selectedNode = $state<PimsNavNode>(rawNodes[0] || {
		id: 't_TreeNav_0',
		label: 'Dashboard',
		parent: '',
		depth: 0,
		href: '',
		pageId: 'home',
		icon: 'fa fa-home',
		isExpandable: false,
		isLeaf: true
	});

	let sidebarCollapsed = $state(false);
	let mobileSidebarOpen = $state(false);
	let menuSearch = $state('');
	let globalSearch = $state('');
	let showGlobalSearchResults = $state(false);
	let userDropdownOpen = $state(false);
	let showProfileModal = $state(false);
	let resetPasswordPrefillUser = $state('');
	let expandedFolders = $state<Record<string, boolean>>({
		'Transaction': true,
		'Periodic': false,
		'Report': false,
		'Inquiries': false,
		'Setup': false,
		'HCM Data': false,
		'Master Data': false,
		'Data Integrations': false,
		'Konfigurasi Setup': true
	});

	function toggleFolder(label: string) {
		expandedFolders[label] = !expandedFolders[label];
	}

	let runtimePages = $state<RuntimePage[]>([]);

	onMount(async () => {
		try {
			const app = await fetchRuntimeApp('gopimsbase');
			if (app && app.pages) {
				runtimePages = app.pages;
			}
		} catch (e) {
			console.warn('Could not load runtime pages for portal:', e);
		}
	});

	function findCustomPage(label: string): RuntimePage | null {
		if (!label || runtimePages.length === 0) return null;
		const l = label.toLowerCase();
		return (
			runtimePages.find((p) => {
				const pt = p.title.toLowerCase();
				const ps = p.slug.toLowerCase();
				if (pt === l || pt.includes(l) || l.includes(pt)) return true;
				if (l === 'setup informasi user' && ps === 'setup-user-informations') return true;
				if (l === 'setup menu user' && ps === 'setup-user-menus') return true;
				if (l === 'setup akses halaman' && ps === 'role-management') return true;
				if (l === 'setup approval hierarchy' && ps === 'approval-hierarchy') return true;
				if (l === 'reset password' && ps === 'reset-password') return true;
				if (l === 'dashboard' && ps === 'dashboard') return true;
				return false;
			}) || null
		);
	}

	const activeCustomPage = $derived.by(() => findCustomPage(selectedNode.label));

	function handleSelectNode(node: PimsNavNode) {
		selectedNode = node;
		mobileSidebarOpen = false;
		showGlobalSearchResults = false;
		globalSearch = '';
	}

	function handleSelectMenuByLabel(label: string) {
		const match = rawNodes.find((n) => n.label.toLowerCase() === label.toLowerCase());
		if (match) {
			handleSelectNode(match);
		}
	}

	// Filter nodes based on global search
	const globalSearchMatches = $derived(
		globalSearch.trim().length > 1
			? rawNodes.filter((n) =>
					n.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
					(n.parent && n.parent.toLowerCase().includes(globalSearch.toLowerCase()))
				).slice(0, 8)
			: []
	);

	// Filter nav items in sidebar
	function matchesSidebarSearch(node: PimsNavNode): boolean {
		if (menuSearch.trim() === '') return true;
		const query = menuSearch.toLowerCase();
		if (node.label.toLowerCase().includes(query)) return true;
		if (node.children && node.children.some(matchesSidebarSearch)) return true;
		return false;
	}

	// Icon selector matching APEX FontApex
	function getCategoryIcon(label: string) {
		switch (label) {
			case 'Dashboard': return Home;
			case 'Transaction': return List;
			case 'Reverse Inventory Adjustment': return RotateCcw;
			case 'Periodic': return Calendar;
			case 'Report': return FileText;
			case 'Inquiries': return HelpCircle;
			case 'Setup': return Sliders;
			case 'HCM Data': return Users;
			case 'Master Data': return Database;
			case 'Data Integrations': return Network;
			case 'Konfigurasi Setup': return Settings;
			default: return Folder;
		}
	}
</script>

<div class="relative flex min-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] text-slate-800 shadow-xl">
	<!-- Top Navigation Bar (APEX Redwood Light Theme) -->
	<header class="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
		<!-- Left: Hamburger & Brand Title -->
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => {
					sidebarCollapsed = !sidebarCollapsed;
					mobileSidebarOpen = !mobileSidebarOpen;
				}}
				class="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
				title="Toggle Sidebar"
			>
				<Menu class="h-5 w-5" />
			</button>

			<button
				type="button"
				class="flex items-center gap-2.5 cursor-pointer text-left"
				onclick={() => handleSelectMenuByLabel('Dashboard')}
			>
				<img
					src={harvestLogo}
					alt="Harvest Cloud Logo"
					class="h-8 w-8 object-contain"
				/>
				<div>
					<div class="flex items-center gap-1.5 leading-none">
						<span class="text-sm font-bold tracking-tight text-slate-900">Harvest Cloud</span>
						<span class="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#026cb6]">
							PIMS
						</span>
					</div>
					<span class="text-[10px] text-slate-400">Oracle APEX 24.2 Parity</span>
				</div>
			</button>
		</div>

		<!-- Center: Global Menu Quick Search -->
		<div class="relative hidden max-w-md flex-1 px-4 md:block">
			<div class="relative">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
					<Search class="h-3.5 w-3.5" />
				</div>
				<input
					type="text"
					bind:value={globalSearch}
					onfocus={() => (showGlobalSearchResults = true)}
					placeholder="Cari dari 160 menu PIMS (e.g. TO Plan, Insentif, BJR)..."
					class="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#026cb6] focus:bg-white focus:ring-1 focus:ring-[#026cb6]"
				/>
			</div>

			<!-- Global Search Instant Dropdown Results -->
			{#if showGlobalSearchResults && globalSearchMatches.length > 0}
				<div class="absolute left-4 right-4 top-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
					<div class="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
						Hasil Pencarian Menu ({globalSearchMatches.length})
					</div>
					<div class="divide-y divide-slate-100">
						{#each globalSearchMatches as match}
							<button
								type="button"
								onclick={() => handleSelectNode(match)}
								class="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-sky-50 cursor-pointer"
							>
								<div class="flex items-center gap-2">
									<FileText class="h-3.5 w-3.5 text-[#026cb6]" />
									<div>
										<div class="font-semibold text-slate-900">{match.label}</div>
										{#if match.parent}
											<div class="text-[10px] text-slate-400">{match.parent}</div>
										{/if}
									</div>
								</div>
								<ArrowRight class="h-3.5 w-3.5 text-slate-400" />
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right: Subsidiary, Studio Switcher & User Profile Dropdown -->
		<div class="flex items-center gap-2.5">
			<!-- Subsidiary Indicator -->
			<div class="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 lg:flex">
				<Building2 class="h-3.5 w-3.5 text-slate-500" />
				<span class="font-semibold text-slate-800">{currentUser.subsidiaryCode}</span>
				<span class="text-slate-400">|</span>
				<span class="text-[11px] text-slate-500 max-w-[140px] truncate">{currentUser.subsidiaryName}</span>
			</div>

			{#if onOpenStudio}
				<!-- Quick switch to Studio -->
				<button
					type="button"
					onclick={onOpenStudio}
					class="hidden items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-2xs hover:bg-purple-100 transition sm:flex cursor-pointer"
				>
					<Sparkles class="h-3.5 w-3.5 text-purple-600" />
					<span>GoBudiBase Studio</span>
				</button>
			{/if}

			<!-- User Profile Dropdown Toggle -->
			<div class="relative">
				<button
					type="button"
					onclick={() => (userDropdownOpen = !userDropdownOpen)}
					class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pl-2.5 pr-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
				>
					<div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#026cb6] text-[10px] font-bold text-white">
						{currentUser.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
					</div>
					<span class="hidden sm:inline font-medium text-slate-700">{currentUser.fullName}</span>
					<ChevronDown class="h-3.5 w-3.5 text-slate-400" />
				</button>

				{#if userDropdownOpen}
					<div class="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
						<div class="border-b border-slate-100 px-3 py-2.5">
							<p class="font-bold text-slate-900 text-xs">{currentUser.fullName}</p>
							<p class="font-mono text-[10px] text-[#026cb6]">@{currentUser.username}</p>
							<p class="mt-1 text-[10px] text-slate-400 leading-tight">{currentUser.role}</p>
						</div>

						<div class="py-1">
							<button
								type="button"
								onclick={() => {
									userDropdownOpen = false;
									showProfileModal = true;
								}}
								class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-[#026cb6] transition cursor-pointer"
							>
								<UserIcon class="h-3.5 w-3.5" />
								<span>Profil Saya (Page 9998)</span>
							</button>

							<button
								type="button"
								onclick={() => {
									userDropdownOpen = false;
									handleSelectMenuByLabel('Reset Password');
								}}
								class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-[#026cb6] transition cursor-pointer"
							>
								<Settings class="h-3.5 w-3.5" />
								<span>Pengaturan Akun</span>
							</button>
						</div>

						<div class="border-t border-slate-100 pt-1">
							<button
								type="button"
								onclick={onLogout}
								class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
							>
								<LogOut class="h-3.5 w-3.5" />
								<span>Sign Out</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main Workspace Split: Sidebar Nav + Content -->
	<div class="relative flex flex-1 overflow-hidden">
		<!-- Desktop Sidebar Navigation (160 Menu Tree) -->
		<aside
			class="hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 md:flex {sidebarCollapsed
				? 'w-14'
				: 'w-72'}"
		>
			{#if !sidebarCollapsed}
				<!-- Sidebar Header: Search & Expand All -->
				<div class="border-b border-slate-100 p-3">
					<div class="relative">
						<Search class="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
						<input
							type="text"
							bind:value={menuSearch}
							placeholder="Filter navigasi..."
							class="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#026cb6] focus:bg-white"
						/>
					</div>
				</div>

				<!-- Menu List Tree Scrollable -->
				<div class="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
					{#each navTree as category}
						{#if matchesSidebarSearch(category)}
							{@const CatIcon = getCategoryIcon(category.label)}
							{@const hasChildren = category.children && category.children.length > 0}
							{@const isExpanded = expandedFolders[category.label] ?? false}
							{@const isSelected = selectedNode.label === category.label}

							<div class="space-y-0.5">
								<!-- Category Header Row -->
								<button
									type="button"
									onclick={() => {
										if (hasChildren) {
											toggleFolder(category.label);
										} else {
											handleSelectNode(category);
										}
									}}
									class="flex w-full items-center justify-between rounded-lg px-2.5 py-2 font-medium transition cursor-pointer {isSelected
										? 'bg-[#026cb6]/10 text-[#026cb6] font-bold border-r-2 border-[#026cb6]'
										: 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'}"
								>
									<div class="flex items-center gap-2.5 truncate">
										<CatIcon class="h-4 w-4 shrink-0 {isSelected ? 'text-[#026cb6]' : 'text-slate-500'}" />
										<span class="truncate">{category.label}</span>
									</div>

									{#if hasChildren}
										<div class="flex items-center gap-1.5">
											<span class="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] text-slate-500">
												{category.children?.length}
											</span>
											{#if isExpanded}
												<ChevronDown class="h-3.5 w-3.5 text-slate-400" />
											{:else}
												<ChevronRight class="h-3.5 w-3.5 text-slate-400" />
											{/if}
										</div>
									{/if}
								</button>

								<!-- Sub-items List -->
								{#if hasChildren && isExpanded}
									<div class="ml-4 pl-2 border-l border-slate-200/80 space-y-0.5 py-0.5">
										{#each category.children || [] as subItem}
											{#if matchesSidebarSearch(subItem)}
												{@const isSubSelected = selectedNode.label === subItem.label}
												<button
													type="button"
													onclick={() => handleSelectNode(subItem)}
													class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition cursor-pointer {isSubSelected
														? 'bg-[#026cb6]/10 text-[#026cb6] font-semibold'
														: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
												>
													<span class="truncate">{subItem.label}</span>
													{#if isSubSelected}
														<span class="h-1.5 w-1.5 rounded-full bg-[#026cb6]"></span>
													{/if}
												</button>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<!-- Collapsed Icon-Only Mini Bar -->
				<div class="flex flex-col items-center py-3 space-y-2">
					{#each navTree as category}
						{@const CatIcon = getCategoryIcon(category.label)}
						{@const isSelected = selectedNode.label === category.label}
						<button
							type="button"
							onclick={() => handleSelectNode(category)}
							class="flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer {isSelected
								? 'bg-[#026cb6] text-white shadow-xs'
								: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}"
							title={category.label}
						>
							<CatIcon class="h-4 w-4" />
						</button>
					{/each}
				</div>
			{/if}
		</aside>

		<!-- Content Stage -->
		<main class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
			<!-- Breadcrumb Header -->
			<div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<nav class="flex items-center gap-1.5 text-xs text-slate-400">
						<button
							type="button"
							onclick={() => handleSelectMenuByLabel('Dashboard')}
							class="hover:text-[#026cb6] transition cursor-pointer"
						>
							Harvest Cloud
						</button>
						{#if selectedNode.parent}
							<span>/</span>
							<span>{selectedNode.parent}</span>
						{/if}
						<span>/</span>
						<span class="font-semibold text-slate-700">{selectedNode.label}</span>
					</nav>

					<h1 class="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
						{selectedNode.label}
					</h1>
				</div>

				<div class="flex items-center gap-2">
					<span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-mono text-slate-500 shadow-2xs">
						<span>Alias:</span>
						<strong class="text-slate-700">{selectedNode.pageId || 'home'}</strong>
					</span>
				</div>
			</div>

			<!-- Dynamic Content: Custom Code-Behind HTML or Component Fallback -->
			{#if activeCustomPage && activeCustomPage.custom_html && activeCustomPage.custom_html.trim() !== ''}
				<div class="pims-dynamic-custom-canvas w-full">
					{#if activeCustomPage.custom_css}
						{@html `<style id="portal-style-${activeCustomPage.slug}">${activeCustomPage.custom_css}</style>`}
					{/if}
					{@html activeCustomPage.custom_html}
				</div>
			{:else if selectedNode.label === 'Dashboard'}
				<PimsDashboard onSelectMenu={handleSelectMenuByLabel} />
			{:else if selectedNode.label === 'Konfigurasi Setup'}
				<KonfigurasiSetupHub onSelectSubmenu={handleSelectMenuByLabel} />
			{:else if selectedNode.label === 'SETUP Informasi User'}
				<SetupUserInformations
					onNavigateResetPassword={(nik) => {
						resetPasswordPrefillUser = nik;
						handleSelectMenuByLabel('Reset Password');
					}}
				/>
			{:else if selectedNode.label === 'SETUP Menu User'}
				<SetupUserMenus />
			{:else if selectedNode.label === 'SETUP Akses Halaman'}
				<SetupRoleManagement />
			{:else if selectedNode.label === 'SETUP Approval Hierarchy'}
				<SetupApprovalHierarchy />
			{:else if selectedNode.label === 'Reset Password'}
				<SetupResetPassword initialUsername={resetPasswordPrefillUser} />
			{:else}
				<PimsGridPage node={selectedNode} />
			{/if}
		</main>
	</div>

	<!-- User Profile Modal (Page 9998) -->
	{#if showProfileModal}
		<PimsProfileModal user={currentUser} onClose={() => (showProfileModal = false)} />
	{/if}
</div>
