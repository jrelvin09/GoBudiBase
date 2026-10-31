<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { Component } from 'svelte';
	import { formatDateTime } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import { displayText } from '$lib/kit/molecules/display';
	import { historyDiff, relativeTime, type HistoryEntry } from './history';

	// Timeline riwayat record (F2-13): terbaru di atas, dengan daftar field
	// yang berubah (lama → baru) untuk tiap entri update.
	let {
		entries,
		current = null,
		fields,
		canRestore = false,
		onrestore
	}: {
		entries: HistoryEntry[];
		current?: Record<string, unknown> | null;
		fields: FieldMeta[];
		canRestore?: boolean;
		onrestore?: (entry: HistoryEntry) => void;
	} = $props();

	const OP_ICON: Record<HistoryEntry['operation'], Component> = {
		create: PlusIcon,
		update: PencilIcon,
		delete: Trash2Icon
	};

	const rows = $derived(historyDiff(entries, current));

	function fieldOf(name: string): FieldMeta | undefined {
		return fields.find((field) => field.name === name);
	}

	/** Nilai terformat untuk tampilan; null/kosong menjadi "—". */
	function valueText(name: string, value: unknown): string {
		const field = fieldOf(name);
		const text = field ? displayText(field.type, value, field.options) : value == null ? '' : String(value);
		return text === '' ? '—' : text;
	}
</script>
{#if rows.length === 0}
	<p class="text-muted-foreground text-sm">{t('kit.msg.no_data_found')}</p>
{:else}
	<ol class="flex flex-col gap-3">
		{#each rows as row, index (index)}
			{@const Icon = OP_ICON[row.entry.operation]}
			<li class="border-border flex flex-col gap-1 border-l-2 pl-3">
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<Icon class="size-4" aria-hidden="true" />
					<span class="font-medium">{t(`kit.history.op.${row.entry.operation}`)}</span>
					<span class="text-muted-foreground">{row.entry.actor_name}</span>
					<time
						datetime={row.entry.occurred_at}
						title={formatDateTime(row.entry.occurred_at)}
						class="text-muted-foreground"
					>
						{relativeTime(row.entry.occurred_at)}
					</time>
				</div>
				{#if row.changes.length > 0}
					<ul class="text-muted-foreground flex flex-col gap-0.5 text-sm">
						{#each row.changes as change (change.field)}
							<li>
								{t('kit.history.change', {
									field: fieldOf(change.field)?.label ?? change.field,
									from: valueText(change.field, change.from),
									to: valueText(change.field, change.to)
								})}
							</li>
						{/each}
					</ul>
				{/if}
				{#if canRestore && row.entry.operation === 'update'}
					<div>
						<Button variant="outline" size="sm" onclick={() => onrestore?.(row.entry)}>
							{t('kit.history.restore_version')}
						</Button>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
{/if}