import { getContext, setContext } from 'svelte';

// File/image upload source (F6-03). The `fields` tier may not import `$lib/api`,
// so the page (a renderer component) injects these through context, like the
// relation source of F2-06.
export type UploadedFile = { id: string; name: string; size: number; content_type: string };

export type FileUploadSource = {
	upload: (field: string, file: File, onProgress: (percent: number) => void) => Promise<UploadedFile>;
	meta: (field: string, id: string) => Promise<UploadedFile>;
	url: (field: string, id: string) => string | null;
};

const KEY = Symbol('bb.file-upload');

export function setFileUploadSource(source: FileUploadSource): void {
	setContext(KEY, source);
}

export function getFileUploadSource(): FileUploadSource | undefined {
	return getContext<FileUploadSource | undefined>(KEY);
}