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
						<div class="relative">
							<Input
								{...props}
								id={ctx.id}
								readonly
								{disabled}
								value={value ? formatDate(value) : ''}
								class="h-(--control-h) pr-9"
								aria-describedby={ctx.describedBy}
								aria-invalid={ctx.invalid}
							/>
							<span class="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center">
								<CalendarIcon class="size-4" />
							</span>
						</div>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-auto p-0">
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
					<div class="flex justify-end gap-2 border-t p-2">
						<Button variant="outline" size="sm" onclick={setToday}>{t('kit.date.today')}</Button>
						{#if !required}
							<Button variant="ghost" size="sm" onclick={() => onCalendarChange(undefined)}
								>{t('kit.date.clear')}</Button
							>
						{/if}
					</div>
				</PopoverContent>
			</Popover>
		{/snippet}
	</Item>
{/if}
