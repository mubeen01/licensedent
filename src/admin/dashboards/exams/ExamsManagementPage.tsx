import { CheckCircle2, GraduationCap, Plus } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import { createExam, getExamsForAdmin, updateExam, useQuery } from 'wasp/client/operations';
import { type Exam } from 'wasp/entities';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

function ExamsManagementPage({ user }: { user: AuthUser }) {
  const { data: exams, isLoading, refetch } = useQuery(getExamsForAdmin);

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Exams' />
      <p className='-mt-4 mb-6 text-sm text-muted-foreground'>
        Every exam students can practice for. Branding here (flag, country, name) drives what's shown across the
        landing page, pricing, and admin dropdowns. New exams appear everywhere automatically — the one exception is
        the per-exam marketing guide page (e.g. /exams/dha), which is hand-written and needs its own follow-up.
      </p>

      <AddExamCard onCreated={refetch} />

      {isLoading && <LoadingSpinner />}

      <div className='mt-4 flex flex-col gap-4'>
        {exams?.map((exam) => (
          <ExamRow key={exam.id} exam={exam} onSaved={refetch} />
        ))}
      </div>
    </DefaultLayout>
  );
}

function AddExamCard({ onCreated }: { onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('');
  const [authorityLabel, setAuthorityLabel] = useState('');
  const [description, setDescription] = useState('');
  const [colorGradient, setColorGradient] = useState('');
  const [standalonePackOnly, setStandalonePackOnly] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setCode('');
    setCountry('');
    setFlagEmoji('');
    setAuthorityLabel('');
    setDescription('');
    setColorGradient('');
    setStandalonePackOnly(false);
    setError(null);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createExam({
        name: name.trim(),
        code: code || null,
        country: country || null,
        flagEmoji: flagEmoji || null,
        authorityLabel: authorityLabel || null,
        description: description || null,
        colorGradient: colorGradient || null,
        isActive: true,
        standalonePackOnly,
      });
      reset();
      setIsOpen(false);
      onCreated();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create exam');
    } finally {
      setIsCreating(false);
    }
  }

  if (!isOpen) {
    return (
      <Button variant='outline' size='sm' className='mb-4' onClick={() => setIsOpen(true)}>
        <Plus className='h-4 w-4 mr-1.5' />
        Add exam
      </Button>
    );
  }

  return (
    <div className='mb-4 rounded-2xl border border-primary/30 bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4'>
      <p className='font-semibold text-foreground'>New exam</p>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div>
          <Label className='text-xs text-muted-foreground'>Name *</Label>
          <Input className='mt-1' value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder='e.g. Egypt Dental Council' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Code</Label>
          <Input className='mt-1' value={code} onChange={(e) => setCode(e.currentTarget.value)} placeholder='EDC' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Country</Label>
          <Input className='mt-1' value={country} onChange={(e) => setCountry(e.currentTarget.value)} placeholder='Cairo, Egypt' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Flag emoji</Label>
          <Input className='mt-1' value={flagEmoji} onChange={(e) => setFlagEmoji(e.currentTarget.value)} placeholder='🇪🇬' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Authority label</Label>
          <Input
            className='mt-1'
            value={authorityLabel}
            onChange={(e) => setAuthorityLabel(e.currentTarget.value)}
            placeholder='Egyptian Dental Syndicate'
          />
        </div>
      </div>
      <div>
        <Label className='text-xs text-muted-foreground'>Description</Label>
        <Input className='mt-1' value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
      </div>
      <div>
        <Label className='text-xs text-muted-foreground'>
          Card gradient (Tailwind classes, e.g. "from-amber-500 to-amber-400")
        </Label>
        <div className='mt-1 flex items-center gap-2'>
          <Input
            value={colorGradient}
            onChange={(e) => setColorGradient(e.currentTarget.value)}
            placeholder='from-primary to-secondary'
            className='flex-1'
          />
          <span
            className={`h-9 w-16 shrink-0 rounded-md bg-linear-to-r ${colorGradient || 'from-primary to-secondary'} shadow-xs`}
            title='Preview'
          />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Switch id='standalone-pack-only-new' checked={standalonePackOnly} onCheckedChange={setStandalonePackOnly} />
        <Label htmlFor='standalone-pack-only-new' className='text-sm text-muted-foreground'>
          Standalone pack only (never included in an all-exams plan)
        </Label>
      </div>
      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        <div className='ml-auto flex gap-2'>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => {
              reset();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button size='sm' disabled={isCreating} onClick={handleCreate}>
            {isCreating ? 'Creating…' : 'Create exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExamRow({ exam, onSaved }: { exam: Exam; onSaved: () => void }) {
  const [name, setName] = useState(exam.name);
  const [code, setCode] = useState(exam.code ?? '');
  const [country, setCountry] = useState(exam.country ?? '');
  const [flagEmoji, setFlagEmoji] = useState(exam.flagEmoji ?? '');
  const [authorityLabel, setAuthorityLabel] = useState(exam.authorityLabel ?? '');
  const [description, setDescription] = useState(exam.description ?? '');
  const [colorGradient, setColorGradient] = useState(exam.colorGradient ?? '');
  const [isActive, setIsActive] = useState(exam.isActive);
  const [standalonePackOnly, setStandalonePackOnly] = useState(exam.standalonePackOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const isDirty =
    name !== exam.name ||
    code !== (exam.code ?? '') ||
    country !== (exam.country ?? '') ||
    flagEmoji !== (exam.flagEmoji ?? '') ||
    authorityLabel !== (exam.authorityLabel ?? '') ||
    description !== (exam.description ?? '') ||
    colorGradient !== (exam.colorGradient ?? '') ||
    isActive !== exam.isActive ||
    standalonePackOnly !== exam.standalonePackOnly;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateExam({
        id: exam.id,
        name,
        code: code || null,
        country: country || null,
        flagEmoji: flagEmoji || null,
        authorityLabel: authorityLabel || null,
        description: description || null,
        colorGradient: colorGradient || null,
        isActive,
        standalonePackOnly,
      });
      setJustSaved(true);
      onSaved();
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow p-5 md:p-6 flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <span className='flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 text-2xl shadow-xs'>
            {flagEmoji || <GraduationCap className='h-5 w-5 text-muted-foreground' />}
          </span>
          <div>
            <p className='font-bold text-foreground'>{exam.slug}</p>
            <p className='text-xs text-muted-foreground'>{exam.id}</p>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Label htmlFor={`standalone-${exam.id}`} className='text-sm text-muted-foreground'>
              Standalone pack only
            </Label>
            <Switch
              id={`standalone-${exam.id}`}
              checked={standalonePackOnly}
              onCheckedChange={setStandalonePackOnly}
            />
          </div>
          <div className='flex items-center gap-2'>
            <Label htmlFor={`active-${exam.id}`} className='text-sm text-muted-foreground'>
              Active
            </Label>
            <Switch id={`active-${exam.id}`} checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div>
          <Label className='text-xs text-muted-foreground'>Name</Label>
          <Input className='mt-1' value={name} onChange={(e) => setName(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Code</Label>
          <Input className='mt-1' value={code} onChange={(e) => setCode(e.currentTarget.value)} placeholder='DHA' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Country</Label>
          <Input
            className='mt-1'
            value={country}
            onChange={(e) => setCountry(e.currentTarget.value)}
            placeholder='Dubai, UAE'
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Flag emoji</Label>
          <Input
            className='mt-1'
            value={flagEmoji}
            onChange={(e) => setFlagEmoji(e.currentTarget.value)}
            placeholder='🇦🇪'
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Authority label</Label>
          <Input
            className='mt-1'
            value={authorityLabel}
            onChange={(e) => setAuthorityLabel(e.currentTarget.value)}
            placeholder='Dubai Health Authority'
          />
        </div>
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>Description</Label>
        <Input className='mt-1' value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
      </div>

      <div>
        <Label className='text-xs text-muted-foreground'>
          Card gradient (Tailwind classes, e.g. "from-amber-500 to-amber-400")
        </Label>
        <div className='mt-1 flex items-center gap-2'>
          <Input
            value={colorGradient}
            onChange={(e) => setColorGradient(e.currentTarget.value)}
            placeholder='from-primary to-secondary'
            className='flex-1'
          />
          <span
            className={`h-9 w-16 shrink-0 rounded-md bg-linear-to-r ${colorGradient || 'from-primary to-secondary'} shadow-xs`}
            title='Preview'
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        {justSaved && !error && (
          <p className='flex items-center gap-1.5 text-xs font-medium text-success'>
            <CheckCircle2 className='h-3.5 w-3.5' /> Saved
          </p>
        )}
        <div className='ml-auto'>
          <Button size='sm' disabled={isSaving || !isDirty} onClick={handleSave}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExamsManagementPage;
