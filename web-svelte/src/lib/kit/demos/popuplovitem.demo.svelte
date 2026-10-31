<script lang="ts">
	import PopupLovItem, { type LovItem } from '$lib/kit/molecules/PopupLovItem.svelte';

	// Fake source (F2-05): the real lookup comes from `_lookup` in F2-06.
	const people: LovItem[] = Array.from({ length: 40 }, (_, i) => ({
		id: `p${i + 1}`,
		label: `Salesperson ${String(i + 1).padStart(2, '0')}`
	}));

	const PAGE = 8;

	async function search(q: string, page: number) {
		const needle = q.toLowerCase();
		const found = people.filter((entry) => entry.label.toLowerCase().includes(needle));
		const start = (page - 1) * PAGE;
		return { items: found.slice(start, start + PAGE), total: found.length };
	}

	let value = $state<string | null>(null);
	let valueLabel = $state<string | null>(null);
	let required = $state<string | null>(null);
	let requiredLabel = $state<string | null>(null);
</script>

<div class="flex max-w-xl flex-col gap-4">
	<p class="text-muted-foreground text-sm">
		APEX popup LOV: the box is read-only, the search button opens a debounced list, and the data
		source is injected. Choose a value and clear it again; the required one has no clear button.
	</p>
	<PopupLovItem
		id="lov-plain"
		label="Salesperson"
		{value}
		valueLabel={valueLabel}
		{search}
		onchange={(id, label) => {
			value = id;
			valueLabel = label;
		}}
	/>
	<PopupLovItem
		id="lov-required"
		label="Required salesperson"
		required
		value={required}
		valueLabel={requiredLabel}
		{search}
		onchange={(id, label) => {
			required = id;
			requiredLabel = label;
		}}
	/>
	<PopupLovItem id="lov-readonly" label="Read only" readOnly value={value} valueLabel={valueLabel} />
</div>
