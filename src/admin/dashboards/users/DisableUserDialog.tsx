import { ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

export default function DisableUserDialog({
  open,
  onOpenChange,
  userLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLabel: string;
  onConfirm: (reason: string | undefined) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim() || undefined);
      setReason('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <span className='flex h-9 w-9 flex-none items-center justify-center rounded-full bg-destructive/10 text-destructive'>
              <ShieldOff className='h-4.5 w-4.5' />
            </span>
            <DialogTitle>Disable {userLabel}?</DialogTitle>
          </div>
          <DialogDescription>
            They'll be signed out immediately and won't be able to log back in until re-enabled. Optionally leave a
            reason for the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label className='text-xs text-muted-foreground'>Reason (optional)</Label>
          <Textarea
            className='mt-1'
            placeholder='e.g. Chargeback, abuse report, requested by user…'
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            maxLength={500}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Disabling…' : 'Disable account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
