<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { demoAggregates, demoMeta, demoRows, demoSettings } from '$lib/kit/demos/fixtures/customers';
	import ColorPickerItem from '$lib/kit/molecules/ColorPickerItem.svelte';
	import TextItem from '$lib/kit/molecules/TextItem.svelte';
	import ReportTable from '$lib/kit/organisms/ir/ReportTable.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import { foregroundFor, isHexColor } from '$lib/theme/color';
	import { cn } from '$lib/utils';

	// Live preview of the draft theme (T2-06). The draft is applied as CSS
	// variables on this wrapper only, so the rest of the application keeps
	// whatever the server sent until Apply Changes is pressed.
	let {
		preset,
		primary,
		primaryDark,
		radius,
		mode = $bindable<'light' | 'dark'>('light')
	}: {
		preset: string;
		primary: string | null;
		primaryDark: string | null;
		radius: string;
		mode?: 'light' | 'dark';
	} = $props();

	let sample = $state('Preview text');
	const sampleError = $derived(t('kit.theme.preview.error_sample'));

	// Only the pieces the Theme Engine owns are overridden here; everything else
	// (surfaces, borders, palettes) comes from the real stylesheet.
	const style = $derived.by(() => {
		const parts = [`--radius: ${radius};`];
		const light = isHexColor(primary) ? primary : '';
		const dark = isHexColor(primaryDark) ? primaryDark : '';
		// The preview shows one mode at a time, so the pair that belongs to the
		// chosen mode is written into --primary.
		const chosen = mode === 'dark' ? dark || light : light || dark;
		if (chosen) {
			parts.push(`--primary: ${chosen};`);
			parts.push(`--primary-foreground: ${foregroundFor(chosen)};`);
			parts.push(`--ring: ${chosen};`);
		}
		return parts.join(' ');
	});
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium">{t('kit.theme.preview.title')}</span>
		<Button
			variant={mode === 'light' ? 'default' : 'outline'}
			size="sm"
			aria-pressed={mode === 'light'}
			onclick={() => (mode = 'light')}
		>
			{t('kit.theme.mode.light')}
		</Button>
		<Button
			variant={mode === 'dark' ? 'default' : 'outline'}
			size="sm"
			aria-pressed={mode === 'dark'}
			onclick={() => (mode = 'dark')}
		>
			{t('kit.theme.mode.dark')}
		</Button>
	</div>

	<div
		data-preview
		data-preset={preset}
		class={cn('bg-background text-foreground border-border flex flex-col gap-3 rounded-lg border p-3', mode === 'dark' && 'dark')}
		style={style}
	>
		<div class="flex flex-wrap items-center gap-2">
			<Button>{t('kit.theme.preview.primary')}</Button>
			<Button variant="secondary">{t('kit.theme.preview.secondary')}</Button>
			<Button variant="outline">{t('kit.theme.preview.outline')}</Button>
			<Button variant="ghost">{t('kit.theme.preview.ghost')}</Button>
			<Button variant="destructive">{t('kit.theme.preview.danger')}</Button>
			<Badge>{t('kit.theme.preview.badge')}</Badge>
			<Badge variant="secondary">2</Badge>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<TextItem id="theme-preview-text" label={t('kit.theme.preview.field')} bind:value={sample} />
			<TextItem
				id="theme-preview-error"
				label={t('kit.theme.preview.field_error')}
				bind:value={sample}
				error={sampleError}
			/>
			<ColorPickerItem id="theme-preview-color" label={t('kit.theme.preview.color')} value={primary} readOnly />
		</div>

		<Region title={t('kit.theme.preview.region')} accent={4}>
			<ReportTable
				meta={demoMeta}
				settings={demoSettings}
				rows={demoRows.slice(0, 5)}
				aggregates={demoAggregates}
				isLastPage={true}
			/>
		</Region>
	</div>
</div>
