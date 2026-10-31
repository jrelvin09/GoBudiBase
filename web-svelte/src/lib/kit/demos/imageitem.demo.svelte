<script lang="ts">
	import ImageItem from '$lib/kit/molecules/ImageItem.svelte';
	import { setFileUploadSource, type UploadedFile } from '$lib/kit/molecules/file-upload';

	// Fake upload (F6-03): the thumbnail shows the chosen file at once, the
	// progress bar follows the upload, then the value holds the file id.
	function upload(_field: string, file: File, onProgress: (percent: number) => void) {
		return new Promise<UploadedFile>((resolve) => {
			let percent = 0;
			const timer = setInterval(() => {
				percent += 25;
				onProgress(percent);
				if (percent >= 100) {
					clearInterval(timer);
					resolve({ id: 'demo-image', name: file.name, size: file.size, content_type: file.type });
				}
			}, 150);
		});
	}

	setFileUploadSource({
		upload,
		meta: (_field, id) =>
			Promise.resolve({ id, name: 'existing-image.png', size: 20480, content_type: 'image/png' }),
		url: () => null
	});

	let value = $state<string | null>(null);
</script>

<div class="flex max-w-xl flex-col gap-4">
	<p class="text-muted-foreground text-sm">
		APEX image item: the thumbnail previews the chosen file before the upload finishes, and the
		upload function is injected through context.
	</p>
	<ImageItem
		id="image-plain"
		fieldName="logo"
		label="Logo"
		maxSize={5242880}
		accept={['image/png', 'image/jpeg', 'image/webp']}
		value={value}
		onchange={(next) => (value = next)}
	/>
</div>