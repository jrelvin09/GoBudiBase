<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';
	import CalendarRegion from '$lib/renderer/regions/CalendarRegion.svelte';

	// Region runtime `calendar`: kalender bulanan dari komponen Calendar yang sudah ada.
	// `dateField` menentukan field tanggal yang digambar; data tetap lewat `_query`
	// dengan izin pemanggil sendiri.
	let { meta, dateField }: { meta: ResourceMeta; dateField?: string } = $props();

	const shaped = $derived<ResourceMeta>({ ...meta, calendar_field: dateField ?? meta.calendar_field });
</script>

<CalendarRegion meta={shaped} />
