<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { demoAggregates, demoMeta, demoRows, demoSettings } from '$lib/kit/demos/fixtures/customers';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import ReportTable from '$lib/kit/organisms/ir/ReportTable.svelte';

	const PRESETS = ['neutral', 'forest'] as const;

	let sample = $state('Preset sample');
</script>

<div class="flex flex-wrap items-start gap-4">
	{#each PRESETS as preset (preset)}
		<div
			data-preset={preset}
			class="bg-background text-foreground border-border flex min-w-80 flex-1 flex-col gap-3 rounded-lg border p-4"
		>
			<span class="text-muted-foreground text-xs font-medium uppercase">{preset}</span>
			<div class="flex flex-wrap items-center gap-2">
				<Button>Primary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="destructive">Destructive</Button>
				<Badge>Badge</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge palette={5}>Palette 5</Badge>
			</div>
			<TextItem id="preset-sample-{preset}" label="Item" bind:value={sample} />
			<div class="overflow-x-auto">
				<ReportTable
					meta={demoMeta}
					settings={demoSettings}
					rows={demoRows}
					aggregates={demoAggregates}
					isLastPage={true}
				/>
			</div>
		</div>
	{/each}
</div>
