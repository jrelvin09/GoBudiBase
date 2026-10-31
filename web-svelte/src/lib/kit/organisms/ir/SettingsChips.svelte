<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { t } from '$lib/i18n/index.svelte';
	import type { Component } from 'svelte';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import AlignLeftIcon from '@lucide/svelte/icons/align-left';
	import HighlighterIcon from '@lucide/svelte/icons/highlighter';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import XIcon from '@lucide/svelte/icons/x';
	import { describeAggregate, describeBreak, describeFilter, describeHighlight } from './model';
	import type { ReportMeta, ReportSettings } from './types';

	let {
		meta,
		settings,
		ontoggle,
		onremove,
		onedit
	}: {
		meta: ReportMeta;
		settings: ReportSettings;
		ontoggle: (kind: string, id: string) => void;
		onremove: (kind: string, id: string) => void;
		onedit: (kind: string, id: string) => void;
	} = $props();

	type Chip = { kind: string; id: string; text: string; enabled: boolean; icon: Component };

	const chips = $derived<Chip[]>([
		...settings.filters.map((filter) => ({
			kind: 'filter',
			id: filter.id,
			text: describeFilter(filter, meta),
			enabled: filter.enabled,
			icon: FilterIcon
		})),
		...settings.breaks.map((entry) => ({
			kind: 'break',
			id: entry.column,
			text: describeBreak(entry, meta),
			enabled: entry.enabled,
			icon: AlignLeftIcon
		})),
		...settings.highlights.map((entry) => ({
			kind: 'highlight',
			id: entry.id,
			text: describeHighlight(entry),
			enabled: entry.enabled,
			icon: HighlighterIcon
		})),
		...settings.aggregates.map((entry) => ({
			kind: 'aggregate',
			id: entry.id,
			text: describeAggregate(entry, meta),
			enabled: entry.enabled,
			icon: SigmaIcon
		}))
	]);
</script>

{#if chips.length > 0}
	<div class="flex flex-wrap items-center gap-2">
		{#each chips as chip (`${chip.kind}-${chip.id}`)}
			{@const Icon = chip.icon}
			<span class="bg-muted flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-sm">
				<Checkbox
					checked={chip.enabled}
					aria-label={t('kit.ir.enable', { name: chip.text })}
					onCheckedChange={() => ontoggle(chip.kind, chip.id)}
				/>
				<Icon class="text-muted-foreground size-3.5" />
				<button type="button" class="hover:underline" onclick={() => onedit(chip.kind, chip.id)}>
					{chip.text}
				</button>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label={t('kit.ir.remove', { name: chip.text })}
					onclick={() => onremove(chip.kind, chip.id)}
				>
					<XIcon />
				</Button>
			</span>
		{/each}
	</div>
{/if}
