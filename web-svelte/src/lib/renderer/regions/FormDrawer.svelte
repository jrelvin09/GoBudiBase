<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { getRecord } from '$lib/api/resources';
	import type { ResourceMeta, ResourceRecord } from '$lib/api/resource-types';
	import * as Sheet from '$lib/components/ui/sheet';
	import { t } from '$lib/i18n/index.svelte';
	import { confirm } from '$lib/kit/confirm.svelte';
	import ResourceFormPage from '$lib/renderer/pages/ResourceFormPage.svelte';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';

	// Form di drawer (K6-05): dipakai saat `form_mode === 'drawer'`. Sheet
	// menjebak fokus dan mengembalikannya ke pemicu; Escape menutup.
	let {
		open = $bindable(false),
		meta,
		mode,
		recordId = null,
		prefill = null,
		hiddenFields = [],
		onsaved
	}: {
		open?: boolean;
		meta: ResourceMeta;
		mode: 'create' | 'edit';
		recordId?: string | null;
		prefill?: Record<string, unknown> | null;
		/** Fields kept out of the rendered form (F3-03). */
		hiddenFields?: string[];
		onsaved?: () => void;
	} = $props();

	let record = $state<ResourceRecord | null>(null);
	let loadState = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}
	$effect(() => {
		if (!open || mode !== 'edit' || !recordId) {
			record = null;
			loadState = 'idle';
			return;
		}
		let cancelled = false;
		loadState = 'loading';
		getRecord(context(), meta.id, recordId)
			.then((resp) => {
				if (cancelled) return;
				record = resp.data;
				loadState = 'ready';
			})
			.catch((err) => {
				if (cancelled) return;
				loadState = 'error';
				notify.errors([{ text: err instanceof ApiError ? err.message : t('kit.msg.request_failed') }]);
			});
		return () => {
			cancelled = true;
		};
	});

	let dirty = $state(false);

	// Escape, overlay, and Cancel all come here: ask before dropping unsaved changes (K2-10).
	async function close() {
		if (dirty) {
			const ok = await confirm({ message: t('kit.msg.unsaved_changes'), okLabel: t('kit.common.go'), danger: true });
			if (!ok) return;
		}
		open = false;
	}
</script>
<Sheet.Root bind:open={() => open, (next) => { if (!next) void close(); }}>
	<Sheet.Content side="right" class="w-full sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title>
				{mode === 'create' ? t('kit.common.create') : t('kit.common.edit')} {meta.label}
			</Sheet.Title>
			<Sheet.Description class="sr-only">{meta.plural}</Sheet.Description>
		</Sheet.Header>
		<div class="overflow-y-auto p-4">
			{#if mode === 'create' || (loadState === 'ready' && record)}
				<ResourceFormPage
					{meta}
					{mode}
					record={record}
					embedded
					bind:dirty
					hiddenFields={hiddenFields}
					prefill={prefill ?? {}}
					ondone={() => (onsaved ? onsaved() : (open = false))}
					oncancel={close}
				/>
			{:else if loadState === 'error'}
				<p class="text-destructive text-sm">{t('kit.msg.request_failed')}</p>
			{:else}
				<p class="text-muted-foreground text-sm">{t('kit.common.loading')}</p>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>