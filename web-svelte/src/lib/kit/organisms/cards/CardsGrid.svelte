<script lang="ts" module>
	export type CardsMeta = { title: string; subtitle?: string; badge?: string; body?: string };
	export type CardsColumns = 2 | 3 | 4 | 5;
	export type CardsVariant = 'basic' | 'compact' | 'featured';
</script>

<script lang="ts">
	import { Badge, type BadgePalette } from '$lib/components/ui/badge';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import { displayText, type DisplayType } from '$lib/kit/molecules/display';
	import type { ReportMeta } from '$lib/kit/organisms/ir/types';
	import { t } from '$lib/i18n/index.svelte';
import type { Snippet } from 'svelte';

	let {
		rows,
		meta,
		cards,
		columns = 3,
		variant = 'basic',
		linkHref,
		onedit,
		labels,
		rowmenu
	}: {
		rows: Record<string, unknown>[];
		meta: ReportMeta;
		cards?: CardsMeta;
		columns?: CardsColumns;
		variant?: CardsVariant;
		linkHref?: (row: Record<string, unknown>) => string;
		onedit?: (row: Record<string, unknown>) => void;
		labels?: Record<string, Record<string, string>>;
		/** Menu aksi baris (F2-11). */
		rowmenu?: Snippet<[Record<string, unknown>]>;
	} = $props();

	// Kelas ditulis eksplisit agar pemindai Tailwind menemukannya (T0-02).
	const COLS: Record<CardsColumns, string> = {
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
		5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
	};
	const PAD: Record<CardsVariant, string> = {
		basic: 'gap-2 p-4',
		compact: 'gap-1 p-2',
		featured: 'gap-3 border-t-[3px] border-t-primary p-5'
	};
	const TITLE: Record<CardsVariant, string> = {
		basic: 'text-sm font-medium',
		compact: 'text-sm font-medium',
		featured: 'text-base font-semibold'
	};
	function field(name?: string): FieldMeta | undefined {
		return name ? meta.fields.find((entry) => entry.name === name) : undefined;
	}

	function value(row: Record<string, unknown>, name?: string): string {
		if (!name) return '';
		const f = field(name);
		const raw = row[name];
		if (raw === null || raw === undefined) return '';
		if (f?.type === 'belongs_to') {
			if (raw === '') return '';
			return labels?.[name]?.[String(raw)] ?? '—';
		}
		return f ? displayText(f.type as DisplayType, raw, f.options) : String(raw);
	}

	// Tone badge mengikuti urutan opsi: opsi ke-N memakai palette N+1 (K6-02).
	function palette(row: Record<string, unknown>, name?: string): BadgePalette | undefined {
		const f = field(name);
		if (!f || !name) return undefined;
		const options = f.type === 'toggle' ? ['true', 'false'] : (f.options?.map((option) => option.value) ?? []);
		const index = options.indexOf(String(row[name]));
		return (((index < 0 ? 0 : index) % 12) + 1) as BadgePalette;
	}
	// Drawer (K6-05): klik kartu membuka form, bukan pindah halaman.
	function onCardClick(event: MouseEvent, row: Record<string, unknown>) {
		if (!onedit) return;
		event.preventDefault();
		onedit(row);
	}
</script>
{#snippet card(row: Record<string, unknown>)}
	{@const title = value(row, cards?.title)}
	{@const subtitle = value(row, cards?.subtitle)}
	{@const badge = cards?.badge ? value(row, cards.badge) : ''}
	{@const body = value(row, cards?.body)}
	<div class="flex items-start justify-between gap-2">
		<h3 class={TITLE[variant]}>{title}</h3>
		{#if badge}
			<Badge palette={palette(row, cards?.badge)}>{badge}</Badge>
		{/if}
	</div>
	{#if subtitle}
		<p class="text-muted-foreground text-sm">{subtitle}</p>
	{/if}
	{#if body}
		<p class="text-muted-foreground line-clamp-3 text-sm">{body}</p>
	{/if}
{/snippet}

{#if rows.length === 0}
	<p class="text-muted-foreground py-6 text-center text-sm">{t('kit.msg.no_data_found')}</p>
{:else}
	<div class="grid gap-3 {COLS[columns]}">
		{#each rows as row, index (String(row.id ?? index))}
			<div class="relative">
			{#if linkHref || onedit}
				<a
					class="bg-card border-border flex flex-col rounded-lg border {PAD[variant]} focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					href={linkHref?.(row)}
					onclick={(event) => onCardClick(event, row)}
				>
					{@render card(row)}
				</a>
			{:else}
				<article class="bg-card border-border flex flex-col rounded-lg border {PAD[variant]}">
					{@render card(row)}
				</article>
			{/if}
			{#if rowmenu}
				<div class="absolute top-2 right-2">
					{@render rowmenu(row)}
				</div>
			{/if}
		</div>
		{/each}
	</div>
{/if}
