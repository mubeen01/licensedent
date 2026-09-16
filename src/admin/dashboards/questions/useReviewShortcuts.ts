import { useEffect, useRef } from 'react';

type ShortcutHandlers = {
  onNext?: () => void;
  onPrev?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSave?: () => void;
  onFocusSearch?: () => void;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  // Also true anywhere inside an open ConfirmDialog (marked with
  // data-confirm-dialog, not just role="dialog" -- the Review Mode modal is
  // ALSO a role="dialog" and must NOT be caught by this, since disabling
  // shortcuts for its entire content would defeat the point of it). Without
  // this, pressing "a" to confirm a destructive popup with focus on its own
  // buttons would also fire Approve on the question underneath it.
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    !!el.closest('[data-confirm-dialog]')
  );
}

// Keyboard-driven review: J/K (or arrows) to move through the queue, A to
// approve, X to reject, Cmd/Ctrl+S to save -- so working through a long
// queue doesn't require reaching for the mouse between every question.
// Ref-backed so the window listener is attached once per mount instead of
// re-bound on every render; callers can pass fresh closures each render.
// Every bare-letter shortcut is disabled while focus is inside a text
// field/select -- only Cmd/Ctrl+S (a deliberate modifier combo no one types
// by accident) works everywhere, including mid-edit in the explanation box.
export function useReviewShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        h.onSave?.();
        return;
      }
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          h.onNext?.();
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          h.onPrev?.();
          break;
        case 'a':
          h.onApprove?.();
          break;
        case 'x':
        case 'r':
          h.onReject?.();
          break;
        case '/':
          e.preventDefault();
          h.onFocusSearch?.();
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
