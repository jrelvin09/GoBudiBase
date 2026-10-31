<script lang="ts">
	import SimpleDatePicker from '$lib/kit/molecules/SimpleDatePicker.svelte';

	let tanggalPilihan = $state<string | null>('2026-10-31');
	let tanggalBaru = $state<string | null>(null);
</script>

<div class="flex flex-col gap-4 max-w-sm">
	<SimpleDatePicker
		label="Pilih Tanggal Transaksi"
		bind:value={tanggalPilihan}
		placeholder="Pilih tanggal..."
	/>

	<SimpleDatePicker
		label="Tanggal Pengadaan (Kosong)"
		bind:value={tanggalBaru}
		placeholder="Pilih tanggal..."
		required
	/>

	{#if tanggalPilihan}
		<div class="rounded-lg bg-emerald-950/30 border border-emerald-500/30 px-3 py-2 text-xs font-mono text-emerald-300">
			Tanggal terpilih: <strong>{tanggalPilihan}</strong>
		</div>
	{/if}
</div>
