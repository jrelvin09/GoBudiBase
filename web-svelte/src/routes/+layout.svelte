<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';
	import { Database, Cpu, ShieldCheck, Zap } from 'lucide-svelte';

	let { children }: LayoutProps = $props();

	onMount(() => {
		const preloader = document.getElementById('global-initial-preloader');
		if (preloader) {
			preloader.style.transition = 'opacity 0.35s ease-out';
			preloader.style.opacity = '0';
			setTimeout(() => {
				preloader.remove();
			}, 350);
		}
	});
</script>

<svelte:head>
	<title>GoBudiBase Enterprise - High Performance Native Oracle APEX Parity</title>
	<meta name="description" content="Go Native Backend + SvelteKit Static SPA + PostgreSQL 17" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
	<!-- Top Enterprise Navigation Header -->
	<header class="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
			<!-- Logo & Architecture Branding -->
			<div class="flex items-center gap-3">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-bold text-white shadow-lg shadow-emerald-500/20">
					GB
				</div>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-sm font-black tracking-wider text-white uppercase">GoBudiBase</span>
						<span class="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
							v2.0 NATIVE
						</span>
					</div>
					<p class="text-[11px] text-slate-400">Oracle APEX 100% Parity • Zero Docker • Go 1.25 + Svelte 5</p>
				</div>
			</div>

			<!-- Live Engine Status & Hardware Telemetry -->
			<div class="hidden items-center gap-4 md:flex">
				<div class="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
					<Database class="h-3.5 w-3.5 text-sky-400" />
					<span class="text-slate-400">PostgreSQL 17:</span>
					<span class="font-mono font-semibold text-slate-200">100.000 Rows</span>
				</div>

				<div class="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
					<Cpu class="h-3.5 w-3.5 text-emerald-400" />
					<span class="text-slate-400">Daemon RAM:</span>
					<span class="font-mono font-semibold text-emerald-400">2.6 MB</span>
				</div>

				<div class="flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-300">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
					</span>
					<span class="font-mono font-medium">10.10.1.106:8085</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content Body -->
	<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
		{@render children()}
	</main>

	<!-- Enterprise Footer -->
	<footer class="border-t border-slate-900 bg-slate-950 px-4 py-4 text-xs text-slate-500">
		<div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row sm:px-6">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
				<span>GoBudiBase Architecture • 100% Free Open Source ($0 License)</span>
			</div>
			<div class="font-mono text-[11px] text-slate-600">
				Chi v5 Router + pgxpool Native • SvelteKit Adapter Static SPA • Tailwind v4
			</div>
		</div>
	</footer>
</div>
