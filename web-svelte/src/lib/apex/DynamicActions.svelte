<script lang="ts">
	import { onMount } from 'svelte';
	import { postRPC, type DynamicActionRule } from '$lib/api/client';
	import { Zap, Play, Terminal, Clock, Sparkles, Layers, RotateCcw } from 'lucide-svelte';

	let rules = $state<DynamicActionRule[]>([]);
	let loadingRules = $state(false);

	// Form Sandbox States
	let code = $state('AST-MED-2026-990');
	let name = $state('MRI Scanner Multi-Slice Diagnostic');
	let category = $state('Equipment');
	let status = $state('active');
	let value = $state(150000000);
	let ageYears = $state(3);
	let location = $state('Building 1 Floor 3');

	let isCodeLocked = $state(true);
	let valueHighlight = $state(true);
	let eventLogs = $state<Array<{ time: string; event: string; target: string; desc: string; latency: number; rpcResult?: any }>>([]);

	async function loadRules() {
		loadingRules = true;
		try {
			rules = await postRPC<DynamicActionRule[]>('/actions/rules', {});
		} catch (e) {
			console.error(e);
		} finally {
			loadingRules = false;
		}
	}

	onMount(() => {
		loadRules();
	});

	async function triggerEvaluation(event: string, target: string, val: any) {
		const t0 = performance.now();
		let rpcRes: any = null;

		if (target === 'value' && Number(val) >= 100000000) {
			valueHighlight = true;
			rpcRes = await postRPC('/actions/execute', {
				p_action_type: 'check_compliance_sla',
				p_payload: { value: val, category }
			});
		} else if (target === 'value') {
			valueHighlight = false;
		}

		if (target === 'category') {
			isCodeLocked = val === 'Equipment';
			if (val === 'Equipment') {
				rpcRes = await postRPC('/actions/execute', {
					p_action_type: 'check_compliance_sla',
					p_payload: { value, category: val }
				});
			}
		}

		if (target === 'status' && val === 'maintenance') {
			rpcRes = await postRPC('/actions/execute', {
				p_action_type: 'trigger_maintenance_ticket',
				p_payload: { code, name, location }
			});
		}

		const latency = Math.round(performance.now() - t0);
		eventLogs = [
			{
				time: new Date().toLocaleTimeString('id-ID'),
				event,
				target,
				desc: `Dynamic Action on [${target}] triggered`,
				latency,
				rpcResult: rpcRes
			},
			...eventLogs.slice(0, 15)
		];
	}

	function resetForm() {
		category = 'Furniture';
		value = 15000000;
		status = 'active';
		isCodeLocked = false;
		valueHighlight = false;
	}
</script>

