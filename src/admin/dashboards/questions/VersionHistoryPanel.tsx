import { History } from 'lucide-react';
import { getQuestionVersions, useQuery } from 'wasp/client/operations';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion';

type Option = { key: string; text: string };

// Surfaces QuestionVersion -- a snapshot of the stem/options/answer/
// explanation taken automatically every time a published question gets
// edited (see updateReviewQuestion in operations.ts). That table has existed
// since the versioning work landed but nothing in the UI ever showed it;
// this is a plain read-only trail, newest edit first. Renders nothing at all
// when a question has no history yet, rather than an empty "no history" box
// on every single card -- most questions never get edited after publishing.
export default function VersionHistoryPanel({ questionId }: { questionId: string }) {
  const { data: versions, isLoading } = useQuery(getQuestionVersions, { questionId });

  if (isLoading || !versions || versions.length === 0) return null;

  return (
    // shrink-0: this is a direct child of QuestionReviewCard's scrollable
    // flex column, and also has overflow-hidden -- without shrink-0, the
    // flexbox spec gives it an automatic minimum size of 0, letting the
    // browser silently collapse it to nothing under content pressure even
    // though "Edit history" and its entries are genuinely in the DOM.
    <div className='shrink-0 overflow-hidden rounded-xl border border-border bg-muted/20'>
      <div className='flex items-center gap-2 border-b border-border px-4 py-3'>
        <History className='h-4 w-4 text-muted-foreground' />
        <p className='text-sm font-semibold text-foreground'>Edit history</p>
        <span className='ml-auto text-xs text-muted-foreground'>
          {versions.length} prior version{versions.length === 1 ? '' : 's'}
        </span>
      </div>
      <Accordion type='single' collapsible className='px-4'>
        {versions.map((v) => {
          const options = (v.options as unknown as Option[]) ?? [];
          return (
            <AccordionItem key={v.id} value={v.id} className='border-border/60'>
              <AccordionTrigger className='py-2.5 text-xs font-medium text-foreground hover:no-underline'>
                <span>
                  {v.editedBy?.username || v.editedBy?.email || 'Unknown admin'}{' '}
                  <span className='font-normal text-muted-foreground'>
                    · edited {new Date(v.createdAt).toLocaleString()}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className='flex flex-col gap-2 rounded-lg bg-card p-3 text-xs'>
                  <p className='font-serif text-[13px] leading-relaxed text-foreground'>{v.stem}</p>
                  <ul className='flex flex-col gap-1'>
                    {options.map((o) => (
                      <li
                        key={o.key}
                        className={
                          o.key === v.correctKey
                            ? 'font-semibold text-primary'
                            : 'text-muted-foreground'
                        }
                      >
                        <span className='font-mono'>{o.key}.</span> {o.text}
                      </li>
                    ))}
                  </ul>
                  {v.explanation && <p className='italic text-muted-foreground'>{v.explanation}</p>}
                  {!v.correctKey && <p className='text-muted-foreground'>(no answer confirmed at this point)</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
