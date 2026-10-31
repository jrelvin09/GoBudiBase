export type ConfirmOptions = {
	title?: string;
	message: string;
	okLabel?: string;
	danger?: boolean;
};

/** Satu state konfirmasi global; dipasang sekali oleh ConfirmDialog di layout. */
class ConfirmState {
	open = $state(false);
	options = $state<ConfirmOptions | null>(null);
	private resolver: ((value: boolean) => void) | null = null;

	ask(options: ConfirmOptions): Promise<boolean> {
		this.options = options;
		this.open = true;
		return new Promise((resolve) => {
			this.resolver = resolve;
		});
	}

	respond(value: boolean): void {
		this.open = false;
		this.resolver?.(value);
		this.resolver = null;
	}
}

export const confirmState = new ConfirmState();

export function confirm(options: ConfirmOptions): Promise<boolean> {
	return confirmState.ask(options);
}