<div class="p-6 space-y-6 max-w-7xl mx-auto">
	<div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
		<div class="flex items-center gap-3">
			<div class="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
				<Zap class="w-5 h-5" />
			</div>
			<div>
				<h2 class="font-bold text-base text-slate-800">Declarative Dynamic Actions Engine (Go + Svelte 5)</h2>
				<p class="text-xs text-slate-500">Aturan deklaratif event-driven: Triggers &bull; Conditions &bull; Client Updates &bull; Server RPC</p>
			</div>
		</div>

		<button onclick={resetForm} class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50">
			<RotateCcw class="w-3.5 h-3.5" />
			<span>Reset Form</span>
		</button>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
		<!-- Sandbox Form -->
		<div class="lg:col-span-7 space-y-4">
			<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
				<div class="flex items-center justify-between border-b border-slate-100 pb-2">
					<div class="flex items-center gap-2">
						<Play class="w-4 h-4 text-emerald-600" />
						<h3 class="font-bold text-sm text-slate-800">Interactive Action Sandbox</h3>
					</div>
					<span class="text-xs text-slate-400 font-mono">Live Testing</span>
				</div>

				<div class="space-y-3 text-xs">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block font-semibold text-slate-600 mb-1">Kode Aset (Locked on Equipment)</label>
							<input
								type="text"
								bind:value={code}
								disabled={isCodeLocked}
								class="w-full px-3 py-1.5 border rounded-lg font-mono {isCodeLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300'}"
							/>
							{#if isCodeLocked}
								<span class="text-[10px] text-amber-600 font-medium">🔒 Dikunci oleh Aturan Kategori Equipment</span>
							{/if}
						</div>

						<div>
							<label class="block font-semibold text-slate-600 mb-1">Kategori Aset (Event: Change)</label>
							<select
								bind:value={category}
								onchange={() => triggerEvaluation('change', 'category', category)}
								class="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
							>
								<option value="Equipment">Equipment (Pemicu Lock)</option>
								<option value="Electronics">Electronics</option>
								<option value="Furniture">Furniture</option>
								<option value="Vehicle">Vehicle</option>
							</select>
						</div>
					</div>

					<div>
						<label class="block font-semibold text-slate-600 mb-1">Nama Aset</label>
						<input type="text" bind:value={name} class="w-full px-3 py-1.5 border border-slate-300 rounded-lg" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block font-semibold text-slate-600 mb-1">Nilai Perolehan (Threshold &gt; 100M)</label>
							<input
								type="number"
								bind:value={value}
								oninput={() => triggerEvaluation('threshold', 'value', value)}
								class="w-full px-3 py-1.5 border font-mono font-bold rounded-lg {valueHighlight ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-300'}"
							/>
							{#if value >= 100000000}
								<span class="text-[10px] text-amber-700 font-bold block mt-1">⚠️ ESKALASI: Memerlukan Approval Direksi (SLA 24h)</span>
							{/if}
						</div>

						<div>
							<label class="block font-semibold text-slate-600 mb-1">Status Operasional</label>
							<select
								bind:value={status}
								onchange={() => triggerEvaluation('change', 'status', status)}
								class="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium {status === 'maintenance' ? 'border-red-500 bg-red-50 text-red-900' : ''}"
							>
								<option value="active">Active (Normal)</option>
								<option value="maintenance">Maintenance (Pemicu Outbox Tiket)</option>
								<option value="retired">Retired</option>
								<option value="disposed">Disposed</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Active Rules -->
			<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
				<div class="flex items-center gap-2 border-b border-slate-100 pb-2">
					<Layers class="w-4 h-4 text-blue-600" />
					<h3 class="font-bold text-sm text-slate-800">Active Dynamic Action Rules (Database Registry)</h3>
				</div>
				<div class="space-y-2">
					{#each rules as r (r.id)}
						<div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
							<div class="flex items-center justify-between">
								<span class="font-bold text-slate-800">{r.rule_name}</span>
								<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-700">
									{r.event_type.toUpperCase()} on [{r.target_field}]
								</span>
							</div>
							<p class="text-slate-500 text-[11px]">{r.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Trace Console -->
		<div class="lg:col-span-5 space-y-4">
			<div class="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 p-4 space-y-3 font-mono text-xs shadow-lg">
				<div class="flex items-center justify-between border-b border-slate-800 pb-2">
					<div class="flex items-center gap-2 text-emerald-400 font-bold">
						<Terminal class="w-4 h-4" />
						<span>Real-Time Event Inspector</span>
					</div>
					<span class="text-[10px] text-slate-500">Live Tracing</span>
				</div>

				{#if eventLogs.length === 0}
					<div class="py-12 text-center text-slate-600 space-y-1">
						<Sparkles class="w-6 h-6 mx-auto text-slate-700 mb-1" />
						<p class="text-xs">Ubah nilai pada sandbox form untuk memicu trace log...</p>
					</div>
				{:else}
					<div class="space-y-2.5 max-h-[500px] overflow-y-auto">
						{#each eventLogs as log (log.time + log.event + log.target)}
							<div class="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
								<div class="flex items-center justify-between text-[11px]">
									<span class="text-amber-400 font-bold">[{log.time}] &bull; {log.event.toUpperCase()} ({log.target})</span>
									<span class="text-emerald-400 text-[10px] flex items-center gap-1">
										<Clock class="w-3 h-3" /> {log.latency}ms
									</span>
								</div>
								<div class="text-[11px] text-slate-300">&gt; {log.desc}</div>
								{#if log.rpcResult}
									<pre class="text-[10px] text-purple-300 bg-purple-950/40 p-1.5 rounded border border-purple-900/50 overflow-x-auto">
										{JSON.stringify(log.rpcResult, null, 2)}
									</pre>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
