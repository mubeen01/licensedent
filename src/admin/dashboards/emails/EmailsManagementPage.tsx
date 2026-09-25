import {
  Ban,
  Clock,
  Eye,
  Mail,
  MousePointerClick,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  cancelScheduledCampaign,
  createEmailCampaign,
  deleteEmailCampaign,
  getCampaignAudienceCount,
  getEmailCampaignById,
  getEmailCampaigns,
  getEmailCampaignSendLog,
  getEmailTemplateGallery,
  getExamsForAdmin,
  previewCampaignEmail,
  scheduleEmailCampaign,
  sendEmailCampaignNow,
  sendTestCampaignEmail,
  updateEmailCampaign,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { PaymentPlanId, prettyPaymentPlanName } from '../../../payment/plans';
import { cn } from '../../../lib/utils';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';
import { type CampaignSendLogRow, type EmailCampaignWithStats } from './operations';

type Tab = 'campaigns' | 'templates';

function AdminEmails({ user }: { user: AuthUser }) {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const { data: campaigns, isLoading, refetch } = useQuery(getEmailCampaigns);

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Emails' />
      <p className='-mt-4 mb-6 text-sm text-muted-foreground'>
        Newsletters and offers, sent from here to students who opted in (marketing consent is
        unticked by default). Account and study emails (verification, plan status, reminders,
        weekly digest) are automatic -- see <code>docs/21-email-system-PRD-008.md</code>.
      </p>

      <div className='mb-5 flex gap-1 rounded-xl border border-border bg-card p-1 w-fit'>
        {(
          [
            { value: 'campaigns', label: 'Campaigns' },
            { value: 'templates', label: 'Template gallery' },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
              setSelectedId(null);
            }}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
              tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'templates' && <TemplateGallery />}

      {tab === 'campaigns' && (
        <>
          {selectedId ? (
            <CampaignEditor
              campaignId={selectedId === 'new' ? null : selectedId}
              onClose={() => {
                setSelectedId(null);
                refetch();
              }}
            />
          ) : (
            <>
              <Button size='sm' className='mb-4' onClick={() => setSelectedId('new')}>
                <Plus className='h-4 w-4 mr-1.5' />
                New campaign
              </Button>
              {isLoading && <LoadingSpinner />}
              <CampaignList campaigns={campaigns} onSelect={setSelectedId} onChanged={refetch} />
            </>
          )}
        </>
      )}
    </DefaultLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*  List                                                                      */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-100 text-amber-800',
  sending: 'bg-blue-100 text-blue-800',
  sent: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-muted text-muted-foreground',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[status] ?? 'bg-muted')}>
      {status}
    </span>
  );
}

function audienceSummary(c: EmailCampaignWithStats): string {
  const parts: string[] = [];
  if (c.audienceExam) parts.push(c.audienceExam.name);
  if (c.audiencePlanType) parts.push(prettyPaymentPlanName(c.audiencePlanType as PaymentPlanId));
  if (c.audienceAccess && c.audienceAccess !== 'any') parts.push(c.audienceAccess === 'active' ? 'active plan' : 'free tier');
  if (c.audienceCountry) parts.push(c.audienceCountry);
  return parts.length > 0 ? parts.join(' · ') : 'Everyone opted in';
}

