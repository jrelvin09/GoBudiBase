<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Input } from '$lib/components/ui/input';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import DisplayOnly from '$lib/kit/molecules/DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from '$lib/kit/molecules/Item.svelte';
	import { formatDate } from '$lib/i18n/format';
	import { getLocale, t } from '$lib/i18n/index.svelte';
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let {
		id,
		value = $bindable(null),
		min,
		max,
		label,
		required = false,
		help,
		inlineHelp,
		error,
		labelPosition = 'above',
		preText,
		postText,
		size = 'md',
		stretch = false,
		readOnly = false,
		disabled = false,
		onchange,
		class: className
	}: {
		id: string;
		value?: string | null;
		min?: string;
		max?: string;
		label?: string;
		required?: boolean;
		help?: string;
		inlineHelp?: string;
		error?: string;
		labelPosition?: ItemLabelPosition;
		preText?: string;
		postText?: string;
		size?: ItemSize;
		stretch?: boolean;
		readOnly?: boolean;
		disabled?: boolean;
		onchange?: (value: string | null) => void;
		class?: string;
	} = $props();

	let open = $state(false);

	const calendarValue = $derived(value ? parseDate(value) : undefined);
	const minValue = $derived(min ? parseDate(min) : undefined);
	const maxValue = $derived(max ? parseDate(max) : undefined);

	function onCalendarChange(next: DateValue | undefined) {
		value = next ? next.toString() : null;
		onchange?.(value);
		open = false;
	}

	function setToday() {
		value = today(getLocalTimeZone()).toString();
		onchange?.(value);
		open = false;
	}
</script>

{#if readOnly}
	<DisplayOnly
		{id}
		type="date"
		value={value}
		{label}
		{required}
		{help}
		{inlineHelp}
		{error}
		{labelPosition}
		{preText}
		{postText}
		{size}
		{stretch}
		class={className}
	/>
{:else}
	<Item
		{id}
		{label}
		{required}
		{help}
		{inlineHelp}
		{error}
		{labelPosition}
		{preText}
		{postText}
		{size}
		{stretch}
		class={className}
	>
		{#snippet children(ctx)}
			<Popover bind:open>
				<PopoverTrigger>
					{#snippet child({ props })}
						<div class="relative group cursor-pointer">
							<Input
								{...props}
								id={ctx.id}
								readonly
								{disabled}
								value={value ? formatDate(value) : ''}
								placeholder="Pilih tanggal..."
								class="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 pr-10 text-xs text-slate-100 shadow-sm outline-none transition group-hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer placeholder:text-slate-500 font-medium"
								aria-describedby={ctx.describedBy}
								aria-invalid={ctx.invalid}
							/>
							<span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 group-hover:text-emerald-400 transition">
								<CalendarIcon class="size-4" />
							</span>
						</div>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-auto p-2.5 bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl">
					<div class="p-1">
						<Calendar
							type="single"
							value={calendarValue}
							onValueChange={onCalendarChange}
							minValue={minValue}
							maxValue={maxValue}
							locale={getLocale()}
						/>
					</div>
					<div class="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2 px-1">
						<button
							type="button"
							class="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition shadow-sm active:scale-95 cursor-pointer"
							onclick={setToday}
						>
							<CalendarIcon class="size-3.5" />
							<span>{t('kit.date.today')}</span>
						</button>
						{#if !required}
							<button
								type="button"
								class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
								onclick={() => onCalendarChange(undefined)}
							>
								{t('kit.date.clear')}
							</button>
						{/if}
					</div>
				</PopoverContent>
			</Popover>
		{/snippet}
	</Item>
{/if}
