<script lang="ts">
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';

	let quantity = $state(3);
	let bounded = $state(10);

	function adjust(target: 'quantity' | 'bounded', delta: number, min: number, max: number) {
		const current = target === 'quantity' ? quantity : bounded;
		const next = Math.min(max, Math.max(min, current + delta));
		if (target === 'quantity') quantity = next;
		else bounded = next;
	}
</script>

{#snippet stepper(id: string, label: string, value: number, min: number, max: number, target: 'quantity' | 'bounded')}
	<div class="flex flex-col gap-1.5">
		<label for={id} class="text-sm font-medium">{label}</label>
		<div class="flex items-stretch gap-2">
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label="{label} -1"
				disabled={value <= min}
				onclick={() => adjust(target, -1, min, max)}
			>
				<MinusIcon />
			</Button>
			<input
				{id}
				type="number"
				class="border-input h-(--control-h) w-20 rounded-lg border bg-transparent px-2.5 text-center text-sm"
				{min}
				{max}
				value={value}
				readonly
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label="{label} +1"
				disabled={value >= max}
				onclick={() => adjust(target, 1, min, max)}
			>
				<PlusIcon />
			</Button>
		</div>
	</div>
{/snippet}

<div class="grid max-w-xl gap-6">
	{@render stepper('stepper-qty', t('kit.demo.step_qty'), quantity, 0, 10, 'quantity')}
	{@render stepper('stepper-bounded', t('kit.demo.bounded_step', { min: 5, max: 20 }), bounded, 5, 20, 'bounded')}
</div>
