<script lang="ts">
	import type { ResourceMeta, ResourceRecord } from '$lib/api/resource-types';
	import { t } from '$lib/i18n/index.svelte';
	import RegionRuntime from './RegionRuntime.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { notify } from '$lib/stores/notify.svelte';
	import { runAction } from '$lib/renderer/actions/actions';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { emptyActionState, runActions, type ActionState, type ServerCall } from './page-actions';
	import { initialItemValues, resolveFilters, type ItemValues } from './page-items';
	import type { SharedRuntime } from '$lib/api/resources';
	import { applyDatasource, itemOptions, regionAllowed } from './shared';
	import { describeIssuesLocalized, planPage, type RegionPlan, type RuntimeStatus } from './runtime-plan';
	import Region from '$lib/kit/organisms/Region.svelte';
	import Tabs from '$lib/kit/organisms/Tabs.svelte';
	import type { RegionDefinition } from './page-definition';

	// Shell runtime: memvalidasi PageDefinition sebelum render, lalu merender
	// tiap region dengan key stabil. Region yang gagal (tipe tak dikenal,
	// resource tidak ada, metadata gagal dimuat) hanya menampilkan pesan sendiri —
	// region lain dan shell halaman tetap hidup. `status` eksplisit supaya
	// kegagalan metadata tidak pernah tampil sebagai loading permanen (MR-R01).
	let {
		page,
		meta,
		status,
		onretry,
		record = null,
		prefill = {},
		query,
		context = {},
		metaFor,
		shared
	}: {
		page: unknown;
		meta?: ResourceMeta;
		status: RuntimeStatus;
		onretry?: () => void;
		record?: ResourceRecord | null;
		prefill?: Record<string, unknown>;
		/** Query URL untuk inisialisasi item yang dideklarasikan (P4). */
		query?: URLSearchParams;
		/** Variabel konteks tepercaya dari sesi/rute (user.id, company.id, location.id, route.*). */
		context?: Record<string, string>;
		/** Metadata per resource untuk halaman multi-resource (sudah terfilter izin). */
		metaFor?: (resourceId: string) => ResourceMeta | undefined;
		/** Komponen bersama yang sudah dievaluasi untuk pengguna ini (LOV, data source, skema otorisasi). */
		shared?: SharedRuntime;
	} = $props();

	const plan = $derived(planPage(page, meta, status, undefined, metaFor));
	const items = $derived(plan.state === 'ready' ? (plan.page.items ?? []) : []);
	const actions = $derived(plan.state === 'ready' ? plan.page.actions : undefined);

	// State item dan efek aksi: hanya memori, per halaman (P4/P5).
	let values = $state<ItemValues>({});
	let hidden = $state<Record<string, boolean>>({});
	let disabled = $state<Record<string, boolean>>({});
	let dialogs = $state<Record<string, boolean>>({});
	let refresh = $state<Record<string, number>>({});
	let previous: ItemValues | null = null;

	/** Terapkan hasil mesin aksi ke state tampilan dan jalankan efek samping (navigate, panggilan server). */
	function apply(result: ActionState, runCalls: boolean) {
		values = result.values;
		hidden = result.hidden;
		disabled = result.disabled;
		dialogs = result.dialogs;
		refresh = result.refresh;
		previous = { ...result.values };
		if (result.navigate) void goto(`/r/${encodeURIComponent(result.navigate)}`);
		if (runCalls) for (const call of result.calls) void serverCall(call);
	}

	function snapshot(): ActionState {
		return { ...emptyActionState({ ...values }), hidden: { ...hidden }, disabled: { ...disabled }, dialogs: { ...dialogs }, refresh: { ...refresh } };
	}

	/** Aksi server terdaftar (fw.Action) lewat endpoint resource yang ada; izin dicek server. */
	async function serverCall(call: ServerCall) {
		try {
			await runAction(
				{
					companyId: sessionStore.context.company_id ?? '',
					locationId: sessionStore.context.location_id ?? null,
					contextVersion: sessionStore.context.context_version
				},
				call.resourceId,
				call.action,
				call.id ? [call.id] : [],
				{},
				sessionStore.csrfToken
			);
			notify.success(t('kit.runtime.action_done'));
			const bumped = { ...refresh };
			for (const r of plan.state === 'ready' ? plan.regions : []) bumped[r.region.id] = (bumped[r.region.id] ?? 0) + 1;
			refresh = bumped;
		} catch {
			notify.errors([{ text: t('kit.msg.request_failed') }]);
		}
	}

	function fire(trigger: string) {
		apply(runActions(actions, trigger, snapshot()), true);
	}

	$effect(() => {
		const acts = actions;
		const initial = initialItemValues(items, query);
		// untrack: efek ini hanya bergantung pada definisi halaman dan query, bukan pada nilai yang diubah pengguna.
		untrack(() => {
			apply(runActions(acts, 'load', { ...emptyActionState(initial) }), true);
		});
	});

	// Perubahan item oleh pengguna memicu aksi dengan `on: <id item>`; hasilnya ditulis balik sekali.
	$effect(() => {
		const now = { ...values };
		if (!previous || !actions) {
			previous = now;
			return;
		}
		const changed = Object.keys(now).filter((id) => now[id] !== previous?.[id]);
		if (changed.length === 0) return;
		let state: ActionState = { ...snapshot(), values: now };
		for (const id of changed) state = runActions(actions, id, state);
		apply(state, true);
	});

	/** Region submit_success: hanya dipasang bila halaman memang punya aksi untuk event itu. */
	function submitHook(regionId: string): (() => void) | undefined {
		const inDialog = plan.state === 'ready' && plan.regions.some((r) => r.region.id === regionId && r.region.dialog);
		const listens = actions?.some((a) => a.on === `submit_success:${regionId}`) ?? false;
		if (!inDialog && !listens) return undefined;
		return () => {
			if (listens) fire(`submit_success:${regionId}`);
			// Form di dalam dialog menutup dialognya setelah simpan berhasil (memicu dialog_close).
			if (inDialog) closeDialog(regionId);
		};
	}

	/** Master-detail: id baris terpilih ditulis ke item; aksi/filter yang bergantung padanya bereaksi lewat jalur item biasa. */
	function rowSelect(region: import('./page-definition').RegionDefinition): ((id: string) => void) | undefined {
		const target = region.rowAction === 'select' ? region.rowItem : undefined;
		return target ? (id) => (values[target] = id) : undefined;
	}

	function closeDialog(regionId: string) {
		dialogs = { ...dialogs, [regionId]: false };
		fire(`dialog_close:${regionId}`);
	}

	const plans = $derived<RegionPlan[]>(plan.state === 'ready' ? plan.regions : []);
	// Tab aktif per region tabs: hanya memori; tab yang tidak ada lagi jatuh ke tab pertama.
	let tabValue = $state<Record<string, string>>({});
	const activeTab = (r: RegionDefinition) => {
		const ids = (r.tabs ?? []).map((tab) => tab.id);
		const wanted = tabValue[r.id];
		return wanted && ids.includes(wanted) ? wanted : (ids[0] ?? '');
	};
	/** Region di dalam wadah `parent` (dan tab `slot`); `parent` kosong = tingkat atas. Wadah tersembunyi menyembunyikan seluruh isinya. */
	function childPlans(parent: string | undefined, slot?: string): RegionPlan[] {
		return plans.filter(
			(r) => r.region.parent === parent && (parent === undefined || r.region.slot === slot) && !r.region.dialog && !hidden[r.region.id] && regionAllowed(r.region, shared)
		);
	}
	const free = $derived(plan.state === 'ready' && plan.page.mode === 'free');
	/** Urutan baca di area sempit (satu kolom): atas ke bawah, lalu kiri ke kanan. */
	const byPosition = (list: RegionPlan[]) => [...list].sort((a, b) => (a.region.layout?.y ?? 0) - (b.region.layout?.y ?? 0) || (a.region.layout?.x ?? 0) - (b.region.layout?.x ?? 0));
	const dialogRegions = $derived(plan.state === 'ready' ? plan.regions.filter((r) => r.region.dialog && regionAllowed(r.region, shared)) : []);
	const regionOf = (item: { region: import('./page-definition').RegionDefinition }) => {
		const merged = applyDatasource(item.region, shared);
		return { ...merged, filters: resolveFilters(merged.filters, values, context) };
	};
