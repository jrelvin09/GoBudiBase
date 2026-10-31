<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import { fileDownloadUrl, fileMeta, labels as fetchLabels, lookup, uploadFile } from '$lib/api/resources';
	import { getFieldInput } from '$lib/kit/fields/registry';
	import { setFileUploadSource } from '$lib/kit/molecules/file-upload';
	import { setRelationSource } from '$lib/kit/fields/relation';
	import type { FieldMeta } from '$lib/kit/fields/types';
	import Region from '$lib/kit/organisms/Region.svelte';
	import Tabs from '$lib/kit/organisms/Tabs.svelte';
	import { isVisible } from '$lib/renderer/visibility';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';

	let {
		meta,
		values = $bindable<Record<string, unknown>>({}),
		fieldErrors = {},
		readOnly = false,
		columns = 2,
		recordId = null
	}: {
		meta: ResourceMeta;
		values?: Record<string, unknown>;
		fieldErrors?: Record<string, string>;
		readOnly?: boolean;
		columns?: 1 | 2;
		/** Record being edited; the file download URL needs it (F6-03). */
		recordId?: string | null;
	} = $props();

	// belongs_to lookups for the fields below (F2-06): the fields tier cannot
	// import `$lib/api`, so this renderer component injects them.
	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	setRelationSource({
		search: (field, q, page) => lookup(context(), meta.id, field, q, page).then((resp) => resp.data),
		labels: (field, ids) => fetchLabels(context(), meta.id, field, ids).then((resp) => resp.data.labels)
	});

	// File/image upload for the fields below (F6-03): the fields tier cannot
	// import `$lib/api`, so this renderer component injects it.
	setFileUploadSource({
		upload: (field, file, onProgress) =>
			uploadFile(context(), meta.id, field, file, onProgress, sessionStore.csrfToken).then((resp) => resp.data),
		meta: (field) => fileMeta(context(), meta.id, recordId ?? '', field).then((resp) => resp.data),
		url: (field) => (recordId ? fileDownloadUrl(meta.id, recordId, field) : null)
	});

	let formEl = $state<HTMLFormElement | null>(null);
	// A field with a VisibleWhen rule disappears while its controller does not match (F6-04).
	const visibleFields = $derived(meta.fields.filter((field) => isVisible(field, values)));

	// Form layout (F6-05): sections, with consecutive tab sections grouped into
	// one Tabs. Without a layout the form stays one plain grid.
	type SectionView = { name: string; label: string; tab: boolean; columns: 1 | 2; fields: FieldMeta[] };
	type Block = { tabs?: SectionView[]; section?: SectionView };

	const sections = $derived(
		(meta.form_layout ?? []).map((section) => ({
			name: section.name,
			label: section.label,
			tab: section.tab,
			columns: (section.columns === 1 ? 1 : 2) as 1 | 2,
			fields: section.fields
				.map((name) => visibleFields.find((field) => field.name === name))
				.filter((field): field is FieldMeta => field !== undefined)
		}))
	);

	const blocks = $derived.by(() => {
		const out: Block[] = [];
		for (const section of sections) {
			const last = out[out.length - 1];
			if (section.tab && last?.tabs) last.tabs.push(section);
			else if (section.tab) out.push({ tabs: [section] });
			else out.push({ section });
		}
		return out;
	});

	// Active tab per tabs-block; a missing entry means the first tab.
	let tabValues = $state<Record<number, string>>({});
	const tabIndex = $derived.by(() => {
		const map: Record<string, { block: number; name: string }> = {};
		blocks.forEach((block, index) => {
			for (const tab of block.tabs ?? []) {
				for (const field of tab.fields) map[field.name] = { block: index, name: tab.name };
			}
		});
		return map;
	});

	// A failed save that names a field inside a tab selects that tab (F6-05).
	$effect(() => {
		const first = Object.keys(fieldErrors).find((name) => fieldErrors[name]);
		if (!first) return;
		const hit = tabIndex[first];
		if (hit && tabValues[hit.block] !== hit.name) tabValues = { ...tabValues, [hit.block]: hit.name };
	});

	/** Validitas bawaan browser (mis. angka tidak valid dari NumberItem, K1-13). */
	export function isNativeValid(): boolean {
		return formEl ? formEl.checkValidity() : true;
	}

	function setValue(fieldName: string, next: unknown) {
		values = { ...values, [fieldName]: next };
	}
</script>

{#snippet fieldGrid(list: FieldMeta[], cols: 1 | 2)}
	<div class={cn('grid gap-4', cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
		{#each list as field (field.name)}
			{@const Input = getFieldInput(field.type)}
			<div class={cn(field.type === 'textarea' && cols === 2 && 'sm:col-span-2')}>
				<Input
					{field}
					id={`P_${field.name}`}
					value={values[field.name]}
					error={fieldErrors[field.name]}
					readOnly={readOnly || field.read_only === true}
					onchange={(next) => setValue(field.name, next)}
				/>
			</div>
		{/each}
	</div>
{/snippet}

<form bind:this={formEl} novalidate class="w-full">
	{#if sections.length === 0}
		{@render fieldGrid(visibleFields, columns)}
	{:else}
		<div class="flex flex-col gap-4">
			{#each blocks as block, index (index)}
				{#if block.tabs}
					<Tabs
						bind:value={tabValues[index]}
						items={block.tabs.map((tab) => ({
							value: tab.name,
							label: tab.label,
							invalid: tab.fields.some((field) => Boolean(fieldErrors[field.name]))
						}))}
						ariaLabel={meta.label}
					/>
					{#each block.tabs as tab (tab.name)}
						{#if (tabValues[index] ?? block.tabs[0]?.name) === tab.name}
							<div
								role="tabpanel"
								id="panel-{tab.name}"
								aria-labelledby="tab-{tab.name}"
								tabindex="0"
								class="focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
							>
								{@render fieldGrid(tab.fields, tab.columns)}
							</div>
						{/if}
					{/each}
				{:else if block.section}
					<Region title={block.section.label} headingLevel={2}>
						{@render fieldGrid(block.section.fields, block.section.columns)}
					</Region>
				{/if}
			{/each}
		</div>
	{/if}
</form>
