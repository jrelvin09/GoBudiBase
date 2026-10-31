<script lang="ts">
	import FileItem from '$lib/kit/molecules/FileItem.svelte';
	import { setFileUploadSource, type UploadedFile } from '$lib/kit/molecules/file-upload';

	// Fake upload (F6-03): progress ticks, then the file completes. The real one
	// comes from `_upload` in the form region.
	function upload(_field: string, file: File, onProgress: (percent: number) => void) {
		return new Promise<UploadedFile>((resolve) => {
			let percent = 0;
			const timer = setInterval(() => {
				percent += 25;
				onProgress(percent);
				if (percent >= 100) {
					clearInterval(timer);
					resolve({ id: 'demo-file', name: file.name, size: file.size, content_type: file.type });
				}
			}, 150);
		});
	}

	setFileUploadSource({
		upload,
		meta: (_field, id) =>
			Promise.resolve({ id, name: 'existing-document.pdf', size: 102400, content_type: 'application/pdf' }),
		url: () => null
	});

	let value = $state<string | null>(null);
</script>

<div class="flex max-w-xl flex-col gap-4">
	<p class="text-muted-foreground text-sm">
		APEX file item: choose or drop a file, watch the upload progress, then remove it. The upload
		function is injected, so the molecule knows nothing about the API.
	</p>
	<FileItem
		id="file-plain"
		fieldName="document"
		label="Document"
		maxSize={1048576}
		accept={['application/pdf']}
		value={value}
		onchange={(next) => (value = next)}
	/>
</div>