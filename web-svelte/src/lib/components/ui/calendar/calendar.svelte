<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = 'short',
		locale = 'en-US',
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
		'bg-background group/calendar [--cell-size:--spacing(8)] in-data-[slot=popover-content]:bg-transparent',
		className
	)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<div class="relative flex flex-col gap-4 md:flex-row">
			<nav class="absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1">
				<CalendarPrimitive.PrevButton
					class={cn(buttonVariants({ variant: 'ghost' }), 'size-(--cell-size) bg-transparent p-0')}
				>
					<ChevronLeftIcon class="size-4" />
				</CalendarPrimitive.PrevButton>
				<CalendarPrimitive.NextButton
					class={cn(buttonVariants({ variant: 'ghost' }), 'size-(--cell-size) bg-transparent p-0')}
				>
					<ChevronRightIcon class="size-4" />
				</CalendarPrimitive.NextButton>
			</nav>
			{#each months as month (month)}
				<div class="flex w-full flex-col gap-4">
					<CalendarPrimitive.Header class="flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium">
						<CalendarPrimitive.Heading class="px-(--cell-size) text-sm font-medium" />
					</CalendarPrimitive.Header>
					<CalendarPrimitive.Grid class="flex w-full border-collapse flex-col">
						<CalendarPrimitive.GridHead>
							<CalendarPrimitive.GridRow class="flex select-none">
								{#each weekdays as weekday, i (i)}
									<CalendarPrimitive.HeadCell
										class="text-muted-foreground w-(--cell-size) rounded-md text-[0.8rem] font-normal"
									>
										{weekday.slice(0, 2)}
									</CalendarPrimitive.HeadCell>
								{/each}
							</CalendarPrimitive.GridRow>
						</CalendarPrimitive.GridHead>
						<CalendarPrimitive.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<CalendarPrimitive.GridRow class="mt-2 flex w-full">
									{#each weekDates as date (date)}
										<CalendarPrimitive.Cell
											{date}
											month={month.value}
											class="relative size-(--cell-size) p-0 text-center text-sm"
										>
											<CalendarPrimitive.Day
												class={cn(
													'flex size-(--cell-size) flex-col items-center justify-center gap-1 rounded-md p-0 leading-none font-normal whitespace-nowrap select-none',
													'[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
													'data-[selected]:bg-primary data-[selected]:text-primary-foreground',
													'[&[data-outside-month]:not([data-selected])]:text-muted-foreground',
													'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
													'data-[unavailable]:text-muted-foreground data-[unavailable]:line-through',
													'focus:relative focus:border-ring focus:ring-ring/50'
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
