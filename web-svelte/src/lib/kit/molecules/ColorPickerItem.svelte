<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import DisplayOnly from './DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from './Item.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';

	// APEX colour picker (T2-05): a native colour input, a hex text box and a
	// preview swatch that all stay in sync. Not part of the field registry: the
	// Theme Settings page (T2-06) uses it directly.
	const HEX = /^#[0-9a-fA-F]{6}$/;

	let {
		id,
		value = $bindable<string | null>(null),
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

	let text = $state(value ?? '');

	// The hex box follows the value when it is a complete colour; a half-typed
	// value stays as the user typed it until it is valid.
	$effect(() => {
		const current = value ?? '';
		if (current !== text && (current === '' || HEX.test(current))) text = current;
	});

	const swatch = $derived(HEX.test(value ?? '') ? (value as string) : '#000000');

	function commit(next: string | null) {
		value = next;
		text = next ?? '';
		onchange?.(value);
	}

	function onText(raw: string) {
		text = raw;
		const trimmed = raw.trim();
		if (trimmed === '') {
			commit(null);
			return;
		}
		const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
		if (HEX.test(withHash)) commit(withHash.toLowerCase());
	}

	function onColor(raw: string) {
		commit(raw.toLowerCase());
	}
</script>

{#if readOnly}
	<DisplayOnly {id} {label} {labelPosition} value={value ?? ''} type="text" {error} {inlineHelp} {help} {size} />
{:else}
	<Item {id} {label} {required} {help} {inlineHelp} {error} {labelPosition} {preText} {postText} {size} {stretch} class={className}>
		{#snippet children(ctx)}
			<div class="flex items-center gap-2">
				<input
					id={`${ctx.id}-picker`}
					type="color"
					class="border-input h-(--control-h) w-10 cursor-pointer rounded-md border p-1 disabled:opacity-50"
					value={swatch}
					{disabled}
					aria-label={t('kit.color.pick')}
					oninput={(event) => onColor(event.currentTarget.value)}
				/>
				<Input
					id={ctx.id}
					class="h-(--control-h) font-mono"
					value={text}
					{disabled}
					aria-describedby={ctx.describedBy}
					aria-invalid={ctx.invalid}
					placeholder={t('kit.color.placeholder')}
					oninput={(event) => onText(event.currentTarget.value)}
				/>
				<div
					data-swatch
					class={cn('border-border h-(--control-h) w-10 shrink-0 rounded-md border')}
					style="background-color: {swatch};"
					aria-hidden="true"
				></div>
				{#if !required}
					<Button variant="ghost" size="sm" {disabled} onclick={() => commit(null)}>
						{t('kit.color.clear')}
					</Button>
				{/if}
			</div>
		{/snippet}
	</Item>
{/if}
