import { Mail, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { inviteUser } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { Switch } from '../../../components/ui/switch';

export default function InviteUserSheet({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function reset() {
    setEmail('');
    setUsername('');
    setIsAdmin(false);
    setError(null);
    setSentTo(null);
  }

  async function handleInvite() {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await inviteUser({ email: email.trim(), username: username.trim() || null, isAdmin });
      setSentTo(email.trim());
      onInvited();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to invite user');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button
        size='sm'
        className='bg-gradient-to-r from-primary to-secondary text-white'
        onClick={() => setOpen(true)}
      >
        <UserPlus className='mr-1.5 h-4 w-4' />
        Invite user
      </Button>
      <SheetContent className='w-full sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Invite a user</SheetTitle>
          <SheetDescription>
            Creates their account right away and emails them a link to set their password.
          </SheetDescription>
        </SheetHeader>

        {sentTo ? (
          <div className='mt-8 flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-6 text-center'>
            <span className='flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success'>
              <Mail className='h-6 w-6' />
            </span>
            <div>
              <p className='text-sm font-semibold text-foreground'>Invite sent to {sentTo}</p>
              <p className='mt-1 text-xs text-muted-foreground'>
                Their account is active — they just need to set a password.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button size='sm' variant='outline' onClick={reset}>
                Invite another
              </Button>
              <Button size='sm' onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            <div>
              <Label className='text-xs text-muted-foreground'>Email *</Label>
              <Input
                className='mt-1'
                type='email'
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder='student@example.com'
              />
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Username</Label>
              <Input
                className='mt-1'
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                placeholder='Defaults to email'
              />
            </div>
            <div className='flex items-center justify-between rounded-xl border border-border p-3'>
              <div>
                <p className='text-sm font-medium text-foreground'>Grant admin access</p>
                <p className='text-xs text-muted-foreground'>They'll be able to manage this admin panel.</p>
              </div>
              <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>

            {error && <p className='text-xs text-destructive'>{error}</p>}

            <Button disabled={isSending} onClick={handleInvite} className='self-start'>
              {isSending ? 'Sending invite…' : 'Send invite'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
