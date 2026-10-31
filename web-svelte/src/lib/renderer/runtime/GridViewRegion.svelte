<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import InteractiveGrid from '$lib/renderer/regions/InteractiveGrid.svelte';

	// Region runtime `grid`: Interactive Grid yang sudah ada (sunting di tempat). Setiap
	// perubahan tetap lewat endpoint resource, jadi izin, scope, dan kebijakan field
	// ditegakkan server.
	let { meta }: { meta: ResourceMeta } = $props();
</script>

<InteractiveGrid {meta} />
