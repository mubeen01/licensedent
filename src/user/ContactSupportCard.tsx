import { CheckCircle2, MessageCircleMore } from 'lucide-react';
import { useState } from 'react';
import { createContactFormMessage } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';

export default function ContactSupportCard() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!message.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      await createContactFormMessage({ content: message.trim() });
      setMessage('');
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send your message');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className='shadow-xl overflow-hidden'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <MessageCircleMore className='w-5 h-5 text-primary' />
          Contact support
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className='flex items-center gap-2 text-sm font-medium text-success'>
            <CheckCircle2 className='h-4 w-4' />
            Sent — our team will get back to you.
            <button className='ml-auto text-xs font-semibold text-primary underline' onClick={() => setSent(false)}>
              Send another
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              placeholder="Question about your plan, a question you think is wrong, anything else -- we'll read it."
            />
            {error && <p className='text-xs text-destructive'>{error}</p>}
            <Button size='sm' className='self-end' disabled={isSending || !message.trim()} onClick={handleSubmit}>
              {isSending ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
