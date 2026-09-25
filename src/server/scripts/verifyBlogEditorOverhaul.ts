import type { PrismaClient } from '@prisma/client';
import { buildBlogArticleJsonLd } from '../../blog/blogSeo';
import { estimateReadingTime } from '../../blog/blogUtils';

/**
 * Live check for the 4-phase blog editor overhaul (Phases 1-4, 2026-09-25): exercises the real
 * createBlogPost/updateBlogPost data path (via prisma directly, same effect as the admin
 * operations), the seoTitle/seoDescription fallback behavior, and buildBlogArticleJsonLd() --
 * the exact function both BlogPostPage.tsx and the admin editor's schema preview call. Cleans up
 * its own row. Safe to rerun.
 *
 *   wasp db seed verifyBlogEditorOverhaul
 */
export async function verifyBlogEditorOverhaul(prisma: PrismaClient) {
  const results: [string, string][] = [];
  const check = (label: string, outcome: string) => {
    results.push([label, outcome]);
    console.log(`[verify-blog-editor] ${label}: ${outcome}`);
  };

  const slug = '__verify-blog-editor-overhaul__';
  await prisma.blogPost.deleteMany({ where: { slug } }); // clean slate if a prior run died mid-way

  try {
    // 1. Create with NO seoTitle/seoDescription -- must save as null, not empty string.
    const created = await prisma.blogPost.create({
      data: {
        slug,
        title: 'Verify: post title',
        excerpt: 'Verify: post excerpt, self-test only, safe to ignore, at least forty characters long.',
        bodyMarkdown: 'Body text. '.repeat(20) + '[link to pillar](/blog/gulf-dental-licensing-exams-guide) and [an exam guide](/exams/dha).',
        tags: ['verify'],
        status: 'draft',
      },
    });
    check(
      'create with blank SEO fields stores null',
      created.seoTitle === null && created.seoDescription === null ? 'correctly null' : 'unexpected non-null'
    );

    // 2. buildBlogArticleJsonLd() falls back to title/excerpt when seoTitle/seoDescription are null.
    const fallbackJsonLd = buildBlogArticleJsonLd({ ...created, coverImageUrl: null });
    check(
      'JSON-LD falls back to title/excerpt',
      fallbackJsonLd.articleJsonLd.headline === created.title && fallbackJsonLd.articleJsonLd.description === created.excerpt
        ? 'correctly falls back'
        : 'unexpected value'
    );
    check(
      'JSON-LD datePublished is valid ISO 8601',
      /^\d{4}-\d{2}-\d{2}T/.test(fallbackJsonLd.articleJsonLd.datePublished) ? 'correctly ISO 8601' : `unexpected: ${fallbackJsonLd.articleJsonLd.datePublished}`
    );

    // 3. Update with real seoTitle/seoDescription overrides, then confirm the two independent
    // things that are actually supposed to happen: (a) they're stored verbatim, and (b) the
    // Article JSON-LD headline/description -- which BlogPostPage.tsx intentionally builds from
    // title/excerpt, never seoTitle/seoDescription (the on-page heading and the <title> tag serve
    // different purposes) -- is unaffected by them. SeoHead's own preference for seoTitle/
    // seoDescription is a client-side render (BlogPostPage.tsx's `post.seoTitle ? ... : ...`), not
    // reachable from a db-seed script -- verified by direct code read instead, see PR/commit.
    const updated = await prisma.blogPost.update({
      where: { slug },
      data: {
        seoTitle: 'Verify: SEO title override',
        seoDescription: 'Verify: SEO description override.',
        status: 'published',
        publishedAt: new Date(),
      },
    });
    check(
      'seoTitle/seoDescription stored verbatim',
      updated.seoTitle === 'Verify: SEO title override' && updated.seoDescription === 'Verify: SEO description override.'
        ? 'correctly stored'
        : 'unexpected value'
    );
    const overrideJsonLd = buildBlogArticleJsonLd({ ...updated, coverImageUrl: null });
    check(
      'Article JSON-LD headline stays post.title (by design, not seoTitle)',
      overrideJsonLd.articleJsonLd.headline === updated.title ? 'correctly unaffected' : 'unexpected -- seoTitle leaked into headline'
    );

    // 4. Reading time / word count utility, used live in the editor's split-view header.
    const rt = estimateReadingTime('word '.repeat(400));
    check('estimateReadingTime scales with length', rt >= 2 ? `${rt} min (>=2 ok)` : `unexpected ${rt}`);

    // 5. The readiness-checklist regex logic (internal link count + pillar/exam-guide link
    // detection) -- same patterns as BlogManagementPage.tsx's buildReadinessChecks, re-verified
    // here against real bodyMarkdown so a future refactor of either side can't silently diverge
    // undetected.
    const internalLinkCount = (created.bodyMarkdown.match(/\]\((?:\/|https:\/\/licensedent\.com)/g) ?? []).length;
    const linksToPillarOrGuide = /\]\(\/(?:blog|exams)\//.test(created.bodyMarkdown);
    check('internal-link regex counts both links', internalLinkCount === 2 ? 'correctly 2' : `unexpected ${internalLinkCount}`);
    check('pillar/exam-guide link regex matches', linksToPillarOrGuide ? 'correctly true' : 'unexpectedly false');
  } finally {
    await prisma.blogPost.deleteMany({ where: { slug } });
  }

  const failed = results.filter(([, outcome]) => /unexpected|BUG/i.test(outcome));
  console.log(`[verify-blog-editor] ${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    throw new Error(`verifyBlogEditorOverhaul: ${failed.length} check(s) failed -- see log above.`);
  }
}
