<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';

	const people = [
		{ name: 'kit.demo.person_1', initials: 'AP', tone: 'bg-palette-1-subtle' },
		{ name: 'kit.demo.person_2', initials: 'SW', tone: 'bg-palette-3-subtle' },
		{ name: 'kit.demo.person_3', initials: 'BS', tone: 'bg-palette-5-subtle' }
	];

	const sizes = [
		{ label: 'xs', cls: 'size-6 text-[10px]' },
		{ label: 'sm', cls: 'size-8 text-xs' },
		{ label: 'md', cls: 'size-10 text-sm' },
		{ label: 'lg', cls: 'size-14 text-base' }
	];
</script>

<div class="flex flex-col gap-6">
	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.sizes')}</h2>
		<div class="flex flex-wrap items-end gap-3">
			{#each sizes as size (size.label)}
				<span class="flex flex-col items-center gap-1">
					<span
						class="border-border flex items-center justify-center rounded-full border font-medium {size.cls} {people[0]
							.tone}"
					>
						{people[0].initials}
					</span>
					<span class="text-muted-foreground text-xs">{size.label}</span>
				</span>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.avatar_group')}</h2>
		<div class="flex items-center">
			{#each people as person (person.name)}
				<span
					class="border-background -ml-2 flex size-9 items-center justify-center rounded-full border-2 text-xs font-medium first:ml-0 {person.tone}"
					title={t(person.name)}
				>
					{person.initials}
				</span>
			{/each}
			<span class="bg-muted border-background -ml-2 flex size-9 items-center justify-center rounded-full border-2 text-xs">
				+4
			</span>
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-muted-foreground text-sm font-medium">{t('kit.demo.with_name')}</h2>
		<div class="flex items-center gap-2">
			<span class="bg-palette-2-subtle flex size-9 items-center justify-center rounded-full text-xs font-medium">
				{people[1].initials}
			</span>
			<span class="flex flex-col leading-tight">
				<span class="text-sm font-medium">{t(people[1].name)}</span>
				<span class="text-muted-foreground text-xs">{t('kit.demo.testimonial_author')}</span>
			</span>
		</div>
	</section>
</div>
