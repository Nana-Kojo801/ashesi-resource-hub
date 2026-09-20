import { useEffect, useRef, useState } from 'react';
import type { ConvexClient } from 'convex/browser';

interface FlagButtonProps {
  resourceSlug: string;
  resourceTitle?: string;
}

const REASONS = [
  'The link is dead',
  'It goes to the wrong page',
  'It asked me to log in unexpectedly',
  'The information is out of date',
  'Something else',
];

type Step = 'closed' | 'form' | 'sending' | 'done' | 'error';

export function FlagButton({ resourceSlug, resourceTitle = '' }: FlagButtonProps) {
  const [step, setStep] = useState<Step>('closed');
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const clientRef = useRef<ConvexClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = import.meta.env.VITE_CONVEX_URL;
        if (!url) return;
        const { ConvexClient } = await import('convex/browser');
        if (!cancelled) clientRef.current = new ConvexClient(url);
      } catch {
        clientRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openForm() {
    setStep('form');
    setReason(null);
    setNote('');
  }
  function closeForm() {
    setStep('closed');
  }

  async function submit() {
    if (!reason) return;
    setStep('sending');
    if (!clientRef.current) {
      // No VITE_CONVEX_URL configured yet — don't claim success for a
      // report that was never sent anywhere.
      setStep('error');
      return;
    }
    try {
      // convex/flags.ts exposes a "create" mutation on the reports table.
      await clientRef.current.mutation('flags:create' as any, {
        resourceSlug,
        reason,
        note: note || undefined,
      });
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  if (step === 'closed') {
    return (
      <button type="button" className="flag-trigger mono" onClick={openForm}>Flag a problem</button>
    );
  }

  return (
    <div className="flag-panel">
      {(step === 'form' || step === 'sending' || step === 'error') && (
        <>
          <p className="flag-title mono">What went wrong with "{resourceTitle}"?</p>
          <div className="reasons">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`reason-row${reason === r ? ' on' : ''}`}
                onClick={() => setReason(r)}
              >
                <span className={`mark${reason === r ? ' on' : ''}`}></span>
                {r}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            placeholder="Anything else? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {step === 'error' && <p className="error-note mono">Could not send the report. Please try again.</p>}
          <div className="flag-actions">
            <button type="button" className="cancel mono" onClick={closeForm}>Cancel</button>
            <button
              type="button"
              className={`submit mono${reason ? ' ready' : ''}`}
              disabled={!reason || step === 'sending'}
              onClick={submit}
            >
              {step === 'sending' ? 'Sending…' : reason ? 'Send report' : 'Pick what went wrong'}
            </button>
          </div>
          <p className="disclaimer mono">No account. No name. No email.<br />We record the link and what you picked.</p>
        </>
      )}
      {step === 'done' && (
        <div className="done">
          <span className="check">✓</span>
          <h3>Reported anonymously</h3>
          <p>We'll check it against the official Ashesi source. If it's broken it comes off the board until it's fixed.</p>
          <button type="button" className="cancel mono" onClick={closeForm}>Back to the board</button>
        </div>
      )}
    </div>
  );
}
