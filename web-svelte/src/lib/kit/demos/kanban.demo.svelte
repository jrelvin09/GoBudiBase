<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { t } from '$lib/i18n/index.svelte';

	type Card = { id: string; n: number };
	type Column = { id: string; titleKey: string; cards: Card[] };

	let columns = $state<Column[]>([
		{
			id: 'todo',
			titleKey: 'kit.demo.kanban_todo',
			cards: [
				{ id: 'c1', n: 1 },
				{ id: 'c2', n: 2 }
			]
		},
		{ id: 'doing', titleKey: 'kit.demo.kanban_doing', cards: [{ id: 'c3', n: 3 }] },
		{ id: 'done', titleKey: 'kit.demo.kanban_done', cards: [{ id: 'c4', n: 4 }] }
	]);

	let dragging = $state<{ cardId: string; from: string } | null>(null);

	function move(cardId: string, from: string, to: string) {
		if (from === to) return;
		const source = columns.find((column) => column.id === from);
		const target = columns.find((column) => column.id === to);
		if (!source || !target) return;
		const index = source.cards.findIndex((card) => card.id === cardId);
		if (index === -1) return;
		const [card] = source.cards.splice(index, 1);
		target.cards.push(card);
	}

	function onDrop(to: string) {
		if (dragging) move(dragging.cardId, dragging.from, to);
		dragging = null;
	}
</script>

<div class="grid gap-4 md:grid-cols-3">
	{#each columns as column, columnIndex (column.id)}
		<section
			class="border-border flex flex-col gap-2 rounded-lg border p-3"
			role="group"
			aria-label={t(column.titleKey)}
			ondragover={(event) => event.preventDefault()}
			ondrop={() => onDrop(column.id)}
		>
			<h2 class="text-sm font-medium">
				{t(column.titleKey)}
				<span class="text-muted-foreground font-normal">({column.cards.length})</span>
			</h2>
			<ul class="flex min-h-16 flex-col gap-2">
				{#each column.cards as card (card.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -- seret tetikus untuk memindahkan; pengguna keyboard memakai tombol panah di dalam kartu. -->
					<li
						class="border-border bg-card flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
						draggable="true"
						ondragstart={() => (dragging = { cardId: card.id, from: column.id })}
						ondragend={() => (dragging = null)}
					>
						<span>{t('kit.demo.list_item', { n: card.n })}</span>
						<span class="flex gap-1">
							<button
								type="button"
								class="hover:bg-muted rounded-sm p-0.5 disabled:opacity-30"
								disabled={columnIndex === 0}
								aria-label="{t('kit.demo.move_left')}: {t('kit.demo.list_item', { n: card.n })}"
								onclick={() => move(card.id, column.id, columns[columnIndex - 1].id)}
							>
								<ChevronLeftIcon class="size-4" />
							</button>
							<button
								type="button"
								class="hover:bg-muted rounded-sm p-0.5 disabled:opacity-30"
								disabled={columnIndex === columns.length - 1}
								aria-label="{t('kit.demo.move_right')}: {t('kit.demo.list_item', { n: card.n })}"
								onclick={() => move(card.id, column.id, columns[columnIndex + 1].id)}
							>
								<ChevronRightIcon class="size-4" />
							</button>
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
