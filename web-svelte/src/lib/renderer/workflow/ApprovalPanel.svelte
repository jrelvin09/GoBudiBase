<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import { getApprovals } from '$lib/api/resources';
	import type { ApprovalEntry, TransitionMeta } from '$lib/api/resource-types';
	import { formatDateTime } from '$lib/i18n/format';
	import { t } from '$lib/i18n/index.svelte';
	import { relativeTime } from '$lib/kit/organisms/history/history';
	import { sessionStore } from '$lib/stores/session.svelte';

	type Level = { level: number; entry: ApprovalEntry | null };
	type Group = { key: string; transition: string; cycle: number; levels: Level[] };

	// Panel approval (F7-04): riwayat level tiap siklus transisi — ✓ oleh siapa +
	// kapan + komentar, atau "menunggu" untuk level yang belum diputuskan.
	let {
		resId,
		recordId,
		transitions
	}: {
		resId: string;
		recordId: string;
		transitions: TransitionMeta[];
	} = $props();

	let entries = $state<ApprovalEntry[]>([]);
	let loading = $state(true);
	let failed = $state(false);

	function context() {
		return {
			companyId: sessionStore.context.company_id ?? '',
			locationId: sessionStore.context.location_id ?? null,
			contextVersion: sessionStore.context.context_version
		};
	}

	$effect(() => {
		const res = resId;
		const id = recordId;
		let cancelled = false;
		loading = true;
		failed = false;
		getApprovals(context(), res, id)
			.then((resp) => {
				if (cancelled) return;
				entries = resp.data;
				loading = false;
			})
			.catch(() => {
				if (cancelled) return;
				failed = true;
				loading = false;
			});
		return () => {
			cancelled = true;
		};
	});

	/** Jumlah level satu transisi: dari metadata workflow, atau level tertinggi
	 * yang tercatat bila metadata tidak memberi angkanya. */
	function levelCount(transition: string, rows: ApprovalEntry[]): number {
		const declared = transitions.find((tr) => tr.name === transition)?.approval_levels ?? 0;
		const seen = rows.reduce((max, row) => Math.max(max, row.level), 0);
		return Math.max(declared, seen);
	}

	const groups: Group[] = $derived.by(() => {
		const byKey = new Map<string, ApprovalEntry[]>();
		for (const entry of entries) {
			const key = `${entry.transition}\u0000${entry.cycle}`;
			const rows = byKey.get(key);
			if (rows) rows.push(entry);
			else byKey.set(key, [entry]);
		}
		const out: Group[] = [];
		for (const [key, rows] of byKey) {
			const { transition, cycle } = rows[0];
			// Penolakan menghentikan siklus, jadi level setelahnya tidak menunggu.
			const rejectedAt = rows.find((row) => row.decision === 'reject')?.level ?? 0;
			const total = rejectedAt > 0 ? rejectedAt : levelCount(transition, rows);
			const levels: Level[] = [];
			for (let level = 1; level <= total; level++) {
				levels.push({ level, entry: rows.find((row) => row.level === level) ?? null });
			}
			out.push({ key, transition, cycle, levels });
		}
		return out.sort((a, b) => a.cycle - b.cycle || a.transition.localeCompare(b.transition));
	});

	function humanize(name: string): string {
		return name.replace(/_/g, ' ');
	}
</script>

{#if loading}
	<p class="text-muted-foreground text-sm">{t('kit.common.loading')}</p>
{:else if failed}
	<p class="text-destructive text-sm">{t('kit.workflow.load_failed')}</p>
{:else if groups.length === 0}
	<p class="text-muted-foreground text-sm">{t('kit.workflow.no_data')}</p>
{:else}
	<div class="flex flex-col gap-4">
		{#each groups as group (group.key)}
			<div class="flex flex-col gap-2">
				<h3 class="text-muted-foreground text-xs font-semibold uppercase">
					{humanize(group.transition)}{group.cycle > 1 ? ` · ${t('kit.workflow.cycle', { n: group.cycle })}` : ''}
				</h3>
				<ol class="flex flex-col gap-2">
					{#each group.levels as row (row.level)}
						<li class="border-border flex gap-2 border-l-2 pl-3">
							{#if row.entry?.decision === 'approve'}
								<CircleCheckIcon class="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
							{:else if row.entry?.decision === 'reject'}
								<CircleXIcon class="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
							{:else}
								<ClockIcon class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
							{/if}
							<div class="flex min-w-0 flex-col gap-0.5 text-sm">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-medium">{t('kit.workflow.level', { n: row.level })}</span>
									{#if row.entry}
										<span>{row.entry.approver_name}</span>
										<span class="text-muted-foreground">
											{t(row.entry.decision === 'approve' ? 'kit.workflow.approved' : 'kit.workflow.rejected')}
										</span>
										<time
											datetime={row.entry.created_at}
											title={formatDateTime(row.entry.created_at)}
											class="text-muted-foreground"
										>
											{relativeTime(row.entry.created_at)}
										</time>
									{:else}
										<span class="text-muted-foreground">{t('kit.workflow.waiting')}</span>
									{/if}
								</div>
								{#if row.entry?.comment}
									<p class="text-muted-foreground">{row.entry.comment}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</div>
		{/each}
	</div>
{/if}
