# LicenseDent — Claude Code project instructions

Gulf + Ireland dental licensing exam prep platform (DHA, HAAD, MOH, SMLE,
OMSB, QCHP, KMLE, NHRA, SHA, IDC Ireland). Built with Wasp 0.25.0 + React 19
+ Prisma/Postgres. Formerly called "dental-app"/OpenSaaS internally
(leftover template naming) — rebranded to LicenseDent 2026-09-16.

**Read this whole file before doing anything else in this project.** It's
short on purpose — the real depth lives in `docs/`, linked below.

## Where the actual project is

**Active development happens in WSL2 Ubuntu, not here on native Windows,**
even if this file is being read from `D:\Dental\LicenseDent`. Wasp has no
native Windows support, and the old native-Windows / `/mnt/d` setup had a
recurring file-watcher staleness bug.

- **Active copy (WSL2)**: `~/LicenseDent/app` — this is where you actually
  work. If your session's shell is on Windows, open a WSL2 shell (or run
  `wsl.exe -e bash -lc "..."` from Windows) and `cd ~/LicenseDent/app`.
- **Windows fallback (`D:\Dental\LicenseDent\app`)**: a frozen snapshot
  still on Wasp 0.18, kept only as a pre-upgrade rollback point. **Don't
  develop against it or try to upgrade it** — it's intentionally untouched.

## Starting the dev server

```bash
# 1. Docker Desktop must already be running (Windows side — it does NOT
#    auto-start). If `docker ps` errors, launch Docker Desktop.exe first
#    and wait for it to come up.
docker start licensedent-postgres

# 2. From a WSL2 Ubuntu shell:
export PATH=$(echo $PATH | tr ':' '\n' | grep -v '^/mnt/c' | paste -sd: -)
source ~/.nvm/nvm.sh && nvm use 24.20.0
cd ~/LicenseDent/app
wasp start
```

Client on `:3100`, server on `:3101`.

**Gotcha — always strip `/mnt/c` from `$PATH` first** (the one-liner
above). WSL2 auto-appends Windows PATH entries with spaces
(`/mnt/c/Program Files/...`), and some of Wasp's internal subprocess calls
word-split on those spaces and fail with `C:/Program: No such file or
directory`. This is scoped to this shell session, not a system-wide fix.

## Framework specifics (Wasp 0.25 — don't assume older-Wasp conventions)

- **`main.wasp.ts`, not `main.wasp`.** The classic Wasp DSL was retired at
  0.24. Routes/pages/queries/actions/jobs/apis are defined with
  `route()`/`page()`/`query()`/`action()`/`job()`/`api()` constructors
  imported from `@wasp.sh/spec`, referencing actual TS functions/components
  via `import X from './src/...' with { type: 'ref' }`.
- Three-file tsconfig split: `tsconfig.json` (references-only solution
  file), `tsconfig.wasp.json` (for `main.wasp.ts`), `tsconfig.src.json`
  (for `src/**`).
- Tailwind CSS v4 (CSS-first `@theme` in `src/client/Main.css`, no
  `tailwind.config.js` anymore).
- After any `main.wasp.ts`/`package.json`/`vite.config.ts` edit, or if you
  see "Missing or stale dependencies," run `wasp install` before
  `wasp start`.

## The one rule that governs all content

**Never invent or guess medical/dental content.** A question with an
unconfirmed answer stays `flagged`, never filled in with a best guess. AI
may *draft* a suggested answer for a human to confirm; it can never write
directly to the fields a student sees, and it can never publish anything on
its own. This applies to any AI-assisted work in this repo — question
content, blog posts, anything student-facing.

## Where to look for context and status

Read `docs/` in this order depending on what you need:

- **`docs/README.md`** — the index, read this first.
- **`docs/05-status-and-gaps.md`** — live content-bank numbers, known
  placeholders/blockers. Numbers go stale; re-verify against the live DB
  (`getPublicBankStats`) before trusting them.
- **`docs/06-phase-status.md`** — the original owner's Phase 0/1/C
  execution tracker (payments, email, AI coach). Real blockers there are
  owner action items (Stripe keys, email provider), not code work.
- **`docs/07-seo-geo-blog-strategy-PRD-01.md`** — the current active
  initiative: SEO/GEO/blog content strategy, phased S0→S3. Check its
  status table before starting new SEO work — some of it is already done.
- **`docs/08-wasp-upgrade-and-rebrand-status.md`** — what changed in the
  Wasp 0.18→0.25 upgrade, Tailwind v3→v4, and the rebrand. Read this if
  something about the current stack surprises you.

If you're Claude Code specifically: this project also has persistent
cross-session memory (separate from this file) that gets loaded
automatically — check it for anything not written down here, especially
*why* past decisions were made, not just *what* the current state is.

## Working discipline for PRD-01 (and future PRDs)

Go phase-by-phase, one task/page at a time: implement, test against a
running `wasp start` (typecheck + actual HTTP/DOM check, not just "it
compiles"), commit locally, then move to the next task. Don't batch
unrelated tasks into one commit. Whenever a task changes what's `done` vs
`todo` in a PRD's status table, update that table in the same commit — the
status table is the source of truth for "what's already done, don't
redo it," so a stale one wastes the next session's time. Add a line to
this changelog for anything a future session needs to know that isn't
obvious from the diff itself (a decision made, a gotcha hit, scope
deliberately deferred).

**Session changelog** (newest first — keep entries short, link the PRD for detail):

- **2026-09-16**: PRD-01 Phase S0 finished (except S0.3, blocked on Q1 —
  real domain). Wired `SeoHead` (title/description/canonical) into the 3
  remaining candidate pages (`LegalPage.tsx`, `DemoExamPage.tsx` intro
  phase, `AllExamsPage.tsx`), completing S0.1/S0.2 at 15/15 pages. Ran
  S0.5's prerender audit: all 13 prerender candidates (landing, legal,
  demo-exam intro, pricing, 10 exam guides) are clean — every
  `window`/`document`/`Math.random()` use is confined to `useEffect` or
  click handlers, never the render body, so S1.1 (`prerender: true`) can
  be flipped on with no further code changes. See
  `docs/07-seo-geo-blog-strategy-PRD-01.md` §7 for the full evidence
  table. Next up: Phase S1 (crawlability — robots.txt, sitemap.xml,
  prerender flags, llms.txt).
