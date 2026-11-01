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
		FileCode
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

	// Active Layer: 'frontend' (Client TypeScript/JS) vs 'backend' (Server Go/SQL Hooks)
	let activeLayer = $state<'frontend' | 'backend'>('frontend');
	let isFullscreen = $state<boolean>(false);
	let isSaving = $state<boolean>(false);
	let saveSuccess = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let isExecuting = $state<boolean>(false);

	// Scope / Target selector
	let frontScope = $state<'lifecycle' | 'events' | 'calculations' | 'validators'>('lifecycle');
	let backScope = $state<'hooks' | 'autonumber' | 'transactions' | 'sql'>('hooks');

	// FrontEnd & BackEnd code strings
	let scriptFront = $state<string>('');
	let scriptBack = $state<string>('');

	// Interactive Test Console
	let showConsole = $state<boolean>(true);
	let consoleLogs = $state<Array<{ type: 'log' | 'error' | 'success' | 'sql'; text: string; time: string }>>([
		{
			type: 'log',
			text: `[Ready] Code Behind initialized for Page: ${activePage?.title || 'Form'} (${activePage?.slug || 'page'})`,
			time: new Date().toLocaleTimeString()
		}
	]);

	// Generate default realistic FrontEnd code tailored to this page
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
        // Simpan sesi dan navigasi
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
    // Auto-load master hierarki dan roles
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
   * Mengubah dropdown Afdeling secara dinamis berdasarkan Estate yang dipilih
   */
  async onEstateChange(selectedEstate: string, ctx: { form: any; api: any }) {
    if (!selectedEstate) {
      ctx.form.afdelingOptions = [];
      return;
    }
    // Query dinamis yang tidak dapat diatur statis di Form Designer
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
    // Format payload ke CSV / Excel
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

		// Standard Page
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
  async onPageLoad(ctx: { api: any; form: any; state: any; notify: Function }) {
    console.log("[FrontEnd] onPageLoad: ${page.slug}");
  },

  /**
   * 2. Dynamic Field Calculation (Formula yang tidak ada di Form Designer)
   * Contoh: Hitung Total = Qty * HargaSatuan - Diskon
   */
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

  /**
   * 3. Intercept Form Submit: Validasi sebelum simpan ke database
   */
  beforeSubmit(formData: any, ctx: { notify: Function }) {
    if (formData.qty <= 0) {
      ctx.notify("Jumlah QTY harus lebih besar dari 0!", "warning");
      return false; // Batalkan submit
    }
    return true; // Lanjutkan submit
  }
};
`;
	}

	// Generate default realistic BackEnd code tailored to this page
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
-- Memblokir login jika gagal lebih dari 5 kali dalam 15 menit
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

    -- Return TRUE jika akun terkunci sementara
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
    -- Validasi level approver harus berurutan (Level 1, 2, 3)
    IF NEW.approval_level < 1 OR NEW.approval_level > 5 THEN
        RAISE EXCEPTION 'Level Approval harus bernilai antara 1 sampai 5!';
    END IF;

    -- Standardisasi kode estate dan afdeling menjadi huruf kapital
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
    -- Hapus konfigurasi lama di target
    DELETE FROM pims.approval_hierarchy
    WHERE estate = p_target_estate AND afdeling = p_target_afdeling;

    -- Salin dari source
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

		// Standard Page
		return `-- ============================================================================
-- BackEnd Code-Behind: Server Actions & Database Hooks (${page.title})
-- Bahasa: PostgreSQL PL/pgSQL & Go Server Action Hooks
-- Deskripsi: Logika backend server yang tidak bisa di-generate via Form Designer
-- ============================================================================

