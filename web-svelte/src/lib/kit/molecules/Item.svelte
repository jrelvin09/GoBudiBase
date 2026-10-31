<script lang="ts" module>
	export type ItemLabelPosition = 'above' | 'left' | 'floating' | 'hidden';
	export type ItemSize = 'md' | 'lg';
	export type ItemChildArgs = { id: string; describedBy: string | undefined; invalid: boolean };
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import type { Snippet } from 'svelte';

	let {
		id,
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
		class: className,
		children
	}: {
		id: string;
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
		class?: string;
		children: Snippet<[ItemChildArgs]>;
	} = $props();

	const describedBy = $derived(
		[inlineHelp ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
	);
	const invalid = $derived(Boolean(error));
	const helpLabel = $derived(label ?? id);
	const control = $derived<ItemChildArgs>({ id, describedBy, invalid });
	const sizeClass = $derived(size === 'lg' ? '[--control-h:calc(2.75rem*var(--density))]' : '');
</script>

{#snippet labelEl(cls: string)}
	<label for={id} class={cn('gap-1 text-sm font-medium', cls)}>
		{label}
		{#if required}
			<span class="text-destructive" aria-hidden="true">*</span>
			<span class="sr-only">{t('kit.item.required')}</span>
		{/if}
	</label>
{/snippet}

{#snippet helpButton()}
	{#if help}
		<Popover>
			<PopoverTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						aria-label={t('kit.item.help_for', { label: helpLabel })}
					>
						<CircleHelpIcon />
					</Button>
				{/snippet}
			</PopoverTrigger>
			<PopoverContent class="text-sm text-muted-foreground">{help}</PopoverContent>
		</Popover>
	{/if}
{/snippet}

{#snippet controlRow()}
	<div class="flex items-stretch">
		{#if preText}
			<span
				class="flex h-(--control-h) items-center rounded-l-lg border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground"
				>{preText}</span
			>
		{/if}
		<div
			class={cn(
				'min-w-0 flex-1',
				preText && '[&_input]:rounded-l-none [&_textarea]:rounded-l-none',
				postText && '[&_input]:rounded-r-none [&_textarea]:rounded-r-none'
			)}
		>
			{@render children(control)}
		</div>
		{#if postText}
			<span
				class="flex h-(--control-h) items-center rounded-r-lg border border-l-0 border-input bg-muted px-2.5 text-sm text-muted-foreground"
				>{postText}</span
			>
		{/if}
	</div>
{/snippet}

{#snippet feedback()}
	{#if inlineHelp}
		<p id="{id}-help" class="text-xs text-muted-foreground">{inlineHelp}</p>
	{/if}
	{#if error}
		<p id="{id}-error" class="flex items-center gap-1 text-xs text-destructive">
			<AlertCircleIcon class="size-3.5 shrink-0" />
			{error}
		</p>
	{/if}
{/snippet}

<div
	data-slot="item"
	data-label-position={labelPosition}
	class={cn('flex flex-col gap-1.5', sizeClass, stretch && 'w-full', className)}
>
	{#if labelPosition === 'above'}
		<div class="flex items-center gap-1">
			{@render labelEl('')}
			{@render helpButton()}
		</div>
		{@render controlRow()}
		{@render feedback()}
	{:else if labelPosition === 'left'}
		<div class="grid grid-cols-[10rem_1fr] items-start gap-2">
			<div class="flex h-(--control-h) items-center justify-end gap-1">
				{@render labelEl('text-right')}
				{@render helpButton()}
			</div>
			<div class="flex min-w-0 flex-col gap-1.5">
				{@render controlRow()}
				{@render feedback()}
			</div>
		</div>
	{:else if labelPosition === 'floating'}
		<div class="relative">
			{@render controlRow()}
			{@render labelEl('absolute -top-2 left-2 z-10 bg-card px-1 text-xs font-normal')}
		</div>
		<div class="flex items-center gap-1">{@render helpButton()}</div>
		{@render feedback()}
	{:else}
		{@render labelEl('sr-only')}
		{@render controlRow()}
		<div class="flex items-center gap-1">{@render helpButton()}</div>
		{@render feedback()}
	{/if}
</div>
