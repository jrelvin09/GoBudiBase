<script lang="ts">
	import type { ResourceMeta, ResourceRecord } from '$lib/api/resource-types';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { resolveRegionComponent } from './component-registry';
	import type { RegionDefinition } from './page-definition';
	import type { RegionPhase } from './runtime-plan';

	// Satu region runtime: memilih komponen dari registry (allowlist statis) dan
	// mengikat ResourceMeta yang sudah dimuat route. Judul H1/breadcrumb tetap
	// milik komponen halaman, bukan milik runtime, supaya tidak dobel.
	let {
		region,
		meta,
		phase,
		onretry,
		record = null,
		prefill = {},
		onsubmitted,
		onrowselect
	}: {
		region: RegionDefinition;
		meta?: ResourceMeta;
		phase: RegionPhase;
		onretry?: () => void;
		record?: ResourceRecord | null;
		prefill?: Record<string, unknown>;
		/** Dipanggil saat form region selesai disimpan (event submit_success). */
		onsubmitted?: () => void;
		/** Dipanggil dengan id baris saat rowAction `select` (master-detail). */
		onrowselect?: (id: string) => void;
	} = $props();

	const Component = $derived(resolveRegionComponent(region.type));
	// Field yang tidak ada di meta (mis. dibatasi izin field) dibuang dari properti presentasi; server tetap penegak.
	const known = $derived(new Set(meta?.fields.map((f) => f.name) ?? []));
	const fields = $derived(region.fields?.filter((n) => known.has(n)));
	const sort = $derived(region.sort && known.has(region.sort.field) ? region.sort : undefined);
	const filters = $derived(region.filters?.filter((f) => known.has(f.field)));
</script>

{#if phase === 'ready' && Component && meta}
	<Component {meta} mode={region.mode} {record} {prefill} {fields} {sort} pageSize={region.pageSize} {filters} rowAction={region.rowAction} onrowselect={onrowselect} metric={region.metric} groupBy={region.groupBy} dateField={region.dateField} text={region.text} ondone={onsubmitted} process={region.onSubmit?.length ? { regionId: region.id } : undefined} />
{:else if phase === 'error'}
	<div class="flex flex-col items-start gap-2" role="alert">
		<p class="text-destructive text-sm">{t('kit.msg.request_failed')}</p>
		{#if onretry}
			<Button variant="outline" size="sm" onclick={onretry}>{t('kit.common.reload')}</Button>
		{/if}
	</div>
{:else if phase === 'unknown_region'}
	<p class="text-destructive text-sm" role="alert">{t('kit.runtime.unknown_region')}</p>
{:else if phase === 'not_found'}
	<p class="text-muted-foreground text-sm">{t('kit.msg.not_found')}</p>
{:else}
	<p class="text-muted-foreground text-sm" role="status">{t('kit.common.loading')}</p>
{/if}
