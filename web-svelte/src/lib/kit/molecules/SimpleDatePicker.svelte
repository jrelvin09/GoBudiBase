<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		id = 'dp-' + Math.random().toString(36).substring(2, 7),
		label = 'Tanggal',
		value = $bindable<string | null | undefined>(),
		placeholder = 'Pilih tanggal...',
		min,
		max,
		disabled = false,
		required = false,
		onchange,
		class: className = ''
	}: {
		id?: string;
		label?: string;
		value?: string | null;
		placeholder?: string;
		min?: string;
		max?: string;
		disabled?: boolean;
		required?: boolean;
		onchange?: (val: string | null) => void;
		class?: string;
	} = $props();

	let open = $state(false);

	function safeParseDate(val: string | null | undefined): DateValue | undefined {
		if (!val) return undefined;
		try {
			const str = typeof val === 'string' ? val.trim() : String(val);
			const dateStr = str.includes('T') ? str.split('T')[0] : str;
			if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
				return parseDate(dateStr);
			}
		} catch {
			// ignore
		}
		return undefined;
	}

	const calendarValue = $derived(safeParseDate(value));
	const minValue = $derived(safeParseDate(min));
	const maxValue = $derived(safeParseDate(max));

	function formatDateIndo(val: string | null): string {
		if (!val) return '';
		try {
			const parts = val.split('-');
			if (parts.length === 3) {
				const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
				const day = parseInt(parts[2], 10);
				const month = months[parseInt(parts[1], 10) - 1] || parts[1];
				const year = parts[0];
				return `${day} ${month} ${year}`;
			}
			return val;
		} catch {
			return val;
		}
	}

	function onSelectDate(next: DateValue | undefined) {
		value = next ? next.toString() : null;
		onchange?.(value);
		open = false;
	}

	function setToday() {
		value = today(getLocalTimeZone()).toString();
		onchange?.(value);
		open = false;
	}

	function clearDate() {
		value = null;
		onchange?.(null);
		open = false;
	}
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label for={id} class="text-xs font-semibold text-slate-300 flex items-center justify-between">
			<span>{label}</span>
			{#if required}
				<span class="text-[10px] text-rose-400 font-bold">*</span>
			{/if}
		</label>
	{/if}

	<Popover bind:open>
		<PopoverTrigger>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					{id}
					{disabled}
					class="flex h-9 w-full items-center justify-between rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-1.5 text-xs text-slate-100 shadow-sm transition hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer group"
				>
					<span class={value ? 'text-slate-100 font-medium' : 'text-slate-500 font-normal'}>
						{value ? formatDateIndo(value) : placeholder}
					</span>
					<div class="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-400 transition">
						{#if value && !disabled && !required}
							<span
								role="button"
								tabindex="0"
								onclick={(e) => { e.stopPropagation(); clearDate(); }}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); clearDate(); } }}
								class="rounded p-0.5 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
								title="Hapus tanggal"
							>
								<XIcon class="size-3" />
							</span>
						{/if}
						<CalendarIcon class="size-4" />
					</div>
				</button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="w-auto p-2 bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl">
			<Calendar
				type="single"
				value={calendarValue}
				onValueChange={onSelectDate}
				minValue={minValue}
				maxValue={maxValue}
			/>
			<div class="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-1 px-1">
				<button
					type="button"
					onclick={setToday}
					class="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer active:scale-95 shadow-sm"
				>
					<CalendarIcon class="size-3" />
					<span>Hari Ini</span>
				</button>
				{#if !required}
					<button
						type="button"
						onclick={clearDate}
						class="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition cursor-pointer px-2 py-1"
					>
						Clear
					</button>
				{/if}
			</div>
		</PopoverContent>
	</Popover>
</div>