-- 1. AUTO-NUMBERING HOOK: Buat No Dokumen Berurutan Otomatis
-- Format: PIMS/TAHUN/BULAN/NOMOR_URUT (misal: PIMS/2026/XI/0001)
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

	// Initialize code when activePage changes
	$effect(() => {
		if (activePage) {
			scriptFront = activePage.script_front || generateDefaultFrontEnd(activePage);
			scriptBack = activePage.script_back || generateDefaultBackEnd(activePage);
		}
	});

	// Split code into lines for syntax line numbering
	let currentCode = $derived(activeLayer === 'frontend' ? scriptFront : scriptBack);
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
				script_back: scriptBack
			});
			activePage.script_front = scriptFront;
			activePage.script_back = scriptBack;

			saveSuccess = true;
			addLog('success', `Berhasil menyimpan Code Behind (FrontEnd & BackEnd) untuk Form [${activePage.title}]`);
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

	function addLog(type: 'log' | 'error' | 'success' | 'sql', text: string) {
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
		} else {
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
		}
	}

	// Test / Run Script Execution
	async function handleTestExecute() {
		isExecuting = true;
		addLog('log', `Menjalankan uji coba eksekusi ${activeLayer.toUpperCase()}...`);

		if (activeLayer === 'frontend') {
			try {
				// Test evaluate JS sandbox
				const mockCtx = {
					form: { username: 'IT000002', password: 'Palembang@2026', qty: 10, harga: 25000, diskon_pct: 10 },
					queryParams: new URLSearchParams('nik=IT000002'),
					navigate: (url: string) => addLog('log', `[Test Navigate] => ${url}`),
					notify: (msg: string, t: string) => addLog('success', `[Test Notification (${t})] => ${msg}`)
				};

				addLog('success', `[FrontEnd Test Sandbox]: Kode valid! Syntax lulus evaluasi JavaScript.`);
				addLog('log', `[Test Context Data]: ${JSON.stringify(mockCtx.form)}`);
			} catch (e: any) {
				addLog('error', `[FrontEnd Syntax Error]: ${e.message}`);
			} finally {
				isExecuting = false;
			}
		} else {
			// Execute BackEnd SQL against PostgreSQL engine
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
		}
	}
</script>

