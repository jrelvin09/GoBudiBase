<script lang="ts">
	import { onMount } from 'svelte';
	import type { RuntimePage, RuntimeComponent } from '$lib/api/builderClient';
	import { savePageCode } from '$lib/api/builderClient';
	import {
		Code2,
		Server,
		Globe,
		Save,
		Copy,
		Check,
		Sparkles,
		CheckCircle2,
		Layers,
		Zap,
		Sliders,
		Plus,
		Maximize2,
		Minimize2,
		AlertCircle,
		Layout,
		FileCode,
		FileText,
		Palette,
		Eye,
		EyeOff
	} from 'lucide-svelte';

	let {
		activePage,
		appSlug = 'gopimsbase',
		onViewDesigner,
		onRunApp
	}: {
		activePage: RuntimePage;
		appSlug?: string;
		onViewDesigner: () => void;
		onRunApp?: () => void;
	} = $props();

	// 4 Pillars of Code Behind: 'frontend' | 'backend' | 'html' | 'css'
	let activeLayer = $state<'frontend' | 'backend' | 'html' | 'css'>('frontend');
	let isFullscreen = $state<boolean>(false);
	let isSaving = $state<boolean>(false);
	let saveSuccess = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let showPreviewPane = $state<boolean>(false);

	// Code strings for the 4 pillars
	let scriptFront = $state<string>('');
	let scriptBack = $state<string>('');
	let customHtml = $state<string>('');
	let customCss = $state<string>('');

	// =========================================================================
	// 1. DEFAULT CODE GENERATORS
	// =========================================================================

	function generateDefaultFrontEnd(page: RuntimePage): string {
		const isLogin = page.slug === 'login' || page.id === 22 || page.title.toLowerCase().includes('login');
		const isSetup = page.slug.includes('setup') || page.slug.includes('hierarchy') || page.slug.includes('role');

		if (isLogin) {
			return `/**
 * ============================================================================
 * FrontEnd Code-Behind: Login Harvest Cloud (Page 9999)
 * Bahasa: Modern TypeScript / Client JavaScript
 * Deskripsi: Kustomisasi logika client-side yang tidak ada di Form Designer
 * ============================================================================
 */

export default {
  /**
   * 1. Lifecycle Hook: onPageLoad
   * Dijalankan saat halaman login dibuka di browser
   */
  async onPageLoad(ctx: { appSlug: string; userSession: any; queryParams: URLSearchParams }) {
    console.log("[P9999 FrontEnd] Page Loaded. Initializing auth state...");
    
    // Cek jika sudah ada sesi login aktif, langsung alihkan ke dashboard
    if (ctx.userSession?.token) {
      ctx.navigate("/dashboard");
      return;
    }

    // Prefill URL parameter jika ada (misal: ?nik=IT000002)
    const presetNik = ctx.queryParams.get("nik");
    if (presetNik && ctx.form) {
      ctx.form.username = presetNik.toUpperCase();
    }
  },

  /**
   * 2. Custom Validator: Validasi Format NIK & Password
   * Form Designer hanya bisa cek 'required', validator ini mengecek format NIK
   */
  validateCredentials(form: { username?: string; password?: string }) {
    const errors: Record<string, string> = {};
    const nik = (form.username || "").trim();

    if (!nik) {
      errors.username = "Username / NIK wajib diisi";
    } else if (nik.length < 4) {
      errors.username = "NIK minimal 4 karakter (misal: IT000002)";
    }

    if (!form.password) {
      errors.password = "Password wajib diisi";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * 3. Component Event: Button Sign In Click
   * Intercept form submit, lakukan sanitasi, dan panggil API otentikasi
   */
  async onSignInClick(event: MouseEvent, ctx: { form: any; api: any; notify: Function; navigate: Function }) {
    const { form, api, notify, navigate } = ctx;
    
    // Validasi kustom
    const val = this.validateCredentials(form);
    if (!val.isValid) {
      notify(Object.values(val.errors).join("\\n"), "warning");
      return;
    }

    try {
      // Panggil endpoint autentikasi server GoBudiBase
      const res = await api.post("/api/v1/auth/login", {
        username: form.username.trim().toUpperCase(),
        password: form.password
      });

      if (res.success) {
        notify(\`Selamat datang, \${res.user.fullName}!\`, "success");
        ctx.setSession("user", res.user);
        navigate("dashboard");
      } else {
        notify(res.message || "Invalid Login Credentials", "error");
      }
    } catch (err: any) {
      notify("Gagal menghubungi server autentikasi: " + err.message, "error");
    }
  },

  /**
   * 4. Demo Helper: Prefill Kredensial Uji Coba
   */
  onPrefillDemoClick(ctx: { form: any; notify: Function }) {
    ctx.form.username = "IT000002";
    ctx.form.password = "Palembang@2026";
    ctx.form.remember_me = true;
    ctx.notify("Kredensial demo IT000002 berhasil diisi", "info");
  }
};
`;
		}

		if (isSetup) {
			return `/**
 * ============================================================================
 * FrontEnd Code-Behind: ${page.title}
 * Bahasa: Modern TypeScript / Client JavaScript
 * Deskripsi: Kustomisasi logika client-side yang tidak ada di Form Designer
 * ============================================================================
 */

export default {
  /**
   * 1. Lifecycle Hook: onPageLoad
   */
  async onPageLoad(ctx: { api: any; state: any; notify: Function }) {
    console.log("[FrontEnd] Memuat data konfigurasi setup...");
    try {
      const roles = await ctx.api.post("/api/v1/builder/query/execute", {
        sql: "SELECT id, role_name, description FROM pims.roles ORDER BY id ASC"
      });
      ctx.state.availableRoles = roles.rows || [];
    } catch (e: any) {
      console.warn("Gagal memuat roles:", e.message);
    }
  },

  /**
   * 2. Dynamic UI Calculation & Cascading Filter
   */
  async onEstateChange(selectedEstate: string, ctx: { form: any; api: any }) {
    if (!selectedEstate) {
      ctx.form.afdelingOptions = [];
      return;
    }
    const res = await ctx.api.post("/api/v1/builder/query/execute", {
      sql: \`SELECT DISTINCT afdeling FROM pims.approval_hierarchy WHERE estate = '\${selectedEstate}'\`
    });
    ctx.form.afdelingOptions = (res.rows || []).map((r: any) => r.afdeling);
  },

  /**
   * 3. Custom Button Action: Export Data Setup ke Spreadsheet
   */
  async onExportClick(ctx: { state: any; notify: Function }) {
    ctx.notify("Mengekspor data konfigurasi...", "info");
    const rows = ctx.state.gridRows || [];
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Nama,Role,Status"].concat(rows.map((r: any) => \`\${r.id},\${r.name},\${r.role},\${r.status}\`)).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`\${page.slug}-export.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
`;
		}

		return `/**
 * ============================================================================
 * FrontEnd Code-Behind: ${page.title}
 * Bahasa: Modern TypeScript / Client JavaScript
 * Deskripsi: Kustomisasi logika client-side yang tidak ada di Form Designer
 * ============================================================================
 */

export default {
  async onPageLoad(ctx: { api: any; form: any; state: any; notify: Function }) {
    console.log("[FrontEnd] onPageLoad: ${page.slug}");
  },

  calculateTotal(form: { qty?: number; harga?: number; diskon_pct?: number }) {
    const qty = Number(form.qty || 0);
    const harga = Number(form.harga || 0);
    const diskon = Number(form.diskon_pct || 0);
    
    const subtotal = qty * harga;
    const nilaiDiskon = subtotal * (diskon / 100);
    const grandTotal = subtotal - nilaiDiskon;
    
    return {
      subtotal,
      nilaiDiskon,
      grandTotal: Math.round(grandTotal)
    };
  },

  beforeSubmit(formData: any, ctx: { notify: Function }) {
    if (formData.qty <= 0) {
      ctx.notify("Jumlah QTY harus lebih besar dari 0!", "warning");
      return false;
    }
    return true;
  }
};
`;
	}

	function generateDefaultBackEnd(page: RuntimePage): string {
		const isLogin = page.slug === 'login' || page.id === 22 || page.title.toLowerCase().includes('login');
		const isSetup = page.slug.includes('setup') || page.slug.includes('hierarchy') || page.slug.includes('role');

		if (isLogin) {
			return `-- ============================================================================
-- BackEnd Code-Behind: Server Actions & Database Hooks (Page 9999: Login)
-- Bahasa: PostgreSQL PL/pgSQL & Go Server Action Hooks
-- Deskripsi: Logika backend server yang tidak bisa di-generate via Form Designer
-- ============================================================================

-- 1. SERVER-SIDE AUDIT LOG HOOK: Catat Riwayat Login
CREATE OR REPLACE FUNCTION pims.hook_after_login_attempt(
    p_username VARCHAR,
    p_ip_address VARCHAR,
    p_is_success BOOLEAN,
    p_user_agent VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO pims.login_history (
        username,
        ip_address,
        login_time,
        is_success,
        user_agent
    ) VALUES (
        p_username,
        p_ip_address,
        NOW(),
        p_is_success,
        p_user_agent
    );
END;
$$;

-- 2. SERVER-SIDE RATE LIMITING & SECURITY CHECK
CREATE OR REPLACE FUNCTION pims.check_account_lockout(p_username VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_fail_count INT;
BEGIN
    SELECT COUNT(*) INTO v_fail_count
    FROM pims.login_history
    WHERE username = p_username
      AND is_success = false
      AND login_time > NOW() - INTERVAL '15 minutes';

    RETURN v_fail_count >= 5;
END;
$$;
`;
		}

		if (isSetup) {
			return `-- ============================================================================
-- BackEnd Code-Behind: Database Triggers & Server RPC (${page.title})
-- Bahasa: PostgreSQL PL/pgSQL & Go Server Action Hooks
-- Deskripsi: Logika backend server yang tidak bisa di-generate via Form Designer
-- ============================================================================

-- 1. SERVER HOOK: Sebelum Simpan Hierarki Approval (Enforce Constraint)
CREATE OR REPLACE FUNCTION pims.hook_before_save_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.approval_level < 1 OR NEW.approval_level > 5 THEN
        RAISE EXCEPTION 'Level Approval harus bernilai antara 1 sampai 5!';
    END IF;

    NEW.estate := UPPER(TRIM(NEW.estate));
    NEW.afdeling := UPPER(TRIM(NEW.afdeling));
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

-- 2. SERVER RPC: Salin Susunan Approval ke Afdeling Lain (Atomic Transaction)
CREATE OR REPLACE FUNCTION pims.rpc_clone_approval_hierarchy(
    p_source_estate VARCHAR,
    p_source_afdeling VARCHAR,
    p_target_estate VARCHAR,
    p_target_afdeling VARCHAR,
    p_operator_user VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_inserted_count INT;
BEGIN
    DELETE FROM pims.approval_hierarchy
    WHERE estate = p_target_estate AND afdeling = p_target_afdeling;

    INSERT INTO pims.approval_hierarchy (estate, afdeling, approval_level, approver_nik, approver_name, role_name, created_by)
    SELECT p_target_estate, p_target_afdeling, approval_level, approver_nik, approver_name, role_name, p_operator_user
    FROM pims.approval_hierarchy
    WHERE estate = p_source_estate AND afdeling = p_source_afdeling;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'status', 'success',
        'cloned_count', v_inserted_count,
        'message', format('Berhasil menyalin %s approver ke %s - %s', v_inserted_count, p_target_estate, p_target_afdeling)
    );
END;
$$;
`;
		}

		return `-- ============================================================================
-- BackEnd Code-Behind: Server Actions & Database Hooks (${page.title})
-- Bahasa: PostgreSQL PL/pgSQL & Go Server Action Hooks
-- Deskripsi: Logika backend server yang tidak bisa di-generate via Form Designer
-- ============================================================================

-- 1. AUTO-NUMBERING HOOK: Buat No Dokumen Berurutan Otomatis
CREATE OR REPLACE FUNCTION pims.generate_document_number(p_prefix VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    v_year VARCHAR := TO_CHAR(NOW(), 'YYYY');
    v_month VARCHAR := TO_CHAR(NOW(), 'MM');
    v_seq INT;
    v_result VARCHAR;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_seq FROM pims.users;
    v_result := format('%s/%s/%s/%s', p_prefix, v_year, v_month, LPAD(v_seq::TEXT, 4, '0'));
    RETURN v_result;
END;
$$;

-- 2. SERVER HOOK: Before Insert Audit Trail
CREATE OR REPLACE FUNCTION pims.hook_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;
`;
	}

	function generateDefaultHtml(page: RuntimePage): string {
		const isLogin = page.slug === 'login' || page.id === 22 || page.title.toLowerCase().includes('login');
		const isSetupUser = page.slug === 'setup-user-informations' || page.id === 12;

		if (isLogin) {
			return `<!-- 
  ============================================================================
  HTML Template: Login Harvest Cloud (Page 9999)
  Kustomisasi tampilan Form Login Oracle APEX Harvest Cloud
  ============================================================================
-->
<div class="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f2f4f7] py-12 px-4 select-none">
  <!-- APEX Redwood Ambient Fluid Background -->
  <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
    <div class="absolute -top-[20%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-br from-amber-200/40 via-orange-100/30 to-transparent blur-3xl"></div>
    <div class="absolute -bottom-[20%] -right-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-tl from-sky-200/40 via-blue-100/30 to-transparent blur-3xl"></div>
    <div class="absolute top-[35%] right-[20%] h-[300px] w-[300px] rounded-full bg-emerald-100/30 blur-2xl"></div>
  </div>

  <!-- APEX Login Container Card -->
  <div class="pims-login-card relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-md transition-all sm:p-10">
    
    <!-- Login Header & Brand Logo -->
    <div class="mb-8 flex flex-col items-center text-center">
      <div class="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#026cb6]/10 text-[#026cb6] shadow-sm transition-transform hover:scale-105">
        <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
          <path d="M7 16v6"/>
          <path d="M13 19v3"/>
          <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7l-2.6-3.1a1 1 0 0 0-1.4 0L10.4 7.3"/>
        </svg>
      </div>
      <h1 id="pims-title" class="text-xl font-bold tracking-tight text-slate-900">Harvest Cloud</h1>
      <p id="pims-subtitle" class="mt-1 text-xs text-slate-500 font-medium">Plantation Information Management System (PIMS)</p>
      <div class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-mono font-medium text-slate-600 border border-slate-200">
        <span>Oracle APEX 24.2 Parity</span>
        <span>•</span>
        <span>App 103</span>
      </div>
    </div>

    <!-- Login Form -->
    <form id="pims-login-form" class="space-y-4">
      <!-- Error Message Container (Hidden by default) -->
      <div id="pims-login-error" class="hidden mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 shadow-sm">
        <span id="pims-login-error-text">Invalid Login Credentials</span>
      </div>

      <!-- Username Input -->
      <div>
        <label for="pims-username" class="sr-only">Username</label>
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <input
            id="pims-username"
            name="username"
            type="text"
            value="IT000002"
            placeholder="Username"
            required
            autocomplete="username"
            class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#026cb6] focus:ring-2 focus:ring-[#026cb6]/20 font-medium"
          />
        </div>
      </div>

      <!-- Password Input -->
      <div>
        <label for="pims-password" class="sr-only">Password</label>
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <input
            id="pims-password"
            name="password"
            type="password"
            value="Palembang@2026"
            placeholder="Password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#026cb6] focus:ring-2 focus:ring-[#026cb6]/20 font-medium"
          />
          <button
            type="button"
            id="btn-toggle-password"
            class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>

      <!-- Remember Username Checkbox -->
      <div class="flex items-center justify-between pt-1">
        <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition">
          <input
            id="pims-remember"
            name="remember"
            type="checkbox"
            checked
            class="h-4 w-4 rounded border-slate-300 text-[#026cb6] focus:ring-[#026cb6]/30 cursor-pointer"
          />
          <span>Remember username</span>
        </label>
      </div>

      <!-- APEX Hot Button: Sign In -->
      <button
        type="submit"
        id="btn-signin"
        class="btn-apex-primary w-full flex items-center justify-center gap-2 rounded-lg bg-[#026cb6] py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-[#026cb6]/25 transition hover:bg-[#025691] active:scale-[0.99] cursor-pointer"
      >
        <span>Sign In</span>
      </button>
    </form>

    <!-- Demo Quick Fill Helper -->
    <div class="mt-6 border-t border-slate-100 pt-5 text-center">
      <button
        type="button"
        id="btn-prefill-demo"
        class="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-[11px] font-semibold text-sky-800 transition hover:bg-sky-100 hover:border-sky-300 cursor-pointer shadow-xs"
      >
        <span>Prefill Demo: <strong>IT000002</strong> / <strong>Palembang@2026</strong></span>
      </button>
    </div>

    <!-- Footer Security Note -->
    <div class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
      <svg class="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
      <span id="pims-footer-note">Secured by GoBudiBase Engine & ORDS Bridge</span>
    </div>
  </div>
</div>`;
		}

		if (isSetupUser) {
			return `<!-- 
  ============================================================================
  HTML Template: SETUP Informasi User (Page 160)
  ============================================================================
-->
<div class="flex flex-col gap-5 p-2 font-sans select-none">
  <!-- APEX Page Header & Breadcrumb -->
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
    <div>
      <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <span>Home</span>
        <span>/</span>
        <span>Konfigurasi Setup</span>
        <span>/</span>
        <span class="text-sky-400 font-bold">SETUP Informasi User</span>
      </div>
      <h2 id="page-title" class="text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
        <span>SETUP Informasi User (P-160)</span>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Live APEX Parity</span>
      </h2>
      <p id="page-desc" class="text-xs text-slate-400 mt-0.5">Kelola data master pengguna korporat, subsidiary, penugasan role, dan status aktifasi akun.</p>
    </div>

    <!-- Action Toolbar -->
    <div class="flex items-center gap-2">
      <button id="btn-export-csv" type="button" class="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer">
        <span>Export CSV</span>
      </button>
      <button id="btn-add-user" type="button" class="flex items-center gap-1.5 rounded-lg bg-[#026cb6] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#026cb6]/30 hover:bg-[#025691] transition cursor-pointer">
        <span>+ Tambah User</span>
      </button>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm backdrop-blur">
    <div class="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
      <input
        id="pims-search-input"
        type="text"
        placeholder="Cari NIK, Nama Karyawan, Role..."
        class="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
      />
      <select id="pims-filter-subsidiary" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer">
        <option value="ALL">Semua Subsidiary (PT)</option>
        <option value="KYA">PT Kirana Yudha Amandari</option>
        <option value="SWA">PT Sumber Wangi Alam</option>
        <option value="ASJ">PT Cahaya Putih Energi Alam</option>
      </select>
    </div>
    <div class="text-xs text-slate-400 font-mono">
      <span>Total: <strong class="text-white">1,420</strong> User</span>
    </div>
  </div>

  <!-- Interactive Grid / Table Card -->
  <div class="rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-300">
        <thead class="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th class="py-3 px-4 w-12 text-center">No</th>
            <th class="py-3 px-4">NIK</th>
            <th class="py-3 px-4">Nama Lengkap</th>
            <th class="py-3 px-4">Subsidiary</th>
            <th class="py-3 px-4">Role System</th>
            <th class="py-3 px-4 text-center">Status</th>
            <th class="py-3 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-4 text-center text-slate-500 font-mono">1</td>
            <td class="py-3 px-4 font-bold text-sky-400 font-mono">IT000002</td>
            <td class="py-3 px-4 font-semibold text-white">Mukti Assary</td>
            <td class="py-3 px-4 text-slate-300">PT Palembang Agro Mandiri</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-500/30">Administrator HCM</span></td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">Aktif</span></td>
            <td class="py-3 px-4 text-right">
              <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold cursor-pointer">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;
		}

		return `<!-- 
  ============================================================================
  HTML Template: ${page.title} (${page.slug})
  ============================================================================
-->
<div class="flex flex-col gap-4 p-2">
  <div class="border-b border-slate-800 pb-3">
    <h2 class="text-lg font-bold text-white">${page.title}</h2>
    <p class="text-xs text-slate-400">Modul Oracle APEX PIMS - Halaman frm_${page.slug}</p>
  </div>
  <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
    <p class="text-xs text-slate-300">Konten form ${page.title} siap dikustomisasi di Studio.</p>
  </div>
</div>`;
	}

	function generateDefaultCss(page: RuntimePage): string {
		const isLogin = page.slug === 'login' || page.id === 22 || page.title.toLowerCase().includes('login');
		if (isLogin) {
			return `/* Custom CSS: Login Harvest Cloud (Page 9999) */
.pims-login-card {
  box-shadow: 0 20px 50px -12px rgba(2, 108, 182, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-apex-primary {
  background-color: #026cb6;
  transition: all 0.2s ease;
}

.btn-apex-primary:hover {
  background-color: #025691;
  box-shadow: 0 4px 14px rgba(2, 108, 182, 0.35);
}

#btn-prefill-demo:hover {
  background-color: #e0f2fe;
}`;
		}

		return `/* Custom CSS: ${page.title} (${page.slug}) */
table tr:hover td {
  background-color: rgba(2, 108, 182, 0.06);
}`;
	}

	// Initialize code when activePage changes
	$effect(() => {
		if (activePage) {
			scriptFront = activePage.script_front || generateDefaultFrontEnd(activePage);
			scriptBack = activePage.script_back || generateDefaultBackEnd(activePage);
			customHtml = activePage.custom_html || generateDefaultHtml(activePage);
			customCss = activePage.custom_css || generateDefaultCss(activePage);
		}
	});

	// Split code into lines for syntax line numbering
	let currentCode = $derived.by(() => {
		if (activeLayer === 'frontend') return scriptFront;
		if (activeLayer === 'backend') return scriptBack;
		if (activeLayer === 'html') return customHtml;
		return customCss;
	});

	let codeLines = $derived.by(() => {
		return currentCode.split('\n');
	});

	// Save Code Behind to Backend
	async function handleSave() {
		if (!activePage) return;
		isSaving = true;
		try {
			await savePageCode({
				page_id: activePage.id,
				script_front: scriptFront,
				script_back: scriptBack,
				custom_html: customHtml,
				custom_css: customCss
			});
			activePage.script_front = scriptFront;
			activePage.script_back = scriptBack;
			activePage.custom_html = customHtml;
			activePage.custom_css = customCss;

			saveSuccess = true;
			setTimeout(() => {
				saveSuccess = false;
			}, 3000);
		} catch (e: any) {
			alert(`Gagal menyimpan Code Behind: ${e.message || e}`);
		} finally {
			isSaving = false;
		}
	}

	function handleCopy() {
		navigator.clipboard.writeText(currentCode);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	// Insert snippet helpers
	function insertSnippet(type: string) {
		if (activeLayer === 'frontend') {
			let snippet = '';
			if (type === 'calc') {
				snippet = `\n  // [Preset] Custom UI Calculation (Formula Dinamis)\n  calculateHargaTotal(qty: number, hargaSatuan: number, diskonPct: number = 0) {\n    const subtotal = qty * hargaSatuan;\n    return subtotal - (subtotal * (diskonPct / 100));\n  }\n`;
			} else if (type === 'cascade') {
				snippet = `\n  // [Preset] Cascading Dropdown (Filter Berantai)\n  async onParentChange(parentId: string, ctx: { form: any; api: any }) {\n    const res = await ctx.api.post("/api/v1/builder/query/execute", {\n      sql: \`SELECT id, name FROM pims.sub_items WHERE parent_id = '\${parentId}'\`\n    });\n    ctx.form.childOptions = res.rows || [];\n  }\n`;
			} else if (type === 'regex') {
				snippet = `\n  // [Preset] Custom NIK Regex Validator\n  validateNik(nik: string) {\n    const regex = /^[0-9]{4,16}$/;\n    return regex.test(nik) ? null : "Format NIK tidak valid (harus angka 4-16 digit)";\n  }\n`;
			}
			scriptFront += snippet;
		} else if (activeLayer === 'backend') {
			let snippet = '';
			if (type === 'autonumber') {
				snippet = `\n-- [Preset] Auto Sequence Generator\nCREATE OR REPLACE FUNCTION pims.get_next_sequence(p_doc_type VARCHAR)\nRETURNS VARCHAR AS $$\nBEGIN\n    RETURN format('%s-%s-%s', p_doc_type, TO_CHAR(NOW(), 'YYYYMMDD'), LPAD((FLOOR(RANDOM()*9000)+1000)::TEXT, 4, '0'));\nEND;\n$$ LANGUAGE plpgsql;\n`;
			} else if (type === 'audit') {
				snippet = `\n-- [Preset] Server Audit Log Interceptor\nCREATE OR REPLACE FUNCTION pims.audit_trigger_func()\nRETURNS TRIGGER AS $$\nBEGIN\n    INSERT INTO pims.activity_log(table_name, operation, record_id, changed_by, changed_at)\n    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, CURRENT_USER, NOW());\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n`;
			} else if (type === 'transaction') {
				snippet = `\n-- [Preset] Multi-Table Atomic Transaction (BEGIN ... COMMIT)\nDO $$\nBEGIN\n    -- Langkah 1: Update status induk\n    UPDATE pims.users SET updated_at = NOW() WHERE id = 1;\n    -- Langkah 2: Catat log\n    INSERT INTO pims.activity_log(operation) VALUES ('BATCH_UPDATE');\n    -- Otomatis commit jika sukses, rollback jika gagal\nEND;\n$$;\n`;
			}
			scriptBack += snippet;
		} else if (activeLayer === 'html') {
			let snippet = '';
			if (type === 'banner') {
				snippet = `\n<!-- [Preset] Hero Alert Banner -->\n<div class="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs mb-4">\n  <span class="text-base">⚠️</span>\n  <div>\n    <strong>Peringatan Sistem:</strong> Pastikan seluruh data approval diperiksa sebelum finalisasi tutup buku bulanan.\n  </div>\n</div>\n`;
			} else if (type === 'kpi') {
				snippet = `\n<!-- [Preset] KPI Metric Card Grid -->\n<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">\n  <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/50">\n    <span class="text-[10px] text-slate-400">Total Karyawan</span>\n    <div class="text-lg font-bold text-white">1,420</div>\n  </div>\n  <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/50">\n    <span class="text-[10px] text-slate-400">Approver Aktif</span>\n    <div class="text-lg font-bold text-emerald-400">48</div>\n  </div>\n</div>\n`;
			} else if (type === 'modal') {
				snippet = `\n<!-- [Preset] Custom Action Modal Container -->\n<div id="custom-action-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">\n  <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">\n    <h3 class="text-sm font-bold text-white mb-2">Konfirmasi Aksi</h3>\n    <p class="text-xs text-slate-400 mb-4">Apakah Anda yakin ingin memproses transaksi ini?</p>\n    <div class="flex justify-end gap-2">\n      <button class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300">Batal</button>\n      <button class="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white font-bold">Lanjutkan</button>\n    </div>\n  </div>\n</div>\n`;
			}
			customHtml += snippet;
		} else if (activeLayer === 'css') {
			let snippet = '';
			if (type === 'glass') {
				snippet = `\n/* [Preset] Modern Glass Container */\n.glass-panel {\n  background: rgba(15, 23, 42, 0.65);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 12px;\n}\n`;
			} else if (type === 'pulse') {
				snippet = `\n/* [Preset] Glowing Neon Indicator */\n.neon-pulse {\n  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);\n  animation: neonPulse 2s infinite ease-in-out;\n}\n@keyframes neonPulse {\n  0%, 100% { opacity: 0.8; transform: scale(1); }\n  50% { opacity: 1; transform: scale(1.02); }\n}\n`;
			} else if (type === 'print') {
				snippet = `\n/* [Preset] Clean Print Mode */\n@media print {\n  .no-print, header, nav, aside, .btn-action {\n    display: none !important;\n  }\n  body { background: #fff !important; color: #000 !important; }\n}\n`;
			}
			customCss += snippet;
		}
	}
</script>

<!-- ========================================================================= -->
<!-- 4-PILLAR CODE BEHIND: FRONTEND, BACKEND, HTML, CSS                        -->
<!-- ========================================================================= -->
<div class="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 shadow-2xl overflow-hidden {isFullscreen ? 'fixed inset-2 z-50' : 'relative'}">
	<!-- 1. CODE BEHIND HEADER: TABS & ACTION BUTTONS -->
	<header class="flex flex-col border-b border-slate-800 bg-slate-900/90 text-xs text-slate-300">
		<!-- Top Row: Mode Switches & Save -->
		<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/70">
			<!-- Left: Return to Designer, Save, Launch -->
			<div class="flex items-center gap-1.5">
				<!-- Return to Form Designer -->
				<button
					type="button"
					onclick={onViewDesigner}
					class="flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-emerald-600 hover:text-white transition font-bold cursor-pointer"
					title="Kembali ke Visual Form Designer (Shift+F7)"
				>
					<Layout class="h-3.5 w-3.5 text-emerald-400" />
					<span>Form Designer</span>
					<span class="text-[9px] opacity-70 font-mono hidden sm:inline">(Shift+F7)</span>
				</button>

				<div class="h-4 w-px bg-slate-800 mx-0.5"></div>

				<!-- Save Code Behind -->
				<button
					type="button"
					onclick={handleSave}
					disabled={isSaving}
					class="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-500 transition cursor-pointer shadow disabled:opacity-50"
					title="Simpan Seluruh Code Behind (FrontEnd, BackEnd, HTML, CSS) ke Database (Ctrl+S)"
				>
					<Save class="h-3.5 w-3.5" />
					<span>{isSaving ? 'Menyimpan...' : 'Simpan Code'}</span>
				</button>

				<!-- Toggle Live Preview -->
				<button
					type="button"
					onclick={() => (showPreviewPane = !showPreviewPane)}
					class="flex items-center gap-1.5 rounded border px-2.5 py-1 font-bold transition cursor-pointer {showPreviewPane ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300'}"
					title="Buka / Tutup Panel Preview Live HTML + CSS"
				>
					{#if showPreviewPane}
						<EyeOff class="h-3 w-3 text-cyan-400" />
						<span>Tutup Preview</span>
					{:else}
						<Eye class="h-3 w-3 text-cyan-400" />
						<span>Live Preview</span>
					{/if}
				</button>

				{#if onRunApp}
					<button
						type="button"
						onclick={onRunApp}
						class="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1 text-white font-bold hover:bg-blue-500 transition cursor-pointer shadow"
						title="Buka Runtime Aplikasi (F5)"
					>
						<Zap class="h-3.5 w-3.5 fill-current" />
						<span class="hidden sm:inline">Launch App (F5)</span>
					</button>
				{/if}
			</div>

			<!-- Right: Copy & Fullscreen -->
			<div class="flex items-center gap-2">
				{#if saveSuccess}
					<span class="flex items-center gap-1 text-emerald-400 font-semibold text-[11px] animate-pulse">
						<CheckCircle2 class="h-3.5 w-3.5" />
						<span>Tersimpan di Database!</span>
					</span>
				{/if}

				<!-- Copy Code -->
				<button
					type="button"
					onclick={handleCopy}
					class="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition cursor-pointer"
					title="Salin Kode Aktif"
				>
					{#if copied}
						<Check class="h-3.5 w-3.5 text-emerald-400" />
						<span class="text-emerald-400">Tersalin</span>
					{:else}
						<Copy class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">Copy</span>
					{/if}
				</button>

				<!-- Toggle Fullscreen -->
				<button
					type="button"
					onclick={() => (isFullscreen = !isFullscreen)}
					class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
					title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen Code Editor'}
				>
					{#if isFullscreen}
						<Minimize2 class="h-3.5 w-3.5" />
					{:else}
						<Maximize2 class="h-3.5 w-3.5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- 4-Pillar Tabs Switcher: FrontEnd | BackEnd | HTML | CSS -->
		<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900 border-b border-slate-800">
			<!-- 4 Tabs -->
			<div class="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1 text-xs">
				<!-- 1. FrontEnd -->
				<button
					type="button"
					onclick={() => (activeLayer = 'frontend')}
					class="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition cursor-pointer {activeLayer === 'frontend' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
				>
					<Globe class="h-3.5 w-3.5" />
					<span>FrontEnd</span>
					<span class="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-400/30">TS/JS</span>
				</button>

				<!-- 2. BackEnd -->
				<button
					type="button"
					onclick={() => (activeLayer = 'backend')}
					class="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition cursor-pointer {activeLayer === 'backend' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
				>
					<Server class="h-3.5 w-3.5" />
					<span>BackEnd</span>
					<span class="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-400/30">SQL/Go</span>
				</button>

				<!-- 3. HTML -->
				<button
					type="button"
					onclick={() => (activeLayer = 'html')}
					class="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition cursor-pointer {activeLayer === 'html' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
				>
					<FileText class="h-3.5 w-3.5" />
					<span>HTML</span>
					<span class="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/30">Markup</span>
				</button>

				<!-- 4. CSS -->
				<button
					type="button"
					onclick={() => (activeLayer = 'css')}
					class="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition cursor-pointer {activeLayer === 'css' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
				>
					<Palette class="h-3.5 w-3.5" />
					<span>CSS</span>
					<span class="text-[9px] px-1 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-400/30">Theme</span>
				</button>
			</div>

			<!-- Quick Snippet Presets for Customizations Not in Form Designer -->
			<div class="flex items-center gap-1.5 text-[11px]">
				<span class="text-slate-500 font-mono text-[10px] hidden md:inline">Sisipkan Kustomisasi:</span>
				{#if activeLayer === 'frontend'}
					<button
						type="button"
						onclick={() => insertSnippet('calc')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-950/40 transition"
					>
						<Sparkles class="h-3 w-3 text-indigo-400" />
						<span>+ Formula Kalkulasi</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('cascade')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-950/40 transition"
					>
						<Sliders class="h-3 w-3 text-indigo-400" />
						<span>+ Cascading Filter</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('regex')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-950/40 transition"
					>
						<Code2 class="h-3 w-3 text-indigo-400" />
						<span>+ Validasi NIK</span>
					</button>
				{:else if activeLayer === 'backend'}
					<button
						type="button"
						onclick={() => insertSnippet('autonumber')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition"
					>
						<Sparkles class="h-3 w-3 text-amber-400" />
						<span>+ Auto Sequence</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('audit')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition"
					>
						<Server class="h-3 w-3 text-amber-400" />
						<span>+ Audit Trail Hook</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('transaction')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition"
					>
						<Zap class="h-3 w-3 text-amber-400" />
						<span>+ Atomic Transaction</span>
					</button>
				{:else if activeLayer === 'html'}
					<button
						type="button"
						onclick={() => insertSnippet('banner')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-cyan-300 hover:border-cyan-500 hover:bg-cyan-950/40 transition"
					>
						<Sparkles class="h-3 w-3 text-cyan-400" />
						<span>+ Banner Alert</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('kpi')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-cyan-300 hover:border-cyan-500 hover:bg-cyan-950/40 transition"
					>
						<Layers class="h-3 w-3 text-cyan-400" />
						<span>+ KPI Cards</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('modal')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-cyan-300 hover:border-cyan-500 hover:bg-cyan-950/40 transition"
					>
						<Layout class="h-3 w-3 text-cyan-400" />
						<span>+ Modal Dialog</span>
					</button>
				{:else if activeLayer === 'css'}
					<button
						type="button"
						onclick={() => insertSnippet('glass')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-pink-300 hover:border-pink-500 hover:bg-pink-950/40 transition"
					>
						<Sparkles class="h-3 w-3 text-pink-400" />
						<span>+ Glassmorphism</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('pulse')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-pink-300 hover:border-pink-500 hover:bg-pink-950/40 transition"
					>
						<Zap class="h-3 w-3 text-pink-400" />
						<span>+ Neon Pulse</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('print')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-pink-300 hover:border-pink-500 hover:bg-pink-950/40 transition"
					>
						<FileText class="h-3 w-3 text-pink-400" />
						<span>+ Print Rules</span>
					</button>
				{/if}
			</div>
		</div>
	</header>

	<!-- 2. REAL CODE EDITOR CANVAS + OPTIONAL LIVE PREVIEW SPLIT -->
	<div class="flex-1 flex overflow-hidden bg-[#0a0e17] font-mono text-xs relative">
		<!-- Line Number Gutter -->
		<div class="w-12 bg-[#060a12] border-r border-slate-800/80 select-none py-3 text-right pr-2 text-slate-600 font-mono text-[11px] overflow-hidden shrink-0">
			{#each codeLines as _, idx}
				<div class="h-5 flex items-center justify-end text-slate-600">
					<span>{idx + 1}</span>
				</div>
			{/each}
		</div>

		<!-- Code Editor Text Area -->
		<div class="flex-1 relative overflow-auto p-3 bg-[#0a0e17]">
			{#if activeLayer === 'frontend'}
				<textarea
					bind:value={scriptFront}
					spellcheck="false"
					class="w-full h-full bg-transparent text-indigo-100 outline-none resize-none font-mono text-[12px] leading-5 whitespace-pre selection:bg-indigo-600 selection:text-white"
					placeholder="// Ketik logika kustom FrontEnd (TypeScript / JavaScript) di sini..."
				></textarea>
			{:else if activeLayer === 'backend'}
				<textarea
					bind:value={scriptBack}
					spellcheck="false"
					class="w-full h-full bg-transparent text-amber-100 outline-none resize-none font-mono text-[12px] leading-5 whitespace-pre selection:bg-amber-600 selection:text-white"
					placeholder="-- Ketik logika kustom BackEnd (PostgreSQL PL/pgSQL / Go Server Hook) di sini..."
				></textarea>
			{:else if activeLayer === 'html'}
				<textarea
					bind:value={customHtml}
					spellcheck="false"
					class="w-full h-full bg-transparent text-cyan-100 outline-none resize-none font-mono text-[12px] leading-5 whitespace-pre selection:bg-cyan-600 selection:text-white"
					placeholder="<!-- Ketik kustomisasi DOM / HTML Template di sini... -->"
				></textarea>
			{:else if activeLayer === 'css'}
				<textarea
					bind:value={customCss}
					spellcheck="false"
					class="w-full h-full bg-transparent text-pink-100 outline-none resize-none font-mono text-[12px] leading-5 whitespace-pre selection:bg-pink-600 selection:text-white"
					placeholder="/* Ketik kustomisasi CSS Stylesheet & Theme di sini... */"
				></textarea>
			{/if}
		</div>

		<!-- Live Preview Split Pane (if toggled) -->
		{#if showPreviewPane}
			<div class="w-1/2 border-l border-slate-800 bg-slate-900/95 flex flex-col overflow-hidden">
				<div class="px-3 py-1.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-sans">
					<span class="font-bold text-slate-300 flex items-center gap-1.5">
						<Sparkles class="h-3.5 w-3.5 text-cyan-400" />
						<span>Live Preview (HTML + CSS)</span>
					</span>
					<span class="text-[10px] text-slate-500 font-mono">Rendered Output</span>
				</div>
				<div class="flex-1 p-4 overflow-auto font-sans">
					{@html `<style>${customCss}</style>`}
					<div class="pims-custom-preview-wrapper text-slate-200">
						{@html customHtml}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- 3. STATUS FOOTER BAR -->
	<footer class="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-3 py-1 text-[10px] font-mono text-slate-400 select-none shrink-0">
		<div class="flex items-center gap-3">
			<span class="text-emerald-400 font-semibold">● Active Form: {activePage.title}</span>
			<span>Layer: <strong class="{activeLayer === 'frontend' ? 'text-indigo-400' : activeLayer === 'backend' ? 'text-amber-400' : activeLayer === 'html' ? 'text-cyan-400' : 'text-pink-400'} uppercase">{activeLayer}</strong></span>
			<span>Lines: <strong class="text-slate-200">{codeLines.length}</strong></span>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-slate-500">Ctrl+S: Simpan | F5: Launch App | Shift+F7: Visual Designer</span>
		</div>
	</footer>
</div>
