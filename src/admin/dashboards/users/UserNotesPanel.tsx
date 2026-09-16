import { StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addUserNote, deleteUserNote, getUserNotes, useQuery } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { formatRelativeTime } from '../../../lib/utils';
import LoadingSpinner from '../../layout/LoadingSpinner';

export default function UserNotesPanel({ userId }: { userId: string }) {
  const { data: notes, isLoading, refetch } = useQuery(getUserNotes, { userId });
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    const body = draft.trim();
    if (!body) return;
    setIsSaving(true);
    try {
      await addUserNote({ userId, body });
      setDraft('');
      refetch();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to add note');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Delete this note?')) return;
    setDeletingId(noteId);
    try {
      await deleteUserNote({ noteId });
      refetch();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to delete note');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className='mb-3 text-sm font-semibold text-foreground'>Internal notes</p>
      <p className='mb-4 text-xs text-muted-foreground'>
        Visible to admins only — support context, escalations, anything worth flagging for the next admin.
      </p>

      <div className='mb-6 flex flex-col gap-2'>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder='Leave a note about this user…'
          maxLength={2000}
        />
        <Button size='sm' className='self-start' disabled={!draft.trim() || isSaving} onClick={handleAdd}>
          {isSaving ? 'Saving…' : 'Add note'}
        </Button>
      </div>

      {isLoading && <LoadingSpinner />}
      {!isLoading && (!notes || notes.length === 0) && (
        <p className='rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground'>
          No notes yet.
        </p>
      )}

      <div className='flex flex-col gap-2'>
        {notes?.map((note) => (
          <div key={note.id} className='flex items-start gap-3 rounded-xl border border-border bg-card p-3'>
            <span className='mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gold/10 text-gold'>
              <StickyNote className='h-3.5 w-3.5' />
            </span>
            <div className='min-w-0 flex-1'>
              <p className='whitespace-pre-wrap text-sm text-foreground'>{note.body}</p>
              <p className='mt-1 text-[11px] text-muted-foreground'>
                {note.admin.username || note.admin.email} · {formatRelativeTime(note.createdAt)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(note.id)}
              disabled={deletingId === note.id}
              className='flex h-7 w-7 flex-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40'
              aria-label='Delete note'
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
