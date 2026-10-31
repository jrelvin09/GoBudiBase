<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = 'short',
		locale = 'id',
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> = $props();
</script>

<CalendarPrimitive.Root
	bind:ref
	bind:value={value as never}
	bind:placeholder
	{weekdayFormat}
	{locale}
	class={cn(
		'select-none p-1 text-slate-100',
		className
	)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<div class="relative flex flex-col gap-3">
			<nav class="absolute inset-x-0 top-0.5 flex w-full items-center justify-between px-0.5 z-10 pointer-events-none">
				<CalendarPrimitive.PrevButton
					class="pointer-events-auto flex size-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-emerald-400 transition cursor-pointer shadow-sm active:scale-95 outline-none"
					title="Bulan Sebelumnya"
				>
					<ChevronLeftIcon class="size-4" />
				</CalendarPrimitive.PrevButton>
				<CalendarPrimitive.NextButton
					class="pointer-events-auto flex size-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-emerald-400 transition cursor-pointer shadow-sm active:scale-95 outline-none"
					title="Bulan Berikutnya"
				>
					<ChevronRightIcon class="size-4" />
				</CalendarPrimitive.NextButton>
			</nav>

			{#each months as month (month)}
				<div class="flex w-full flex-col gap-2.5">
					<!-- Month & Year Title -->
					<CalendarPrimitive.Header class="flex h-9 w-full items-center justify-center">
						<CalendarPrimitive.Heading class="text-xs font-bold tracking-wider text-slate-200 capitalize font-sans" />
					</CalendarPrimitive.Header>

					<CalendarPrimitive.Grid class="flex w-full border-collapse flex-col">
						<!-- Weekdays Header Row -->
						<CalendarPrimitive.GridHead>
							<CalendarPrimitive.GridRow class="flex w-full justify-between select-none mb-1">
								{#each weekdays as weekday, i (i)}
									<CalendarPrimitive.HeadCell
										class="w-8 h-7 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400"
									>
										{weekday.length > 3 ? weekday.slice(0, 3) : weekday}
									</CalendarPrimitive.HeadCell>
								{/each}
							</CalendarPrimitive.GridRow>
						</CalendarPrimitive.GridHead>

						<!-- Days Matrix Grid -->
						<CalendarPrimitive.GridBody class="flex flex-col gap-1">
							{#each month.weeks as weekDates (weekDates)}
								<CalendarPrimitive.GridRow class="flex w-full justify-between">
									{#each weekDates as date (date)}
										<CalendarPrimitive.Cell
											{date}
											month={month.value}
											class="relative size-8 p-0 text-center"
										>
											<CalendarPrimitive.Day
												class={cn(
													'flex size-8 items-center justify-center rounded-xl text-xs font-medium text-slate-200 transition-all select-none cursor-pointer outline-none',
													'hover:bg-slate-800 hover:text-emerald-300 active:scale-90',
													// Hari ini (Today)
													'[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-emerald-500/60 [&[data-today]:not([data-selected])]:bg-emerald-500/15 [&[data-today]:not([data-selected])]:text-emerald-400 [&[data-today]:not([data-selected])]:font-bold',
													// Tanggal Terpilih (Selected)
													'data-[selected]:bg-gradient-to-tr data-[selected]:from-emerald-600 data-[selected]:to-teal-500 data-[selected]:text-white data-[selected]:font-black data-[selected]:shadow-lg data-[selected]:shadow-emerald-600/40 data-[selected]:scale-105 data-[selected]:rounded-xl',
													// Tanggal di luar bulan aktif (Outside Month)
													'[&[data-outside-month]:not([data-selected])]:text-slate-600 [&[data-outside-month]:not([data-selected])]:hover:text-slate-400',
													// Tanggal non-aktif / terblokir batas min-max
													'data-[disabled]:pointer-events-none data-[disabled]:opacity-20 data-[disabled]:line-through',
													'data-[unavailable]:text-slate-600 data-[unavailable]:line-through data-[unavailable]:pointer-events-none'
												)}
											/>
										</CalendarPrimitive.Cell>
									{/each}
								</CalendarPrimitive.GridRow>
							{/each}
						</CalendarPrimitive.GridBody>
					</CalendarPrimitive.Grid>
				</div>
			{/each}
		</div>
	{/snippet}
</CalendarPrimitive.Root>
