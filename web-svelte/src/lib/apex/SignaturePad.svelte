<script lang="ts">
	import { onMount } from 'svelte';
	import { Eraser, Check, FileSignature } from 'lucide-svelte';

	let {
		signatureData = $bindable(''),
		label = 'Tanda Tangan Digital',
		signerName = 'Petugas BAST',
		width = 460,
		height = 180
	}: {
		signatureData?: string;
		label?: string;
		signerName?: string;
		width?: number;
		height?: number;
	} = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDrawing = $state(false);
	let hasSignature = $state(false);

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.lineWidth = 2.5;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				ctx.strokeStyle = '#0284c7'; // Sky-600 digital ink
			}
		}
	});

	function getPos(e: MouseEvent | TouchEvent) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		if ('touches' in e && e.touches.length > 0) {
			return {
				x: (e.touches[0].clientX - rect.left) * scaleX,
				y: (e.touches[0].clientY - rect.top) * scaleY
			};
		}
		const me = e as MouseEvent;
		return {
			x: (me.clientX - rect.left) * scaleX,
			y: (me.clientY - rect.top) * scaleY
		};
	}

	function startDraw(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		if (!ctx) return;
		isDrawing = true;
		const pos = getPos(e);
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
	}

	function draw(e: MouseEvent | TouchEvent) {
		if (!isDrawing || !ctx) return;
		e.preventDefault();
		const pos = getPos(e);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		hasSignature = true;
	}

	function stopDraw() {
		if (!isDrawing) return;
		isDrawing = false;
		if (canvas && hasSignature) {
			signatureData = canvas.toDataURL('image/png');
		}
	}

	function clearPad() {
		if (!ctx || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hasSignature = false;
		signatureData = '';
	}
</script>

<div class="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
			<FileSignature class="h-4 w-4 text-emerald-400" />
			<span>{label}</span>
		</div>
		<span class="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
			{signerName}
		</span>
	</div>

	<div class="relative overflow-hidden rounded-lg border border-dashed border-slate-700 bg-slate-950">
		<canvas
			bind:this={canvas}
			{width}
			{height}
			class="h-[180px] w-full cursor-crosshair touch-none"
			onmousedown={startDraw}
			onmousemove={draw}
			onmouseup={stopDraw}
			onmouseleave={stopDraw}
			ontouchstart={startDraw}
			ontouchmove={draw}
			ontouchend={stopDraw}
		></canvas>

		{#if !hasSignature}
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-600 select-none">
				<p class="text-xs">Goreskan tanda tangan di sini (Mouse / Touch)</p>
				<div class="mt-8 w-2/3 border-b border-slate-800"></div>
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-between pt-1">
		<div class="flex items-center gap-2">
			{#if hasSignature}
				<span class="flex items-center gap-1 text-xs text-emerald-400 font-medium">
					<Check class="h-3.5 w-3.5" /> Tersimpan
				</span>
			{:else}
				<span class="text-xs text-slate-500">Belum ditandatangani</span>
			{/if}
		</div>

		<button
			type="button"
			onclick={clearPad}
			class="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
		>
			<Eraser class="h-3.5 w-3.5" />
			<span>Hapus</span>
		</button>
	</div>
</div>
