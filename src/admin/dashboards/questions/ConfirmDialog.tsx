import { AlertTriangle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
};

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

// Promise-based replacement for window.confirm() -- same call-site shape
// (`if (!(await confirm({...}))) return;`) but themed to match the rest of
// the app instead of an unstyleable browser dialog. Each component that
// needs confirmation mounts its own instance via this hook; there's no
// shared global state to wire up.
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  const ConfirmDialog = (
    <Dialog open={!!pending} onOpenChange={(open) => !open && settle(false)}>
      {/* data-confirm-dialog, not just role="dialog" -- the Review Mode
          modal in QuestionsReviewPage.tsx is ALSO a Radix Dialog (role=
          "dialog"), so useReviewShortcuts needs a way to tell "a blocking
          confirm popup is open on top" apart from "the review modal itself
          is open" -- the latter must NOT disable J/K/A/X, that's the whole
          point of it. */}
      <DialogContent className='max-w-md' data-confirm-dialog>
        {pending && (
          <>
            <DialogHeader>
              <div className='flex items-center gap-2.5'>
                {pending.variant === 'destructive' && (
                  <span className='flex h-9 w-9 flex-none items-center justify-center rounded-full bg-destructive/10 text-destructive'>
                    <AlertTriangle className='h-4.5 w-4.5' />
                  </span>
                )}
                <DialogTitle>{pending.title}</DialogTitle>
              </div>
              <DialogDescription className='pt-1.5 text-[13px] leading-relaxed'>
                {pending.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => settle(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={pending.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
