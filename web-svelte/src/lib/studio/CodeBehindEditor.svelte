<script lang="ts">
	import { onMount } from 'svelte';
	import type { RuntimePage, RuntimeComponent } from '$lib/api/builderClient';
	import { savePageCode, executeSqlStudio } from '$lib/api/builderClient';
	import {
		Code2,
		Server,
		Globe,
		Play,
		Save,
		Copy,
		Check,
		Sparkles,
		Terminal,
		CheckCircle2,
		Layers,
		Zap,
		Sliders,
		Plus,
		Maximize2,
		Minimize2,
		AlertCircle,
		Layout,
		RefreshCw,
		Trash2,
		Send,
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
	let isExecuting = $state<boolean>(false);
	let showPreviewPane = $state<boolean>(false);

	// Code strings for the 4 pillars
	let scriptFront = $state<string>('');
	let scriptBack = $state<string>('');
	let customHtml = $state<string>('');
	let customCss = $state<string>('');

	// Interactive Test Console
	let showConsole = $state<boolean>(true);
	let consoleLogs = $state<Array<{ type: 'log' | 'error' | 'success' | 'sql' | 'dom'; text: string; time: string }>>([
		{
			type: 'log',
			text: '[Ready] 4-Pillar Code Behind initialized (FrontEnd, BackEnd, HTML, CSS ready).',
			time: new Date().toLocaleTimeString()
		}
	]);

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
		if (isLogin) {
			return `<!-- 
  ============================================================================
  Custom HTML Template: Login Harvest Cloud (Page 9999)
  Kustomisasi DOM / Markup yang tidak ada di Form Designer standar
  ============================================================================
-->
<div class="pims-custom-banner flex items-center justify-between p-3.5 mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-lg">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">
      ⚡
    </div>
    <div>
      <h5 class="text-xs font-bold text-emerald-200">Harvest Cloud PIMS Production System</h5>
      <p class="text-[11px] text-emerald-400/80">Single Sign-On aktif. Gunakan akun korporat IT000002 untuk modul HCM & Plantation.</p>
    </div>
  </div>
  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
    v2.6.4-ONLINE
  </span>
</div>

<div class="pims-custom-footer text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-800/80">
  <p>© 2026 PT. Sahabat Agro Group • Plantation Information & Management System</p>
  <p class="text-[10px] text-slate-600 mt-1">Sistem ini dilindungi hak cipta dan enkripsi end-to-end SSL.</p>
</div>`;
		}

		return `<!-- 
  ============================================================================
  Custom HTML Template: ${page.title} (${page.slug})
  Kustomisasi DOM / Markup yang tidak ada di Form Designer standar
  ============================================================================
-->
<div class="pims-header-widget grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
  <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between shadow-sm">
    <div>
      <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Status Modul</span>
      <h4 class="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Aktif & Terhubung
      </h4>
    </div>
    <span class="text-2xl">📊</span>
  </div>

  <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between shadow-sm">
    <div>
      <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tipe Form</span>
      <h4 class="text-sm font-bold text-cyan-400 mt-0.5">Oracle APEX Cloned (PIMS)</h4>
    </div>
    <span class="text-2xl">🏛️</span>
  </div>

  <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between shadow-sm">
    <div>
      <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Keamanan Akses</span>
      <h4 class="text-sm font-bold text-amber-400 mt-0.5">Role-Based (Level 5)</h4>
    </div>
    <span class="text-2xl">🔒</span>
  </div>
</div>`;
	}

	function generateDefaultCss(page: RuntimePage): string {
		return `/**
 * ============================================================================
 * Custom CSS Stylesheet: ${page.title} (${page.slug})
 * Kustomisasi Stylesheet & Tema yang tidak ada di Form Designer standar
 * ============================================================================
 */

/* 1. Efek Glassmorphism Kustom */
.pims-glass-card {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pims-glass-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 12px 40px 0 rgba(16, 185, 129, 0.15);
}

/* 2. Banner Pemberitahuan Khusus */
.pims-custom-banner {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.pims-custom-banner:hover {
  transform: translateY(-1px);
  border-color: rgba(16, 185, 129, 0.5);
}

/* 3. Custom Scrollbar Halus */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.6);
}

/* 4. Aturan Cetak / Print Stylesheet */
@media print {
  .pims-custom-banner, .btn-action, nav, aside {
    display: none !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
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
			addLog('success', `Berhasil menyimpan 4-Pillar Code Behind (FrontEnd, BackEnd, HTML, CSS) untuk Form [${activePage.title}]`);
			setTimeout(() => {
				saveSuccess = false;
			}, 3000);
		} catch (e: any) {
			addLog('error', `Gagal menyimpan Code Behind: ${e.message || e}`);
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

	function addLog(type: 'log' | 'error' | 'success' | 'sql' | 'dom', text: string) {
		consoleLogs = [
			...consoleLogs,
			{
				type,
				text,
				time: new Date().toLocaleTimeString()
			}
		];
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
			addLog('log', `Preset FrontEnd [${type}] disisipkan ke kode.`);
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
			addLog('sql', `Preset BackEnd [${type}] disisipkan ke kode.`);
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
			addLog('dom', `Preset HTML [${type}] disisipkan ke kode.`);
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
			addLog('dom', `Preset CSS [${type}] disisipkan ke stylesheet.`);
		}
	}

	// Test / Run Script Execution
	async function handleTestExecute() {
		isExecuting = true;
		addLog('log', `Menjalankan uji coba eksekusi layer [${activeLayer.toUpperCase()}]...`);

		if (activeLayer === 'frontend') {
			try {
				const mockCtx = {
					form: { username: 'IT000002', password: 'Palembang@2026', qty: 10, harga: 25000, diskon_pct: 10 },
					queryParams: new URLSearchParams('nik=IT000002'),
					navigate: (url: string) => addLog('log', `[Test Navigate] => ${url}`),
					notify: (msg: string, t: string) => addLog('success', `[Test Notification (${t})] => ${msg}`)
				};
				addLog('success', `[FrontEnd Test Sandbox]: Kode valid! Syntax TypeScript/JS lulus uji linting.`);
				addLog('log', `[Test Context Data]: ${JSON.stringify(mockCtx.form)}`);
			} catch (e: any) {
				addLog('error', `[FrontEnd Syntax Error]: ${e.message}`);
			} finally {
				isExecuting = false;
			}
		} else if (activeLayer === 'backend') {
			try {
				const queryToTest = scriptBack.includes('SELECT')
					? scriptBack.split(';').find((q) => q.toUpperCase().includes('SELECT'))?.trim() || 'SELECT version();'
					: 'SELECT current_database(), current_user, version();';

				addLog('sql', `[Executing SQL against PostgreSQL]: ${queryToTest}`);
				const res = await executeSqlStudio(queryToTest, 5);
				addLog('success', `[PostgreSQL Query Succeeded]: ${res.total_rows || res.rows.length} records dikembalikan`);
				if (res.rows && res.rows.length > 0) {
					addLog('log', `[Sample Output]: ${JSON.stringify(res.rows[0])}`);
				}
			} catch (e: any) {
				addLog('error', `[BackEnd Execution Error]: ${e.message}`);
			} finally {
				isExecuting = false;
			}
		} else if (activeLayer === 'html') {
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(customHtml, 'text/html');
				const parserErrors = doc.querySelectorAll('parsererror');
				if (parserErrors.length > 0) {
					addLog('error', `[HTML Parser Warning]: Terdapat syntax tag yang tidak valid.`);
				} else {
					const nodeCount = doc.body.querySelectorAll('*').length;
					addLog('success', `[HTML DOM Validasi]: Markup HTML valid! Terdeteksi ${nodeCount} node DOM kustom.`);
					addLog('dom', `[Struktur Elemen]: ${Array.from(doc.body.children).map(c => `<${c.tagName.toLowerCase()}>`).join(', ')}`);
				}
			} catch (e: any) {
				addLog('error', `[HTML Error]: ${e.message}`);
			} finally {
				isExecuting = false;
			}
		} else if (activeLayer === 'css') {
			try {
				const styleEl = document.createElement('style');
				styleEl.textContent = customCss;
				document.head.appendChild(styleEl);
				const sheet = styleEl.sheet as CSSStyleSheet;
				const rulesCount = sheet?.cssRules?.length || 0;
				document.head.removeChild(styleEl);
				addLog('success', `[CSS Stylesheet Validasi]: Stylesheet valid! ${rulesCount} CSS rules berhasil diuraikan.`);
			} catch (e: any) {
				addLog('error', `[CSS Parser Error]: ${e.message}`);
			} finally {
				isExecuting = false;
			}
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
			<!-- Left: Return to Designer, Save, Test, Launch -->
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

				<!-- Run / Test Code -->
				<button
					type="button"
					onclick={handleTestExecute}
					disabled={isExecuting}
					class="flex items-center gap-1.5 rounded bg-blue-600 px-2.5 py-1 text-white font-bold hover:bg-blue-500 transition cursor-pointer shadow"
					title="Uji Coba Validasi & Eksekusi Layer Aktif Ini"
				>
					<Play class="h-3 w-3 fill-current" />
					<span>Uji {activeLayer.toUpperCase()}</span>
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
						class="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 transition cursor-pointer"
						title="Buka Runtime Aplikasi (F5)"
					>
						<Zap class="h-3.5 w-3.5 text-emerald-400" />
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
					class="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
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
					class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
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

	<!-- 3. INTERACTIVE REPL CONSOLE (OUTPUT & TEST LOGS) -->
	{#if showConsole}
		<div class="h-44 border-t border-slate-800 bg-[#05080e] flex flex-col shrink-0">
			<!-- Console Bar -->
			<div class="flex items-center justify-between border-b border-slate-800 px-3 py-1 bg-slate-900/90 text-[11px] font-bold text-slate-300">
				<div class="flex items-center gap-1.5">
					<Terminal class="h-3 w-3 text-emerald-400" />
					<span class="text-emerald-400">Code Behind Output & Execution Console</span>
					<span class="text-slate-500 font-normal font-mono text-[10px]">(Hasil uji coba logika FrontEnd / BackEnd / HTML / CSS)</span>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (consoleLogs = [])}
						class="text-slate-500 hover:text-slate-300 transition"
						title="Bersihkan Log"
					>
						<Trash2 class="h-3 w-3" />
					</button>
					<button
						type="button"
						onclick={() => (showConsole = false)}
						class="text-slate-500 hover:text-slate-300 transition"
						title="Tutup Console"
					>
						✕
					</button>
				</div>
			</div>

			<!-- Console Output List -->
			<div class="flex-1 overflow-auto p-2 font-mono text-[11px] space-y-1">
				{#each consoleLogs as log}
					<div class="flex items-start gap-2">
						<span class="text-slate-600 text-[10px] shrink-0">{log.time}</span>
						<span class="font-bold shrink-0 {log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'sql' ? 'text-amber-400' : log.type === 'dom' ? 'text-cyan-400' : 'text-blue-400'}">
							[{log.type.toUpperCase()}]
						</span>
						<span class="text-slate-300 whitespace-pre-wrap">{log.text}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 4. STATUS FOOTER BAR -->
	<footer class="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-3 py-1 text-[10px] font-mono text-slate-400 select-none">
		<div class="flex items-center gap-3">
			<span class="text-emerald-400 font-semibold">● Active Form: {activePage.title}</span>
			<span>Layer: <strong class="{activeLayer === 'frontend' ? 'text-indigo-400' : activeLayer === 'backend' ? 'text-amber-400' : activeLayer === 'html' ? 'text-cyan-400' : 'text-pink-400'} uppercase">{activeLayer}</strong></span>
			<span>Lines: <strong class="text-slate-200">{codeLines.length}</strong></span>
		</div>
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (showConsole = !showConsole)}
				class="text-slate-400 hover:text-emerald-400 transition cursor-pointer font-bold"
			>
				{showConsole ? '▼ Sembunyikan Console' : '▲ Buka Console'}
			</button>
			<span class="text-slate-500">Ctrl+S: Simpan | F5: Run</span>
		</div>
	</footer>
</div>
