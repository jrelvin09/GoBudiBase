<script lang="ts">
	import SimpleDatePicker from './SimpleDatePicker.svelte';
	import { today, getLocalTimeZone } from '@internationalized/date';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let {
		id = 'drp-' + Math.random().toString(36).substring(2, 7),
		label = 'Rentang Tanggal',
		startDate = $bindable<string | null | undefined>(),
		endDate = $bindable<string | null | undefined>(),
		onchange,
		class: className = ''
	}: {
		id?: string;
		label?: string;
		startDate?: string | null;
		endDate?: string | null;
		onchange?: (range: { start: string | null; end: string | null }) => void;
		class?: string;
	} = $props();

	function setPreset(daysBack: number) {
		const now = new Date();
		const endStr = now.toISOString().split('T')[0];
		let startStr = endStr;
		if (daysBack > 0) {
			const start = new Date();
			start.setDate(start.getDate() - daysBack);
			startStr = start.toISOString().split('T')[0];
		} else if (daysBack === -1) {
			// This Month
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			startStr = startOfMonth.toISOString().split('T')[0];
		}
		startDate = startStr;
		endDate = endStr;
		onchange?.({ start: startDate, end: endDate });
	}

	const durationDays = $derived.by(() => {
		if (!startDate || !endDate) return null;
		const s = new Date(startDate);
		const e = new Date(endDate);
		const diffTime = e.getTime() - s.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
		return diffDays > 0 ? diffDays : null;
	});
</script>

<div class="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 {className}">
	<div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
		<div class="flex items-center gap-1.5 text-xs font-bold text-slate-200">
			<CalendarIcon class="h-4 w-4 text-emerald-400" />
			<span>{label}</span>
		</div>
		{#if durationDays}
			<span class="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
				{durationDays} Hari
			</span>
		{/if}
	</div>

	<!-- Date Input Fields: Dari & Sampai -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
		<SimpleDatePicker
			id="{id}-start"
			label="Dari Tanggal"
			bind:value={startDate}
			placeholder="Pilih tanggal awal..."
			max={endDate || null}
			onchange={() => onchange?.({ start: startDate, end: endDate })}
		/>
		<SimpleDatePicker
			id="{id}-end"
			label="Sampai Tanggal"
			bind:value={endDate}
			placeholder="Pilih tanggal akhir..."
			min={startDate || null}
			onchange={() => onchange?.({ start: startDate, end: endDate })}
		/>
	</div>

	<!-- Quick Presets -->
	<div class="flex flex-wrap items-center gap-1.5 pt-1">
		<span class="text-[10px] text-slate-500 font-medium mr-1">Pintasan:</span>
		<button
			type="button"
			onclick={() => setPreset(0)}
			class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
		>
			Hari Ini
		</button>
		<button
			type="button"
			onclick={() => setPreset(7)}
			class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
		>
			7 Hari
		</button>
		<button
			type="button"
			onclick={() => setPreset(30)}
			class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
		>
			30 Hari
		</button>
		<button
			type="button"
			onclick={() => setPreset(-1)}
			class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
		>
			Bulan Ini
		</button>
	</div>
</div>
