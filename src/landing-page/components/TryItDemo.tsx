import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import SectionTitle from './SectionTitle';

export interface DemoQuestion {
  subject: string;
  stem: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

export default function TryItDemo({ questions }: { questions: DemoQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isAnswered = selectedKey !== null;
  const isCorrect = selectedKey === question.correctKey;

  const handleNext = () => {
    setSelectedKey(null);
    setIndex((prev) => (prev + 1) % questions.length);
  };

  const handleRetry = () => setSelectedKey(null);

  return (
    <div className='mx-auto max-w-4xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Try it yourself'
        title='Answer a real question before you sign up'
        description='No account needed — pick an option and see how explanations work.'
      />

      {/* Progress dots */}
      <div className='mb-6 flex justify-center gap-2'>
        {questions.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === index ? 'w-8 bg-primary' : 'w-1.5 bg-muted'
            )}
          />
        ))}
      </div>

      <div className='overflow-hidden rounded-2xl border border-border bg-card shadow-md'>
        <div className='flex items-center justify-between border-b border-border bg-muted/60 px-6 py-3'>
          <span className='rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'>
            {question.subject}
          </span>
          <span className='text-xs text-muted-foreground'>
            Sample question {index + 1} of {questions.length}
          </span>
        </div>

        <div className='p-6 sm:p-8'>
          <p className='text-base font-medium leading-7 text-foreground'>{question.stem}</p>

          <div className='mt-6 space-y-2.5'>
            {question.options.map((opt) => {
              const isSelected = opt.key === selectedKey;
              const isTheCorrectOne = opt.key === question.correctKey;
              const showCorrect = isAnswered && isTheCorrectOne;
              const showWrong = isAnswered && isSelected && !isTheCorrectOne;

              return (
                <button
                  key={opt.key}
                  disabled={isAnswered}
                  onClick={() => setSelectedKey(opt.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-200',
                    !isAnswered && 'border-border hover:border-primary/40 hover:bg-primary/5',
                    showCorrect && 'border-secondary/50 bg-secondary/10',
                    showWrong && 'border-destructive/50 bg-destructive/10',
                    isAnswered && !isSelected && !isTheCorrectOne && 'border-border opacity-60'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold',
                      showCorrect ? 'bg-secondary text-secondary-foreground' : showWrong ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className='flex-1 text-foreground'>{opt.text}</span>
                  {showCorrect && <CheckCircle2 className='h-4 w-4 flex-none text-secondary' />}
                  {showWrong && <XCircle className='h-4 w-4 flex-none text-destructive' />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className='mt-5 space-y-4'>
              <div
                className={cn(
                  'rounded-lg px-4 py-3 text-sm font-semibold',
                  isCorrect ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'
                )}
              >
                {isCorrect ? 'Correct!' : 'Not quite.'}
              </div>
              <div className='rounded-lg bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground'>
                <span className='font-semibold text-foreground'>Explanation: </span>
                {question.explanation}
              </div>

              <div className='flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between'>
                <button
                  onClick={handleRetry}
                  className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                >
                  <RotateCcw className='h-3.5 w-3.5' /> Try again
                </button>

                {isLast ? (
                  <Button asChild>
                    <WaspRouterLink to={routes.DemoExamRoute.to}>
                      Take the full 20-question demo exam <ArrowRight className='ml-1 h-4 w-4' />
                    </WaspRouterLink>
                  </Button>
                ) : (
                  <Button onClick={handleNext} variant='outline'>
                    Next question <ArrowRight className='ml-1 h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
