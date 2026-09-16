import { ReactNode } from 'react';
import { BookOpenCheck, CheckCircle2, ClipboardCheck, LineChart } from 'lucide-react';
import { useBankStats } from '../client/hooks/useBankStats';

export function AuthPageLayout({ children }: { children: ReactNode }) {
  // Live bank count from the database instead of a hardcoded claim.
  const { stats: bankStats } = useBankStats();
  const pitchFeatures = [
    {
      icon: BookOpenCheck,
      text:
        bankStats?.publishedQuestionCount != null
          ? `${bankStats.publishedQuestionCount.toLocaleString()}+ published questions across ${bankStats.subjectCount} dental subjects`
          : 'A growing, dentist-reviewed question bank across every core dental subject',
    },
    { icon: CheckCircle2, text: '100% of published answers human-verified — never AI-guessed' },
    { icon: ClipboardCheck, text: 'Timed, Prometric-style mock tests' },
    { icon: LineChart, text: 'Progress analytics by subject' },
  ];
  return (
    <div className='flex min-h-screen'>
      <div className='hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-linear-to-br from-primary via-primary to-secondary p-12 text-primary-foreground overflow-hidden'>
        <div
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden='true'
        />
        <div className='relative flex items-center gap-3'>
          <img src='/licensedent-icon.svg' alt='LicenseDent' className='h-10 w-10 rounded-xl shadow-xs' />
          <span className='text-2xl font-bold'>LicenseDent</span>
        </div>
        <div className='relative max-w-md'>
          <h1 className='text-3xl font-bold leading-tight mb-4'>
            Gulf + Ireland Dental Licensing Exam Prep
          </h1>
          <p className='text-primary-foreground/80 mb-8'>
            Everything you need to walk into DHA, HAAD, MOH, SMLE and IDC Ireland licensing
            exams prepared — one question bank, subject by subject.
          </p>
          <ul className='space-y-4'>
            {pitchFeatures.map(({ icon: Icon, text }) => (
              <li key={text} className='flex items-center gap-3'>
                <Icon className='h-5 w-5 shrink-0 text-gold' aria-hidden='true' />
                <span className='text-sm text-primary-foreground/90'>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='relative' />
      </div>

      <div className='flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-12 bg-background'>
        <div className='mx-auto w-full max-w-sm'>
          <div className='mb-8 text-center lg:hidden'>
            <span className='text-xl font-bold text-primary'>LicenseDent</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
