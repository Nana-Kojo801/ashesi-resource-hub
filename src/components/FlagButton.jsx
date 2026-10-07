import { useEffect, useRef, useState } from "react";

const reasons = [
  "The link is dead",
  "It goes to the wrong page",
  "It asked me to log in unexpectedly",
  "The information is out of date",
  "Something else",
];
export default function FlagButton({ resourceSlug, unavailable = false }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState("form");
  const client = useRef(null);
  const ready = useRef(Promise.resolve());
  useEffect(() => {
    let disposed = false;
    ready.current = (async () => {
      const url = import.meta.env.VITE_CONVEX_URL;
      if (!url) return;
      try {
        const { ConvexClient } = await import("convex/browser");
        if (!disposed) client.current = new ConvexClient(url);
      } catch {
        client.current = null;
      }
    })();
    return () => {
      disposed = true;
      client.current?.close();
      client.current = null;
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    if (!reason || unavailable || state === "sending") return;
    setState("sending");
    await ready.current;
    if (!client.current) {
      setState("error");
      return;
    }
    try {
      await client.current.mutation("flags:create", {
        resourceSlug,
        reason,
        note: note.trim() || undefined,
      });
      setState("done");
    } catch {
      setState("error");
    }
  }
  if (state === "done")
    return (
      <section className="report-success" role="status">
        <h2>Reported anonymously</h2>
        <p>
          We'll check it against the official Ashesi source. If it's broken it
          comes off the board until it's fixed.
        </p>
        <a className="outline-button" href={`/resource/${resourceSlug}`}>
          Back to resource
        </a>
      </section>
    );
  return (
    <form className="report-form" onSubmit={submit}>
      <fieldset disabled={state === "sending"}>
        <legend>What went wrong?</legend>
        <div className="report-options">
          {reasons.map((option) => (
            <label className={reason === option ? "selected" : ""} key={option}>
              <input
                type="radio"
                name="reason"
                value={option}
                checked={reason === option}
                onChange={() => setReason(option)}
                required
              />
              <span className="radio-square" aria-hidden="true" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="note-label" htmlFor="report-note">
        <strong>Anything else?</strong> (optional)
      </label>
      <textarea
        id="report-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Add a little context…"
        disabled={state === "sending"}
      />
      {state === "error" && (
        <p className="report-error" role="alert">
          Could not send the report. Please try again.
        </p>
      )}
      <div className="report-actions">
        <a href={`/resource/${resourceSlug}`}>Cancel</a>
        <button
          className="primary-button"
          type="submit"
          disabled={!reason || unavailable || state === "sending"}
        >
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
      </div>
      <p className="privacy-note">No account. No name. No email.</p>
    </form>
  );
}
