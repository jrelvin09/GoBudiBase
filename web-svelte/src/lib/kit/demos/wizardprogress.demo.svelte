<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import WizardProgress from '$lib/kit/organisms/WizardProgress.svelte';

	const steps = [{ label: 'Company' }, { label: 'Documents' }, { label: 'Review' }];
	let current = $state(1);
</script>

<div class="flex flex-col gap-6">
	<WizardProgress {steps} {current} ariaLabel="Wizard demo" />
	<div class="flex gap-2">
		<Button variant="outline" disabled={current === 0} onclick={() => (current = Math.max(0, current - 1))}>
			Back
		</Button>
		<Button disabled={current === steps.length - 1} onclick={() => (current = Math.min(steps.length - 1, current + 1))}>
			Next
		</Button>
	</div>
</div>