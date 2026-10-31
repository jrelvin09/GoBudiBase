<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { getFileUploadSource, type UploadedFile } from './file-upload';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import DisplayOnly from './DisplayOnly.svelte';
	import Item, { type ItemLabelPosition, type ItemSize } from './Item.svelte';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';

	// APEX-style image item (F6-03): a thumbnail plus the same choose/drop and
	// progress behaviour as FileItem. Before the first upload the preview comes
	// from the local file; once attached it comes from the injected download URL.
	let {
		id,
		fieldName,
		value = null,
		label,
		required = false,
		help,
		inlineHelp,
		error,
		labelPosition = 'above',
		size = 'md',
		stretch = false,
		readOnly = false,
		disabled = false,
		maxSize,
		accept,
		onchange,
		class: className
	}: {
		id: string;
		fieldName: string;
		value?: string | null;
		label?: string;
		required?: boolean;
		help?: string;
		inlineHelp?: string;
		error?: string;
		labelPosition?: ItemLabelPosition;
		size?: ItemSize;
		stretch?: boolean;
		readOnly?: boolean;
		disabled?: boolean;
		maxSize?: number;
		accept?: string[];
		onchange?: (value: string | null) => void;
		class?: string;
	} = $props();

	const source = getFileUploadSource();	let current = $state<UploadedFile | null>(null);
	let loadedId = $state<string | null>(null);
	let progress = $state<number | null>(null);
	let localError = $state<string | null>(null);
	let dragging = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	// Object URL of a freshly chosen file (revoked when it is replaced).
	let localPreview = $state<string | null>(null);

	const previewUrl = $derived(localPreview ?? (current && source ? source.url(fieldName, current.id) : null));

	$effect(() => {
		const url = localPreview;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	$effect(() => {
		const currentId = value ?? null;
		if (currentId === null) {
			current = null;
			loadedId = null;
			return;
		}
		if (currentId === loadedId || !source) return;
		let cancelled = false;
		void source
			.meta(fieldName, currentId)
			.then((meta) => {
				if (!cancelled) {
					current = meta;
					loadedId = meta.id;
				}
			})
			.catch(() => {
				if (!cancelled) current = null;
			});
		return () => {
			cancelled = true;
		};
	});
	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function pick(file: File) {
		localError = null;
		if (maxSize && file.size > maxSize) {
			localError = t('kit.file.too_large', { max: formatSize(maxSize) });
			return;
		}
		if (accept && accept.length > 0 && file.type && !accept.includes(file.type)) {
			localError = t('kit.file.not_allowed');
			return;
		}
		if (!source) {
			localError = t('kit.msg.request_failed');
			return;
		}
		localPreview = URL.createObjectURL(file);
		progress = 0;
		try {
			const uploaded = await source.upload(fieldName, file, (percent) => (progress = percent));
			current = uploaded;
			loadedId = uploaded.id;
			onchange?.(uploaded.id);
		} catch (err) {
			localError = err instanceof Error ? err.message : t('kit.msg.request_failed');
			localPreview = null;
		} finally {
			progress = null;
		}
	}

	function onFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void pick(file);
		input.value = '';
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) void pick(file);
	}

	function remove() {
		current = null;
		loadedId = null;
		localError = null;
		localPreview = null;
		onchange?.(null);
	}
</script>
{#if readOnly}
	<DisplayOnly
		{id}
		type="image"
		value={current?.name ?? value ?? ''}
		{label}
		{required}
		{help}
		{inlineHelp}
		{error}
		{labelPosition}
		{size}
		{stretch}
		class={className}
	/>
{:else}
	<Item {id} {label} {required} {help} {inlineHelp} {error} {labelPosition} {size} {stretch} class={className}>
		{#snippet children(ctx)}
			<div class="flex flex-col gap-2">
				{#if previewUrl}
					<img src={previewUrl} alt="" class="border-input h-24 w-24 rounded-lg border object-cover" />
				{/if}
				{#if current}
					<div class="border-input bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
						<span class="min-w-0 flex-1 truncate">{current.name}</span>
						<span class="text-muted-foreground shrink-0">{formatSize(current.size)}</span>
						<Button variant="ghost" size="icon-sm" aria-label={t('kit.file.remove')} {disabled} onclick={remove}>
							<XIcon />
						</Button>
					</div>
				{/if}
				<button
					type="button"
					id={ctx.id}
					{disabled}
					aria-describedby={ctx.describedBy}
					class={cn(
						'border-input text-muted-foreground flex h-(--control-h) w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 text-sm',
						dragging && 'border-primary text-primary',
						disabled && 'opacity-50'
					)}
					onclick={() => inputEl?.click()}
					ondragover={(event) => {
						event.preventDefault();
						dragging = true;
					}}
					ondragleave={() => (dragging = false)}
					ondrop={onDrop}
				>
					<UploadIcon class="size-4" />
					{t('kit.file.drop')}
				</button>
				<input bind:this={inputEl} type="file" class="sr-only" tabindex="-1" aria-hidden="true" aria-label={label ?? t('kit.file.drop')} accept={accept?.join(',')} onchange={onFileInput} />
				{#if progress !== null}
					<div
						class="bg-muted h-2 w-full overflow-hidden rounded"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={progress}
						aria-label={t('kit.file.uploading')}
					>
						<div class="bg-primary h-full" style="width: {progress}%"></div>
					</div>
				{/if}
				{#if localError}
					<p class="text-destructive text-xs" role="alert">{localError}</p>
				{/if}
			</div>
		{/snippet}
	</Item>
{/if}