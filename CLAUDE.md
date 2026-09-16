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

**Gotcha — if you're driving this from outside an interactive WSL shell**
(e.g. `wsl.exe -e bash -lc "wasp start &"` from a Windows-side tool/script),
plain `nohup ... &` is unreliable here — it has repeatedly died silently a
few seconds after the invoking command returns, leaving orphaned `nodemon`
processes and no server actually listening (confirmed 2026-09-16). Use a
detached **tmux** session instead, which survives independently:

```bash
tmux kill-server 2>/dev/null   # clear any dead/stale session first
tmux new-session -d -s licensedent ~/start-dev.sh
```

`~/start-dev.sh` (create once) is just the block above as a script:

```bash
#!/bin/bash
export PATH=$(echo $PATH | tr ':' '\n' | grep -v '^/mnt/c' | paste -sd: -)
source ~/.nvm/nvm.sh && nvm use 24.20.0
cd ~/LicenseDent/app
wasp start
```

Check status with `tmux capture-pane -t licensedent -p | tail -40` or
`curl http://localhost:3100/`. WSL2 auto-forwards `localhost` ports to
Windows, so a Windows browser can hit `http://localhost:3100/` directly
once the tmux session is confirmed up — no port-forward setup needed.

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
- **`docs/09-work-changelog.md`** — dated, cited log of every work
  session across all initiatives (not just PRD-01). Read this to see what
  actually happened recently and why, with commit-hash citations in both
  repos. **Update it every session** — see "Working discipline" below.

If you're Claude Code specifically: this project also has persistent
cross-session memory (separate from this file) that gets loaded
automatically — check it for anything not written down here, especially
*why* past decisions were made, not just *what* the current state is.

## Working discipline (applies to PRD-01 and every future initiative)

This is a hard rule, not a suggestion — treat documentation as a
deliverable of the work, not an afterthought:

1. Go phase-by-phase, one task/page at a time.
2. Implement, then test against a running `wasp start` — typecheck *and*
   an actual HTTP/DOM check, not just "it compiles."
3. Commit locally (don't batch unrelated tasks into one commit).
4. **Update docs in the same commit as the code**, every time, no
   exceptions:
   - The relevant PRD/status doc's own task table (`done`/`todo` +
     verification evidence) — it's the source of truth for "what's
     already done, don't redo it."
   - `docs/09-work-changelog.md` — add a dated entry (what changed, why,
     evidence, citations — use the template at the bottom of that file).
     This is the project's PM-style running log; it must never fall
     behind the code. If you did something worth remembering, it isn't
     done until it's in that file.
5. Only then move to the next task.

A stale doc costs the next session real time re-deriving what's already
known — treat an undocumented change as an unfinished one.
