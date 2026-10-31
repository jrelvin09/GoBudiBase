<script lang="ts">
	import type { ResourceMeta } from '$lib/api/resource-types';

	// Region runtime `text`: teks statis dari definisi halaman. Hanya teks polos; tidak
	// ada HTML atau markdown, jadi tidak ada yang bisa dieksekusi. Baris baru dipertahankan.
	let { text }: { meta?: ResourceMeta; text?: { heading?: string; body?: string } } = $props();
</script>

<div class="flex flex-col gap-1" data-testid="text-region">
	{#if text?.heading}<h2 class="text-base font-semibold">{text.heading}</h2>{/if}
	{#if text?.body}<p class="text-sm break-words whitespace-pre-wrap">{text.body}</p>{/if}
</div>
