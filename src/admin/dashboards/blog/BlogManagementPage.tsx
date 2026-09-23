import { CheckCircle2, ExternalLink, FileText, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostsForAdmin,
  updateBlogPost,
  useQuery,
} from 'wasp/client/operations';
import { type BlogPost } from 'wasp/entities';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

function slugify(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || ''
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
  post?: BlogPost;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [bodyMarkdown, setBodyMarkdown] = useState(post?.bodyMarkdown ?? '');
  const [tagsInput, setTagsInput] = useState(post?.tags.join(', ') ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>((post?.status as 'draft' | 'published') ?? 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!post;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave() {
    if (!title.trim() || !excerpt.trim() || !bodyMarkdown.trim()) {
      setError('Title, excerpt and body are all required.');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateBlogPost({ id: post.id, title, slug, excerpt, bodyMarkdown, tags, status });
      } else {
        await createBlogPost({ title, slug: slug || slugify(title), excerpt, bodyMarkdown, tags, status });
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
      <p className='font-semibold text-foreground'>{isEditing ? 'Edit post' : 'New post'}</p>

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
        <Label className='text-xs text-muted-foreground'>Excerpt (used for meta description + card preview) *</Label>
        <Textarea className='mt-1' rows={2} value={excerpt} onChange={(e) => setExcerpt(e.currentTarget.value)} />
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>Body (Markdown) *</Label>
        <Textarea
          className='mt-1 font-mono text-sm'
          rows={16}
          value={bodyMarkdown}
          onChange={(e) => setBodyMarkdown(e.currentTarget.value)}
          placeholder={'## A heading\n\nRegular paragraph text, **bold**, lists, links — standard Markdown.'}
        />
      </div>

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
  post: BlogPost;
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
          <span className='flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-secondary/10 text-primary'>
            <FileText className='h-5 w-5' />
          </span>
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
