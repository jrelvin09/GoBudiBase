<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import { passwordStrength } from '$lib/kit/molecules/password-strength';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	let password = $state('');
	const strength = $derived(passwordStrength(password));
	const levelKeys = ['kit.demo.pw_weak', 'kit.demo.pw_weak', 'kit.demo.pw_fair', 'kit.demo.pw_good', 'kit.demo.pw_strong'];
	const level = $derived(levelKeys[strength.score] ?? 'kit.demo.pw_weak');
	const bars = $derived(
		['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-info', 'bg-success'][strength.score] ?? 'bg-destructive'
	);

	const rules = $derived([
		{ key: 'kit.demo.pw_rule_length', ok: strength.rules.length },
		{ key: 'kit.demo.pw_rule_case', ok: strength.rules.lower && strength.rules.upper },
		{ key: 'kit.demo.pw_rule_digit', ok: strength.rules.digit }
	]);
</script>

<div class="grid max-w-xl gap-4">
	<label class="flex flex-col gap-1.5 text-sm">
		<span class="font-medium">{t('kit.demo.pw_label')}</span>
		<input
			type="password"
			bind:value={password}
			autocomplete="new-password"
			class="border-input h-(--control-h) w-full rounded-lg border bg-transparent px-2.5 text-sm"
			aria-describedby="pw-rules"
			aria-invalid={password.length > 0 && strength.score < 3}
		/>
	</label>

	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<div class="flex flex-1 gap-1" aria-hidden="true">
				{#each [0, 1, 2, 3] as index (index)}
					<span class="h-1.5 flex-1 rounded-full {index < strength.score ? bars : 'bg-muted'}"></span>
				{/each}
			</div>
			<span class="text-muted-foreground w-16 text-right text-xs" aria-live="polite">{t(level)}</span>
		</div>

		<ul id="pw-rules" class="flex flex-col gap-1 text-xs">
			{#each rules as rule (rule.key)}
				<li class="flex items-center gap-1.5 {rule.ok ? 'text-success' : 'text-muted-foreground'}">
					{#if rule.ok}
						<CheckIcon class="size-3.5" aria-hidden="true" />
					{:else}
						<XIcon class="size-3.5" aria-hidden="true" />
					{/if}
					{t(rule.key)}
				</li>
			{/each}
		</ul>
	</div>
</div>
