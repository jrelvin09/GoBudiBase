<script lang="ts">
	import { User, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-svelte';
	import harvestLogo from '$lib/assets/HarvestCloud512.png';
	import type { PimsUser } from './types';

	let {
		onLoginSuccess
	}: {
		onLoginSuccess: (user: PimsUser) => void;
	} = $props();

	let username = $state('IT000002');
	let password = $state('Palembang@2026');
	let rememberUsername = $state(true);
	let showPassword = $state(false);
	let loading = $state(false);
	let errorMessage = $state('');
	let throttleSeconds = $state(0);
	let throttleInterval: any = null;

	function toggleShowPassword() {
		showPassword = !showPassword;
	}

	function quickFillDemo() {
		username = 'IT000002';
		password = 'Palembang@2026';
		errorMessage = '';
	}

	function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (throttleSeconds > 0) return;

		errorMessage = '';
		loading = true;

		setTimeout(() => {
			loading = false;
			const trimmedUser = username.trim().toUpperCase();

			// Valid credentials check: user IT000002 with Palembang@2026, or standard admin
			if (
				(trimmedUser === 'IT000002' && password === 'Palembang@2026') ||
				(trimmedUser === 'MUKTI' && password === 'Palembang@2026') ||
				(trimmedUser === 'ADMIN' && password === 'admin')
			) {
				const authenticatedUser: PimsUser = {
					username: trimmedUser === 'IT000002' ? 'IT000002' : trimmedUser,
					fullName: 'Mukti Assary',
					email: 'mukti@company.com',
					role: 'Administrator HCM & Plantation',
					subsidiaryCode: 'PLMB',
					subsidiaryName: 'PT Palembang Agro Mandiri',
					lastLogin: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
					ipAddress: '10.10.5.25'
				};

				if (rememberUsername) {
					try {
						localStorage.setItem('pims_saved_user', trimmedUser);
					} catch {}
				}

				onLoginSuccess(authenticatedUser);
			} else {
				// APEX style throttled error message
				throttleSeconds = 5;
				errorMessage = 'Invalid Login Credentials';

				if (throttleInterval) clearInterval(throttleInterval);
				throttleInterval = setInterval(() => {
					throttleSeconds -= 1;
					if (throttleSeconds <= 0) {
						clearInterval(throttleInterval);
					}
				}, 1000);
			}
		}, 400);
	}
</script>

<div class="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f2f4f7] py-12 px-4 select-none">
	<!-- APEX Redwood Ambient Fluid Background -->
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
		<div class="absolute -top-[20%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-br from-amber-200/40 via-orange-100/30 to-transparent blur-3xl"></div>
		<div class="absolute -bottom-[20%] -right-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-tl from-sky-200/40 via-blue-100/30 to-transparent blur-3xl"></div>
		<div class="absolute top-[35%] right-[20%] h-[300px] w-[300px] rounded-full bg-emerald-100/30 blur-2xl"></div>
	</div>

	<!-- APEX Login Container Card -->
	<div class="relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-md transition-all sm:p-10">
		<!-- APEX Error Alert Banner -->
		{#if errorMessage}
			<div class="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm animate-in fade-in slide-in-from-top-2">
				<div class="flex items-start gap-2.5">
					<AlertCircle class="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
					<div class="flex-1">
						<p class="font-semibold text-rose-900">{errorMessage}</p>
						{#if throttleSeconds > 0}
							<p class="mt-1 text-[11px] text-rose-700">
								Please wait <strong class="font-bold text-rose-900">{throttleSeconds}</strong> seconds to sign in again.
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Login Header & Brand Logo -->
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="relative mb-3 flex h-24 w-24 items-center justify-center transition-transform hover:scale-105">
				<img
					src={harvestLogo}
					alt="Harvest Cloud Logo"
					class="max-h-full max-w-full object-contain drop-shadow-md"
				/>
			</div>
			<h1 class="text-xl font-bold tracking-tight text-slate-900">Harvest Cloud</h1>
			<p class="mt-1 text-xs text-slate-500 font-medium">Plantation Information Management System (PIMS)</p>
			<div class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-mono font-medium text-slate-600 border border-slate-200">
				<span>Oracle APEX 24.2 Parity</span>
				<span>•</span>
				<span>App 103</span>
			</div>
		</div>

		<!-- Login Form -->
		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- Username Input -->
			<div>
				<label for="pims-username" class="sr-only">Username</label>
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
						<User class="h-4 w-4" />
					</div>
					<input
						id="pims-username"
						type="text"
						bind:value={username}
						placeholder="Username"
						required
						autocomplete="username"
						class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#026cb6] focus:ring-2 focus:ring-[#026cb6]/20 font-medium"
					/>
				</div>
			</div>

			<!-- Password Input with Toggle Eye -->
			<div>
				<label for="pims-password" class="sr-only">Password</label>
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
						<Lock class="h-4 w-4" />
					</div>
					<input
						id="pims-password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder="Password"
						required
						autocomplete="current-password"
						class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#026cb6] focus:ring-2 focus:ring-[#026cb6]/20 font-medium"
					/>
					<button
						type="button"
						onclick={toggleShowPassword}
						tabindex="-1"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
					>
						{#if showPassword}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
				</div>
			</div>

			<!-- Remember Username & Quick Assist -->
			<div class="flex items-center justify-between pt-1">
				<label class="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition">
					<input
						type="checkbox"
						bind:checked={rememberUsername}
						class="h-4 w-4 rounded border-slate-300 text-[#026cb6] focus:ring-[#026cb6]/30 cursor-pointer"
					/>
					<span>Remember username</span>
				</label>
			</div>

			<!-- APEX Hot Button: Sign In -->
			<button
				type="submit"
				disabled={loading || throttleSeconds > 0}
				class="w-full flex items-center justify-center gap-2 rounded-lg bg-[#026cb6] py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#026cb6]/25 transition hover:bg-[#025691] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			>
				{#if loading}
					<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
					<span>Signing In...</span>
				{:else}
					<span>Sign In</span>
				{/if}
			</button>
		</form>

		<!-- Demo Quick Fill Helper -->
		<div class="mt-6 border-t border-slate-100 pt-5 text-center">
			<button
				type="button"
				onclick={quickFillDemo}
				class="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-[11px] font-semibold text-sky-800 transition hover:bg-sky-100 hover:border-sky-300 cursor-pointer shadow-xs"
			>
				<Sparkles class="h-3 w-3 text-sky-600" />
				<span>Prefill Demo: <strong>IT000002</strong> / <strong>Palembang@2026</strong></span>
			</button>
		</div>

		<!-- Footer Security Note -->
		<div class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
			<ShieldCheck class="h-3.5 w-3.5 text-emerald-600" />
			<span>Secured by GoBudiBase Engine & ORDS Bridge</span>
		</div>
	</div>
</div>
