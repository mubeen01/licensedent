import { CheckCircle2, Clock, Mail, MessageCircleMore, ShieldCheck, Sparkles } from 'lucide-react';
import { type CSSProperties, type FormEvent, useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { createContactFormMessage } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import SeoHead from '../client/components/SeoHead';
import Eyebrow from '../landing-page/components/Eyebrow';
import Reveal from '../landing-page/components/Reveal';
import SectionTitle from '../landing-page/components/SectionTitle';

/**
 * Public /contact page. Visually built from the same pieces as the landing
 * page (Eyebrow, Reveal, SectionTitle, card-elevated) so it reads as one
 * product rather than a bolted-on support form.
 *
 * `createContactFormMessage` (see admin/dashboards/messages/operations.ts)
 * writes to ContactFormMessage, which requires a real `userId` -- it 401s
 * for a signed-out caller. Rather than fake a submission that would
 * silently fail for the majority of visitors who land here signed out, a
 * logged-in visitor's message goes straight into that inbox (identical
 * path to the "Contact support" card on /account), and a signed-out
 * visitor's message opens a prefilled mailto: to support@licensedent.com --
 * still a real, working send, just through their own mail client instead
 * of our database.
 */

const dotGridStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(#000000 1.8px, transparent 1.8px)',
  backgroundSize: '22px 22px',
  opacity: 0.06,
};

const subjectOptions = [
  { value: 'account', label: 'Account or billing' },
  { value: 'content', label: 'A question I think is wrong' },
  { value: 'exam', label: 'Which plan / exam is right for me' },
  { value: 'partnership', label: 'Partnership or press' },
  { value: 'other', label: 'Something else' },
];

const infoCards = [
  {
    icon: Mail,
    title: 'Email us directly',
    description: 'support@licensedent.com — the fastest way to reach a real person.',
    action: { label: 'support@licensedent.com', href: 'mailto:support@licensedent.com' },
  },
  {
    icon: MessageCircleMore,
    title: 'Already have an account?',
    description: 'Send a message from your dashboard and it lands straight in our support inbox, tracked to your account.',
    action: { label: 'Go to your account', to: routes.AccountRoute.to },
  },
  {
    icon: ShieldCheck,
    title: 'Found a wrong answer?',
    description: 'Tell us the exam, subject and question — corrections go through the same review process as new content.',
    action: { label: 'View plans', to: routes.PricingPageRoute.to },
  },
];

const nextSteps = [
  { title: 'We read it', description: 'Every message is read by a real person on the team — no auto-replies, no ticket bot.' },
  { title: 'The right person follows up', description: 'Account questions, content corrections and general questions each get routed to whoever can actually answer.' },
  { title: 'You hear back by email', description: 'Replies go to the account or address you wrote in from.' },
];

export default function ContactPage() {
  const { data: currentUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(subjectOptions[0].value);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<'submitted' | 'mailto' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const subjectLabel = subjectOptions.find((o) => o.value === subject)?.label ?? 'General';
    const lines = [`Subject: ${subjectLabel}`];
    if (name.trim()) lines.push(`From: ${name.trim()}`);
    if (!currentUser && email.trim()) lines.push(`Reply to: ${email.trim()}`);
    const composed = `${lines.join('\n')}\n\n${message.trim()}`;

    setIsSending(true);
    setError(null);

    if (currentUser) {
      try {
        await createContactFormMessage({ content: composed });
        setSent('submitted');
        setName('');
        setEmail('');
        setMessage('');
      } catch (err: any) {
        setError(err?.message ?? 'Failed to send your message — please try again.');
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Signed out: no ContactFormMessage row can be written, so hand the
    // same composed message to the visitor's own mail client instead.
    const mailBody = email.trim() ? `${composed}\n\nReply to: ${email.trim()}` : composed;
    const mailto = `mailto:support@licensedent.com?subject=${encodeURIComponent(
      `LicenseDent contact — ${subjectLabel}`
    )}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = mailto;
    setSent('mailto');
    setIsSending(false);
  }

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='Contact LicenseDent'
        description='Questions about your account, a plan, or a question you think we got wrong? Reach the LicenseDent team directly.'
        path='/contact'
      />

      <main className='isolate'>
        {/* Hero */}
        <section className='relative overflow-hidden border-b border-border/60'>
          <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden='true'>
            <div style={dotGridStyle} />
          </div>
          <div className='mx-auto max-w-3xl px-6 py-20 text-center sm:py-28'>
            <Reveal className='flex justify-center'>
              <Eyebrow>Contact us</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className='mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl'>
                Talk to a real person, <span className='text-primary'>not a bot</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className='mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
                Questions about your account, a plan, or something in a question you think we got wrong —
                write in below. We read every message.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Info cards */}
        <div className='mx-auto max-w-7xl px-6 py-16 lg:px-8'>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-3'>
            {infoCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Reveal key={card.title} delay={idx * 80} className='h-full'>
                  <div className='card-elevated card-elevated-hover flex h-full flex-col p-6'>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                      <Icon className='h-5 w-5' strokeWidth={1.75} />
                    </div>
                    <h3 className='mt-4 text-base font-semibold text-foreground'>{card.title}</h3>
                    <p className='mt-2 flex-1 text-sm leading-6 text-muted-foreground'>{card.description}</p>
                    {'href' in card.action ? (
                      <a
                        href={card.action.href}
                        className='mt-4 text-sm font-semibold text-primary hover:underline underline-offset-2'
                      >
                        {card.action.label} →
                      </a>
                    ) : (
                      <WaspRouterLink
                        to={card.action.to}
                        className='mt-4 text-sm font-semibold text-primary hover:underline underline-offset-2'
                      >
                        {card.action.label} →
                      </WaspRouterLink>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Form + what happens next */}
        <div className='border-y border-border/60 bg-muted/30'>
          <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
            <SectionTitle
              eyebrow='Send a message'
              title="We'll get back to you"
              description={
                currentUser
                  ? "Your message goes straight to our support inbox, tracked to your account."
                  : "Signed out? Submitting opens a prefilled email to support@licensedent.com from your own mail app — nothing is sent without you hitting send there."
              }
            />

            <div className='grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10'>
              {/* Form */}
              <Reveal className='lg:col-span-3'>
                <div className='card-elevated p-6 sm:p-8'>
                  {sent ? (
                    <div className='flex flex-col items-center gap-3 py-10 text-center'>
                      <span className='flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success'>
                        <CheckCircle2 className='h-6 w-6' />
                      </span>
                      <h3 className='text-lg font-semibold text-foreground'>
                        {sent === 'submitted' ? 'Message sent' : 'Opening your email app…'}
                      </h3>
                      <p className='max-w-sm text-sm text-muted-foreground'>
                        {sent === 'submitted'
                          ? "Thanks — our team will get back to you by email."
                          : "If nothing opened, email us directly at support@licensedent.com."}
                      </p>
                      <Button variant='outline' size='sm' onClick={() => setSent(null)}>
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
                      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                        <div>
                          <Label htmlFor='contact-name'>Name</Label>
                          <Input
                            id='contact-name'
                            className='mt-1.5'
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                            placeholder='Your name'
                            autoComplete='name'
                          />
                        </div>
                        <div>
                          <Label htmlFor='contact-email'>Email {!currentUser && <span className='text-muted-foreground font-normal'>(so we can reply)</span>}</Label>
                          <Input
                            id='contact-email'
                            type='email'
                            className='mt-1.5'
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                            placeholder='you@example.com'
                            autoComplete='email'
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor='contact-subject'>What's this about?</Label>
                        <Select value={subject} onValueChange={setSubject}>
                          <SelectTrigger id='contact-subject' className='mt-1.5 w-full'>
                            <SelectValue placeholder='Select a topic' />
                          </SelectTrigger>
                          <SelectContent>
                            {subjectOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor='contact-message'>Message</Label>
                        <Textarea
                          id='contact-message'
                          className='mt-1.5'
                          rows={6}
                          value={message}
                          onChange={(e) => setMessage(e.currentTarget.value)}
                          placeholder="Tell us what's going on — the more detail, the faster we can help."
                          required
                        />
                      </div>

                      {error && <p className='text-sm text-destructive'>{error}</p>}

                      <Button type='submit' size='lg' disabled={isSending || !message.trim()} className='self-start'>
                        {isSending ? 'Sending…' : currentUser ? 'Send message' : 'Send via email'}
                      </Button>
                    </form>
                  )}
                </div>
              </Reveal>

              {/* What happens next */}
              <Reveal delay={100} className='lg:col-span-2'>
                <div className='card-elevated flex h-full flex-col p-6 sm:p-8'>
                  <div className='flex items-center gap-2'>
                    <Sparkles className='h-4 w-4 text-primary' />
                    <h3 className='text-sm font-semibold uppercase tracking-widest text-primary'>What happens next</h3>
                  </div>
                  <ol className='mt-6 space-y-6'>
                    {nextSteps.map((step, idx) => (
                      <li key={step.title} className='flex gap-4'>
                        <span className='flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                          {idx + 1}
                        </span>
                        <div>
                          <p className='text-sm font-semibold text-foreground'>{step.title}</p>
                          <p className='mt-1 text-sm leading-6 text-muted-foreground'>{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className='mt-auto flex items-center gap-2 border-t border-border pt-6 mt-6 text-xs text-muted-foreground'>
                    <Clock className='h-3.5 w-3.5' />
                    We're a small team — replies come from a person, not a queue number.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Closing links */}
        <div className='mx-auto max-w-3xl px-6 py-16 text-center'>
          <p className='text-sm text-muted-foreground'>
            Curious about LicenseDent before writing in?{' '}
            <WaspRouterLink to={routes.AboutRoute.to} className='font-semibold text-primary hover:underline'>
              Read about us
            </WaspRouterLink>{' '}
            or{' '}
            <WaspRouterLink to={routes.PricingPageRoute.to} className='font-semibold text-primary hover:underline'>
              see plans & pricing
            </WaspRouterLink>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
