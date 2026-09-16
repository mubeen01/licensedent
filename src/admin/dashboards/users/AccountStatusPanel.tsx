import { ShieldAlert, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { toggleUserDisabled } from 'wasp/client/operations';
import { Switch } from '../../../components/ui/switch';
import { cn } from '../../../lib/utils';
import DisableUserDialog from './DisableUserDialog';

export default function AccountStatusPanel({
  userId,
  userLabel,
  isDisabled,
  onChanged,
}: {
  userId: string;
  userLabel: string;
  isDisabled: boolean;
  onChanged?: () => void;
}) {
  const { data: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === userId;

  const [isTogglingDisabled, setIsTogglingDisabled] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function enable() {
    setIsTogglingDisabled(true);
    try {
      await toggleUserDisabled({ id: userId, isDisabled: false });
      onChanged?.();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to update account status');
    } finally {
      setIsTogglingDisabled(false);
    }
  }

  async function disable(reason: string | undefined) {
    try {
      await toggleUserDisabled({ id: userId, isDisabled: true, reason });
      onChanged?.();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to update account status');
      throw e;
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-2xl border p-4',
          isDisabled ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
        )}
      >
        <div className='flex items-center gap-3'>
          {isDisabled ? (
            <ShieldOff className='h-5 w-5 flex-none text-destructive' />
          ) : (
            <ShieldAlert className='h-5 w-5 flex-none text-muted-foreground' />
          )}
          <div>
            <p className='text-sm font-semibold text-foreground'>{isDisabled ? 'Account disabled' : 'Account active'}</p>
            <p className='text-xs text-muted-foreground'>
              {isDisabled ? "This user can't log in until re-enabled." : 'Can log in and use the platform.'}
            </p>
          </div>
        </div>
        <Switch
          checked={!isDisabled}
          disabled={isCurrentUser || isTogglingDisabled}
          onCheckedChange={(checked) => (checked ? enable() : setConfirmOpen(true))}
        />
      </div>
      {isCurrentUser && <p className='mt-2 text-xs text-muted-foreground'>You can't disable your own account.</p>}

      <DisableUserDialog open={confirmOpen} onOpenChange={setConfirmOpen} userLabel={userLabel} onConfirm={disable} />
    </>
  );
}
