<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import XIcon from '@lucide/svelte/icons/x';

	// Organisme tidak boleh mengimpor `$lib/stores` (aturan tingkat K0-03),
	// jadi bentuknya ditulis di sini dan layout yang menghubungkan ke store.
	let {
		successes,
		errors,
		ondismiss,
		onclear
	}: {
		successes: { id: number; text: string }[];
		errors: { text: string; fieldId?: string }[];
		ondismiss?: (id: number) => void;
		onclear?: () => void;
	} = $props();

	const errorTitle = $derived(
		errors.length === 1
			? t('kit.msg.errors_occurred_one')
			: t('kit.msg.errors_occurred_other', { count: errors.length })
	);

	function focusField(fieldId: string) {
		document.getElementById(fieldId)?.focus();
	}
</script>

<div class="fixed top-3 right-3 z-50 flex flex-col gap-2">
	{#each successes as item (item.id)}
		<div
			role="status"
			class="bg-success text-success-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-md"
		>
			<CircleCheckIcon class="size-4 shrink-0" />
			<span>{item.text}</span>
			<button
				type="button"
				aria-label={t('kit.common.close')}
				onclick={() => ondismiss?.(item.id)}
				class="rounded-md p-0.5"
			>
				<XIcon class="size-4" />
			</button>
		</div>
	{/each}
</div>

{#if errors.length > 0}
	<div role="alert" class="bg-destructive/10 border-destructive text-destructive mb-4 rounded-lg border p-3">
		<div class="flex items-start gap-2">
			<CircleXIcon class="mt-0.5 size-4 shrink-0" />
			<div class="flex flex-col gap-1">
				<p class="text-sm font-medium">{errorTitle}</p>
				<ul class="flex flex-col gap-0.5">
					{#each errors as err, i (i)}
						<li class="text-sm">
							{#if err.fieldId}
								{@const fieldId = err.fieldId}
								<button type="button" class="underline underline-offset-2" onclick={() => focusField(fieldId)}>
									{err.text}
								</button>
							{:else}
								{err.text}
							{/if}
						</li>
					{/each}
				</ul>
			</div>
			<button
				type="button"
				aria-label={t('kit.common.close')}
				onclick={() => onclear?.()}
				class="ml-auto rounded-md p-0.5"
			>
				<XIcon class="size-4" />
			</button>
		</div>
	</div>
{/if}
