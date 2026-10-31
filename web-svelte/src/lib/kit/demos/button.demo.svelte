<script lang="ts">
	import { Button, type ButtonVariant } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	// Padanan jenis tombol APEX Universal Theme.
	const variants: { apex: string; variant: ButtonVariant }[] = [
		{ apex: 'Hot', variant: 'default' },
		{ apex: 'Normal', variant: 'outline' },
		{ apex: 'Danger', variant: 'destructive' },
		{ apex: 'Success', variant: 'success' },
		{ apex: 'Warning', variant: 'warning' },
		{ apex: 'Simple / Flat', variant: 'ghost' },
		{ apex: 'Link', variant: 'link' }
	];

	const sizes = ['xs', 'sm', 'default', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;

	const i18nButtons: { key: string; variant: ButtonVariant }[] = [
		{ key: 'kit.common.save', variant: 'default' },
		{ key: 'kit.common.cancel', variant: 'outline' },
		{ key: 'kit.common.delete', variant: 'destructive' },
		{ key: 'kit.common.apply_changes', variant: 'secondary' },
		{ key: 'kit.common.reset', variant: 'ghost' },
		{ key: 'kit.common.close', variant: 'link' }
	];
</script>

<div class="flex flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">APEX button types</h2>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b text-muted-foreground">
						<th class="py-1 pr-4 font-medium">APEX</th>
						<th class="py-1 pr-4 font-medium">Text</th>
						<th class="py-1 pr-4 font-medium">Text + icon start</th>
						<th class="py-1 pr-4 font-medium">Text + icon end</th>
						<th class="py-1 font-medium">Icon only</th>
					</tr>
				</thead>
				<tbody>
					{#each variants as item (item.apex)}
						<tr class="border-b last:border-0">
							<td class="py-2 pr-4 text-muted-foreground">{item.apex}</td>
							<td class="py-2 pr-4">
								<Button variant={item.variant}>Button</Button>
							</td>
							<td class="py-2 pr-4">
								<Button variant={item.variant}>
									<PlusIcon data-icon="inline-start" />
									Button
								</Button>
							</td>
							<td class="py-2 pr-4">
								<Button variant={item.variant}>
									Button
									<PlusIcon data-icon="inline-end" />
								</Button>
							</td>
							<td class="py-2">
								<Button variant={item.variant} size="icon" aria-label="{item.apex} button">
									<PlusIcon />
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">Sizes</h2>
		<div class="flex flex-wrap items-center gap-2">
			{#each sizes as size (size)}
				{#if size.startsWith('icon')}
					<Button {size} aria-label={size}>
						<PlusIcon />
					</Button>
				{:else}
					<Button {size}>{size}</Button>
				{/if}
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">i18n</h2>
		<div class="flex flex-wrap items-center gap-2">
			{#each i18nButtons as item (item.key)}
				<Button variant={item.variant}>{t(item.key)}</Button>
			{/each}
		</div>
	</section>
</div>
