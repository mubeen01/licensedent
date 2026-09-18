import toast from 'react-hot-toast';

// A single dismissible toast with an inline Undo action, shared by the
// single-question card actions and the bulk-action toolbar on the review
// queue -- kept short-lived (8s) so the option to undo is never left
// dangling long after the underlying data may have moved on from under it.
export function showUndoToast(message: string, onUndo: () => void | Promise<void>) {
  toast.custom(
    (t) => (
      <div
        className={
          'flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm shadow-lg transition-opacity ' +
          (t.visible ? 'opacity-100' : 'opacity-0')
        }
      >
        <span className='text-foreground'>{message}</span>
        <button
          type='button'
          className='shrink-0 text-xs font-semibold text-primary hover:underline'
          onClick={() => {
            toast.dismiss(t.id);
            void onUndo();
          }}
        >
          Undo
        </button>
      </div>
    ),
    { duration: 8000 }
  );
}
