<script lang="ts">
	import { Badge, type BadgePalette, type BadgeVariant } from '$lib/components/ui/badge';

	const variants: BadgeVariant[] = [
		'default',
		'secondary',
		'destructive',
		'success',
		'warning',
		'info',
		'outline',
		'ghost',
		'link'
	];

	const palettes: BadgePalette[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
</script>

<div class="flex flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">Variants</h2>
		<div class="flex flex-wrap items-center gap-2">
			{#each variants as variant (variant)}
				<Badge {variant}>{variant}</Badge>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">Palettes</h2>
		<div class="flex flex-wrap items-center gap-2">
			{#each palettes as palette (palette)}
				<Badge {palette}>Palette {palette}</Badge>
			{/each}
		</div>
	</section>
</div>
