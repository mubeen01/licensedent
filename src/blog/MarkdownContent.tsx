import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Single shared renderer for blog body Markdown -- used by the public post page
// AND the admin editor's live preview, so they can never drift apart again (the
// table-rendering bug that shipped before this component existed was exactly a
// case of the admin editor not using the same renderer as the public page).
export default function MarkdownContent({ markdown, className = '' }: { markdown: string; className?: string }) {
  return (
    <div
      className={`prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-2xl prose-a:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-img:rounded-xl prose-table:text-sm prose-th:text-left ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
