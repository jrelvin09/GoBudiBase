import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	bindAuthRefresh,
	fetchMe,
	login,
	refreshSession,
	type AuthRefreshBindings,
	type RefreshResponse
} from './client';

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

function refreshBody(generation: number): RefreshResponse {
	return { session: { ...SESSION, credential_generation: generation }, csrf_token: 'csrf' };
}
describe('apiRequest auth refresh (H2-02)', () => {
	let generation: number;
	let refreshCalls: number;
	let refreshFailed: number;

	beforeEach(() => {
		generation = 1;
		refreshCalls = 0;
		refreshFailed = 0;
		const bindings: AuthRefreshBindings = {
			csrfToken: () => 'csrf',
			generation: () => generation,
			onRefreshed: (resp) => {
				generation = resp.session.credential_generation;
			},
			onRefreshFailed: () => {
				refreshFailed += 1;
			}
		};
		bindAuthRefresh(bindings);
	});

	afterEach(() => {
		bindAuthRefresh(null);
		vi.unstubAllGlobals();
	});

	it('retries the original request once after a successful refresh', async () => {
		let meCalls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input).endsWith('/auth/refresh')) {
					refreshCalls += 1;
					return response(200, refreshBody(2));
				}
				meCalls += 1;
				return meCalls === 1 ? response(401, apiErrorBody(401, 'INVALID_SESSION')) : response(200, ME);
			})
		);

		const me = await fetchMe();

		expect(me.session.credential_generation).toBe(2);
		expect(refreshCalls).toBe(1);
		expect(meCalls).toBe(2);
		expect(generation).toBe(2);
	});

	it('surfaces the original error and drops the store when refresh fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input).endsWith('/auth/refresh')) {
					refreshCalls += 1;
					return response(409, apiErrorBody(409, 'CREDENTIAL_GENERATION_CONFLICT'));
				}
				return response(401, apiErrorBody(401, 'INVALID_SESSION'));
			})
		);

		await expect(fetchMe()).rejects.toMatchObject({ status: 401, code: 'INVALID_SESSION' });
		expect(refreshCalls).toBe(1);
		expect(refreshFailed).toBe(1);
	});

	it('adopts the new generation when another tab already refreshed (409)', async () => {
		let meCalls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input).endsWith('/auth/refresh')) {
					refreshCalls += 1;
					return response(409, apiErrorBody(409, 'CREDENTIAL_GENERATION_CONFLICT'));
				}
				meCalls += 1;
				if (meCalls === 1) return response(401, apiErrorBody(401, 'INVALID_SESSION'));
				return response(200, { ...ME, session: { ...SESSION, credential_generation: 3 } });
			})
		);

		const me = await fetchMe();

		expect(me.session.credential_generation).toBe(3);
		expect(refreshCalls).toBe(1);
		expect(refreshFailed).toBe(0);
		expect(generation).toBe(3);
	});
	it('coalesces two concurrent 401s into a single refresh', async () => {
		let meCalls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input).endsWith('/auth/refresh')) {
					refreshCalls += 1;
					await new Promise((resolve) => setTimeout(resolve, 0));
					return response(200, refreshBody(2));
				}
				meCalls += 1;
				return meCalls <= 2 ? response(401, apiErrorBody(401, 'INVALID_SESSION')) : response(200, ME);
			})
		);

		await Promise.all([fetchMe(), fetchMe()]);

		expect(refreshCalls).toBe(1);
	});

	it('does not refresh when the login endpoint itself returns 401', async () => {
		let loginCalls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input).endsWith('/auth/refresh')) {
					refreshCalls += 1;
					return response(200, refreshBody(2));
				}
				loginCalls += 1;
				return response(401, apiErrorBody(401, 'INVALID_SESSION'));
			})
		);

		await expect(login('a@example.com', 'pw')).rejects.toMatchObject({ code: 'INVALID_SESSION' });
		expect(refreshCalls).toBe(0);
		expect(loginCalls).toBe(1);
	});

	it('refreshSession posts the expected credential generation', async () => {
		let body: unknown = null;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
				body = init?.body ? JSON.parse(String(init.body)) : null;
				return response(200, refreshBody(8));
			})
		);

		await refreshSession('csrf', 7);

		expect(body).toEqual({ expected_credential_generation: 7 });
	});
});