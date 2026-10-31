<script lang="ts">
	import type { ResourceMeta, ResourceRecord } from '$lib/api/resource-types';
	import { runPageProcess } from '$lib/api/resources';
	import ResourceFormPage from '$lib/renderer/pages/ResourceFormPage.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { FormMode } from './page-definition';

	// Region runtime `resource-form`: adapter tipis ke ResourceFormPage yang ada.
	// Mode berasal dari PageDefinition; record dan prefill dipasok route tepercaya.
	// `fields` (P6) hanya memilih field yang tampil; validasi tetap di server.
	// `process` (F001): bila region punya `onSubmit`, simpan lewat proses terdaftar.
	let {
		meta,
		mode,
		record = null,
		prefill = {},
		fields,
		ondone,
		process
	}: {
		meta: ResourceMeta;
		mode: FormMode;
		record?: ResourceRecord | null;
		prefill?: Record<string, unknown>;
		fields?: string[];
		/** Bila ada, dipanggil setelah simpan menggantikan kembali ke daftar (submit_success). */
		ondone?: () => void;
		process?: { regionId: string };
	} = $props();

	const hiddenFields = $derived(fields?.length ? meta.fields.map((f) => f.name).filter((name) => !fields.includes(name)) : []);
	const createOverride = $derived(
		process && mode === 'create'
			? (values: Record<string, unknown>) =>
					runPageProcess(
						{
							companyId: sessionStore.context.company_id ?? '',
							locationId: sessionStore.context.location_id ?? null,
							contextVersion: sessionStore.context.context_version
						},
						meta.id,
						process.regionId,
						values,
						sessionStore.csrfToken
					)
			: undefined
	);
</script>

<ResourceFormPage {meta} {mode} {record} {prefill} {hiddenFields} {ondone} {createOverride} />
