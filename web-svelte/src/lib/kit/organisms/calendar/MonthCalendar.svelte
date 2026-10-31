<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { getLocale, t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { eventsByDay, monthGrid, type WeekStart } from './month';

	// Kalender bulan (K6-04): region memuat datanya; komponen ini tampilan dan
	// navigasi hari saja.
	let {
		rows,
		dateField,
		titleField,
		year = $bindable(),
		month = $bindable(),
		weekStart,
		canCreate = false,
		onedit,
		oncreate,
		labels
	}: {
		rows: Record<string, unknown>[];
		dateField: string;
		titleField: string;
		year: number;
		month: number;
		weekStart: WeekStart;
		canCreate?: boolean;
		onedit?: (row: Record<string, unknown>) => void;
		oncreate?: (iso: string) => void;
		labels?: Record<string, Record<string, string>>;
	} = $props();
	const locale = $derived(getLocale());
	const grid = $derived(monthGrid(year, month, weekStart));
	const events = $derived(eventsByDay(rows, dateField));
	const title = $derived(
		new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
	);
	// 2023-01-01 jatuh Minggu, jadi nama hari bisa digeser menurut weekStart.
	const dayNames = $derived(
		Array.from({ length: 7 }, (_, i) =>
			new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2023, 0, 1 + ((weekStart + i) % 7)))
		)
	);
	const now = new Date();
	const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

	let gridEl = $state<HTMLDivElement | null>(null);
	let activeIndex = $state(0);

	function rowsOf(day: string): Record<string, unknown>[] {
		return events[day] ?? [];
	}
	function eventTitle(row: Record<string, unknown>): string {
		const raw = row[titleField];
		if (raw === null || raw === undefined || raw === '') return '';
		return labels?.[titleField]?.[String(raw)] ?? String(raw);
	}
	$effect(() => {
		// grid dibaca agar hari aktif mengikuti bulan yang tampil.
		const index = grid.flat().indexOf(todayIso);
		activeIndex = index >= 0 ? index : 0;
	});

	function focusDay(index: number) {
		gridEl?.querySelector<HTMLElement>(`[data-day-index="${index}"]`)?.focus();
	}
	function shift(delta: number) {
		const date = new Date(year, month - 1 + delta, 1);
		year = date.getFullYear();
		month = date.getMonth() + 1;
	}
	function goToday() {
		year = now.getFullYear();
		month = now.getMonth() + 1;
	}
	function moveTo(next: number, event: KeyboardEvent) {
		if (next < 0 || next > 41) return;
		event.preventDefault();
		activeIndex = next;
		focusDay(next);
	}
	function activate(index: number) {
		const day = grid.flat()[index];
		const dayRows = rowsOf(day);
		if (dayRows.length > 0) onedit?.(dayRows[0]);
		else if (canCreate) oncreate?.(day);
	}
	function onDayKeydown(event: KeyboardEvent, index: number) {
		switch (event.key) {
			case 'ArrowLeft': moveTo(index - 1, event); break;
			case 'ArrowRight': moveTo(index + 1, event); break;
			case 'ArrowUp': moveTo(index - 7, event); break;
			case 'ArrowDown': moveTo(index + 7, event); break;
			case 'Home': moveTo(index - (index % 7), event); break;
			case 'End': moveTo(index - (index % 7) + 6, event); break;
			case 'PageUp': event.preventDefault(); shift(-1); break;
			case 'PageDown': event.preventDefault(); shift(1); break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				activate(index);
				break;
			default:
				return;
		}
	}
</script>
<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between gap-2">
		<Button variant="ghost" size="icon-sm" aria-label={t('kit.calendar.previous_month')} onclick={() => shift(-1)}>
			<ChevronLeftIcon />
		</Button>
		<div class="flex items-center gap-2">
			<h2 class="text-sm font-semibold">{title}</h2>
			<Button variant="outline" size="sm" onclick={goToday}>{t('kit.calendar.today')}</Button>
		</div>
		<Button variant="ghost" size="icon-sm" aria-label={t('kit.calendar.next_month')} onclick={() => shift(1)}>
			<ChevronRightIcon />
		</Button>
	</div>

	<div bind:this={gridEl} role="grid" aria-label={title} class="border-border overflow-hidden rounded-lg border">
		<div role="row" class="border-border bg-muted/50 grid grid-cols-7 border-b">
			{#each dayNames as name (name)}
				<div role="columnheader" class="text-muted-foreground px-2 py-1 text-center text-xs font-medium">{name}</div>
			{/each}
		</div>
		{#each grid as week, r (r)}
			<div role="row" class="border-border grid grid-cols-7 border-b last:border-b-0">
				{#each week as day, c (day)}
					{@const index = r * 7 + c}
					{@const dayRows = rowsOf(day)}
					{@const inMonth = day.slice(0, 7) === `${year}-${String(month).padStart(2, '0')}`}
					<div
						role="gridcell"
						data-day-index={index}
						tabindex={activeIndex === index ? 0 : -1}
						aria-label={day}
						class={cn(
							'flex min-h-24 flex-col gap-1 p-1',
							!inMonth && 'text-muted-foreground',
							day === todayIso && 'ring-ring ring-2'
						)}
						onkeydown={(event) => onDayKeydown(event, index)}
						onclick={() => {
							if (dayRows.length === 0 && canCreate) oncreate?.(day);
						}}
					>
						<span class="text-xs font-medium">{Number(day.slice(8, 10))}</span>
						{#each dayRows.slice(0, 3) as row, i (String(row.id ?? i))}
							<button
								type="button"
								class="bg-palette-9-subtle w-full truncate rounded px-1 text-left text-xs"
								onclick={(event) => {
									event.stopPropagation();
									onedit?.(row);
								}}
							>
								{eventTitle(row)}
							</button>
						{/each}
						{#if dayRows.length > 3}
							<Popover>
								<PopoverTrigger>
									{#snippet child({ props })}
										<button
											{...props}
											type="button"
											class="text-primary text-left text-xs"
											onclick={(event) => event.stopPropagation()}
										>
											{t('kit.calendar.more', { n: dayRows.length - 3 })}
										</button>
									{/snippet}
								</PopoverTrigger>
								<PopoverContent class="w-56 p-2">
									<ul class="flex flex-col gap-1">
										{#each dayRows as row, i (String(row.id ?? i))}
											<li>
												<button type="button" class="text-left text-xs" onclick={() => onedit?.(row)}>
													{eventTitle(row)}
												</button>
											</li>
										{/each}
									</ul>
								</PopoverContent>
							</Popover>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>