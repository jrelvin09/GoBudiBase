<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import PopoverPortal from "./popover-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		sideOffset = 4,
		align = "center",
		portalProps,
		class: className,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();
</script>

<PopoverPortal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		{sideOffset}
		{align}
		class={cn(
			"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border border-slate-700/80 bg-slate-900/98 text-slate-100 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 origin-(--bits-popover-content-transform-origin) rounded-2xl p-2.5 text-sm duration-150 outline-none",
			className
		)}
		{...restProps}
	/>
</PopoverPortal>
