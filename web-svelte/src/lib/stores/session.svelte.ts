import {
	ApiError,
	bindAuthRefresh,
	fetchMe,
	fetchTheme,
	login as apiLogin,
	logout as apiLogout,
	patchPreferences,
	requestSessionRefresh,
	switchContext,
	type RefreshResponse
} from '$lib/api/client';
import { setLocale } from '$lib/i18n/index.svelte';
import { applyServerTheme, setDensity, setMode } from '$lib/theme/theme.svelte';
import { publishedStore } from '$lib/stores/published.svelte';
import { resourcesStore } from '$lib/stores/resources.svelte';
import type { Density, Mode } from '$lib/theme/types';
import type { ContextDTO, ContextKind, MeResponse, OrgDTO, UserDTO } from '$lib/api/types';

// PRD 10.3's AuthStore/ContextStore/PermissionStore are described as
// separate concerns, but every server response (login/me/context) replaces
// all three atomically together — so one store *is* the correct
// implementation of "replaced atomically" rather than three stores kept in
// sync by hand.
// 'unknown'/'bootstrapping' gate the whole app's first paint (root layout
// shows a loading screen). 'anonymous'/'authenticated' are the resting
// states. A login *attempt* in flight is tracked separately by `loggingIn`
// so submitting the login form doesn't blank out the login page itself.
export type SessionStatus = 'unknown' | 'bootstrapping' | 'anonymous' | 'authenticated';

// H2-02b: cadangan bootstrap di localStorage. CSRF bukan kredensial (PRD §8.4),
// jadi boleh dibaca JavaScript same-origin. Nilai store yang menang; cadangan
// dipakai saat store masih kosong (reload / tab baru) supaya /auth/refresh
// tidak dikirim tanpa X-CSRF-Token.
const AUTH_KEY = 'bb.auth';

interface StoredAuth {
	csrf: string;
	generation: number;
}