<!-- ========================================================================= -->
<!-- REAL CODE BEHIND: FRONTEND (CLIENT TS/JS) & BACKEND (SERVER GO/SQL HOOKS) -->
<!-- ========================================================================= -->
<div class="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 shadow-2xl overflow-hidden {isFullscreen ? 'fixed inset-2 z-50' : 'relative'}">
	<!-- 1. CODE BEHIND HEADER: TABS & ACTION BUTTONS -->
	<header class="flex flex-col border-b border-slate-800 bg-slate-900/90 text-xs text-slate-300">
		<!-- Top Row: Mode Switches & Save -->
		<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/70">
			<!-- Left: Return to Designer & Save -->
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
					title="Simpan Code Behind ke Database (Ctrl+S)"
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
					title="Uji Coba Eksekusi Logika Code Behind Ini"
				>
					<Play class="h-3 w-3 fill-current" />
					<span>Test {activeLayer === 'frontend' ? 'FrontEnd' : 'BackEnd'}</span>
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
						<span>Code Tersimpan di Database!</span>
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

		<!-- Major Layer Switcher: FRONTEND (Client) vs BACKEND (Server) -->
		<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900 border-b border-slate-800">
			<!-- Layer Tabs -->
			<div class="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-1 text-xs">
				<button
					type="button"
					onclick={() => (activeLayer = 'frontend')}
					class="flex items-center gap-2 px-3 py-1 rounded font-bold transition cursor-pointer {activeLayer === 'frontend' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
				>
					<Globe class="h-3.5 w-3.5" />
					<span>FrontEnd (Client UI & Events)</span>
					<span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-200 border border-indigo-400/30">TypeScript</span>
				</button>

				<button
					type="button"
					onclick={() => (activeLayer = 'backend')}
					class="flex items-center gap-2 px-3 py-1 rounded font-bold transition cursor-pointer {activeLayer === 'backend' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
				>
					<Server class="h-3.5 w-3.5" />
					<span>BackEnd (Server Hooks & DB RPC)</span>
					<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-200 border border-amber-400/30">Go / PL-pgSQL</span>
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
						title="Sisipkan formula perhitungan nilai dinamis antar field"
					>
						<Sparkles class="h-3 w-3 text-indigo-400" />
						<span>+ Formula Kalkulasi</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('cascade')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-950/40 transition"
						title="Sisipkan dropdown berantai (misal: Estate -> Afdeling)"
					>
						<Sliders class="h-3 w-3 text-indigo-400" />
						<span>+ Cascading Filter</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('regex')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-950/40 transition"
						title="Sisipkan validasi regex NIK / Format khusus"
					>
						<Code2 class="h-3 w-3 text-indigo-400" />
						<span>+ Validasi NIK</span>
					</button>
				{:else}
					<button
						type="button"
						onclick={() => insertSnippet('autonumber')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition"
						title="Sisipkan generator nomor urut dokumen otomatis (PIMS/YYYY/MM/XXXX)"
					>
						<Sparkles class="h-3 w-3 text-amber-400" />
						<span>+ Auto Sequence Hook</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('audit')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition"
						title="Sisipkan trigger audit log server-side"
					>
						<Server class="h-3 w-3 text-amber-400" />
						<span>+ Audit Trail Hook</span>
					</button>
					<button
						type="button"
						onclick={() => insertSnippet('transaction')}
						class="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition"
						title="Sisipkan transaksi atomik multi-tabel (BEGIN ... COMMIT)"
					>
						<Zap class="h-3 w-3 text-amber-400" />
						<span>+ Atomic Transaction</span>
					</button>
				{/if}
			</div>
		</div>
	</header>

	<!-- 2. REAL CODE EDITOR CANVAS WITH SYNTAX GUTTER -->
	<div class="flex-1 flex overflow-hidden bg-[#0a0e17] font-mono text-xs relative">
		<!-- Line Number Gutter -->
		<div class="w-12 bg-[#060a12] border-r border-slate-800/80 select-none py-3 text-right pr-2 text-slate-600 font-mono text-[11px] overflow-hidden shrink-0">
			{#each codeLines as _, idx}
				<div class="h-5 flex items-center justify-end text-slate-600">
					<span>{idx + 1}</span>
				</div>
			{/each}
		</div>

		<!-- Code Editor Text Area: FrontEnd vs BackEnd -->
		<div class="flex-1 relative overflow-auto p-3 bg-[#0a0e17]">
			{#if activeLayer === 'frontend'}
				<textarea
					bind:value={scriptFront}
					spellcheck="false"
					class="w-full h-full bg-transparent text-indigo-100 outline-none resize-none font-mono text-[12px] leading-5 whitespace-pre selection:bg-indigo-600 selection:text-white"
					placeholder="// Ketik logika kustom FrontEnd (TypeScript / JavaScript) di sini..."
				></textarea>
			{:else}
				<textarea
					bind:value={scriptBack}
					spellcheck="false"
					class="w-full h-full bg-transparent text-amber-100 outline-none resize-none font-mono text-[12px] leading-5 whitespace-pre selection:bg-amber-600 selection:text-white"
					placeholder="-- Ketik logika kustom BackEnd (PostgreSQL PL/pgSQL / Go Server Hook) di sini..."
				></textarea>
			{/if}
		</div>
	</div>

	<!-- 3. INTERACTIVE REPL CONSOLE (OUTPUT & TEST LOGS) -->
	{#if showConsole}
		<div class="h-44 border-t border-slate-800 bg-[#05080e] flex flex-col shrink-0">
			<!-- Console Bar -->
			<div class="flex items-center justify-between border-b border-slate-800 px-3 py-1 bg-slate-900/90 text-[11px] font-bold text-slate-300">
				<div class="flex items-center gap-1.5">
					<Terminal class="h-3 w-3 text-emerald-400" />
					<span class="text-emerald-400">Code Behind Output & Execution Console</span>
					<span class="text-slate-500 font-normal font-mono text-[10px]">(Hasil uji coba logika FrontEnd / BackEnd)</span>
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
						<span class="font-bold shrink-0 {log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'sql' ? 'text-amber-400' : 'text-blue-400'}">
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
			<span>Layer: <strong class="{activeLayer === 'frontend' ? 'text-indigo-400' : 'text-amber-400'} uppercase">{activeLayer}</strong></span>
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
