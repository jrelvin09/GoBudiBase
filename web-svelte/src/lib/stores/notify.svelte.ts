export type NotifyError = { text: string; fieldId?: string };
export type NotifySuccess = { id: number; text: string };

let seq = 0;

/** APEX-style messages: success toast (auto-hide) and a persistent error box. */
class NotifyStore {
	successes = $state<NotifySuccess[]>([]);
	errorList = $state<NotifyError[]>([]);

	success(text: string): void {
		this.errorList = [];
		const id = ++seq;
		this.successes = [...this.successes, { id, text }];
		setTimeout(() => this.dismiss(id), 5000);
	}

	dismiss(id: number): void {
		this.successes = this.successes.filter((item) => item.id !== id);
	}

	errors(list: NotifyError[]): void {
		this.errorList = list;
	}

	clearErrors(): void {
		this.errorList = [];
	}
}

export const notify = new NotifyStore();
