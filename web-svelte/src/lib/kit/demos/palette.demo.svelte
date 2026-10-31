<script lang="ts">
	// Kelas ditulis eksplisit (bukan `bg-palette-{n}`) agar pemindai statis
	// Tailwind benar-benar menghasilkan utilitasnya.
	const cells = [
		{ n: 1, strong: 'bg-palette-1', subtle: 'bg-palette-1-subtle' },
		{ n: 2, strong: 'bg-palette-2', subtle: 'bg-palette-2-subtle' },
		{ n: 3, strong: 'bg-palette-3', subtle: 'bg-palette-3-subtle' },
		{ n: 4, strong: 'bg-palette-4', subtle: 'bg-palette-4-subtle' },
		{ n: 5, strong: 'bg-palette-5', subtle: 'bg-palette-5-subtle' },
		{ n: 6, strong: 'bg-palette-6', subtle: 'bg-palette-6-subtle' },
		{ n: 7, strong: 'bg-palette-7', subtle: 'bg-palette-7-subtle' },
		{ n: 8, strong: 'bg-palette-8', subtle: 'bg-palette-8-subtle' },
		{ n: 9, strong: 'bg-palette-9', subtle: 'bg-palette-9-subtle' },
		{ n: 10, strong: 'bg-palette-10', subtle: 'bg-palette-10-subtle' },
		{ n: 11, strong: 'bg-palette-11', subtle: 'bg-palette-11-subtle' },
		{ n: 12, strong: 'bg-palette-12', subtle: 'bg-palette-12-subtle' }
	];
</script>

<div class="flex flex-col gap-4">
	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">Strong</h2>
		<div class="grid grid-cols-6 gap-2">
			{#each cells as cell (cell.n)}
				<div
					id="p-{cell.n}"
					class={['rounded-md px-2 py-4 text-center text-xs text-foreground', cell.strong]}
				>
					{cell.n}
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-muted-foreground">Subtle</h2>
		<div class="grid grid-cols-6 gap-2">
			{#each cells as cell (cell.n)}
				<div
					id="p-{cell.n}-subtle"
					class={['rounded-md px-2 py-4 text-center text-xs text-foreground', cell.subtle]}
				>
					{cell.n}
				</div>
			{/each}
		</div>
	</section>
</div>
