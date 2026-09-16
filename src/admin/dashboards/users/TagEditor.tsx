import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { updateUserTags } from 'wasp/client/operations';
import { Input } from '../../../components/ui/input';

const SUGGESTED_TAGS = ['VIP', 'At risk', 'Beta tester', 'High value', 'Needs follow-up'];

export default function TagEditor({
  userId,
  tags,
  onChanged,
}: {
  userId: string;
  tags: string[];
  onChanged?: (tags: string[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function save(nextTags: string[]) {
    setIsSaving(true);
    try {
      const result = await updateUserTags({ userId, tags: nextTags });
      onChanged?.(result.tags);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to update tags');
    } finally {
      setIsSaving(false);
    }
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setDraft('');
      setIsAdding(false);
      return;
    }
    save([...tags, trimmed]);
    setDraft('');
    setIsAdding(false);
  }

  function removeTag(tag: string) {
    save(tags.filter((t) => t !== tag));
  }

  const availableSuggestions = SUGGESTED_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {tags.map((tag) => (
        <span
          key={tag}
          className='inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary'
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            disabled={isSaving}
            aria-label={`Remove tag ${tag}`}
            className='rounded-full hover:text-destructive'
          >
            <X className='h-3 w-3' />
          </button>
        </span>
      ))}

      {isAdding ? (
        <div className='flex items-center gap-1'>
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag(draft);
              if (e.key === 'Escape') {
                setDraft('');
                setIsAdding(false);
              }
            }}
            onBlur={() => (draft ? addTag(draft) : setIsAdding(false))}
            placeholder='Tag name'
            className='h-7 w-32 rounded-full px-2.5 text-xs'
            list='tag-suggestions'
          />
          <datalist id='tag-suggestions'>
            {availableSuggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          disabled={isSaving}
          className='inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary'
        >
          <Plus className='h-3 w-3' /> Tag
        </button>
      )}
    </div>
  );
}
