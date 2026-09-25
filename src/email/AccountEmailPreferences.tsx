import { useEffect, useState } from 'react';
import { getMyEmailPreferences, updateMyEmailPreferences, useQuery } from 'wasp/client/operations';
import { Switch } from '../components/ui/switch';
import type { EmailPreferencesView } from './operations';

// Account page section: same two switches as the public /email/preferences page.
export default function AccountEmailPreferences() {
  const { data } = useQuery(getMyEmailPreferences);
  const [prefs, setPrefs] = useState<EmailPreferencesView | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  async function toggle(field: 'marketingOptIn' | 'studyEmails', value: boolean) {
    if (!prefs) return;
    const before = prefs;
    setPrefs({ ...prefs, [field]: value });
    try {
      setPrefs(await updateMyEmailPreferences({ [field]: value }));
      setStatus('Saved');
    } catch {
      setPrefs(before);
      setStatus('Could not save');
    }
  }

  const rows = [
    {
      field: 'studyEmails' as const,
      title: 'Study emails',
      body: 'Welcome tips, reminders when you have been away, plan-ending notices and a weekly progress summary.',
    },
    {
      field: 'marketingOptIn' as const,
      title: 'News and offers',
      body: 'Exam news, new features and occasional offers. A few emails a month at most.',
    },
  ];

  return (
    <section className='panel p-5 sm:p-6' aria-labelledby='email-prefs-heading'>
      <div className='mb-4 flex items-baseline justify-between gap-3'>
        <h2 id='email-prefs-heading' className='text-sm font-semibold text-foreground'>
          Emails
        </h2>
        {status && (
          <span role='status' className='text-[12px] text-ink-3'>
            {status}
          </span>
        )}
      </div>
      {!prefs ? (
        <div className='space-y-3'>
          <div className='h-14 animate-pulse rounded-lg bg-surface-2' />
          <div className='h-14 animate-pulse rounded-lg bg-surface-2' />
        </div>
      ) : (
        <ul className='divide-y divide-line rounded-lg border border-line'>
          {rows.map((r) => (
            <li key={r.field} className='flex items-start justify-between gap-4 px-4 py-3.5'>
              <label htmlFor={`acct-${r.field}`} className='min-w-0 cursor-pointer'>
                <span className='block text-sm font-medium text-foreground'>{r.title}</span>
                <span className='mt-0.5 block text-[13px] leading-5 text-ink-3'>{r.body}</span>
              </label>
              <Switch id={`acct-${r.field}`} checked={prefs[r.field]} onCheckedChange={(v) => toggle(r.field, v)} className='mt-0.5 shrink-0' />
            </li>
          ))}
          <li className='px-4 py-3.5'>
            <p className='text-sm font-medium text-foreground'>Account emails</p>
            <p className='mt-0.5 text-[13px] leading-5 text-ink-3'>Password resets, payment confirmations and access changes. Always sent.</p>
          </li>
        </ul>
      )}
      {prefs?.suppressed && (
        <p className='mt-3 text-[13px] leading-5 text-ink-3'>
          Emails are paused because a recent email to {prefs.email} bounced or was marked as spam. Contact support to turn them back on.
        </p>
      )}
    </section>
  );
}
