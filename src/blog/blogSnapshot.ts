import type { PublishedBlogPost } from './operations';
import { publishedPostsSnapshot as snapshotJson } from './publishedPostsSnapshot.generated';

// Written by blogBuildTimeData.ts at `wasp start`/`wasp build` time (PRD-007
// S12) -- one row per currently-published post, keyed by slug. JSON has no
// Date type, so publishedAt/createdAt/updatedAt come back as ISO strings (or
// null for publishedAt) and need converting back before this matches
// PublishedBlogPost's real shape.
type SnapshotRow = Omit<PublishedBlogPost, 'publishedAt' | 'createdAt' | 'updatedAt'> & {
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const snapshot = snapshotJson as unknown as Record<string, SnapshotRow>;

function hydrate(row: SnapshotRow): PublishedBlogPost {
  return {
    ...row,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/** Used as `useQuery`'s `initialData` so a page's build-time prerender (and
 * a browser's very first paint before hydration) has real content instead
 * of a loading state -- see blogBuildTimeData.ts for the full mechanism. */
export function getSnapshotPost(slug: string): PublishedBlogPost | undefined {
  const row = snapshot[slug];
  return row ? hydrate(row) : undefined;
}

/** Same purpose as getSnapshotPost, for the list views (BlogIndexPage, the
 * homepage's BlogPreviewSection) -- ordered newest-first to match
 * getPublishedBlogPosts' own `orderBy: { publishedAt: 'desc' }`. */
export function getSnapshotPostList(): PublishedBlogPost[] {
  return Object.values(snapshot)
    .map(hydrate)
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? 0;
      const bTime = b.publishedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}
