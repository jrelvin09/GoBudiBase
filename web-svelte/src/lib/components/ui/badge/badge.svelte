<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
				success: "bg-success text-success-foreground [a]:hover:bg-success/90",
				warning: "bg-warning text-warning-foreground [a]:hover:bg-warning/90",
				info: "bg-info text-info-foreground [a]:hover:bg-info/90",
				outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

	// Palet aksen 1..12 (setara APEX `u-color-N`). Kelas ditulis eksplisit,
	// bukan dirakit dengan template string, agar pemindai Tailwind menemukannya.
	export const badgePalettes = {
		1: "border-palette-1 bg-palette-1-subtle text-foreground",
		2: "border-palette-2 bg-palette-2-subtle text-foreground",
		3: "border-palette-3 bg-palette-3-subtle text-foreground",
		4: "border-palette-4 bg-palette-4-subtle text-foreground",
		5: "border-palette-5 bg-palette-5-subtle text-foreground",
		6: "border-palette-6 bg-palette-6-subtle text-foreground",
		7: "border-palette-7 bg-palette-7-subtle text-foreground",
		8: "border-palette-8 bg-palette-8-subtle text-foreground",
		9: "border-palette-9 bg-palette-9-subtle text-foreground",
		10: "border-palette-10 bg-palette-10-subtle text-foreground",
		11: "border-palette-11 bg-palette-11-subtle text-foreground",
		12: "border-palette-12 bg-palette-12-subtle text-foreground"
	} as const;

	export type BadgePalette = keyof typeof badgePalettes;
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		palette,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		palette?: BadgePalette;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), palette ? badgePalettes[palette] : undefined, className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
