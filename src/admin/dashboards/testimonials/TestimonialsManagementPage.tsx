import { CheckCircle2, ImagePlus, Plus, Quote, Trash2, User, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialImageUploadUrl,
  getTestimonialsForAdmin,
  updateTestimonial,
  useQuery,
} from 'wasp/client/operations';
import { type TestimonialWithImage } from './operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function TestimonialsManagementPage({ user }: { user: AuthUser }) {
  const { data: testimonials, isLoading, refetch } = useQuery(getTestimonialsForAdmin);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Testimonials' />
      <p className='-mt-4 mb-6 text-sm text-muted-foreground'>
        Only add real, name-cleared quotes from actual students — this section shows nothing on the homepage until
        at least one testimonial here is set to Published. Never invent a name or quote.
      </p>

      {!isAdding && (
        <Button variant='outline' size='sm' className='mb-4' onClick={() => setIsAdding(true)}>
          <Plus className='h-4 w-4 mr-1.5' />
          New testimonial
        </Button>
      )}
      {isAdding && (
        <TestimonialForm
          onCancel={() => setIsAdding(false)}
          onSaved={() => {
            setIsAdding(false);
            refetch();
          }}
        />
      )}

      {isLoading && <LoadingSpinner />}

      <div className='mt-4 flex flex-col gap-4'>
        {testimonials?.map((t) => (
          <TestimonialRow key={t.id} testimonial={t} onSaved={refetch} onDeleted={refetch} />
        ))}
        {testimonials?.length === 0 && !isAdding && (
          <p className='text-sm text-muted-foreground'>
            No testimonials yet — click "New testimonial" once you have a real one to add.
          </p>
        )}
      </div>
    </DefaultLayout>
  );
}

function TestimonialForm({
  testimonial,
  onCancel,
  onSaved,
}: {
  testimonial?: TestimonialWithImage;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(testimonial?.name ?? '');
  const [context, setContext] = useState(testimonial?.context ?? '');
  const [quote, setQuote] = useState(testimonial?.quote ?? '');
  const [displayOrder, setDisplayOrder] = useState(testimonial?.displayOrder ?? 0);
  const [isPublished, setIsPublished] = useState(testimonial?.isPublished ?? false);
  const [avatarImageKey, setAvatarImageKey] = useState<string | null>(testimonial?.avatarImageKey ?? null);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(testimonial?.avatarImageUrl ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!testimonial;

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
      const { s3UploadUrl, s3UploadFields, key, publicUrl } = await getTestimonialImageUploadUrl({
        fileName: file.name,
        fileType: file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      });

      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([k, v]) => formData.append(k, v));
      formData.append('file', file);
      const uploadRes = await fetch(s3UploadUrl, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      setAvatarImageKey(key);
      setAvatarImageUrl(publicUrl);
    } catch (e: any) {
      setImageError(e?.message ?? 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !context.trim() || !quote.trim()) {
      setError('Name, context and quote are all required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateTestimonial({
          id: testimonial.id,
          name,
          context,
          quote,
          displayOrder,
          isPublished,
          avatarImageKey,
        });
      } else {
        await createTestimonial({ name, context, quote, displayOrder, isPublished, avatarImageKey });
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save testimonial');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='mb-4 rounded-2xl border border-primary/30 bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4'>
      <p className='font-semibold text-foreground'>{isEditing ? 'Edit testimonial' : 'New testimonial'}</p>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Name *</Label>
          <Input className='mt-1' value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder='Real full name' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Context *</Label>
          <Input
            className='mt-1'
            value={context}
            onChange={(e) => setContext(e.currentTarget.value)}
            placeholder='e.g. DHA, passed 2026'
          />
        </div>
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>Quote *</Label>
        <Textarea className='mt-1' rows={4} value={quote} onChange={(e) => setQuote(e.currentTarget.value)} placeholder='Their actual words — never write this for them.' />
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>Photo (optional)</Label>
        <input
          ref={fileInputRef}
          type='file'
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className='hidden'
          onChange={handleImageSelected}
        />
        {avatarImageUrl ? (
          <div className='mt-1.5 flex items-center gap-3'>
            <img src={avatarImageUrl} alt='' className='h-12 w-12 rounded-full object-cover' />
            <Button
              size='sm'
              variant='outline'
              disabled={isUploadingImage}
              onClick={() => {
                setAvatarImageKey(null);
                setAvatarImageUrl(null);
              }}
            >
              <X className='h-3.5 w-3.5 mr-1.5' />
              Remove
            </Button>
          </div>
        ) : (
          <Button size='sm' variant='outline' className='mt-1.5' disabled={isUploadingImage} onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className='h-3.5 w-3.5 mr-1.5' />
            {isUploadingImage ? 'Uploading…' : 'Upload photo'}
          </Button>
        )}
        {imageError && <p className='mt-1 text-xs text-destructive'>{imageError}</p>}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Display order (lower shows first)</Label>
          <Input
            type='number'
            className='mt-1'
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.currentTarget.value) || 0)}
          />
        </div>
        <div className='flex items-center gap-2 pt-6'>
          <Switch id='testimonial-published' checked={isPublished} onCheckedChange={setIsPublished} />
          <Label htmlFor='testimonial-published' className='text-sm text-muted-foreground'>
            Published (visible on the homepage)
          </Label>
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        <div className='ml-auto flex gap-2'>
          <Button size='sm' variant='ghost' onClick={onCancel}>
            Cancel
          </Button>
          <Button size='sm' disabled={isSaving} onClick={handleSave}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create testimonial'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TestimonialRow({
  testimonial,
  onSaved,
  onDeleted,
}: {
  testimonial: TestimonialWithImage;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTestimonial({ id: testimonial.id });
      onDeleted();
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <TestimonialForm
        testimonial={testimonial}
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
          {testimonial.avatarImageUrl ? (
            <img src={testimonial.avatarImageUrl} alt='' className='h-10 w-10 flex-none rounded-full object-cover' />
          ) : (
            <span className='flex h-10 w-10 flex-none items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-secondary/10 text-primary'>
              <User className='h-5 w-5' />
            </span>
          )}
          <div>
            <p className='font-bold text-foreground'>{testimonial.name}</p>
            <p className='text-xs text-muted-foreground'>{testimonial.context}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            testimonial.isPublished ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          }`}
        >
          {testimonial.isPublished ? (
            <span className='flex items-center gap-1'>
              <CheckCircle2 className='h-3 w-3' /> Published
            </span>
          ) : (
            'Draft'
          )}
        </span>
      </div>

      <p className='flex items-start gap-2 text-sm text-muted-foreground'>
        <Quote className='mt-0.5 h-3.5 w-3.5 flex-none text-primary/40' />
        {testimonial.quote}
      </p>

      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {confirmingDelete ? (
          <div className='flex items-center gap-2 text-xs'>
            <span className='text-destructive'>Delete this testimonial permanently?</span>
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
        <Button size='sm' className='ml-auto' onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </div>
    </div>
  );
}

export default TestimonialsManagementPage;
