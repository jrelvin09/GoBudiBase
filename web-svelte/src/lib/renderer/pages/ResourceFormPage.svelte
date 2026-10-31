<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { APP_NAME } from '$lib/app';
	import { ApiError } from '$lib/api/client';
	import { createRecord, deleteRecord, getHistory, getRecord, listPendingApprovals, updateRecord } from '$lib/api/resources';
	import type { ActionMeta, PendingApproval, ResourceMeta, ResourceRecord } from '$lib/api/resource-types';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import { confirm } from '$lib/kit/confirm.svelte';
	import HistoryTimeline from '$lib/kit/organisms/history/HistoryTimeline.svelte';
	import Region from '$lib/kit/organisms/Region.svelte';
	import RelationManager from '$lib/renderer/regions/RelationManager.svelte';
	import ApprovalPanel from '$lib/renderer/workflow/ApprovalPanel.svelte';
	import { resourcesStore } from '$lib/stores/resources.svelte';
	import Tabs from '$lib/kit/organisms/Tabs.svelte';
	import WizardProgress from '$lib/kit/organisms/WizardProgress.svelte';
	import FormRegion from '$lib/renderer/regions/FormRegion.svelte';
import MenuPopup from '$lib/kit/molecules/MenuPopup.svelte';
import ActionRunner from '$lib/renderer/actions/ActionRunner.svelte';
import { rowActions } from '$lib/renderer/actions/actions';
	import {
		changedFields,
		clientValidate,
		initialValues,
		serverErrorsToMap,
		type FormErrors,
		type FormValues
	} from '$lib/renderer/form-state';
	import { notify } from '$lib/stores/notify.svelte';
	import type { HistoryEntry } from '$lib/kit/organisms/history/history';
	import { sessionStore } from '$lib/stores/session.svelte';

	let {
		meta,
		mode,
		record = null,
		prefill = {},
		embedded = false,
		ondone,
		oncancel,
		hiddenFields = [],
		createOverride,
		dirty = $bindable(false)
	}: {
		/** Pengganti simpan mode create, mis. proses halaman terdaftar (F001); validasi server tetap berlaku. */
		createOverride?: (values: Record<string, unknown>) => Promise<unknown>;
		meta: ResourceMeta;
		mode: 'create' | 'edit';
		record?: ResourceRecord | null;
		prefill?: Record<string, unknown>;
		embedded?: boolean;
		ondone?: () => void;
		oncancel?: () => void;
		/** True while there are unsaved changes; lets a drawer guard its own close (K6-05). */
		dirty?: boolean;
		/** Fields kept out of the rendered form (a relation's locked FK, F3-03). */
		hiddenFields?: string[];
	} = $props();

	function recordValues(meta: ResourceMeta, rec: ResourceRecord | null): FormValues {
		const values = rec ? ({} as FormValues) : initialValues(meta);
		if (rec) {
			for (const field of meta.fields) {
				if (field.type === 'toggle') {
					values[field.name] = rec[field.name] === true || rec[field.name] === 1 || rec[field.name] === 'true';
				} else {
					values[field.name] = rec[field.name] ?? null;
				}
			}
		}
		for (const [name, value] of Object.entries(prefill)) {
			if (name in values) values[name] = value;
		}
		return values;
	}

	const listHref = $derived(`/r/${meta.id}`);
	const canCreate = $derived(meta.capabilities.create === true);
	const canUpdate = $derived(meta.capabilities.update === true);
	const canDelete = $derived(meta.capabilities.delete === true);
	const readOnly = $derived(mode === 'edit' && !canUpdate);
	const canSubmit = $derived(mode === 'create' ? canCreate : canUpdate);
	const hidden = $derived(hiddenFields ?? []);
	const formMeta = $derived(hidden.length === 0 ? meta : { ...meta, fields: meta.fields.filter((field) => !hidden.includes(field.name)) });
	const visibleRelations = $derived((meta.relations ?? []).filter((relation) => resourcesStore.getResource(relation.resource)));
	const approvalTransitions = $derived((meta.workflow?.transitions ?? []).filter((tr) => tr.approval_levels > 0));
	const hasApprovals = $derived(mode === 'edit' && record != null && approvalTransitions.length > 0);
	const showTabs = $derived(
		!embedded &&
			mode === 'edit' &&
			(meta.capabilities.history === true || visibleRelations.length > 0 || hasApprovals)
	);
	let activeTab = $state('details');
	const activeRelation = $derived(visibleRelations.find((relation) => 'rel_' + relation.name === activeTab));

	// Wizard create (F6-06): one FormLayout section per step; editing keeps the
	// section/tab display of F6-05.
	const wizardSteps = $derived(formMeta.form_layout ?? []);
	const wizard = $derived(mode === 'create' && meta.create_wizard === true && wizardSteps.length > 0);
	let step = $state(0);
	const stepMeta = $derived(
		wizard ? { ...formMeta, form_layout: [wizardSteps[Math.min(step, wizardSteps.length - 1)]] } : formMeta
	);

	// Nilai awal form; halaman ini dibuat ulang tiap navigasi, jadi snapshot
	// awal ini memang disengaja (bukan nilai yang ikut berubah).
	// svelte-ignore state_referenced_locally
	let version = $state(record?.version ?? 0);
	// svelte-ignore state_referenced_locally
	let original = $state<FormValues>(recordValues(meta, record));
	// svelte-ignore state_referenced_locally
	let values = $state<FormValues>(recordValues(meta, record));
	let fieldErrors = $state<FormErrors>({});
	let saving = $state(false);
	let versionConflict = $state(false);
	let leaving = $state(false);
	let formRegion = $state<{ isNativeValid: () => boolean } | null>(null);
	let runner = $state<{ run: (action: ActionMeta, ids: string[]) => Promise<void> } | null>(null);
	let historyEntries = $state<HistoryEntry[]>([]);
	let historyError = $state(false);

	// Setiap state workflow dapat satu warna; yang tak dikenal memakai `secondary`.
	const STATE_VARIANTS: Record<string, BadgeVariant> = {
		draft: 'secondary',
		submitted: 'warning',
		pending: 'warning',
		approved: 'success',
		active: 'success',
		confirmed: 'success',
		done: 'success',
		rejected: 'destructive',
		cancelled: 'destructive',
		failed: 'destructive',
		blocked: 'destructive'
	};

	// Header edit (F7-04): badge state dari field workflow, tombol transisi dari
	// aksi otomatis. State dibaca dari `values` (bukan `record`) supaya ikut segar
	// setelah refreshRecord pasca-aksi.
	let pending = $state<PendingApproval[]>([]);
	const workflowField = $derived(meta.workflow?.field ?? '');
	const workflowState = $derived(workflowField ? String(values[workflowField] ?? '') : '');
	const workflowFieldMeta = $derived(meta.fields.find((field) => field.name === workflowField) ?? null);
	const workflowStateLabel = $derived.by(() => {
		const option = workflowFieldMeta?.options?.find((item) => item.value === workflowState);
		return option?.label ?? workflowState.replace(/_/g, ' ');
	});

	// Transisi approval yang record ini tunggu keputusan saya. Server tetap
	// otoritatif; daftar pending hanya penentu tampilnya tombol approve/reject.
	const pendingTransitions = $derived.by(() => {
		const set = new Set<string>();
		if (!record) return set;
		for (const item of pending) {
			if (item.resource === meta.id && item.record_id === record.id) set.add(item.transition);
		}
		return set;
	});

	const transitionActions = $derived.by(() => {
		const wf = meta.workflow;
		if (mode !== 'edit' || !record || !wf) return [] as ActionMeta[];
		const byName = new Map((meta.actions ?? []).map((action) => [action.name, action]));
		const available = (name: string): ActionMeta | null => {
			const action = byName.get(name);
			if (!action) return null;
			const when = action.available_when;
			if (when && (when.field !== wf.field || !when.values.map((value) => String(value)).includes(workflowState))) {
				return null;
			}
			return action;
		};
		const out: ActionMeta[] = [];
		for (const tr of wf.transitions) {
			if (tr.approval_levels > 0) {
				if (!pendingTransitions.has(tr.name)) continue;
				for (const name of [`${tr.name}_approve`, `${tr.name}_reject`]) {
					const action = available(name);
					if (action) out.push(action);
				}
				continue;
			}
			const action = available(tr.name);
			if (action) out.push(action);
		}
		return out;
	});

	// Aksi transisi tampil sebagai tombol header, jadi bukan lagi item menu.
	const menuActions = $derived(
		rowActions(meta).filter((action) => !(meta.workflow && action.available_when?.field === meta.workflow.field))
	);

	const changed = $derived(changedFields(original, values));
	$effect(() => {
		dirty = !leaving && changed.length > 0;
	});

	// Selesai: drawer memakai ondone; halaman mandiri kembali ke daftar (K6-05).
	async function finish() {
		leaving = true;
		if (ondone) {
			ondone();
			return;
		}
		await goto(listHref);
	}

	// K2-10: peringatan perubahan belum disimpan.
	beforeNavigate((navigation) => {
		if (leaving || changed.length === 0) return;
		navigation.cancel();
		// K2-11: reload/tutup tab sudah punya dialog browser sendiri.
		if (navigation.type === 'leave') return;
		void confirm({
			message: t('kit.msg.unsaved_changes'),
			okLabel: t('kit.common.go'),
			danger: true
		}).then((ok) => {
			if (ok && navigation.to) {
				leaving = true;
				void goto(navigation.to.url.pathname + navigation.to.url.search);
			}
		});
	});

	$effect(() => {
		if (leaving || changed.length === 0) return;
		const handler = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	function validate(): FormErrors {
		const errors: FormErrors = {};
		for (const [field, key] of Object.entries(clientValidate(meta, values))) errors[field] = t(key);
		return errors;
	}

	/** Fields of one wizard step (F6-06). */
	function stepFields(index: number): string[] {
		return wizardSteps[index]?.fields ?? [];
	}

	/** Client validation for one wizard step only. */
	function stepErrors(index: number): FormErrors {
		const names = stepFields(index);
		const subset = { ...formMeta, fields: formMeta.fields.filter((field) => names.includes(field.name)) };
		const errors: FormErrors = {};
		for (const [field, key] of Object.entries(clientValidate(subset, values))) errors[field] = t(key);
		return errors;
	}

	function firstErrorStep(errors: FormErrors): number {
		const names = Object.keys(errors);
		for (let index = 0; index < wizardSteps.length; index++) {
			if (stepFields(index).some((field) => names.includes(field))) return index;
		}
		return 0;
	}

	function nextStep() {
		if (!nativeValid()) return;
		const errors = stepErrors(step);
		if (Object.keys(errors).length > 0) {
			fieldErrors = errors;
			notifyFieldErrors(errors);
			return;
		}
		fieldErrors = {};
		step = Math.min(step + 1, wizardSteps.length - 1);
	}

	function prevStep() {
		fieldErrors = {};
		step = Math.max(step - 1, 0);
	}

	function notifyFieldErrors(errors: FormErrors) {
		notify.errors(
			Object.entries(errors).map(([field, message]) => ({ text: message, fieldId: `P_${field}` }))
		);
	}

	/** Fokus ke input pertama yang ditolak browser; jangan kirim. */
	function nativeValid(): boolean {
		if (formRegion?.isNativeValid()) return true;
		const invalid = document.querySelector('form :invalid');
		if (invalid instanceof HTMLElement) invalid.focus();
		notify.errors([{ text: t('kit.msg.invalid_input') }]);
		return false;
	}

	function handleError(err: unknown) {
		if (err instanceof ApiError) {
			if (err.status === 422 && err.fieldErrors.length > 0) {
				const map = serverErrorsToMap(err.fieldErrors);
				fieldErrors = map;
				notifyFieldErrors(map);
				return;
			}
			notify.errors([{ text: err.message }]);
			return;
		}
		notify.errors([{ text: t('kit.msg.request_failed') }]);
	}

	async function submitCreate() {
		if (!nativeValid()) return;
		const errors = validate();
		fieldErrors = errors;
		if (Object.keys(errors).length > 0) {
			notifyFieldErrors(errors);
			if (wizard) step = firstErrorStep(errors);
			return;
		}
		saving = true;
		try {
			if (createOverride) await createOverride(values);
			else await createRecord(context(), meta.id, values, sessionStore.csrfToken);
			notify.success(t('kit.msg.row_created'));
			await finish();
		} catch (err) {
			handleError(err);
			// A server error on Finish sends the wizard to the first bad step.
			if (wizard && Object.keys(fieldErrors).length > 0) step = firstErrorStep(fieldErrors);
		} finally {
			saving = false;
		}
	}

	async function submitUpdate() {
		if (changed.length === 0) {
			notify.success(t('kit.msg.no_changes'));
			return;
		}
		if (!nativeValid()) return;
		const errors = validate();
		fieldErrors = errors;
		if (Object.keys(errors).length > 0) {
			notifyFieldErrors(errors);
			return;
		}
		const payload: Record<string, unknown> = {};
		for (const field of changed) payload[field] = values[field];
		saving = true;
		try {
			await updateRecord(context(), meta.id, record!.id, version, payload, sessionStore.csrfToken);
			notify.success(t('kit.msg.changes_saved'));
			await finish();
		} catch (err) {
			if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
				versionConflict = true;
				notify.errors([{ text: t('kit.msg.version_conflict') }]);
			} else {
				handleError(err);
			}
		} finally {
			saving = false;
		}
	}

	async function onDelete() {
		if (!record) return;
		const ok = await confirm({
			message: t('kit.msg.confirm_delete'),
			okLabel: t('kit.common.delete'),
			danger: true
		});
		if (!ok) return;
		saving = true;
		try {
			await deleteRecord(context(), meta.id, record.id, version, sessionStore.csrfToken);
			notify.success(t('kit.msg.row_deleted'));
			await finish();
		} catch (err) {
			handleError(err);
		} finally {
			saving = false;
		}
	}

	async function reload() {
		if (!record) return;
		const ok = await confirm({
			message: t('kit.msg.discard_changes'),
			okLabel: t('kit.common.reload'),
			danger: true
		});
		if (!ok) return;
		try {
			const resp = await getRecord(context(), meta.id, record.id);
			version = resp.data.version;
			original = recordValues(meta, resp.data);
			values = recordValues(meta, resp.data);
			fieldErrors = {};
			versionConflict = false;
		} catch (err) {
			handleError(err);
		}
	}

	// Setelah aksi (F2-11) record diambil ulang tanpa dialog.
	async function refreshRecord() {
		if (!record) return;
		try {
			const resp = await getRecord(context(), meta.id, record.id);
			version = resp.data.version;
			original = recordValues(meta, resp.data);
			values = recordValues(meta, resp.data);
			fieldErrors = {};
		} catch (err) {
			handleError(err);
		}
	}

	function stateVariant(state: string): BadgeVariant {
		return STATE_VARIANTS[state.toLowerCase()] ?? 'secondary';
	}

	// Daftar record yang menunggu keputusan saya (F7-02/F7-04); hanya dimuat
	// untuk resource ber-approval.
	async function loadPending() {
		if (!record || approvalTransitions.length === 0) return;
		try {
			const resp = await listPendingApprovals(context());
			pending = resp.data;
		} catch {
			pending = [];
		}
	}

	$effect(() => {
		if (mode === 'edit' && record && approvalTransitions.length > 0) void loadPending();
	});

	// Setelah aksi: segarkan record (state) dan daftar pending (tombol, F7-04).
	async function onActionDone() {
		await refreshRecord();
		await loadPending();
	}

	// Riwayat hanya dimuat saat tab-nya ada (F2-13).
	async function loadHistory() {
		if (!record) return;
		try {
			const resp = await getHistory(context(), meta.id, record.id);
			historyEntries = resp.data;
			historyError = false;
		} catch {
			historyError = true;
		}
	}

	$effect(() => {
		if (showTabs && record) void loadHistory();
	});

	// "Kembalikan versi ini": PATCH biasa dengan nilai snapshot versi itu (F2-13).
	async function restoreEntry(entry: HistoryEntry) {
		if (!record) return;
		const ok = await confirm({
			message: t('kit.history.restore_confirm'),
			okLabel: t('kit.history.restore_version'),
			danger: true
		});
		if (!ok) return;
		const snapshot = entry.snapshot ?? {};
		const payload: Record<string, unknown> = {};
		for (const field of meta.fields) {
			if (field.name in snapshot) payload[field.name] = snapshot[field.name];
		}
		saving = true;
		try {
			await updateRecord(context(), meta.id, record.id, version, payload, sessionStore.csrfToken);
			notify.success(t('kit.msg.changes_saved'));
			await refreshRecord();
			await loadHistory();
		} catch (err) {
			if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
				versionConflict = true;
				notify.errors([{ text: t('kit.msg.version_conflict') }]);
			} else {
				handleError(err);
			}
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	{#if !embedded}
		<title>{meta.label} — {APP_NAME}</title>
	{/if}
</svelte:head>

<div class="flex flex-col gap-4">
	{#if !embedded}
		<nav aria-label="Breadcrumb" class="text-muted-foreground flex items-center gap-1 text-sm">
			<a href={listHref} class="text-primary underline-offset-4 hover:underline">{meta.plural}</a>
			<span aria-hidden="true">›</span>
			<span>{mode === 'create' ? t('kit.common.create') : t('kit.common.edit')}</span>
		</nav>
	{/if}

	{#if mode === 'edit' && record}
		<div class="flex flex-wrap items-center gap-2">
			{#if workflowField && workflowState}
				<Badge variant={stateVariant(workflowState)} title={workflowFieldMeta?.label}>
					{workflowStateLabel}
				</Badge>
			{/if}
			{#if transitionActions.length > 0 || menuActions.length > 0}
				<div class="ms-auto flex flex-wrap items-center gap-2">
					{#each transitionActions as action (action.name)}
						<Button
							variant={action.danger ? 'destructive' : 'default'}
							size="sm"
							disabled={saving}
							onclick={() => void runner?.run(action, [String(record?.id)])}
						>
							{action.label}
						</Button>
					{/each}
					{#if menuActions.length > 0}
						<MenuPopup
							label={t('kit.ir.actions')}
							items={menuActions.map((action) => ({
								label: action.label,
								danger: action.danger,
								onselect: () => void runner?.run(action, [String(record?.id)])
							}))}
						/>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#snippet formPanel()}
		<FormRegion bind:this={formRegion} meta={formMeta} bind:values {fieldErrors} {readOnly} recordId={record?.id ?? null} />

			{#if versionConflict}
				<div class="mt-4">
					<Button variant="outline" size="sm" onclick={reload} disabled={saving}>
						{t('kit.common.reload')}
					</Button>
				</div>
			{/if}

			<div class="mt-4 flex items-center justify-end gap-2">
				{#if mode === 'edit' && canDelete}
					<Button variant="destructive" class="mr-auto" onclick={onDelete} disabled={saving}>
						{t('kit.common.delete')}
					</Button>
				{/if}
				<Button variant="outline" onclick={() => (oncancel ? oncancel() : goto(listHref))} disabled={saving}>
					{t('kit.common.cancel')}
				</Button>
				{#if canSubmit}
					<Button onclick={mode === 'create' ? submitCreate : submitUpdate} disabled={saving}>
						{saving
							? t('kit.common.loading')
							: mode === 'create'
								? t('kit.common.create')
								: t('kit.common.apply_changes')}
					</Button>
				{/if}
			</div>
	{/snippet}

	{#snippet wizardPanel()}
		<WizardProgress steps={wizardSteps} current={step} ariaLabel={meta.label} />
		<FormRegion bind:this={formRegion} meta={stepMeta} bind:values {fieldErrors} {readOnly} recordId={null} />

		<div class="mt-4 flex items-center justify-end gap-2">
			<Button variant="outline" onclick={() => (oncancel ? oncancel() : goto(listHref))} disabled={saving}>
				{t('kit.common.cancel')}
			</Button>
			<Button variant="outline" onclick={prevStep} disabled={saving || step === 0}>
				{t('kit.wizard.back')}
			</Button>
			{#if step < wizardSteps.length - 1}
				<Button onclick={nextStep} disabled={saving}>{t('kit.wizard.next')}</Button>
			{:else}
				<Button onclick={submitCreate} disabled={saving}>
					{saving ? t('kit.common.loading') : t('kit.wizard.finish')}
				</Button>
			{/if}
		</div>
	{/snippet}

	{#snippet historyPanel()}
		{#if historyError}
			<p class="text-destructive text-sm">{t('kit.ir.load_failed')}</p>
		{:else}
			<HistoryTimeline
				entries={historyEntries}
				current={original}
				fields={meta.fields}
				canRestore={canUpdate}
				onrestore={(entry) => void restoreEntry(entry)}
			/>
		{/if}
	{/snippet}

	{#snippet relationPanel()}
		{#if activeRelation && record}
			<RelationManager relation={activeRelation} parentId={record.id} />
		{/if}
	{/snippet}

	{#snippet approvalPanel()}
		{#if record}
			<ApprovalPanel resId={meta.id} recordId={record.id} transitions={approvalTransitions} />
		{/if}
	{/snippet}

	<Region title={meta.label} headingLevel={1} variant={embedded ? 'plain' : 'standard'}>
		{#if mode === 'create' && !canCreate}
			<p class="text-destructive text-sm">{t('kit.msg.not_authorized')}</p>
		{:else if wizard}
			{@render wizardPanel()}
		{:else if showTabs}
			<Tabs
				bind:value={activeTab}
				items={[
					{ value: 'details', label: t('kit.history.tab_details'), content: formPanel },
					...visibleRelations.map((relation) => ({ value: 'rel_' + relation.name, label: relation.label, content: relationPanel })),
					...(hasApprovals
						? [{ value: 'approval', label: t('kit.workflow.tab_approval'), content: approvalPanel }]
						: []),
					...(meta.capabilities.history === true
						? [{ value: 'history', label: t('kit.history.tab_history'), content: historyPanel }]
						: [])
				]}
				ariaLabel={meta.label}
			/>
		{:else}
			{@render formPanel()}
		{/if}
	</Region>

	<ActionRunner bind:this={runner} {meta} ondone={() => void onActionDone()} />
</div>
