import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMe } from '$lib/api/client';
import { sessionStore } from './session.svelte';

const SESSION = {
	access_expires_at: '2026-01-01T00:05:00Z',
	idle_expires_at: '2026-01-01T00:30:00Z',
	credential_generation: 2
};

const ME = {
	user: {},
	csrf_token: 'csrf',
	context: { kind: 'NONE', context_version: 1 },
	session: SESSION,
	allowed_companies: [],
	allowed_locations: [],
	permissions: [],
	platform_eligible: false
};

function response(status: number, body: unknown): Response {
	return {
		status,
		ok: status >= 200 && status < 300,
		statusText: '',
		json: async () => body
	} as unknown as Response;
}

function apiErrorBody(status: number, code: string) {
	return {
		error: { status, code, message: code, field_errors: [], retryable: false },
		meta: { request_id: '', timestamp: '' }
	};
}

// H2-02b: the node test environment has no localStorage; the store's bb.auth
// fallback is exercised through this in-memory stub.
function stubStorage(): Map<string, string> {
	const store = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key)
	});
	return store;
}
describe('session store bb.auth bootstrap (H2-02b)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('refreshes with the stored csrf and generation when the store is empty', async () => {
		const storage = stubStorage();
		storage.set('bb.auth', JSON.stringify({ csrf: 'stored-csrf', generation: 7 }));

		let refreshCalls = 0;
		let meCalls = 0;
		let refreshHeaders: Record<string, string> = {};
		let refreshBody: unknown = null;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
				if (String(input).endsWith('/auth/refresh')) {
					refreshCalls += 1;
					refreshHeaders = init?.headers as Record<string, string>;
					refreshBody = init?.body ? JSON.parse(String(init.body)) : null;
					return response(200, { session: { ...SESSION, credential_generation: 8 }, csrf_token: 'rotated' });
				}
				meCalls += 1;
				return meCalls === 1 ? response(401, apiErrorBody(401, 'INVALID_SESSION')) : response(200, ME);
			})
		);

		const me = await fetchMe();

		expect(me.session.credential_generation).toBe(2);
		expect(refreshCalls).toBe(1);
		expect(meCalls).toBe(2);
		expect(refreshHeaders['X-CSRF-Token']).toBe('stored-csrf');
		expect(refreshBody).toEqual({ expected_credential_generation: 7 });
	});

	it('reset clears bb.auth', () => {
		const storage = stubStorage();
		storage.set('bb.auth', JSON.stringify({ csrf: 'stored-csrf', generation: 7 }));
		(sessionStore as unknown as { reset: () => void }).reset();
		expect(storage.has('bb.auth')).toBe(false);
	});
});