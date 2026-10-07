<script>
  import { onMount, onDestroy } from "svelte";
  export let resourceSlug;
  export let resourceTitle = "";
  const reasons = [
    "The link is dead",
    "It goes to the wrong page",
    "It asked me to log in unexpectedly",
    "The information is out of date",
    "Something else",
  ];
  let reason = "";
  let note = "";
  let state = "form";
  let client = null;
  let disposed = false;
  let ready = Promise.resolve();
  onMount(() => {
    ready = (async () => {
      const url = import.meta.env.PUBLIC_CONVEX_URL;
      if (!url) return;
      try {
        const { ConvexClient } = await import("convex/browser");
        if (!disposed) client = new ConvexClient(url);
      } catch {
        client = null;
      }
    })();
  });
  onDestroy(() => {
    disposed = true;
    client?.close();
  });
  async function submit() {
    if (!reason || state === "sending") return;
    state = "sending";
    await ready;
    if (!client) {
      state = "error";
      return;
    }
    try {
      await client.mutation("flags:create", {
        resourceSlug,
        reason,
        note: note.trim() || undefined,
      });
      state = "done";
    } catch {
      state = "error";
    }
  }
</script>

{#if state === "done"}
  <section class="report-success" role="status">
    <h2>Reported anonymously</h2>
    <p>
      We'll check it against the official Ashesi source. If it's broken it comes
      off the board until it's fixed.
    </p>
    <a class="outline-button" href={`/resource/${resourceSlug}`}
      >Back to resource</a
    >
  </section>
{:else}
  <form class="report-form" on:submit|preventDefault={submit}>
    <fieldset disabled={state === "sending"}>
      <legend>What went wrong?</legend>
      <div class="report-options">
        {#each reasons as option}<label class:selected={reason === option}
            ><input
              type="radio"
              name="reason"
              value={option}
              bind:group={reason}
              required
            /><span class="radio-square" aria-hidden="true"></span><span
              >{option}</span
            ></label
          >{/each}
      </div>
    </fieldset>
    <label class="note-label" for="report-note"
      ><strong>Anything else?</strong> (optional)</label
    ><textarea
      id="report-note"
      bind:value={note}
      rows="4"
      placeholder="Add a little context…"
      disabled={state === "sending"}></textarea>
    {#if state === "error"}<p class="report-error" role="alert">
        Could not send the report. Please try again.
      </p>{/if}
    <div class="report-actions">
      <a href={`/resource/${resourceSlug}`}>Cancel</a><button
        class="primary-button"
        type="submit"
        disabled={!reason || state === "sending"}
        >{state === "sending" ? "Sending…" : "Send report"}</button
      >
    </div>
    <p class="privacy-note">No account. No name. No email.</p>
  </form>
{/if}
