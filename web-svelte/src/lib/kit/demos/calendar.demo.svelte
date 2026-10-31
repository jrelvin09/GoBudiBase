<script lang="ts">
	import MonthCalendar from '$lib/kit/organisms/calendar/MonthCalendar.svelte';
	import { weekStartFor } from '$lib/kit/organisms/calendar/month';

	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	/** Tanggal relatif hari ini agar demo selalu menunjukkan event. */
	function iso(offset: number): string {
		const date = new Date();
		date.setDate(date.getDate() + offset);
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	}

	const rows: Record<string, unknown>[] = [
		{ id: '1', name: 'Acme Corp', customer_since: iso(0) },
		{ id: '2', name: 'Bumi Retail', customer_since: iso(0) },
		{ id: '3', name: 'Cahaya Niaga', customer_since: iso(0) },
		{ id: '4', name: 'Delta Karya', customer_since: iso(0) },
		{ id: '5', name: 'Eka Jaya', customer_since: iso(2) },
		{ id: '6', name: 'Fajar Sentosa', customer_since: iso(-3) },
		{ id: '7', name: 'Gita Mandiri', customer_since: iso(10) },
		{ id: '8', name: 'Hana Abadi', customer_since: iso(40) }
	];

	let yearId = $state(now.getFullYear());
	let monthId = $state(now.getMonth() + 1);
	let yearEn = $state(now.getFullYear());
	let monthEn = $state(now.getMonth() + 1);
</script>
<div class="flex flex-col gap-8">
	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">id · minggu mulai Senin</h2>
		<MonthCalendar bind:year={yearId} bind:month={monthId} weekStart={weekStartFor('id')} {rows} dateField="customer_since" titleField="name" canCreate />
	</section>
	<section class="flex flex-col gap-3">
		<h2 class="text-muted-foreground text-sm font-medium">en · minggu mulai Minggu</h2>
		<MonthCalendar bind:year={yearEn} bind:month={monthEn} weekStart={weekStartFor('en')} {rows} dateField="customer_since" titleField="name" canCreate />
	</section>
</div>