</script>

<!-- Grid 12 kolom untuk satu wadah (atau tingkat atas); wadah menggambar anak-anaknya lewat grid lagi. -->
{#snippet grid(parent: string | undefined, slot?: string)}
	{@const placed = free && parent === undefined}
	<div class="page-grid-host">
		<div class="page-grid" class:page-grid-free={placed} data-testid={placed ? 'free-grid' : undefined}>
			{#each placed ? byPosition(childPlans(parent, slot)) : childPlans(parent, slot) as item (item.region.id + ':' + (refresh[item.region.id] ?? 0))}
				{#if placed}
					{@const l = item.region.layout}
					<div class="min-w-0" data-box style="--x: {l?.x ?? 0}; --y: {l?.y ?? 0}; --w: {l?.span ?? 12}; --h: {l?.h ?? 4}">
						{@render node(item)}
					</div>
				{:else}
					<div class="min-w-0" data-span style="--span: {item.region.layout?.span ?? 12}" data-new-row={item.region.layout?.newRow ? '' : undefined}>
						{@render node(item)}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/snippet}

{#snippet node(item: RegionPlan)}
	{@const r = item.region}
	{#if r.type === 'tabs'}
		<div class="flex flex-col gap-3" data-testid="tabs-region">
			<Tabs items={(r.tabs ?? []).map((tab) => ({ value: tab.id, label: tab.label }))} bind:value={() => activeTab(r), (v) => (tabValue[r.id] = v ?? '')} ariaLabel={r.id} />
			{@render grid(r.id, activeTab(r))}
		</div>
	{:else if r.type === 'panel'}
		<div data-testid="panel-region">
			<Region title={r.title ?? ''} variant={r.title ? 'standard' : 'plain'} collapsible={r.collapsible === true}>
				{@render grid(r.id)}
			</Region>
		</div>
	{:else}
		<RegionRuntime region={regionOf(item)} meta={metaFor?.(r.resourceId) ?? meta} phase={item.phase} {onretry} {record} {prefill} onsubmitted={submitHook(r.id)} onrowselect={rowSelect(r)} />
	{/if}
{/snippet}

{#if plan.state === 'invalid'}
	<p class="text-destructive text-sm" role="alert">
		{t('kit.runtime.invalid_page')}
		<span class="text-muted-foreground">({describeIssuesLocalized(plan.issues, t)})</span>
	</p>
{:else}
	<div class="flex flex-col gap-4">
		{#if items.length > 0}
			<div class="flex flex-wrap items-end gap-3" role="group" aria-label={t('kit.runtime.items')}>
				{#each items as it (it.id)}
					{#if it.type === 'button'}
						<Button variant="outline" disabled={disabled[it.id]} onclick={() => (values[it.id] = String(Number(values[it.id] || 0) + 1))}>{it.label}</Button>
					{:else}
						<label class="flex flex-col gap-1 text-sm">
							{it.label}
							{#if it.type === 'select'}
								<select class="border-input bg-background h-9 rounded-md border px-2" disabled={disabled[it.id]} bind:value={values[it.id]}>
									<option value="">—</option>
									{#each itemOptions(it, shared) as option (option.value)}<option value={option.value}>{option.label}</option>{/each}
								</select>
							{:else if it.type === 'switch'}
								<select class="border-input bg-background h-9 rounded-md border px-2" disabled={disabled[it.id]} bind:value={values[it.id]}>
									<option value="">—</option>
									<option value="true">true</option>
									<option value="false">false</option>
								</select>
							{:else}
								<Input type={it.type === 'date' ? 'date' : 'text'} maxlength={128} disabled={disabled[it.id]} bind:value={values[it.id]} />
							{/if}
						</label>
					{/if}
				{/each}
			</div>
		{/if}
		{@render grid(undefined)}
	</div>
	{#each dialogRegions as item (item.region.id)}
		<Dialog open={dialogs[item.region.id] === true} onOpenChange={(open) => !open && closeDialog(item.region.id)}>
			<DialogContent title={item.region.id}>
				<RegionRuntime region={regionOf(item)} meta={metaFor?.(item.region.resourceId) ?? meta} phase={item.phase} {onretry} {record} {prefill} onsubmitted={submitHook(item.region.id)} onrowselect={rowSelect(item.region)} />
			</DialogContent>
		</Dialog>
	{/each}
{/if}
