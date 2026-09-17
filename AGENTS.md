<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guide: Sistem Manajemen Kelas SD

## Stack & Environment
- **Framework**: Next.js 16 (App Router) + React 19 + React Compiler enabled (`next.config.ts`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` and `@import "tailwindcss";` in `app/globals.css`.
- **Language & Linter**: TypeScript 5 (`strict: true`, path alias `@/*` -> `./*`), ESLint 9 flat config (`eslint.config.mjs`).
- **Platform**: Node.js on Windows (win32).

## Developer Commands
- `npm run dev`: Start Next.js development server.
- `npm run build`: Build production bundle with type check.
- `npm run lint`: Run ESLint on project files.
- `npx tsc --noEmit`: Run standalone TypeScript type checking.

## Key Conventions & Gotchas
- **Path Alias**: Import root modules using `@/...` (e.g. `@/app/...` or `@/components/...`).
- **Next.js 16 / React 19**: Always check Next 16 conventions and avoid deprecated React/Next APIs. React Compiler is enabled (`reactCompiler: true`), so manual memoization (`useMemo`, `useCallback`) is generally unnecessary unless required for specific reference stability.
- **Tailwind v4**: Uses `@import "tailwindcss";` and `@theme inline` in `app/globals.css` rather than a `tailwind.config.js` file.
- **Verification Order**: Run `npm run lint && npx tsc --noEmit` before committing code changes.

## AI Provider & Gemini Architecture

### AI Provider
- **Primary AI Provider**: Google Gemini API via Google AI Studio Free Tier.
- **SDK**: Official Google GenAI JavaScript SDK `@google/genai`. Do not use unofficial libraries.
- **Cost & Free Tier**: Designed to run on Gemini Free Tier during development; do not require billing/paid APIs.
- **No Complex Multi-Provider**: Do not introduce OpenAI, Anthropic, or complex multi-provider abstractions early on before Gemini features are stable.

### Gemini Configuration & Security
- **API Key Env Var**: `GEMINI_API_KEY`.
- **Server-Side Only**: All Gemini calls must execute on the server. Never expose `GEMINI_API_KEY` to client components, browser bundles, Admin, or Guru.
- **Secrets Safety**: Never commit `.env.local` or hardcode API keys in source files.

### Model Configuration
- Centralize model names via environment variables or central config (e.g., in `lib/ai/`).
- Do not hardcode model strings across multiple files so Free Tier model adjustments remain single-point changes.

### AI Architecture & Server Service
- Single server-side AI entrypoint (e.g., `lib/ai/`) handling:
  - Gemini client initialization
  - Model configuration & centralized selection
  - Prompt templates
  - Structured output schemas
  - Robust error handling (handling `429`, timeouts, invalid keys, upstream errors)
  - Usage logging (excluding secrets)
- Never call Gemini API directly from React Client Components.

### Structured Output & Document Validation
- For Modul Ajar, RPP, LKPD, soal, and rubrik:
  - Utilize structured output (JSON schema) whenever supported.
  - Validate all AI outputs with Zod before persisting.
  - Reject invalid outputs and surface clear, actionable error messages to users.

### AI Document Workflow
1. User selects parameters: Jenjang/Kelas, Mata pelajaran, Topik, Tujuan pembelajaran, Durasi, and additional context.
2. Flow: **Generate → Preview → Edit → Review Guru → Simpan**.
3. AI outputs must never be published automatically as final documents without teacher review.

### Free Tier Safety & Quotas
- Prevent redundant requests and avoid polling Gemini unnecessarily.
- Optimize prompts and avoid bloated context sizes.
- Handle `429 Too Many Requests`, timeouts, invalid API keys, and service outages gracefully.
- Avoid unbounded retry loops.

### AI Usage & Privacy
- **Usage Logging**: If implemented, log `user`, `feature`, `model`, timestamp, status, token usage (if available), and errors. Never log `GEMINI_API_KEY`.
- **Privacy First**: Do not send unnecessary student personal identification to Gemini. Prioritize anonymized pedagogical context.
- **Human-in-the-loop**: Teachers hold responsibility for reviewing and finalizing all AI-assisted materials.

### Development Priority
1. Gemini connection test
2. Basic AI chat/service foundation
3. Generate Modul Ajar
4. Generate RPP
5. Generate LKPD
6. Generate Soal
7. AI refinement/editing flow
8. Usage logging