function CampaignList({
  campaigns,
  onSelect,
  onChanged,
}: {
  campaigns: EmailCampaignWithStats[] | undefined;
  onSelect: (id: string) => void;
  onChanged: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, subject: string) {
    if (!confirm(`Delete the draft "${subject}"? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteEmailCampaign({ campaignId: id });
      onChanged();
    } finally {
      setDeletingId(null);
    }
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center'>
        <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted'>
          <Mail className='h-6 w-6 text-muted-foreground' />
        </div>
        <p className='font-semibold text-foreground'>No campaigns yet</p>
        <p className='mt-1 text-sm text-muted-foreground'>Click "New campaign" to write the first one.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {campaigns.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c.id)}
          className='cursor-pointer rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col gap-3'
        >
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='truncate font-bold text-foreground'>{c.subject}</span>
                <StatusPill status={c.status} />
              </div>
              <p className='mt-0.5 text-xs text-muted-foreground'>{audienceSummary(c)}</p>
            </div>
            <div className='flex shrink-0 items-center gap-3 text-xs text-muted-foreground'>
              <span className='text-right'>
                {c.status === 'scheduled' && c.scheduledAt && <>Scheduled {new Date(c.scheduledAt).toLocaleString()}</>}
                {c.status === 'sent' && c.sentAt && <>Sent {new Date(c.sentAt).toLocaleString()}</>}
                {(c.status === 'draft' || c.status === 'canceled') && <>Created {new Date(c.createdAt).toLocaleDateString()}</>}
              </span>
              {c.status === 'draft' && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-muted-foreground hover:text-destructive'
                  disabled={deletingId === c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id, c.subject);
                  }}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              )}
            </div>
          </div>

          {(c.stats.sent > 0 || c.status === 'sending') && (
            <div className='flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground'>
              <span>
                <strong className='text-foreground'>{c.stats.sent}</strong> sent
              </span>
              <span>
                <strong className='text-foreground'>{c.stats.delivered}</strong> delivered
              </span>
              <span>
                <strong className='text-foreground'>{c.stats.opened}</strong> opened
              </span>
              <span>
                <strong className='text-foreground'>{c.stats.clicked}</strong> clicked
              </span>
              {c.stats.bounced > 0 && <span className='text-destructive'>{c.stats.bounced} bounced</span>}
              {c.stats.complained > 0 && <span className='text-destructive'>{c.stats.complained} complained</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Editor (compose / view / send)                                            */
/* -------------------------------------------------------------------------- */

const ACCESS_OPTIONS = [
  { value: 'any', label: 'Any (no access filter)' },
  { value: 'active', label: 'Currently on a paid plan' },
  { value: 'free', label: 'Free tier (never purchased)' },
] as const;

function CampaignEditor({ campaignId, onClose }: { campaignId: string | null; onClose: () => void }) {
  const { data: existing, isLoading: isLoadingExisting } = useQuery(
    getEmailCampaignById,
    campaignId ? { campaignId } : undefined,
    { enabled: !!campaignId }
  );
  const { data: exams } = useQuery(getExamsForAdmin);

  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [preheader, setPreheader] = useState(existing?.preheader ?? '');
  const [heading, setHeading] = useState(existing?.heading ?? '');
  const [bodyMarkdown, setBodyMarkdown] = useState(existing?.bodyMarkdown ?? '');
  const [audienceExamId, setAudienceExamId] = useState<string>(existing?.audienceExamId ?? 'any');
  const [audiencePlanType, setAudiencePlanType] = useState<string>(existing?.audiencePlanType ?? 'any');
  const [audienceAccess, setAudienceAccess] = useState<string>(existing?.audienceAccess ?? 'any');
  const [audienceCountry, setAudienceCountry] = useState(existing?.audienceCountry ?? '');
  const [loadedForId, setLoadedForId] = useState(campaignId);

  // Hydrate local state once the loaded campaign arrives (useQuery has no data on first render).
  if (existing && loadedForId !== existing.id) {
    setLoadedForId(existing.id);
    setSubject(existing.subject);
    setPreheader(existing.preheader);
    setHeading(existing.heading);
    setBodyMarkdown(existing.bodyMarkdown);
    setAudienceExamId(existing.audienceExamId ?? 'any');
    setAudiencePlanType(existing.audiencePlanType ?? 'any');
    setAudienceAccess(existing.audienceAccess ?? 'any');
    setAudienceCountry(existing.audienceCountry ?? '');
  }

  const audienceFilter = useMemo(
    () => ({
      audienceExamId: audienceExamId === 'any' ? null : audienceExamId,
      audiencePlanType: audiencePlanType === 'any' ? null : (audiencePlanType as PaymentPlanId),
      audienceAccess: audienceAccess === 'any' ? null : (audienceAccess as 'active' | 'free'),
      audienceCountry: audienceCountry.trim() || null,
    }),
    [audienceExamId, audiencePlanType, audienceAccess, audienceCountry]
  );
  const { data: audienceCount } = useQuery(getCampaignAudienceCount, audienceFilter);

  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [scheduledAtInput, setScheduledAtInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(campaignId);

  const isDraft = !existing || existing.status === 'draft';
  const canEdit = isDraft;

  async function handleSave() {
    if (!subject.trim() || !heading.trim() || !bodyMarkdown.trim()) {
      setError('Subject, heading and body are all required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = { subject, preheader, heading, bodyMarkdown, ...audienceFilter };
      if (savedId) {
        await updateEmailCampaign({ id: savedId, ...payload });
      } else {
        const created = await createEmailCampaign(payload);
        setSavedId(created.id);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendTest() {
    if (!savedId) {
      setError('Save the campaign first.');
      return;
    }
    if (!testEmail.trim()) return;
    setTestStatus('sending…');
    const result = await sendTestCampaignEmail({ campaignId: savedId, testEmail: testEmail.trim() });
    setTestStatus(result.status === 'sent' ? `Sent to ${testEmail}` : `Failed: ${result.error ?? 'unknown error'}`);
  }

  async function handleSendNow() {
    if (!savedId) return;
    if (!confirm(`Send "${subject}" to ${audienceCount?.count ?? '?'} people right now? This can't be undone.`)) return;
    await handleSave();
    try {
      await sendEmailCampaignNow({ campaignId: savedId });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send');
    }
  }

  async function handleSchedule() {
    if (!savedId || !scheduledAtInput) return;
    await handleSave();
    try {
      await scheduleEmailCampaign({ campaignId: savedId, scheduledAt: new Date(scheduledAtInput) });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to schedule');
    }
  }

  async function handleCancelSchedule() {
    if (!existing) return;
    await cancelScheduledCampaign({ campaignId: existing.id });
    onClose();
  }

  if (campaignId && isLoadingExisting) return <LoadingSpinner />;

  return (
    <div className='rounded-2xl border border-primary/30 bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <p className='font-semibold text-foreground'>
          {existing ? existing.subject || 'Campaign' : 'New campaign'} {existing && <StatusPill status={existing.status} />}
        </p>
        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={onClose}>
          <X className='h-4 w-4' />
        </Button>
      </div>

      <fieldset disabled={!canEdit} className={cn('flex flex-col gap-4', !canEdit && 'opacity-70')}>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <Label className='text-xs text-muted-foreground'>Subject line *</Label>
            <Input className='mt-1' value={subject} onChange={(e) => setSubject(e.currentTarget.value)} />
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>Preheader (preview text in the inbox)</Label>
            <Input className='mt-1' value={preheader} onChange={(e) => setPreheader(e.currentTarget.value)} />
          </div>
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Heading (shown at the top of the email) *</Label>
          <Input className='mt-1' value={heading} onChange={(e) => setHeading(e.currentTarget.value)} />
        </div>
        <div>
          <div className='flex items-center justify-between'>
            <Label className='text-xs text-muted-foreground'>
              Body (Markdown: paragraphs, ## heading, - list, {'>'} note, ---, [button: Label](https://...)) *
            </Label>
            <button
              type='button'
              className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className='h-3.5 w-3.5' /> Preview
            </button>
          </div>
          <Textarea
            className='mt-1 font-mono text-sm'
            rows={12}
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.currentTarget.value)}
            placeholder={'Here is what you need to know this month.\n\n## Three things to know\n- First point\n- Second point\n\n[button: Read more](https://licensedent.com/blog/...)'}
          />
        </div>

        <div className='rounded-xl border border-border bg-subtle p-4'>
          <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-foreground'>
            <Users className='h-4 w-4' /> Audience
            <span className='ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary'>
              {audienceCount?.count ?? '…'} opted-in {audienceCount?.count === 1 ? 'person' : 'people'} match
            </span>
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div>
              <Label className='text-xs text-muted-foreground'>Exam</Label>
              <Select value={audienceExamId} onValueChange={setAudienceExamId}>
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='any'>Any exam</SelectItem>
                  {exams?.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Plan</Label>
              <Select value={audiencePlanType} onValueChange={setAudiencePlanType}>
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='any'>Any plan</SelectItem>
                  {Object.values(PaymentPlanId).map((p) => (
                    <SelectItem key={p} value={p}>
                      {prettyPaymentPlanName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Access</Label>
              <Select value={audienceAccess} onValueChange={setAudienceAccess}>
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Country</Label>
              <Input
                className='mt-1'
                value={audienceCountry}
                onChange={(e) => setAudienceCountry(e.currentTarget.value)}
                placeholder='e.g. Pakistan'
              />
            </div>
          </div>
        </div>
      </fieldset>

      {error && <p className='text-xs text-destructive'>{error}</p>}

      {canEdit && (
        <div className='flex justify-end gap-2 border-t border-border pt-3'>
          <Button variant='outline' size='sm' onClick={onClose}>
            Cancel
          </Button>
          <Button size='sm' disabled={isSaving} onClick={handleSave}>
            {savedId ? 'Save changes' : 'Save draft'}
          </Button>
        </div>
      )}

      {savedId && isDraft && (
        <div className='grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2'>
          <div className='rounded-xl border border-border p-4'>
            <p className='mb-2 text-sm font-semibold text-foreground'>Send a test</p>
            <div className='flex gap-2'>
              <Input placeholder='you@example.com' value={testEmail} onChange={(e) => setTestEmail(e.currentTarget.value)} />
              <Button size='sm' variant='outline' onClick={handleSendTest}>
                Send test
              </Button>
            </div>
            {testStatus && <p className='mt-1.5 text-xs text-muted-foreground'>{testStatus}</p>}
          </div>
          <div className='rounded-xl border border-border p-4'>
            <p className='mb-2 text-sm font-semibold text-foreground'>Send to the real audience</p>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' onClick={handleSendNow}>
                <Send className='h-3.5 w-3.5 mr-1.5' />
                Send now
              </Button>
              <Input
                type='datetime-local'
                className='w-auto'
                value={scheduledAtInput}
                onChange={(e) => setScheduledAtInput(e.currentTarget.value)}
              />
              <Button size='sm' variant='outline' disabled={!scheduledAtInput} onClick={handleSchedule}>
                <Clock className='h-3.5 w-3.5 mr-1.5' />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {existing?.status === 'scheduled' && (
        <div className='flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm'>
          <span>
            Scheduled to send {existing.scheduledAt && new Date(existing.scheduledAt).toLocaleString()} to{' '}
            {audienceCount?.count ?? '…'} people.
          </span>
          <Button size='sm' variant='outline' onClick={handleCancelSchedule}>
            <Ban className='h-3.5 w-3.5 mr-1.5' />
            Cancel schedule
          </Button>
        </div>
      )}

      {existing && (existing.status === 'sending' || existing.status === 'sent') && <SendLog campaignId={existing.id} />}

      <PreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        subject={subject}
        preheader={preheader}
        heading={heading}
        bodyMarkdown={bodyMarkdown}
      />
    </div>
  );
}

function SendLog({ campaignId }: { campaignId: string }) {
  const { data: log, isLoading } = useQuery(getEmailCampaignSendLog, { campaignId });
  if (isLoading) return <LoadingSpinner />;
  if (!log || log.length === 0) return null;

  return (
    <div className='border-t border-border pt-4'>
      <p className='mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground'>
        <MousePointerClick className='h-4 w-4' /> Send log ({log.length})
      </p>
      <div className='max-h-80 overflow-y-auto rounded-xl border border-border'>
        <table className='w-full text-xs'>
          <thead className='sticky top-0 bg-subtle text-left text-muted-foreground'>
            <tr>
              <th className='px-3 py-2'>Recipient</th>
              <th className='px-3 py-2'>Status</th>
              <th className='px-3 py-2'>Delivered</th>
              <th className='px-3 py-2'>Opened</th>
              <th className='px-3 py-2'>Clicked</th>
            </tr>
          </thead>
          <tbody>
            {log.map((row: CampaignSendLogRow) => (
              <tr key={row.id} className='border-t border-border'>
                <td className='px-3 py-1.5'>{row.toEmail}</td>
                <td className='px-3 py-1.5'>
                  <span className={cn('font-medium', row.status === 'failed' && 'text-destructive')}>{row.status}</span>
                  {row.error && <span className='ml-1 text-muted-foreground'>({row.error})</span>}
                </td>
                <td className='px-3 py-1.5'>{row.deliveredAt ? '✓' : ''}</td>
                <td className='px-3 py-1.5'>{row.openedAt ? '✓' : ''}</td>
                <td className='px-3 py-1.5'>{row.clickedAt ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewDialog({
  open,
  onOpenChange,
  subject,
  preheader,
  heading,
  bodyMarkdown,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subject: string;
  preheader: string;
  heading: string;
  bodyMarkdown: string;
}) {
  const { data } = useQuery(previewCampaignEmail, { subject, preheader, heading, bodyMarkdown }, { enabled: open });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        <div className='h-[70vh] overflow-hidden rounded-xl border border-border'>
          {data ? (
            <iframe title='Email preview' srcDoc={data.html} className='h-full w-full' sandbox='' />
          ) : (
            <LoadingSpinner />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Template gallery                                                          */
/* -------------------------------------------------------------------------- */

function TemplateGallery() {
  const { data: templates, isLoading } = useQuery(getEmailTemplateGallery);
  const [previewing, setPreviewing] = useState<{ label: string; html: string } | null>(null);

  if (isLoading) return <LoadingSpinner />;

  const byCategory = new Map<string, typeof templates>();
  for (const t of templates ?? []) {
    byCategory.set(t.category, [...(byCategory.get(t.category) ?? []), t]);
  }

  return (
    <div className='flex flex-col gap-6'>
      {Array.from(byCategory.entries()).map(([category, items]) => (
        <div key={category}>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{category}</p>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {items?.map((t) => (
              <button
                key={t.id}
                onClick={() => setPreviewing({ label: t.label, html: t.html })}
                className='rounded-xl border border-border bg-card p-4 text-left shadow-xs hover:shadow-md transition-shadow'
              >
                <p className='font-semibold text-foreground'>{t.label}</p>
                <p className='mt-1 truncate text-xs text-muted-foreground'>{t.subject}</p>
                <span className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary'>
                  <Eye className='h-3.5 w-3.5' /> Preview
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!previewing} onOpenChange={(v) => !v && setPreviewing(null)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{previewing?.label}</DialogTitle>
          </DialogHeader>
          <div className='h-[70vh] overflow-hidden rounded-xl border border-border'>
            {previewing && <iframe title={previewing.label} srcDoc={previewing.html} className='h-full w-full' sandbox='' />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminEmails;
