<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import FacetedSearch from '$lib/renderer/regions/FacetedSearch.svelte';

	// Region runtime `facets`: pencarian berfaset dari komponen yang sudah ada.
	let { meta }: { meta: ResourceMeta } = $props();
</script>

<FacetedSearch {meta} />
