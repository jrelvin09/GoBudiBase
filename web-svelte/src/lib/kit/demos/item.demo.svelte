<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import Item from '$lib/kit/molecules/Item.svelte';

	const positions = ['above', 'left', 'floating', 'hidden'] as const;
</script>

<div class="flex flex-col gap-8">
	{#each positions as position (position)}
		<section class="flex flex-col gap-4">
			<h2 class="text-sm font-medium text-muted-foreground">{position}</h2>
			<div class="grid max-w-xl gap-4">
				<Item
					id="{position}-normal"
					label="Normal"
					labelPosition={position}
					help="Help text shown in a popover."
				>
					{#snippet children(ctx)}
						<Input
							id={ctx.id}
							aria-describedby={ctx.describedBy}
							aria-invalid={ctx.invalid}
							class="h-(--control-h)"
							placeholder="Normal"
						/>
					{/snippet}
				</Item>

				<Item id="{position}-required" label="Required" labelPosition={position} required>
					{#snippet children(ctx)}
						<Input
							id={ctx.id}
							aria-describedby={ctx.describedBy}
							aria-invalid={ctx.invalid}
							class="h-(--control-h)"
							placeholder="Required"
						/>
					{/snippet}
				</Item>

				<Item
					id="{position}-error"
					label="With error"
					labelPosition={position}
					error="This field is required."
					inlineHelp="Inline help below the control."
				>
					{#snippet children(ctx)}
						<Input
							id={ctx.id}
							aria-describedby={ctx.describedBy}
							aria-invalid={ctx.invalid}
							class="h-(--control-h)"
							placeholder="With error"
						/>
					{/snippet}
				</Item>

				<Item
					id="{position}-prepost"
					label="Amount"
					labelPosition={position}
					preText="$"
					postText=".00"
				>
					{#snippet children(ctx)}
						<Input
							id={ctx.id}
							aria-describedby={ctx.describedBy}
							aria-invalid={ctx.invalid}
							class="h-(--control-h)"
							placeholder="1,234"
						/>
					{/snippet}
				</Item>
			</div>
		</section>
	{/each}
</div>
