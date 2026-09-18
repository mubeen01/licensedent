import { useEffect, useRef } from 'react';

type ShortcutHandlers = {
  onNext?: () => void;
  onPrev?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSave?: () => void;
  onFocusSearch?: () => void;
  onSetDifficulty?: (level: 'easy' | 'medium' | 'hard') => void;
  onToggleHighYield?: () => void;
  onToggleCaseBased?: () => void;
};

function isInsideConfirmDialog(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && !!el.closest('[data-confirm-dialog]');
}

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
    isInsideConfirmDialog(el) ||
    // Radix Select/DropdownMenu portal their open content to document.body as
    // plain divs (role="listbox"/"menu"), never INPUT/SELECT tags -- without
    // this, opening e.g. the Subject dropdown and typing "a" to type-ahead to
    // "Anatomy" also fires the global Approve shortcut on the question behind
    // it, and arrow keys meant for the dropdown move the list selection too.
    !!el.closest('[role="listbox"],[role="menu"],[data-radix-popper-content-wrapper]')
  );
}

// Keyboard-driven review: J/K (or arrows) to move through the queue, A to
// approve, X to reject, Cmd/Ctrl+S to save, 1/2/3 to tag difficulty
// easy/medium/hard, H/C to toggle High-Yield/Case-Based -- so working through
// a long queue (including tagging) doesn't require reaching for the mouse
// between every question.
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
        // Deliberately not gated by the full isTypingTarget() (Save must work
        // mid-edit in a text field), but it must still respect a ConfirmDialog
        // -- otherwise Cmd/Ctrl+S while a destructive confirm popup is open
        // would save the card underneath it instead of doing nothing.
        if (isInsideConfirmDialog(e.target)) return;
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
        case '1':
          h.onSetDifficulty?.('easy');
          break;
        case '2':
          h.onSetDifficulty?.('medium');
          break;
        case '3':
          h.onSetDifficulty?.('hard');
          break;
        case 'h':
          h.onToggleHighYield?.();
          break;
        case 'c':
          h.onToggleCaseBased?.();
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
