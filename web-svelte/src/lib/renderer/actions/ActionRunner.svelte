<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import type { ActionMeta, ResourceMeta } from '$lib/api/resource-types';
	import { t } from '$lib/i18n/index.svelte';
	import { confirm } from '$lib/kit/confirm.svelte';
	import { notify } from '$lib/stores/notify.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import ActionDialog from './ActionDialog.svelte';
	import { runAction } from './actions';

	// Menjalankan aksi resource dari mana saja (F2-11): aksi berform membuka
	// dialog, aksi ber-confirm memakai confirm(), lalu pemanggil memuat ulang.
	let { meta, ondone }: { meta: ResourceMeta; ondone: (affected: number) => void } = $props();

	let dialogOpen = $state(false);
	let current = $state<ActionMeta | null>(null);
	let ids = $state<string[]>([]);

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	async function apply(
		action: ActionMeta,
		recordIds: string[],
		values: Record<string, unknown>
	): Promise<ApiError | null> {
		try {
			const resp = await runAction(context(), meta.id, action.name, recordIds, values, sessionStore.csrfToken);
			notify.success(t('kit.msg.action_done', { n: resp.data.affected }));
			ondone(resp.data.affected);
			return null;
		} catch (err) {
			if (err instanceof ApiError) return err;
			notify.errors([{ text: t('kit.msg.request_failed') }]);
			return null;
		}
	}

	/** Entry point untuk menu baris/bulk/header. */
	export async function run(action: ActionMeta, recordIds: string[]) {
		if (action.form && action.form.length > 0) {
			current = action;
			ids = recordIds;
			dialogOpen = true;
			return;
		}
		if (
			action.confirm &&
			!(await confirm({ title: action.label, message: action.confirm_text || action.label, danger: action.danger }))
		) {
			return;
		}
		await apply(action, recordIds, {});
	}
</script>

<ActionDialog
	bind:open={dialogOpen}
	action={current}
	onsubmit={async (values) => (current ? apply(current, ids, values) : null)}
/>