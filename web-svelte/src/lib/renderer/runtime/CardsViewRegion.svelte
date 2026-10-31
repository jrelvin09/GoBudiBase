<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import CardsRegion from '$lib/renderer/regions/CardsRegion.svelte';

	// Region runtime `cards`: kartu rekaman dari komponen Cards yang sudah ada (data,
	// pencarian, sortir, dan aksi baris lewat endpoint resource yang sama). `fields`
	// memilih isi kartu berurutan: judul, subjudul, lencana, isi.
	let { meta, fields }: { meta: ResourceMeta; fields?: string[] } = $props();

	const shaped = $derived<ResourceMeta>({
		...meta,
		cards: fields?.length
			? { title: fields[0], subtitle: fields[1], badge: fields[2], body: fields[3] }
			: (meta.cards ?? { title: meta.title_field })
	});
</script>

<CardsRegion meta={shaped} />
