# nchat Migration Inventory — P102 Baseline Snapshot

**Generated:** 2026-05-14 (S20 audit, pre-P102 migration)  
**Last verified:** 2026-05-14 (P102 Wave 6 S20-T01..T04 — extended route listing, CI/CD count confirmed, V08 flags verified from source)  
**Current stack:** Electron 33.2.0 desktop + Next.js 15.5.15 web (React 19.0.0) + Capacitor 6.2.0 mobile  
**Node.js requirement:** `>=20` (per `.node-version` in `frontend/`)  
**Target stack (P102):** Tauri 2 desktop + React + Vite + shadcn/ui + @nself/* shared packages  
**App Router route count:** 35 segments (30 page routes + 5 root files)  
**Electron main process files:** 7 (`frontend/platforms/desktop/src/main/`)  
**IPC methods:** 20 (contextBridge DesktopAPI)  
**CI/CD workflows:** 46 total (`.github/workflows/`)  
**Dispositions:** keep | migrate | discard | replace  

**⚠ Clean Root violations:** `frontend/QA-REPORT.md` and `frontend/RESTRUCTURE-SUMMARY.md` — move to `.github/wiki/qa/` in S21. See §Clean Root Violations below.

---

## Electron Main Process (`frontend/platforms/desktop/src/main/`)

| File | Disposition | Notes |
|------|------------|-------|
| `index.ts` | **migrate** | Deep link (`nchat://`), single-instance lock, init sequence → port to Tauri 2 plugin equivalents |
| `window-manager.ts` | **migrate** | BrowserWindow config (contextIsolation:true, sandbox:true, nodeIntegration:false, webSecurity:true) → reference model for Tauri 2 window config; PreferencesWindow missing explicit `sandbox:true` — fix in S21 |
| `ipc-handlers.ts` | **migrate** | 18 IPC handlers → map to Tauri 2 commands; `screen:get-sources` (desktopCapturer) needs Tauri 2 screen-capture plugin |
| `auto-updater.ts` | **replace** | electron-updater ^6.3.9 → `tauri-plugin-updater` (P102 SIEGE V07-F01/F02 fix); add Ed25519 signature verification |
| `menu.ts` | **migrate** | Native application menu → Tauri 2 menu API |
| `tray.ts` | **migrate** | System tray → Tauri 2 tray API |
| `shortcuts.ts` | **migrate** | Global shortcuts → Tauri 2 global-shortcut plugin |

### IPC Surface (preload/index.ts — contextBridge DesktopAPI)

| Method | Disposition | Tauri 2 equivalent |
|--------|------------|-------------------|
| `app.getVersion()` | migrate | `@tauri-apps/api/app` getVersion() |
| `app.getName()` | migrate | `@tauri-apps/api/app` getName() |
| `app.getPath(name)` | migrate | `@tauri-apps/api/path` |
| `window.minimize()` | migrate | `@tauri-apps/api/window` currentWindow().minimize() |
| `window.maximize()` | migrate | currentWindow().maximize() |
| `window.close()` | migrate | currentWindow().close() |
| `window.isMaximized()` | migrate | currentWindow().isMaximized() |
| `shell.openExternal(url)` | migrate | `@tauri-apps/plugin-shell` open() |
| `shell.showItemInFolder(path)` | migrate | `@tauri-apps/plugin-shell` open() with path |
| `update.check()` | replace | `tauri-plugin-updater` check() |
| `update.onProgress(cb)` | replace | tauri-plugin-updater event listener |
| `notification.show(opts)` | migrate | `@tauri-apps/plugin-notification` |
| `platform.get()` | migrate | `@tauri-apps/api/os` platform() |
| `screen.getSources()` | migrate | Tauri 2 screen-capture plugin (TBD — plugin not yet confirmed) |
| `clipboard.readText()` | migrate | `@tauri-apps/plugin-clipboard-manager` |
| `clipboard.writeText(t)` | migrate | clipboard-manager write |
| `clipboard.readImage()` | migrate | clipboard-manager readImageBase64() |
| `clipboard.writeImage(d)` | migrate | clipboard-manager writeImageBase64() |
| `clipboard.hasImage()` | migrate | clipboard-manager hasImage() |
| `drag.startFile(path)` | migrate | Tauri 2 drag-and-drop emit (startDragging) |

---

## Desktop Renderer (`frontend/platforms/desktop/`)

| Item | Disposition | Notes |
|------|------------|-------|
| `package.json` (@nself-chat/desktop v0.9.2) | **migrate** | Electron ^33.2.0, electron-builder ^25.1.8, electron-updater ^6.3.9 → all Electron deps replaced by Tauri 2; Vite + React retained |
| `src/renderer/` (Vite app) | **keep** | Desktop renderer is already Vite-based — major migration advantage; NOT Next.js |
| `vite.config.ts` (desktop) | **migrate** | Adjust for Tauri 2 Vite plugin (`@tauri-apps/vite-plugin`) |
| Workspace deps: @nself-chat/core, api, state, ui, config | **keep** | Shared package architecture survives migration |

---

## Next.js 15 Frontend (`frontend/`)

### Configuration

| File | Disposition | Notes |
|------|------------|-------|
| `next.config.js` | **discard** | Next.js config → replace with Vite config; security headers (CSP, HSTS, COEP, COOP, CORP) must be ported to Vite middleware / Tauri 2 web context |
| `tsconfig.json` | **migrate** | Strict TypeScript config survives; adjust paths for Vite |
| `tailwind.config.ts` | **keep** | Tailwind config compatible with Vite |
| `postcss.config.js` | **keep** | No changes needed |

### App Router Routes (`frontend/src/app/`)

All 35 App Router route segments migrate to React Router v6 (SPA). Disposition: **migrate** for page routes; **replace** for api/ routes.

| Route segment | Disposition | Notes |
|---------------|------------|-------|
| `(app)/` | migrate | Root layout group → React Router layout |
| `(auth)/` | migrate | Auth group → React Router auth layout |
| `(authenticated)/` | migrate | Protected group → React Router guard |
| `(setup)/` | migrate | Setup wizard group → React Router guard |
| `activity/` | migrate | Activity feed page |
| `admin/` | migrate | Admin panel pages |
| `api/` | **replace** | Next.js API routes → direct nSelf backend calls via `@nself/api-client` |
| `api-docs/` | migrate | API docs viewer |
| `apps/` | migrate | Connected apps page |
| `auth/` | migrate | Auth landing |
| `billing/` | migrate | Billing pages → nself plugin HTTP endpoints |
| `calls/` | migrate | Call management pages |
| `channels/` | migrate | Channel listing + detail (`[id]`) |
| `chat/` | migrate | Chat room pages |
| `demo/` | migrate | Demo pages |
| `dev/` | migrate | Dev tools pages |
| `dm/` | migrate | Direct messages |
| `drafts/` | migrate | Drafts page |
| `graphql-playground/` | migrate | Dev-only GraphQL explorer |
| `invite/` | migrate | Invite flow |
| `login/` | migrate | Login page |
| `meetings/` | migrate | Meetings list + scheduling |
| `offline/` | migrate | Offline fallback page |
| `onboarding/` | migrate | Onboarding wizard |
| `people/` | migrate | People directory |
| `profile/` | migrate | User profile |
| `saved/` | migrate | Saved messages |
| `search-demo/` | migrate | Search demo |
| `settings/` | migrate | Settings pages (nested) |
| `setup/` | migrate | Initial setup wizard |
| `signup/` | migrate | Registration flow |
| `streams/` | migrate | Live streams |
| `test-env/` | migrate | Test environment page (dev only) |
| `wallet/` | migrate | Wallet / credits page |
| `error.tsx` + `loading.tsx` + `not-found.tsx` + `layout.tsx` + `page.tsx` | migrate | Root layout + error boundaries → React Router equivalents |

### Components (`frontend/src/components/`)

| Component group | Disposition | Notes |
|----------------|------------|-------|
| `chat/message-content.tsx` | **keep** | Uses DOMPurify — safe; retain sanitization pattern |
| `chat/CodeBlock.tsx` | **keep** | highlight.js — confirm sanitization in S21 |
| `bot/bot-message.tsx` | **migrate** | `dangerouslySetInnerHTML` WITHOUT DOMPurify — V08-F04 fix required in S21 |
| `users/UserBio.tsx` | **migrate** | `dangerouslySetInnerHTML` WITHOUT DOMPurify — V08-F04 fix required in S21 |
| `search/SearchResults.tsx` | **migrate** | `dangerouslySetInnerHTML` — audit source in S21 |
| `presence/TypingIndicator.tsx` | **migrate** | `dangerouslySetInnerHTML` — audit source in S21 |
| `dev/code-block.tsx` | **migrate** | `dangerouslySetInnerHTML` — audit source in S21 |
| `white-label/Step6EmailTemplates.tsx` | **migrate** | V08-F03: `sandbox="allow-same-origin"` at line 255 — fix in S21 |
| shadcn/ui components | **keep** | Already using shadcn/ui + Radix — zero migration cost |
| TipTap editor components | **keep** | TipTap 2.11 is Vite-compatible |
| LiveKit room components | **keep** | livekit-client ^2.17.3 is framework-agnostic |
| Apollo Client hooks | **keep** | Apollo 3.14 + React 19 compatible with Vite |
| Zustand stores | **keep** | Zustand 5 framework-agnostic |

---

## Dependencies (`frontend/package.json`)

| Package | Current | Disposition | Migration action |
|---------|---------|------------|-----------------|
| `next ^15.5.15` | 15.5.15 | **discard** | Replace with Vite + @vitejs/plugin-react |
| `react ^19.0.0` | 19.0.0 | **keep** | No change |
| `marked ^17.0.4` | 17.0.4 | **keep with fix** | V08-F04: ensure all call sites use DOMPurify post-parse |
| `livekit-client ^2.17.3` | 2.17.3 | **keep** | Framework-agnostic |
| `@apollo/client ^3.14.x` | 3.14.x | **keep** | Compatible |
| `@tiptap/* ^2.11.x` | 2.11.x | **keep** | Vite-compatible |
| `zustand ^5.x` | 5.x | **keep** | Framework-agnostic |
| `dompurify ^3.x` | 3.x | **keep + extend** | Extend usage to all unmarked `dangerouslySetInnerHTML` sites |
| `@capacitor/core ^6.2.0` | 6.2.0 | **discard** | Replaced by Tauri 2 mobile (S22+) |
| shadcn/ui + radix-ui | current | **keep** | No change needed |

---

## Brand Assets (`frontend/public/`)

| File | Disposition | Notes |
|------|------------|-------|
| `icon.png` (34KB, 512×512) | **keep** | Primary app icon — update to ɳ-branded version per P102 convergence |
| `icon.svg` | **keep** | SVG master |
| `logo.svg` | **keep** | Logo variant |
| `android-chrome-192x192.png` | **keep** | PWA icon |
| `android-chrome-512x512.png` | **keep** | PWA icon |
| `apple-touch-icon.png` | **keep** | iOS PWA |
| `favicon-16x16.png` | **keep** | Favicon |
| `favicon-32x32.png` | **keep** | Favicon |
| `favicon-48x48.png` | **keep** | Favicon |
| `favicon.ico` | **keep** | Favicon |
| `manifest.json` | **migrate** | Update theme_color + icons for Tauri 2 web context |
| `sw.js` | **migrate** | Service worker — retain PWA offline support in Vite build |

---

## Mobile — Store Listings

| File | Disposition | Notes |
|------|------------|-------|
| `platforms/mobile/app-store/metadata.json` | **keep** | bundleId: `com.nself.chat`; category: SOCIAL_NETWORKING; contentRating: 4+ — no changes needed for P102 inventory phase |
| `platforms/mobile/play-store/metadata.json` | **keep** | packageName: `com.nself.chat`; category: SOCIAL — no changes needed |

**Note:** Both platforms use `com.nself.chat` — preserve through Tauri 2 mobile migration (S22).

---

## CI/CD Workflows (`.github/workflows/`)

46 workflows total. Disposition by category:

**Discard (4) — replaced by Tauri 2 migration:**
| Workflow | Notes |
|----------|-------|
| `build-electron.yml` | Replaced by Tauri 2 desktop build in S22 |
| `build-capacitor.yml` | Replaced by Tauri 2 mobile in S22 |
| `build-tauri.yml` | Premature scaffold — existed before migration; recreate clean in S22 |
| `build-react-native.yml` | nchat never used React Native; stray from template |

**Migrate (9) — update for Vite / Tauri 2:**
| Workflow | Notes |
|----------|-------|
| `build-web.yml` | Update to Vite build in S23 |
| `build-desktop.yml` | Update for Tauri 2 build in S22 |
| `desktop-build.yml` | Update for Tauri 2 in S22 |
| `desktop-release.yml` | Update release artifacts for Tauri 2 in S22 |
| `android-build.yml` | Update for Tauri 2 mobile in S22 |
| `ios-build.yml` | Update for Tauri 2 mobile in S22 |
| `deploy-mobile-android.yml` | Update artifact paths in S22 |
| `deploy-mobile-ios.yml` | Update artifact paths in S22 |
| `release.yml` | Update for Tauri 2 artifacts in S22 |

**Keep (33) — no framework-level changes required:**
| Workflow | Notes |
|----------|-------|
| `ci.yml` | Update Jest → Vitest commands in S24 |
| `cd.yml` | Update artifact paths for Tauri 2 in S22 |
| `test.yml` | Update for Vitest in S24 |
| `e2e-tests.yml` | Playwright compatible with Vite |
| `security-scan.yml` | Add V08-F03/F04 SIEGE regression checks in S21 |
| `clean-root.yml` | No changes needed |
| `nself-first-check.yml` | No changes needed |
| `accessibility.yml` | No changes needed |
| `codeql.yml` | No changes needed |
| `coverage.yml` | Update for Vitest coverage in S24 |
| `dependabot-review.yml` | No changes needed |
| `dependency-review.yml` | No changes needed |
| `deploy-docker.yml` | No changes needed |
| `deploy-k8s.yml` | No changes needed |
| `deploy-netlify.yml` | No changes needed |
| `deploy-production.yml` | No changes needed |
| `deploy-staging.yml` | No changes needed |
| `deploy-vercel.yml` | No changes needed |
| `doc-sync.yml` | No changes needed |
| `docker-build.yml` | No changes needed |
| `docs-wiki.yml` | No changes needed |
| `gitleaks.yml` | No changes needed |
| `hadolint.yml` | No changes needed |
| `lighthouse-ci.yml` | Verify Vite build compat in S23 |
| `multi-arch-check.yml` | No changes needed |
| `placeholder-gate.yml` | No changes needed |
| `pr-checks.yml` | No changes needed |
| `quarterly-doc-audit.yml` | No changes needed |
| `sbom.yml` | No changes needed |
| `validate-secrets.yml` | No changes needed |
| `visual-regression.yml` | Update for Vite in S23 |
| `wiki-sync.yml` | No changes needed |
| `clean-working-tree.yml` | No changes needed |

---

## Clean Root Violations

| File | Disposition | Action |
|------|------------|--------|
| `frontend/QA-REPORT.md` | **discard from root** | Move to `frontend/.github/wiki/qa/QA-REPORT.md` in S21 cleanup |
| `frontend/RESTRUCTURE-SUMMARY.md` | **discard from root** | Move to `frontend/.github/wiki/qa/RESTRUCTURE-SUMMARY.md` in S21 cleanup |

---

## Security Flags for S21

### V08-F03 — CRITICAL: IFrame Sandbox allow-same-origin Combo
- **File:** `frontend/src/components/white-label/Step6EmailTemplates.tsx`
- **Line:** 255
- **Issue:** `sandbox="allow-same-origin"` without explicit script denial. If any JavaScript executes inside the iframe, this attribute re-enables same-origin access (cookies, localStorage, sessionStorage).
- **Fix:** Change to `sandbox=""` (deny all) or `sandbox="allow-scripts"` (never combine with `allow-same-origin`).

### V08-F04 — HIGH: Markdown→DOM XSS via marked + dangerouslySetInnerHTML
- **Dependency:** `marked ^17.0.4` (frontend/package.json)
- **Unsafe sites (no DOMPurify):**
  - `src/components/bot/bot-message.tsx` — `{ __html: formattedText }`
  - `src/components/users/UserBio.tsx` — `{ __html: parsedBio }`
  - `src/components/search/SearchResults.tsx` — source TBD
  - `src/components/presence/TypingIndicator.tsx` — source TBD
  - `src/components/dev/code-block.tsx` — source TBD
- **Safe sites (DOMPurify present):**
  - `src/components/chat/message-content.tsx` — uses DOMPurify ✓
  - `src/components/chat/CodeBlock.tsx` — highlight.js output (confirm in S21)
- **Changelog/release-notes component:** `marked(` call not pinpointed — S21 must `grep -r "marked\." src --include="*.tsx"` and audit all found files
- **Fix:** Wrap all `marked.parse()` output in `DOMPurify.sanitize()` before passing to `dangerouslySetInnerHTML`.

---

## Migration Friction Assessment

| Area | Friction | Reason |
|------|---------|--------|
| Desktop renderer → Tauri 2 | **LOW** | Already Vite-based (localhost:5174); not Next.js |
| IPC layer → Tauri 2 commands | **MEDIUM** | 18 methods to port; screen-capture needs plugin research |
| Auto-updater → tauri-plugin-updater | **HIGH** | Requires Ed25519 key generation + signature infrastructure (SIEGE V07-F01/F02) |
| Next.js App Router → React Router / Vite | **MEDIUM** | 30+ routes; API routes need separate handling |
| Capacitor → Tauri 2 mobile | **HIGH** | Full build pipeline replacement; store listings preserved |
| Brand assets | **LOW** | PNG/SVG set complete; minor manifest updates only |
| shadcn/ui components | **NONE** | Already in use; zero migration cost |
| DOMPurify gap fixes | **LOW** | Pattern established in message-content.tsx; extend to 5 unsafe sites |
