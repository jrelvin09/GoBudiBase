<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { computationAliases } from './model';
	import type { ReportMeta } from './types';

	// The Columns and Keypad panels shared by Compute and Row Filter (K4-09, K4-10).
	const KEYPAD = ['+', '-', '*', '/', '(', ')', '||'];
	const FUNCS = ['ABS', 'ROUND', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'NVL', 'COALESCE'];

	let { meta, oninsert }: { meta: ReportMeta; oninsert: (text: string) => void } = $props();

	const aliases = $derived(computationAliases(meta));
</script>

<div class="grid grid-cols-2 gap-3">
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.ir.compute.columns')}</span>
		<div class="flex flex-wrap gap-1">
			{#each aliases as alias (alias.letter)}
				<Button variant="outline" size="xs" onclick={() => oninsert(alias.letter)}>
					{alias.letter} {alias.field.label}
				</Button>
			{/each}
		</div>
	</div>
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">{t('kit.ir.compute.keypad')}</span>
		<div class="flex flex-wrap gap-1">
			{#each KEYPAD as key (key)}
				<Button variant="outline" size="xs" onclick={() => oninsert(key)}>{key}</Button>
			{/each}
			{#each FUNCS as fn (fn)}
				<Button variant="outline" size="xs" onclick={() => oninsert(`${fn}(`)}>{fn}</Button>
			{/each}
		</div>
	</div>
</div>