function readStoredAuth(): StoredAuth | null {
	try {
		const raw = localStorage.getItem(AUTH_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredAuth>;
		return typeof parsed?.csrf === 'string' && typeof parsed?.generation === 'number'
			? { csrf: parsed.csrf, generation: parsed.generation }
			: null;
	} catch {
		return null;
	}
}

function writeStoredAuth(auth: StoredAuth): void {
	try {
		localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
	} catch {
		// Cadangan bootstrap: gagal menyimpan bukan alasan menggagalkan aksi user.
	}
}

function clearStoredAuth(): void {
	try {
		localStorage.removeItem(AUTH_KEY);
	} catch {
		// localStorage tidak tersedia (mis. mode privat): tidak ada yang dibersihkan.
	}
}

class SessionStore {
	status = $state<SessionStatus>('unknown');
	user = $state<UserDTO | null>(null);
	csrfToken = $state('');
	context = $state<ContextDTO>({ kind: 'NONE', context_version: 0 });
	credentialGeneration = $state(0);
	permissions = $state<string[]>([]);
	platformEligible = $state(false);
	allowedCompanies = $state<OrgDTO[]>([]);
	allowedLocations = $state<OrgDTO[]>([]);
	error = $state<string | null>(null);
	loggingIn = $state(false);
	switching = $state(false);
	/** Epoch ms of the access token expiry, driving the proactive refresh (H2-02). */
	accessExpiresAt = $state(0);
	private refreshTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		bindAuthRefresh({
			csrfToken: () => this.csrfToken || readStoredAuth()?.csrf || '',
			generation: () => this.credentialGeneration || readStoredAuth()?.generation || 0,
			onRefreshed: (resp) => this.applyRefresh(resp),
			onRefreshFailed: () => this.reset()
		});
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'visible') this.scheduleRefresh();
			});
		}
	}

	hasPermission(key: string): boolean {
		return this.permissions.includes(key);
	}

	/** H2-02b: simpan cadangan begitu csrf & generation terisi. */
	private saveAuth() {
		if (this.csrfToken && this.credentialGeneration) {
			writeStoredAuth({ csrf: this.csrfToken, generation: this.credentialGeneration });
		}
	}

	/** T1-05: tema diambil dari server saat start (halaman login pun), setelah
	 * login, dan setiap ganti konteks. Preferensi user hanya dipakai bila login,
	 * supaya tamu memakai mode/density mesin ini saja. */
	async loadTheme(): Promise<void> {
		try {
			const resp = await fetchTheme();
			applyServerTheme(resp.data, this.status === 'authenticated');
		} catch {
			// Tema adalah tampilan: gagal memuat bukan alasan menggagalkan app.
		}
	}

	/** Mode dari menu user: lokal dulu (tanpa menunggu jaringan), lalu server. */
	async setThemeMode(next: Mode): Promise<void> {
		setMode(next);
		await this.savePreference({ preferred_theme_mode: next });
	}

	async setThemeDensity(next: Density): Promise<void> {
		setDensity(next);
		await this.savePreference({ preferred_density: next });
	}

	private async savePreference(patch: { preferred_theme_mode?: Mode; preferred_density?: Density }): Promise<void> {
		if (this.status !== 'authenticated') return;
		try {
			await patchPreferences(patch, this.csrfToken);
		} catch (err) {
			this.error = err instanceof ApiError ? err.message : 'Could not save the theme preference.';
		}
	}

	/** PRD 10.4: "Show the company and location labels together at all
	 * times." Looked up from allowedCompanies/allowedLocations (the only
	 * source of display names this store has); a location-only grant whose
	 * company never appears in allowedCompanies falls back to a generic
	 * label — a known simplification for this walking skeleton. */
	get contextLabel(): string {
		const company = this.allowedCompanies.find((c) => c.id === this.context.company_id);
		const location = this.allowedLocations.find((l) => l.id === this.context.location_id);
		switch (this.context.kind) {
			case 'NONE':
				return 'No workspace selected';
			case 'PLATFORM':
				return 'Platform administration';
			case 'COMPANY':
				return `${company?.display_name ?? 'Company'} · All eligible locations`;
			case 'LOCATION':
				return `${company?.display_name ?? 'Company'} · ${location?.name ?? 'Location'}`;
		}
	}

	private applyMe(resp: MeResponse) {
		this.user = resp.user;
		this.csrfToken = resp.csrf_token;
		this.context = resp.context;
		this.credentialGeneration = resp.session.credential_generation;
		this.accessExpiresAt = Date.parse(resp.session.access_expires_at);
		this.allowedCompanies = resp.allowed_companies;
		this.allowedLocations = resp.allowed_locations;
		this.permissions = resp.permissions;
		this.platformEligible = resp.platform_eligible;
		// Satu-satunya sumber locale: preferensi user dari server (K0-04).
		setLocale(resp.user.preferred_locale);
		this.status = 'authenticated';
		this.error = null;
		this.saveAuth();
		this.scheduleRefresh();
	}

	/** Called once at app startup to discover whether a session cookie is
	 * already valid — the loading guard's only job, never a security decision. */
	async bootstrap() {
		this.status = 'bootstrapping';
		try {
			const resp = await fetchMe();
			this.applyMe(resp);
		} catch {
			this.status = 'anonymous';
			this.reset();
		}
		await this.loadTheme();
	}

	async login(email: string, password: string): Promise<boolean> {
		this.loggingIn = true;
		this.error = null;
		try {
			await apiLogin(email, password); // establishes the session cookies
			// The login response itself carries no allowed_companies/allowed_locations
			// (only /auth/me does) — fetch the full profile so /select-context has
			// something to render immediately after a successful login.
			const resp = await fetchMe();
			this.applyMe(resp);
			await this.loadTheme();
			return true;
		} catch (err) {
			this.error = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
			return false;
		} finally {
			this.loggingIn = false;
		}
	}

	async logout() {
		try {
			await apiLogout(this.csrfToken);
		} catch {
			// Best-effort: the cookie is invalid/expired either way, so proceed to reset.
		}
		this.reset();
	}

	/** Switches workspace context via POST /auth/context, using the CAS
	 * counters this store already holds. State is replaced only after the
	 * server confirms success (PRD 10.5: "atomically replace context and
	 * permission state" on success, restore prior state on failure). */
	async switchTo(kind: ContextKind, companyId: string | null, locationId: string | null): Promise<boolean> {
		if (this.switching) return false;
		this.switching = true;
		this.error = null;
		const previousCompanyId = this.context.company_id ?? null;
		const previousLocationId = this.context.location_id ?? null;
		try {
			const resp = await switchContext(
				{
					kind,
					company_id: companyId,
					location_id: locationId,
					expected_context_version: this.context.context_version,
					expected_credential_generation: this.credentialGeneration
				},
				this.csrfToken,
				previousCompanyId,
				previousLocationId
			);
			this.context = resp.context;
			this.credentialGeneration = resp.session.credential_generation;
			this.accessExpiresAt = Date.parse(resp.session.access_expires_at);
			this.permissions = resp.permissions;
			this.csrfToken = resp.csrf_token;
			this.saveAuth();
			resourcesStore.clearResources();
			publishedStore.clear();
			await this.loadTheme();
			this.scheduleRefresh();
			return true;
		} catch (err) {
			// Failure: context/permissions are left untouched (still the prior
			// confirmed state), matching PRD 10.5's "restore the confirmed prior
			// context" — there is nothing to restore *to* because nothing changed.
			this.error = err instanceof ApiError ? err.message : 'Could not switch workspace. Please try again.';
			return false;
		} finally {
			this.switching = false;
		}
	}

	/** H2-02: fold a successful refresh back into the store (generation, csrf, expiry). */
	private applyRefresh(resp: RefreshResponse) {
		this.csrfToken = resp.csrf_token;
		this.credentialGeneration = resp.session.credential_generation;
		this.accessExpiresAt = Date.parse(resp.session.access_expires_at);
		this.saveAuth();
		this.scheduleRefresh();
	}

	/** H2-02: refresh 60 s before the access token expires, only while this tab is visible. */
	private scheduleRefresh() {
		this.clearRefreshTimer();
		if (this.status !== 'authenticated' || !this.accessExpiresAt) return;
		if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
		const delay = Math.max(0, this.accessExpiresAt - Date.now() - 60_000);
		this.refreshTimer = setTimeout(() => {
			void this.refreshNow();
		}, delay);
	}

	private clearRefreshTimer() {
		if (this.refreshTimer !== null) {
			clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
	}

	private async refreshNow() {
		this.refreshTimer = null;
		if (this.status !== 'authenticated') return;
		try {
			await requestSessionRefresh();
		} catch {
			// onRefreshFailed already reset the store.
		}
	}

	private reset() {
		this.clearRefreshTimer();
		clearStoredAuth();
		this.accessExpiresAt = 0;
		this.user = null;
		this.csrfToken = '';
		this.context = { kind: 'NONE', context_version: 0 };
		this.credentialGeneration = 0;
		this.permissions = [];
		this.platformEligible = false;
		this.allowedCompanies = [];
		this.allowedLocations = [];
		this.status = 'anonymous';
		resourcesStore.clearResources();
			publishedStore.clear();
	}
}

export const sessionStore = new SessionStore();
