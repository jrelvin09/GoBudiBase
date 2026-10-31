<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type RegistryItem } from '$lib/api/client';
	import { ArrowLeftRight, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, CheckCircle2, ShieldCheck } from 'lucide-svelte';

	interface ShuttleItem {
		id: number;
		code: string;
		name: string;
	}

	let {
		title = 'Oracle APEX Shuttle Selector'
	}: {
		title?: string;
	} = $props();

	let available = $state<ShuttleItem[]>([]);
	let selected = $state<ShuttleItem[]>([]);
	let selectedAvailIds = $state<number[]>([]);
	let selectedTargetIds = $state<number[]>([]);
	let isSaved = $state(false);

	async function loadItems() {
		try {
			const res = await postRPC<{ rows: RegistryItem[] }>('/registry/list', { limit: 50 });
			const all = (res.rows || []).map((r) => ({ id: r.id, code: r.code, name: r.name }));
			available = all.slice(0, 15);
			selected = all.slice(15, 20);
		} catch (e) {
			console.error('Failed to load shuttle items:', e);
		}
	}

	onMount(() => {
		loadItems();
	});

	function moveRight() {
		const toMove = available.filter((item) => selectedAvailIds.includes(item.id));
		selected = [...selected, ...toMove];
		available = available.filter((item) => !selectedAvailIds.includes(item.id));
		selectedAvailIds = [];
	}

	function moveAllRight() {
		selected = [...selected, ...available];
		available = [];
		selectedAvailIds = [];
	}

	function moveLeft() {
		const toMove = selected.filter((item) => selectedTargetIds.includes(item.id));
		available = [...available, ...toMove];
		selected = selected.filter((item) => !selectedTargetIds.includes(item.id));
		selectedTargetIds = [];
	}

	function moveAllLeft() {
		available = [...available, ...selected];
		selected = [];
		selectedTargetIds = [];
	}

	function handleSave() {
		isSaved = true;
		setTimeout(() => (isSaved = false), 3000);
	}
</script>

<div class="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
	<!-- Header -->
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
				<ArrowLeftRight class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
					<span>{title}</span>
					<span class="rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-300">
						DUAL LISTBOX
					</span>
				</h3>
				<p class="text-xs text-slate-400">Pindahkan item antar daftar untuk alokasi aset massal ke unit kerja</p>
			</div>
		</div>

		<button
			type="button"
			onclick={handleSave}
			class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
		>
			<CheckCircle2 class="h-3.5 w-3.5" />
			<span>{isSaved ? 'Tersimpan!' : 'Simpan Alokasi'}</span>
		</button>
	</div>

	<!-- Shuttle Controls Grid -->
	<div class="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
		<!-- Left Box: Available -->
		<div class="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3">
			<div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-xs font-bold text-slate-300">
				<span>Daftar Aset Tersedia ({available.length})</span>
				<span class="text-[10px] font-mono text-slate-500">Unassigned</span>
			</div>
			<div class="flex flex-col gap-1 overflow-y-auto h-64 pr-1">
				{#each available as item (item.id)}
					{@const isSelected = selectedAvailIds.includes(item.id)}
					<button
						type="button"
						onclick={() => {
							if (isSelected) selectedAvailIds = selectedAvailIds.filter((id) => id !== item.id);
							else selectedAvailIds = [...selectedAvailIds, item.id];
						}}
						class="flex items-center justify-between rounded-lg border p-2 text-left text-xs transition {isSelected ? 'border-teal-500 bg-teal-950/30 text-teal-200' : 'border-slate-800/60 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40'}"
					>
						<span class="truncate pr-2">{item.name}</span>
						<span class="font-mono text-[10px] text-slate-400 shrink-0">{item.code}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Middle Buttons: Move Left/Right -->
		<div class="flex flex-row md:flex-col justify-center gap-2">
			<button
				type="button"
				onclick={moveAllRight}
				disabled={available.length === 0}
				title="Pindahkan Semua ke Kanan"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
			>
				<ChevronsRight class="h-4 w-4" />
			</button>
			<button
				type="button"
				onclick={moveRight}
				disabled={selectedAvailIds.length === 0}
				title="Pindahkan Terpilih ke Kanan"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-950/60 text-teal-300 hover:bg-teal-900 disabled:opacity-40"
			>
				<ChevronRight class="h-4 w-4" />
			</button>
			<button
				type="button"
				onclick={moveLeft}
				disabled={selectedTargetIds.length === 0}
				title="Pindahkan Terpilih ke Kiri"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-950/60 text-teal-300 hover:bg-teal-900 disabled:opacity-40"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<button
				type="button"
				onclick={moveAllLeft}
				disabled={selected.length === 0}
				title="Pindahkan Semua ke Kiri"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
			>
				<ChevronsLeft class="h-4 w-4" />
			</button>
		</div>

		<!-- Right Box: Assigned -->
		<div class="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3">
			<div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-xs font-bold text-slate-300">
				<span>Aset Dialokasikan ({selected.length})</span>
				<span class="text-[10px] font-mono text-emerald-400">Assigned</span>
			</div>
			<div class="flex flex-col gap-1 overflow-y-auto h-64 pr-1">
				{#each selected as item (item.id)}
					{@const isSelected = selectedTargetIds.includes(item.id)}
					<button
						type="button"
						onclick={() => {
							if (isSelected) selectedTargetIds = selectedTargetIds.filter((id) => id !== item.id);
							else selectedTargetIds = [...selectedTargetIds, item.id];
						}}
						class="flex items-center justify-between rounded-lg border p-2 text-left text-xs transition {isSelected ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200' : 'border-slate-800/60 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40'}"
					>
						<span class="truncate pr-2">{item.name}</span>
						<span class="font-mono text-[10px] text-emerald-400/80 shrink-0">{item.code}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>