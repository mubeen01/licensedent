import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getEmailPreferencesByToken, updateEmailPreferencesByToken, useQuery } from 'wasp/client/operations';
import { CheckCircle2 } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import SeoHead from '../client/components/SeoHead';
import type { EmailPreferencesView } from './operations';

// Public page behind the "Email preferences" / "Unsubscribe" links in every
// email. Works without logging in (the token in the link identifies the
// preferences). "?unsubscribe=marketing|lifecycle" turns that stream off on
// arrival and says so, which is what people expect from an unsubscribe link.
export default function EmailPreferencesPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const unsubscribe = params.get('unsubscribe');
  const { data, isLoading, error } = useQuery(getEmailPreferencesByToken, { token }, { enabled: token.length >= 20, retry: false });
  const [prefs, setPrefs] = useState<EmailPreferencesView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const didUnsubscribe = useRef(false);

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  useEffect(() => {
    if (!data || didUnsubscribe.current || !unsubscribe) return;
    didUnsubscribe.current = true;
    const field = unsubscribe === 'lifecycle' ? 'studyEmails' : 'marketingOptIn';
    if (!data[field]) {
      setNotice(field === 'studyEmails' ? "Study emails are already off." : "You're already unsubscribed from news and offers.");
      return;
    }
    updateEmailPreferencesByToken({ token, [field]: false }).then((next) => {
      setPrefs(next);
      setNotice(field === 'studyEmails' ? "Done. You won't get study emails anymore." : "Done. You won't get news and offers anymore.");
    });
  }, [data, unsubscribe, token]);

  async function toggle(field: 'marketingOptIn' | 'studyEmails', value: boolean) {
    if (!prefs) return;
    setPrefs({ ...prefs, [field]: value });
    setSaving(true);
    try {
      setPrefs(await updateEmailPreferencesByToken({ token, [field]: value }));
      setNotice('Saved.');
    } catch {
      setPrefs(prefs);
      setNotice('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='flex justify-center bg-background px-4 py-10 sm:py-16'>
      <SeoHead title='Email preferences — LicenseDent' description='Choose which emails LicenseDent sends you.' path='/email/preferences' noindex />
      <div className='w-full max-w-md'>
        <div className='panel p-6 sm:p-7'>
          <h1 className='text-xl font-semibold tracking-tight text-foreground'>Email preferences</h1>

          {!token || error ? (
            <p className='mt-3 text-sm leading-6 text-ink-2'>
              This link is not valid anymore. Log in and open <strong className='font-medium text-foreground'>Account</strong> to manage your
              emails, or write to <a className='text-brand-11 underline underline-offset-4' href='mailto:help@licensedent.com'>help@licensedent.com</a>.
            </p>
          ) : isLoading || !prefs ? (
            <div className='mt-4 space-y-3'>
              <div className='h-4 w-2/3 animate-pulse rounded bg-surface-2' />
              <div className='h-16 animate-pulse rounded-lg bg-surface-2' />
              <div className='h-16 animate-pulse rounded-lg bg-surface-2' />
            </div>
          ) : (
            <>
              <p className='mt-1 text-sm text-ink-3'>For {prefs.email}</p>

              {notice && (
                <p role='status' className='mt-5 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-foreground'>
                  <CheckCircle2 className='h-4 w-4 shrink-0 text-success' aria-hidden='true' />
                  {notice}
                </p>
              )}

              <ul className='mt-5 divide-y divide-line rounded-lg border border-line'>
                <PrefRow
                  id='study'
                  title='Study emails'
                  body='Welcome tips, reminders when you have been away, plan-ending notices and your weekly progress summary.'
                  checked={prefs.studyEmails}
                  disabled={saving}
                  onChange={(v) => toggle('studyEmails', v)}
                />
                <PrefRow
                  id='marketing'
                  title='News and offers'
                  body='Exam news, new features and occasional offers. A few emails a month at most.'
                  checked={prefs.marketingOptIn}
                  disabled={saving}
                  onChange={(v) => toggle('marketingOptIn', v)}
                />
                <li className='px-4 py-3.5'>
                  <p className='text-sm font-medium text-foreground'>Account emails</p>
                  <p className='mt-0.5 text-[13px] leading-5 text-ink-3'>
                    Password resets, payment confirmations and changes to your access. These are always sent, because they are about your account.
                  </p>
                </li>
              </ul>

              {prefs.suppressed && (
                <p className='mt-4 text-[13px] leading-5 text-ink-3'>
                  Emails to this address are paused because a recent email bounced or was marked as spam. Write to help@licensedent.com to turn them back on.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  id,
  title,
  body,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  body: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className='flex items-start justify-between gap-4 px-4 py-3.5'>
      <label htmlFor={`pref-${id}`} className='min-w-0 cursor-pointer'>
        <span className='block text-sm font-medium text-foreground'>{title}</span>
        <span className='mt-0.5 block text-[13px] leading-5 text-ink-3'>{body}</span>
      </label>
      <Switch id={`pref-${id}`} checked={checked} disabled={disabled} onCheckedChange={onChange} className='mt-0.5 shrink-0' />
    </li>
  );
}
