import { useState } from 'react';
import { updateTargetExamDate } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { todayISODate } from '../greeting';

export default function ExamDateForm({
  defaultValue,
  onDone,
}: {
  defaultValue?: string | null;
  onDone?: () => void;
}) {
  const [date, setDate] = useState(defaultValue ? defaultValue.slice(0, 10) : '');
  const [isSaving, setIsSaving] = useState(false);
  const todayISO = todayISODate();
  const isPastDate = !!date && date < todayISO;

  async function handleSave() {
    if (!date || isPastDate) return;
    setIsSaving(true);
    try {
      await updateTargetExamDate({ targetExamDate: new Date(date) });
      onDone?.();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor='exam-date' className='text-sm font-medium text-foreground'>
        When is your exam?
      </label>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <input
          id='exam-date'
          type='date'
          min={todayISO}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className='h-9 flex-1 rounded-lg border border-line-strong bg-surface px-3 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        />
        <Button size='sm' disabled={!date || isPastDate || isSaving} onClick={handleSave}>
          Save date
        </Button>
        {onDone && defaultValue && (
          <Button size='sm' variant='ghost' onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
      {isPastDate ? (
        <p className='text-xs text-destructive'>Your exam date needs to be today or later.</p>
      ) : (
        <p className='text-xs text-ink-3'>Used for your countdown and daily question target.</p>
      )}
    </div>
  );
}
