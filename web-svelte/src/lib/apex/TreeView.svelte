<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type TreeNode } from '$lib/api/client';
	import {
		FolderTree,
		Folder,
		FolderOpen,
		ChevronRight,
		ChevronDown,
		Building2,
		Layers,
		Search,
		RefreshCw,
		Package
	} from 'lucide-svelte';

	let {
		title = 'Hierarki Lokasi Spasial',
		onSelectNode
	}: {
		title?: string;
		onSelectNode?: (node: TreeNode) => void;
	} = $props();

	let treeData = $state<TreeNode[]>([]);
	let loading = $state(false);
	let expandedNodes = $state<Record<string, boolean>>({});
	let selectedNodeId = $state<string | null>(null);
	let searchTerm = $state('');

	async function loadTree() {
		loading = true;
		try {
			const res = await postRPC<TreeNode[]>('/spatial/tree');
			treeData = Array.isArray(res) ? res : [];
			// Auto expand root items
			if (treeData.length > 0) {
				expandedNodes[treeData[0].id] = true;
			}
		} catch (err) {
			console.error('Gagal memuat pohon hierarki lokasi:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadTree();
	});

	function toggleNode(id: string) {
		expandedNodes[id] = !expandedNodes[id];
	}

	function handleSelect(node: TreeNode) {
		selectedNodeId = node.id;
		if (onSelectNode) onSelectNode(node);
	}

	function getNodeIcon(type: string, isExpanded: boolean) {
		switch (type) {
			case 'root':
			case 'campus':
				return Building2;
			case 'building':
				return Building2;
			case 'floor':
				return Layers;
			default:
				return isExpanded ? FolderOpen : Folder;
		}
	}
</script>

<!-- Snippet Recursive Tree Node for Svelte 5 -->
{#snippet renderNode(node: TreeNode, depth: number)}
	{@const isExpanded = !!expandedNodes[node.id]}
	{@const hasChildren = node.children && node.children.length > 0}
	{@const isSelected = selectedNodeId === node.id}
	{@const Icon = getNodeIcon(node.type, isExpanded)}

	<div class="flex flex-col">
		<div
			class="flex items-center justify-between rounded-lg px-2 py-1.5 transition cursor-pointer select-none {isSelected ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60'}"
			style="padding-left: {depth * 16 + 8}px"
			onclick={() => {
				if (hasChildren) toggleNode(node.id);
				handleSelect(node);
			}}
		>
			<div class="flex items-center gap-2 truncate">
				{#if hasChildren}
					<button
						type="button"
						class="text-slate-500 hover:text-slate-200"
						onclick={(e) => {
							e.stopPropagation();
							toggleNode(node.id);
						}}
					>
						{#if isExpanded}
							<ChevronDown class="h-3.5 w-3.5" />
						{:else}
							<ChevronRight class="h-3.5 w-3.5" />
						{/if}
					</button>
				{:else}
					<span class="w-3.5"></span>
				{/if}

				<Icon class="h-4 w-4 shrink-0 {isSelected ? 'text-emerald-400' : 'text-slate-500'}" />
				<span class="truncate text-xs">{node.name}</span>
			</div>

			{#if node.count !== undefined}
				<span class="ml-2 rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
					{node.count}
				</span>
			{/if}
		</div>

		{#if hasChildren && isExpanded}
			<div class="flex flex-col">
				{#each node.children as child}
					{@render renderNode(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<FolderTree class="h-4 w-4 text-emerald-400" />
			<span class="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</span>
		</div>

		<button
			type="button"
			onclick={loadTree}
			disabled={loading}
			class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
		>
			<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
		</button>
	</div>

	<!-- Search Bar -->
	<div class="relative">
		<Search class="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="Filter cabang lokasi..."
			class="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
		/>
	</div>

	<!-- Tree Container -->
	{#if loading && treeData.length === 0}
		<div class="flex h-40 items-center justify-center text-xs text-slate-500">
			Memuat struktur pohon...
		</div>
	{:else if treeData.length === 0}
		<div class="flex h-40 items-center justify-center text-xs text-slate-500">
			Pohon lokasi kosong.
		</div>
	{:else}
		<div class="flex max-h-[460px] flex-col gap-0.5 overflow-y-auto pr-1">
			{#each treeData as rootNode}
				{@render renderNode(rootNode, 0)}
			{/each}
		</div>
	{/if}
</div>
