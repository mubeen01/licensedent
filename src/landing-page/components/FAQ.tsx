import { ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import Eyebrow from './Eyebrow';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  href?: string;
}

export default function FAQ({ faqs }: { faqs: FAQ[] }) {
  return (
    <div id='faq' className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <div className='grid gap-10 lg:grid-cols-3 lg:gap-12'>
        {/* Left · sticky intro + contact prompt */}
        <div className='lg:col-span-1 lg:sticky lg:top-24 lg:self-start'>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className='mt-4 text-title-lg font-bold tracking-tight text-foreground sm:text-title-xl'>
            Questions, answered
          </h2>
          <p className='mt-4 text-base leading-7 text-muted-foreground'>
            How LicenseDent works — from what’s in the question bank to switching exams and getting your
            answers verified.
          </p>

          <div className='mt-8 rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] to-secondary/[0.04] p-6'>
            <p className='text-sm font-semibold text-foreground'>Still have a question?</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Send us a message and we’ll help you pick the right plan before you buy.
            </p>
            <a
              href='mailto:support@licensedent.com'
              className='group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5'
            >
              Email our team <ArrowRight className='h-4 w-4' />
            </a>
          </div>
        </div>

        {/* Right · accordion */}
        <div className='lg:col-span-2'>
          <Accordion type='single' collapsible className='w-full space-y-3'>
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={`faq-${faq.id}`}
                className='rounded-2xl border border-border bg-card px-6 transition-colors duration-200 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:bg-primary/[0.04]'
              >
                <AccordionTrigger className='py-5 text-left text-base font-semibold leading-7 text-foreground transition-colors duration-200 hover:text-primary hover:no-underline data-[state=open]:text-primary'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='pb-5 text-muted-foreground'>
                  <div className='flex flex-col items-start gap-3'>
                    <p className='text-base leading-7 text-muted-foreground'>{faq.answer}</p>
                    {faq.href && (
                      <a
                        href={faq.href}
                        className='text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80'
                      >
                        Learn more →
                      </a>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}