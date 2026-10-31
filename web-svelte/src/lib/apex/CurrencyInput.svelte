<script lang="ts">
	let {
		value = $bindable(0),
		placeholder = '0',
		disabled = false,
		currencyPrefix = 'Rp',
		className = ''
	}: {
		value?: number;
		placeholder?: string;
		disabled?: boolean;
		currencyPrefix?: string;
		className?: string;
	} = $props();

	function formatDisplay(num: number): string {
		if (isNaN(num) || num === null || num === undefined) return '';
		return new Intl.NumberFormat('id-ID').format(num);
	}

	let displayVal = $state(formatDisplay(value));

	$effect(() => {
		displayVal = formatDisplay(value);
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const rawDigits = target.value.replace(/[^0-9]/g, '');
		const parsed = rawDigits ? parseInt(rawDigits, 10) : 0;
		value = parsed;
		displayVal = formatDisplay(parsed);
	}
</script>

<div class="relative inline-flex w-full items-center rounded-lg border border-slate-700 bg-slate-900 shadow-inner focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 {className}">
	<span class="pointer-events-none select-none pl-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
		{currencyPrefix}
	</span>
	<input
		type="text"
		inputmode="numeric"
		{disabled}
		{placeholder}
		value={displayVal}
		oninput={handleInput}
		class="w-full bg-transparent px-2.5 py-1.5 text-right font-mono text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
	/>
</div>
