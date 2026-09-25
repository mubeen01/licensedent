import { Check, CheckCircle2, Circle, ClipboardCopy, ExternalLink, Eye, FileText, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import {
  createBlogPost,
  deleteBlogPost,
  getBlogImageUploadUrl,
  getBlogPostsForAdmin,
  updateBlogPost,
  useQuery,
} from 'wasp/client/operations';
import { type BlogPostWithCoverImage } from './operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';
import MarkdownContent from '../../../blog/MarkdownContent';
import { estimateReadingTime } from '../../../blog/blogUtils';
import { buildBlogArticleJsonLd } from '../../../blog/blogSeo';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function slugify(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ''
  );
}

// Search-safe length guidance for the optional SEO title/description overrides --
// informational only, never blocks saving. `emptyOk` covers these fields being
// blank on purpose (falls back to title/excerpt), so 0 characters isn't flagged.
function LengthHint({ length, min, max, emptyOk }: { length: number; min: number; max: number; emptyOk?: boolean }) {
  if (length === 0 && emptyOk) {
    return <span className='text-[11px] text-muted-foreground/70'>0 — will use fallback</span>;
  }
  const inRange = length >= min && length <= max;
  return (
    <span className={cn('text-[11px]', inRange ? 'text-success' : 'text-muted-foreground')}>
      {length} / {min}–{max} chars{inRange ? '' : length < min ? ' (short)' : ' (long)'}
    </span>
  );
}

interface ReadinessCheck {
  label: string;
  ok: boolean;
}

// Informational only -- this never disables Save/Publish. This project's whole
// content model is a human deciding when a post is ready, not a score gate (see
// the plan this Phase was built from). It exists so a real gap -- no cover image,
// no internal links -- is visible before publishing, not discovered after.
function buildReadinessChecks(args: {
  excerpt: string;
  bodyMarkdown: string;
  coverImageUrl: string | null;
  tags: string[];
}): ReadinessCheck[] {
  const internalLinkCount = (args.bodyMarkdown.match(/\]\((?:\/|https:\/\/licensedent\.com)/g) ?? []).length;
  const linksToPillarOrGuide = /\]\(\/(?:blog|exams)\//.test(args.bodyMarkdown);
  return [
    { label: 'Excerpt is at least 40 characters', ok: args.excerpt.trim().length >= 40 },
    { label: 'Body has real content (150+ characters)', ok: args.bodyMarkdown.trim().length >= 150 },
    { label: 'Cover image set', ok: !!args.coverImageUrl },
    { label: 'At least 1 tag', ok: args.tags.length >= 1 },
    { label: '2+ internal links in the body', ok: internalLinkCount >= 2 },
    { label: 'Links to another blog post or an exam guide', ok: linksToPillarOrGuide },
  ];
}

