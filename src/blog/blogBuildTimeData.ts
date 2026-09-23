import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// A `.ts` file, not `.json` -- Wasp's own internal SDK build (a separate
// tsc invocation this project doesn't control, confirmed by testing: it
// does NOT have `resolveJsonModule` enabled, unlike tsconfig.src.json which
// only affects IDE support per that file's own header comment) fails the
// whole `wasp start`/`wasp build` outright on a bare `import x from
// './foo.json'`. A plain object-literal export needs no such flag.
const SNAPSHOT_PATH = path.join(APP_ROOT, 'src/blog/publishedPostsSnapshot.generated.ts');

// Same one-line logic as file-upload/s3Utils.ts's getPublicImageUrl --
// duplicated rather than imported, deliberately: that module constructs a
// real S3Client (plus 3 AWS SDK packages) at import time, unnecessary
// weight to pull into main.wasp.ts's evaluation for one string template.
function getPublicImageUrl(key: string | null): string | null {
  if (!key) return null;
  return `https://${process.env.AWS_S3_FILES_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
}

// Wasp evaluates main.wasp.ts (and therefore this module) in a spec-loader
// context that does NOT reliably inherit `.env.server`'s DATABASE_URL the
// way the actual generated server process does (confirmed empirically:
// `new PrismaClient()` with no override connected to nothing and silently
// hit the catch block below) -- read the real value directly off disk
// instead of trusting ambient `process.env` here.
function readDatabaseUrlFromEnvServer(): string | undefined {
  try {
    const contents = readFileSync(path.join(APP_ROOT, '.env.server'), 'utf-8');
    const match = contents.match(/^DATABASE_URL=(.+)$/m);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

/**
 * Queries every published BlogPost directly via `@prisma/client` (already
 * present in node_modules, hoisted from Wasp's own generated workspace) --
 * not through this app's own getPublishedBlogPosts operation, since Wasp's
 * generated server (where that operation actually runs) doesn't exist yet
 * at the point main.wasp.ts itself is being evaluated. Used for two things
 * at `wasp start`/`wasp build` time, both PRD-007 S12:
 *
 * 1. BlogPostRoute's `prerender` array (the concrete `/blog/<slug>` paths
 *    returned here) -- @wasp.sh/spec supports prerendering specific
 *    instances of a dynamic route, not just `true`/`false`.
 * 2. A committed snapshot module (`publishedPostsSnapshot.generated.ts`)
 *    that BlogIndexPage/BlogPostPage import directly and feed to
 *    `useQuery(..., { initialData })`. This second part is the one that
 *    actually matters: marking the route `prerender` alone was NOT enough
 *    on its own -- confirmed empirically that Wasp's prerender pass
 *    freezes BlogPostPage in its *loading* state (a live `useQuery` never
 *    resolves during that synchronous pass, the same PRD-01 S2.2 finding
 *    BlogIndexPage.tsx's own header comment already documents), so the
 *    frozen HTML had zero real title/schema even with the path correctly
 *    listed. `initialData` sidesteps that entirely: react-query treats it
 *    as already-resolved data on the very first render (including during
 *    prerender, no network call needed), so the frozen HTML now contains
 *    the real post. A live browser still refetches immediately after
 *    hydration (react-query's default `staleTime: 0`), so an actual
 *    visitor always ends up seeing current data regardless -- only the
 *    frozen pre-hydration HTML a non-JS crawler sees is capped at "as of
 *    the last rebuild," which is the deliberate PRD-007 S12 tradeoff.
 *
 * Failure anywhere in here (no DATABASE_URL, DB unreachable, migrations
 * not run) must never block `wasp start`/`wasp build` outright --
 * returns no paths to prerender and leaves the snapshot file exactly as
 * it already was on disk (never overwritten with an empty snapshot just
 * because one build happened to run without DB access).
 */
export async function prepareBlogBuildTimeData(): Promise<string[]> {
  let PrismaClient: typeof import('@prisma/client').PrismaClient;
  try {
    ({ PrismaClient } = await import('@prisma/client'));
  } catch (err) {
    console.warn(
      '[main.wasp.ts] @prisma/client not available yet, skipping blog post prerendering:',
      err instanceof Error ? err.message : err
    );
    return [];
  }

  const databaseUrl = readDatabaseUrlFromEnvServer() ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[main.wasp.ts] No DATABASE_URL found (.env.server or process.env), skipping blog post prerendering.');
    return [];
  }

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const posts = await prisma.blogPost.findMany({ where: { status: 'published' } });

    const snapshot: Record<string, unknown> = {};
    for (const post of posts) {
      snapshot[post.slug] = { ...post, coverImageUrl: getPublicImageUrl(post.coverImageKey) };
    }
    const fileContents = `// Auto-generated by blogBuildTimeData.ts at wasp start/wasp build time
// (PRD-007 S12) -- do not edit by hand, it's overwritten on every build.
// One row per currently-published BlogPost, keyed by slug. See
// blogSnapshot.ts for how this gets consumed.
export const publishedPostsSnapshot = ${JSON.stringify(snapshot, null, 2)} as const;
`;
    // Only write if the content actually changed. This file lives under
    // src/blog/, inside the same tree Wasp's own top-level watcher (and
    // nodemon) watch -- an unconditional writeFileSync here re-triggers
    // "Recompiling on file change", which re-runs this function, which
    // writes again, forever (confirmed live: `wasp start` never reached
    // "Server listening", stuck re-compiling every ~18s). Skipping the
    // write when nothing published actually changed breaks that loop after
    // at most one extra cycle.
    let previousContents: string | null = null;
    try {
      previousContents = readFileSync(SNAPSHOT_PATH, 'utf-8');
    } catch {
      // First run, or file briefly missing -- fall through and write it.
    }
    if (previousContents !== fileContents) {
      writeFileSync(SNAPSHOT_PATH, fileContents, 'utf-8');
    }

    return posts.map((p) => `/blog/${p.slug}`);
  } catch (err) {
    console.warn(
      '[main.wasp.ts] Could not query published blog posts, skipping blog post prerendering:',
      err instanceof Error ? err.message : err
    );
    return [];
  } finally {
    await prisma.$disconnect();
  }
}
