<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type CalendarEvent } from '$lib/api/client';
	import {
		Calendar as CalendarIcon,
		Clock,
		AlertCircle,
		CheckCircle2,
		Filter,
		RefreshCw,
		ChevronLeft,
		ChevronRight,
		Layers
	} from 'lucide-svelte';

	let events = $state<CalendarEvent[]>([]);
	let loading = $state(false);
	let viewMode = $state<'calendar' | 'timeline'>('timeline');
	let selectedEvent = $state<CalendarEvent | null>(null);
	let filterPriority = $state('ALL');

	async function loadEvents() {
		loading = true;
		try {
			const res = await postRPC<CalendarEvent[]>('/calendar/events');
			events = Array.isArray(res) ? res : [];
		} catch (err) {
			console.error('Gagal mengambil jadwal kalender:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadEvents();
	});

	let filteredEvents = $derived(
		filterPriority === 'ALL'
			? events
			: events.filter((e) => e.details?.priority?.toUpperCase() === filterPriority)
	);

	function getPriorityBadge(priority: string) {
		switch (priority?.toUpperCase()) {
			case 'CRITICAL':
				return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
			case 'HIGH':
				return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
			case 'MEDIUM':
				return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
			default:
				return 'bg-slate-700/50 text-slate-300 border-slate-600';
		}
	}

	function getStateBadge(state: string) {
		switch (state?.toLowerCase()) {
			case 'approved':
				return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
			case 'rejected':
				return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
			case 'submitted':
			case 'pending':
				return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
			default:
				return 'bg-slate-700 text-slate-300 border-slate-600';
		}
	}

	// Days for the mini calendar representation
	const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
</script>

<div class="flex flex-col gap-4">
	<!-- Control Bar -->
	<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
		<div class="flex items-center gap-3">
			<div class="flex rounded-lg border border-slate-800 bg-slate-950 p-1">
				<button
					type="button"
					onclick={() => (viewMode = 'timeline')}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition {viewMode === 'timeline' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
				>
					<Layers class="h-3.5 w-3.5" />
					Gantt Timeline
				</button>
				<button
					type="button"
					onclick={() => (viewMode = 'calendar')}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition {viewMode === 'calendar' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
				>
					<CalendarIcon class="h-3.5 w-3.5" />
					SLA Calendar
				</button>
			</div>

			<div class="flex items-center gap-2 text-xs text-slate-400">
				<Filter class="h-3.5 w-3.5 text-slate-500" />
				<select
					bind:value={filterPriority}
					class="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
				>
					<option value="ALL">Semua Prioritas ({events.length})</option>
					<option value="CRITICAL">Critical</option>
					<option value="HIGH">High</option>
					<option value="MEDIUM">Medium</option>
				</select>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={loadEvents}
				disabled={loading}
				class="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>
		</div>
	</div>

	<!-- Content Area -->
	{#if viewMode === 'timeline'}
		<div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
			<div class="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 class="text-sm font-bold text-slate-100 uppercase tracking-wider">Jalur Waktu SLA & Pemeliharaan</h3>
					<p class="text-xs text-slate-400">Visualisasi rentang durasi tiket aset per kuartal berjalan</p>
				</div>
				<span class="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-emerald-400">
					{filteredEvents.length} Jadwal
				</span>
			</div>

			{#if loading}
				<div class="flex h-48 items-center justify-center text-slate-500 text-sm">
					<RefreshCw class="mr-2 h-5 w-5 animate-spin text-emerald-500" />
					Memuat antrean jadwal...
				</div>
			{:else if filteredEvents.length === 0}
				<div class="flex h-48 flex-col items-center justify-center text-slate-500">
					<AlertCircle class="h-8 w-8 text-slate-600 mb-2" />
					<p class="text-sm">Tidak ada jadwal pemeliharaan terdaftar.</p>
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					{#each filteredEvents as evt}
						<div
							class="group relative flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 transition hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer"
							onclick={() => (selectedEvent = evt)}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2.5">
									<span class="font-mono text-xs font-semibold text-slate-200">
										{evt.details?.request_no || evt.id}
									</span>
									<span class="text-xs font-medium text-slate-300">{evt.title}</span>
								</div>

								<div class="flex items-center gap-2">
									<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase {getPriorityBadge(evt.details?.priority)}">
										{evt.details?.priority || 'NORMAL'}
									</span>
									<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase {getStateBadge(evt.details?.state)}">
										{evt.details?.state || 'OPEN'}
									</span>
								</div>
							</div>

							<!-- Duration progress bar mock -->
							<div class="mt-1 flex items-center gap-3 text-xs text-slate-400">
								<div class="flex items-center gap-1">
									<Clock class="h-3 w-3 text-slate-500" />
									<span>{new Date(evt.start).toLocaleDateString('id-ID')}</span>
								</div>
								<span>&rarr;</span>
								<span>{new Date(evt.end).toLocaleDateString('id-ID')}</span>
								<div class="ml-auto text-[11px] font-mono text-slate-400">
									Pemohon: <span class="text-slate-200">{evt.details?.requester || '-'}</span>
								</div>
							</div>

							<div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
								<div
									class="h-full rounded-full transition-all duration-500"
									style="width: 70%; background-color: {evt.backgroundColor || '#10b981'}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Calendar View -->
		<div class="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
			<div class="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 class="text-sm font-bold text-slate-100 uppercase tracking-wider">Kalender Perawatan Aset</h3>
					<p class="text-xs text-slate-400">Grid tanggal jatuh tempo kalibrasi & jadwal servis berkala</p>
				</div>
			</div>

			<div class="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
				{#each daysOfWeek as day}
					<div class="py-2 uppercase tracking-wider text-slate-500">{day}</div>
				{/each}
			</div>

			<div class="grid grid-cols-7 gap-2">
				{#each Array(35) as _, i}
					{@const dayNum = (i % 31) + 1}
					{@const dayEvents = filteredEvents.filter((e) => new Date(e.start).getDate() === dayNum)}
					<div class="min-h-[90px] rounded-lg border border-slate-800/80 bg-slate-950/50 p-2 text-left transition hover:border-slate-700">
						<span class="text-[11px] font-mono font-bold text-slate-400">{dayNum}</span>
						<div class="mt-1 flex flex-col gap-1">
							{#each dayEvents.slice(0, 2) as de}
								<div
									class="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm cursor-pointer"
									style="background-color: {de.backgroundColor || '#0284c7'}"
									onclick={() => (selectedEvent = de)}
								>
									{de.title}
								</div>
							{/each}
							{#if dayEvents.length > 2}
								<span class="text-[9px] text-slate-500 font-mono">+{dayEvents.length - 2} lainnya</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if selectedEvent}
	<!-- Modal Detail Event -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold text-slate-100">Detail Jadwal SLA</h3>
				<button
					type="button"
					onclick={() => (selectedEvent = null)}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
				>
					&times;
				</button>
			</div>

			<div class="mt-4 flex flex-col gap-3 text-xs">
				<div class="flex justify-between border-b border-slate-800/60 pb-2">
					<span class="text-slate-400">Nomor Registrasi:</span>
					<span class="font-mono font-semibold text-slate-100">{selectedEvent.details?.request_no}</span>
				</div>
				<div class="flex justify-between border-b border-slate-800/60 pb-2">
					<span class="text-slate-400">Judul Kegiatan:</span>
					<span class="font-semibold text-slate-100 text-right">{selectedEvent.title}</span>
				</div>
				<div class="flex justify-between border-b border-slate-800/60 pb-2">
					<span class="text-slate-400">Prioritas:</span>
					<span class="rounded px-2 py-0.5 font-semibold {getPriorityBadge(selectedEvent.details?.priority)}">
						{selectedEvent.details?.priority}
					</span>
				</div>
				<div class="flex justify-between border-b border-slate-800/60 pb-2">
					<span class="text-slate-400">Status:</span>
					<span class="rounded px-2 py-0.5 font-semibold {getStateBadge(selectedEvent.details?.state)}">
						{selectedEvent.details?.state}
					</span>
				</div>
				<div class="flex justify-between border-b border-slate-800/60 pb-2">
					<span class="text-slate-400">Pemohon:</span>
					<span class="text-slate-200">{selectedEvent.details?.requester}</span>
				</div>
				<div class="flex justify-between pt-1">
					<span class="text-slate-400">Rentang Waktu:</span>
					<span class="font-mono text-slate-300">
						{new Date(selectedEvent.start).toLocaleDateString('id-ID')} &rarr; {new Date(selectedEvent.end).toLocaleDateString('id-ID')}
					</span>
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<button
					type="button"
					onclick={() => (selectedEvent = null)}
					class="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