function ReadinessPanel({ checks }: { checks: ReadinessCheck[] }) {
  const doneCount = checks.filter((c) => c.ok).length;
  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Readiness checklist</p>
        <span className='text-[11px] text-muted-foreground'>
          {doneCount}/{checks.length}
        </span>
      </div>
      <p className='mt-0.5 text-[11px] text-muted-foreground'>Guidance only — never blocks saving or publishing.</p>
      <ul className='mt-3 flex flex-col gap-1.5'>
        {checks.map((c) => (
          <li key={c.label} className={cn('flex items-start gap-2 text-xs', c.ok ? 'text-foreground' : 'text-muted-foreground')}>
            {c.ok ? (
              <Check className='mt-0.5 h-3.5 w-3.5 flex-none text-success' />
            ) : (
              <Circle className='mt-0.5 h-3.5 w-3.5 flex-none text-muted-foreground/50' />
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SchemaPreviewPanel({
  slug,
  title,
  excerpt,
  tags,
  coverImageUrl,
  existingPublishedAt,
  existingCreatedAt,
}: {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  coverImageUrl: string | null;
  existingPublishedAt: Date | null;
  existingCreatedAt: Date | null;
}) {
  const [copied, setCopied] = useState(false);
  const { articleJsonLd } = buildBlogArticleJsonLd({
    slug,
    title: title || '(untitled)',
    excerpt: excerpt || '(no excerpt yet)',
    tags,
    authorName: 'LicenseDent',
    coverImageUrl,
    publishedAt: existingPublishedAt,
    createdAt: existingCreatedAt ?? new Date(),
    updatedAt: new Date(),
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(articleJsonLd, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable -- silently no-op.
    }
  }

  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Schema.org preview</p>
        <button
          type='button'
          onClick={handleCopy}
          className='flex items-center gap-1 text-[11px] font-medium text-primary hover:underline'
        >
          <ClipboardCopy className='h-3 w-3' /> {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
      <p className='mt-0.5 text-[11px] text-muted-foreground'>What search engines and AI crawlers will see, updating as you type.</p>
      <dl className='mt-3 flex flex-col gap-2 text-xs'>
        <div>
          <dt className='text-muted-foreground'>Headline</dt>
          <dd className='text-foreground'>{articleJsonLd.headline}</dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>Description</dt>
          <dd className='text-foreground'>{articleJsonLd.description}</dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>Image</dt>
          <dd className='truncate text-foreground'>{coverImageUrl ? articleJsonLd.image : 'Falls back to the site default'}</dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>Publish date</dt>
          <dd className='text-foreground'>{existingPublishedAt ? articleJsonLd.datePublished : 'Set automatically at publish time'}</dd>
        </div>
      </dl>
    </div>
  );
}

function BlogManagementPage({ user }: { user: AuthUser }) {
  const { data: posts, isLoading, refetch } = useQuery(getBlogPostsForAdmin);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Blog' />
      <p className='-mt-4 mb-6 text-sm text-muted-foreground'>
        Posts published here appear on <code>/blog</code> and <code>/blog/:slug</code>, prerendered with the same
        SEO title/description/canonical and <code>Article</code> JSON-LD schema (real <code>datePublished</code>/
        <code>dateModified</code> from when a post is actually published/edited) as the exam guide pages. Nothing
        here goes live until you set status to Published.
      </p>

      {!isAdding && (
        <Button variant='outline' size='sm' className='mb-4' onClick={() => setIsAdding(true)}>
          <Plus className='h-4 w-4 mr-1.5' />
          New post
        </Button>
      )}
      {isAdding && (
        <PostForm
          onCancel={() => setIsAdding(false)}
          onSaved={() => {
            setIsAdding(false);
            refetch();
          }}
        />
      )}

      {isLoading && <LoadingSpinner />}

      <div className='mt-4 flex flex-col gap-4'>
        {posts?.map((post) => (
          <PostRow key={post.id} post={post} onSaved={refetch} onDeleted={refetch} />
        ))}
        {posts?.length === 0 && !isAdding && (
          <p className='text-sm text-muted-foreground'>No posts yet — click "New post" to write the first one.</p>
        )}
      </div>
    </DefaultLayout>
  );
}

function PostForm({
  post,
  onCancel,
  onSaved,
}: {
  post?: BlogPostWithCoverImage;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? '');
  const [bodyMarkdown, setBodyMarkdown] = useState(post?.bodyMarkdown ?? '');
  const [tagsInput, setTagsInput] = useState(post?.tags.join(', ') ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>((post?.status as 'draft' | 'published') ?? 'draft');
  const [coverImageKey, setCoverImageKey] = useState<string | null>(post?.coverImageKey ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.coverImageUrl ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!post;
  const wordCount = useMemo(() => bodyMarkdown.trim().split(/\s+/).filter(Boolean).length, [bodyMarkdown]);
  const readingTime = useMemo(() => estimateReadingTime(bodyMarkdown), [bodyMarkdown]);
  const tagsList = useMemo(
    () => tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    [tagsInput]
  );
  const readinessChecks = useMemo(
    () => buildReadinessChecks({ excerpt, bodyMarkdown, coverImageUrl, tags: tagsList }),
    [excerpt, bodyMarkdown, coverImageUrl, tagsList]
  );

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setImageError('Only JPEG, PNG or WebP images are supported.');
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);
    try {
      const { s3UploadUrl, s3UploadFields, key, publicUrl } = await getBlogImageUploadUrl({
        fileName: file.name,
        fileType: file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      });

      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([k, v]) => formData.append(k, v));
      formData.append('file', file);
      const uploadRes = await fetch(s3UploadUrl, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      setCoverImageKey(key);
      setCoverImageUrl(publicUrl);
    } catch (e: any) {
      setImageError(e?.message ?? 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave() {
    if (!title.trim() || !excerpt.trim() || !bodyMarkdown.trim()) {
      setError('Title, excerpt and body are all required.');
      return;
    }
    const tags = tagsList;

    setIsSaving(true);
    setError(null);
    try {
      const seoFields = { seoTitle: seoTitle.trim() || null, seoDescription: seoDescription.trim() || null };
      if (isEditing) {
        await updateBlogPost({ id: post.id, title, slug, excerpt, bodyMarkdown, tags, status, coverImageKey, ...seoFields });
      } else {
        await createBlogPost({
          title,
          slug: slug || slugify(title),
          excerpt,
          bodyMarkdown,
          tags,
          status,
          coverImageKey,
          ...seoFields,
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='mb-4 rounded-2xl border border-primary/30 bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4'>
      <div className='flex items-center gap-2'>
        <p className='font-semibold text-foreground'>{isEditing ? 'Edit post' : 'New post'}</p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
            status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          )}
        >
          {status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]'>
      <div className='flex flex-col gap-4'>
      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Content</p>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Title *</Label>
          <Input className='mt-1' value={title} onChange={(e) => handleTitleChange(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Slug (URL: /blog/…) *</Label>
          <Input
            className='mt-1 font-mono text-sm'
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.currentTarget.value);
            }}
          />
        </div>
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>
          Cover image (used for the /blog card, social previews, and schema.org <code>image</code>)
        </Label>
        <input
          ref={fileInputRef}
          type='file'
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className='hidden'
          onChange={handleImageSelected}
        />
        {coverImageUrl ? (
          <div className='mt-1.5 flex items-center gap-3'>
            <img src={coverImageUrl} alt='' className='h-20 w-32 rounded-lg object-cover' />
            <Button
              size='sm'
              variant='outline'
              disabled={isUploadingImage}
              onClick={() => {
                setCoverImageKey(null);
                setCoverImageUrl(null);
              }}
            >
              <X className='h-3.5 w-3.5 mr-1.5' />
              Remove
            </Button>
          </div>
        ) : (
          <Button
            size='sm'
            variant='outline'
            className='mt-1.5'
            disabled={isUploadingImage}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className='h-3.5 w-3.5 mr-1.5' />
            {isUploadingImage ? 'Uploading…' : 'Upload image'}
          </Button>
        )}
        {imageError && <p className='mt-1 text-xs text-destructive'>{imageError}</p>}
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>Excerpt (the /blog card summary — also the meta description fallback) *</Label>
        <Textarea className='mt-1' rows={2} value={excerpt} onChange={(e) => setExcerpt(e.currentTarget.value)} />
      </div>

      <div className='rounded-xl border border-border bg-muted/20 p-4'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>SEO & social (optional)</p>
        <p className='mt-0.5 text-[11px] text-muted-foreground'>
          Leave blank to use the title/excerpt above. Set these when you want a shorter, search-optimized version
          without changing the on-page heading or card summary.
        </p>
        <div className='mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <div className='flex items-baseline justify-between'>
              <Label className='text-xs text-muted-foreground'>SEO title</Label>
              <LengthHint length={seoTitle.length} min={30} max={60} emptyOk />
            </div>
            <Input className='mt-1' value={seoTitle} onChange={(e) => setSeoTitle(e.currentTarget.value)} placeholder={title || 'Falls back to Title'} />
          </div>
          <div>
            <div className='flex items-baseline justify-between'>
              <Label className='text-xs text-muted-foreground'>Meta description</Label>
              <LengthHint length={seoDescription.length} min={120} max={160} emptyOk />
            </div>
            <Input
              className='mt-1'
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.currentTarget.value)}
              placeholder={excerpt || 'Falls back to Excerpt'}
            />
          </div>
        </div>
      </div>

      <div>
        <div className='flex items-baseline justify-between'>
          <Label className='text-xs text-muted-foreground'>Body (Markdown) *</Label>
          <span className='text-[11px] text-muted-foreground'>
            {wordCount} word{wordCount === 1 ? '' : 's'} · {readingTime} min read
          </span>
        </div>
        <div className='mt-1 grid grid-cols-1 gap-3 lg:grid-cols-2'>
          <div>
            <div className='mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground'>
              <Pencil className='h-3 w-3' /> Write
            </div>
            <Textarea
              className='h-105 font-mono text-sm'
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.currentTarget.value)}
              placeholder={'## A heading\n\nRegular paragraph text, **bold**, lists, links, tables — standard Markdown.'}
            />
          </div>
          <div>
            <div className='mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground'>
              <Eye className='h-3 w-3' /> Live preview — exactly what /blog/{slug || '…'} will render
            </div>
            <div className='h-105 overflow-y-auto rounded-md border border-input bg-background px-4 py-3'>
              {bodyMarkdown.trim() ? (
                <MarkdownContent markdown={bodyMarkdown} />
              ) : (
                <p className='text-sm text-muted-foreground/70'>Start writing to see the preview…</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Publish settings</p>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Tags (comma-separated)</Label>
          <Input className='mt-1' value={tagsInput} onChange={(e) => setTagsInput(e.currentTarget.value)} placeholder='dha, exam-format, dubai' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published')}>
            <SelectTrigger className='mt-1'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='draft'>Draft (not visible on the site)</SelectItem>
              <SelectItem value='published'>Published (live on /blog)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </div>

      <div className='flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start'>
        <ReadinessPanel checks={readinessChecks} />
        <SchemaPreviewPanel
          slug={slug}
          title={title}
          excerpt={excerpt}
          tags={tagsList}
          coverImageUrl={coverImageUrl}
          existingPublishedAt={post?.publishedAt ?? null}
          existingCreatedAt={post?.createdAt ?? null}
        />
      </div>
      </div>

      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        <div className='ml-auto flex gap-2'>
          <Button size='sm' variant='ghost' onClick={onCancel}>
            Cancel
          </Button>
          <Button size='sm' disabled={isSaving} onClick={handleSave}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create post'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PostRow({
  post,
  onSaved,
  onDeleted,
}: {
  post: BlogPostWithCoverImage;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteBlogPost({ id: post.id });
      onDeleted();
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <PostForm
        post={post}
        onCancel={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false);
          onSaved();
        }}
      />
    );
  }

  return (
    <div className='rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow p-5 md:p-6 flex flex-col gap-3'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          {post.coverImageUrl ? (
            <img src={post.coverImageUrl} alt='' className='h-10 w-10 flex-none rounded-xl object-cover' />
          ) : (
            <span className='flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-secondary/10 text-primary'>
              <FileText className='h-5 w-5' />
            </span>
          )}
          <div>
            <p className='font-bold text-foreground'>{post.title}</p>
            <p className='text-xs text-muted-foreground font-mono'>/blog/{post.slug}</p>
            {post.tags.length > 0 && (
              <p className='mt-1 flex flex-wrap gap-1'>
                {post.tags.map((t) => (
                  <span key={t} className='rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
                    {t}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              post.status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}
          >
            {post.status === 'published' ? (
              <span className='flex items-center gap-1'>
                <CheckCircle2 className='h-3 w-3' /> Published
              </span>
            ) : (
              'Draft'
            )}
          </span>
        </div>
      </div>

      <p className='text-sm text-muted-foreground'>{post.excerpt}</p>

      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {confirmingDelete ? (
          <div className='flex items-center gap-2 text-xs'>
            <span className='text-destructive'>Delete this post permanently?</span>
            <Button size='sm' variant='destructive' disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Deleting…' : 'Yes, delete'}
            </Button>
            <Button size='sm' variant='ghost' onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size='sm' variant='ghost' className='text-destructive hover:text-destructive' onClick={() => setConfirmingDelete(true)}>
            <Trash2 className='h-3.5 w-3.5 mr-1.5' />
            Delete
          </Button>
        )}
        <div className='ml-auto flex gap-2'>
          {post.status === 'published' && (
            <Button size='sm' variant='outline' asChild>
              <Link to={`/blog/${post.slug}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-3.5 w-3.5 mr-1.5' />
                View live
              </Link>
            </Button>
          )}
          <Button size='sm' onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BlogManagementPage;
