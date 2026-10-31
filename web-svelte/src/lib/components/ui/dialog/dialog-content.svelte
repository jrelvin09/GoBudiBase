<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		title,
		children,
		footer,
		...restProps
	}: DialogPrimitive.ContentProps & {
		title: string;
		children?: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<DialogPrimitive.Portal>
	<DialogPrimitive.Overlay class="bg-overlay fixed inset-0 z-50" />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(
			'bg-card border-border fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-lg border p-4 shadow-lg',
			className
		)}
		{...restProps}
	>
		<DialogPrimitive.Title class="text-sm font-semibold">{title}</DialogPrimitive.Title>
		<div class="mt-3">{@render children?.()}</div>
		{#if footer}
			<div class="mt-4 flex justify-end gap-2">{@render footer()}</div>
		{/if}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
