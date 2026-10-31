<script lang="ts" module>
	export type WizardStep = { label: string };
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';

	// Wizard Progress (APEX Wizard, F6-06): numbered steps, a tick for the ones
	// already passed, and aria-current on the active step.
	let {
		steps,
		current,
		ariaLabel
	}: {
		steps: WizardStep[];
		current: number;
		ariaLabel?: string;
	} = $props();
</script>

<ol class="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label={ariaLabel}>
	{#each steps as step, index (index)}
		{@const done = index < current}
		{@const active = index === current}
		<li class="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
			<span
				class={cn(
					'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
					done && 'bg-primary text-primary-foreground border-primary',
					active && 'border-primary text-primary',
					!done && !active && 'border-border text-muted-foreground'
				)}
			>
				{#if done}
					<CheckIcon class="size-4" aria-hidden="true" />
				{:else}
					{index + 1}
				{/if}
			</span>
			<span class={cn('text-sm', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
				{step.label}
			</span>
		</li>
	{/each}
</ol>