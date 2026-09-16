import { useEffect } from 'react';

// Attaches while mounted -- rewrites whatever ends up on the clipboard from a
// copy/cut inside the page to always carry an attribution stamp, so a leaked
// copy of exam/practice content can be traced back to the account it came
// from. This is a deterrent, not a technical block: no browser API can stop
// someone from photographing their screen or using OS-level screen capture.
export function useCopyProtection(label: string) {
  useEffect(() => {
    function stampClipboard(e: ClipboardEvent) {
      const selection = window.getSelection()?.toString();
      if (!selection) return;
      e.preventDefault();
      e.clipboardData?.setData('text/plain', `${selection}\n\n[Copied by ${label} -- redistribution is tracked]`);
    }
    document.addEventListener('copy', stampClipboard);
    document.addEventListener('cut', stampClipboard);
    return () => {
      document.removeEventListener('copy', stampClipboard);
      document.removeEventListener('cut', stampClipboard);
    };
  }, [label]);
}
