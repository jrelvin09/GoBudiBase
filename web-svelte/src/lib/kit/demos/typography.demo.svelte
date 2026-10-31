<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
</script>

<div class="flex max-w-2xl flex-col gap-6">
	<article class="flex flex-col gap-3">
		<h1 class="text-2xl font-semibold tracking-tight">{t('kit.demo.section_heading')}</h1>
		<h2 class="text-lg font-semibold">{t('kit.demo.subheading')}</h2>
		<p class="text-muted-foreground text-sm">{t('kit.demo.body')}</p>
		<p class="text-sm">
			{t('kit.demo.body')}
			<a class="text-primary underline-offset-4 hover:underline" href="/kit/typography">
				{t('kit.demo.link_plain')}
			</a>
		</p>
	</article>

	<article class="flex flex-col gap-2">
		<h3 class="text-sm font-medium">{t('kit.demo.section_heading')}</h3>
		<p class="text-sm">
			<strong>{t('kit.demo.strong')}</strong>, <em>{t('kit.demo.emphasis')}</em>, <mark class="bg-warning text-warning-foreground rounded-sm px-1">{t('kit.demo.marked')}</mark>,
			<del>{t('kit.demo.deleted')}</del>, <ins>{t('kit.demo.inserted')}</ins>, <abbr title="Application Express">APEX</abbr>, {t('kit.demo.and')}
			<code class="bg-muted rounded-sm px-1 font-mono text-xs">{t('kit.demo.code')}</code>.
		</p>
	</article>

	<blockquote class="border-primary border-l-2 pl-4">
		<p class="text-sm">{t('kit.demo.quote')}</p>
		<footer class="text-muted-foreground mt-1 text-xs">— {t('kit.demo.attribution')}</footer>
	</blockquote>

	<dl class="text-sm">
		<dt class="font-medium">{t('kit.demo.term')}</dt>
		<dd class="text-muted-foreground">{t('kit.demo.definition')}</dd>
		<dt class="mt-2 font-medium">{t('kit.demo.term')} 2</dt>
		<dd class="text-muted-foreground">{t('kit.demo.definition')}</dd>
	</dl>
</div>
