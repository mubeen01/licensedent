// Shared by BlogIndexPage, BlogPostPage and the landing page's
// BlogPreviewSection -- one place for the two bits of derived display logic
// none of them should compute separately (reading time isn't stored on
// BlogPost; it's cheap to derive from bodyMarkdown at render time).

/** ~200 wpm, rounded up so a short post never reads as "0 min read". */
export function estimateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Tags are stored lowercase-kebab (exam codes, or multi-word topics like
// "exam-format") since that's what the admin form free-types into a simple
// string array -- this is display-only formatting, never written back.
const ACRONYM_TAGS = new Set([
  'dha', 'haad', 'moh', 'smle', 'sdle', 'qchp', 'nhra', 'omsb', 'kmle', 'sha', 'idc', 'gdc', 'saq', 'mcq', 'cbt',
]);
const TAG_LABEL_OVERRIDES: Record<string, string> = {
  dataflow: 'DataFlow',
};

export function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => {
      const lower = word.toLowerCase();
      if (TAG_LABEL_OVERRIDES[lower]) return TAG_LABEL_OVERRIDES[lower];
      if (ACRONYM_TAGS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function formatBlogDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
