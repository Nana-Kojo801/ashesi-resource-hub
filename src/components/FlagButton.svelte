<script>
  export let resourceSlug;
  export let resourceTitle = '';

  import { onMount } from 'svelte';

  const REASONS = [
    'The link is dead',
    'It goes to the wrong page',
    'It asked me to log in unexpectedly',
    'The information is out of date',
    'Something else',
  ];

  /** @type {'closed'|'form'|'sending'|'done'|'error'} */
  let step = 'closed';
  let reason = null;
  let note = '';
  let client = null;

  onMount(async () => {
    try {
      const url = import.meta.env.PUBLIC_CONVEX_URL;
      if (!url) return;
      const { ConvexClient } = await import('convex/browser');
      client = new ConvexClient(url);
    } catch (e) {
      client = null;
    }
  });

  function openForm() {
    step = 'form';
    reason = null;
    note = '';
  }
  function closeForm() {
    step = 'closed';
  }
  function pick(r) {
    reason = r;
  }

  async function submit() {
    if (!reason) return;
    step = 'sending';
    if (!client) {
      // No PUBLIC_CONVEX_URL configured yet — don't claim success for a report
      // that was never sent anywhere.
      step = 'error';
      return;
    }
    try {
      // convex/flags.ts exposes a "create" mutation on the reports table.
      await client.mutation('flags:create', {
        resourceSlug,
        reason,
        note: note || undefined,
      });
      step = 'done';
    } catch (e) {
      step = 'error';
    }
  }
</script>

{#if step === 'closed'}
  <button type="button" class="flag-trigger mono" on:click={openForm}>Flag a problem</button>
{:else}
  <div class="flag-panel">
    {#if step === 'form' || step === 'sending' || step === 'error'}
      <p class="flag-title mono">What went wrong with “{resourceTitle}”?</p>
      <div class="reasons">
        {#each REASONS as r}
          <button
            type="button"
            class="reason-row"
            class:on={reason === r}
            on:click={() => pick(r)}
          >
            <span class="mark" class:on={reason === r}></span>
            {r}
          </button>
        {/each}
      </div>
      <textarea
        rows="3"
        placeholder="Anything else? (optional)"
        bind:value={note}
      ></textarea>
      {#if step === 'error'}
        <p class="error-note mono">Could not send the report. Please try again.</p>
      {/if}
      <div class="flag-actions">
        <button type="button" class="cancel mono" on:click={closeForm}>Cancel</button>
        <button
          type="button"
          class="submit mono"
          class:ready={!!reason}
          disabled={!reason || step === 'sending'}
          on:click={submit}
        >
          {step === 'sending' ? 'Sending…' : reason ? 'Send report' : 'Pick what went wrong'}
        </button>
      </div>
      <p class="disclaimer mono">No account. No name. No email.<br />We record the link and what you picked.</p>
    {:else if step === 'done'}
      <div class="done">
        <span class="check">✓</span>
        <h3>Reported anonymously</h3>
        <p>We'll check it against the official Ashesi source. If it's broken it comes off the board until it's fixed.</p>
        <button type="button" class="cancel mono" on:click={closeForm}>Back to the board</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .flag-trigger {
    width: 100%;
    background: none;
    border: 1px solid var(--border-3, #D9CBB5);
    color: var(--text, #1C1614);
    padding: 14px;
    cursor: pointer;
    font-size: 10.5px;
    letter-spacing: 0.06em;
  }
  .flag-trigger:hover { border-color: var(--text, #1C1614); }

  .flag-panel {
    border: 1px solid var(--border, #E4D9C7);
    background: var(--card, #FFFDF7);
    padding: 16px;
    animation: rise 0.2s ease;
  }
  .flag-title { font-size: 11px; color: var(--muted-2, #4A403B); margin: 0 0 12px; }
  .reasons { margin-bottom: 14px; }
  .reason-row {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border, #E4D9C7);
    padding: 12px 4px;
    cursor: pointer;
    font-size: 13.5px;
    color: var(--muted, #6B5F58);
  }
  .reason-row.on { background: #FBEDE9; color: var(--text, #1C1614); }
  .mark {
    flex: 0 0 auto;
    width: 13px;
    height: 13px;
    border: 1px solid var(--border-3, #D9CBB5);
    background: transparent;
  }
  .mark.on { border-color: var(--primary, #A93C40); background: var(--primary, #A93C40); }
  textarea {
    width: 100%;
    resize: vertical;
    background: var(--input-bg, #FBF6EA);
    border: 1px solid var(--border, #E4D9C7);
    color: var(--text, #1C1614);
    padding: 12px;
    font-size: 13.5px;
    line-height: 1.55;
    margin-bottom: 14px;
    font-family: inherit;
  }
  textarea:focus { border-color: var(--text, #1C1614); }
  .flag-actions { display: flex; gap: 8px; margin-bottom: 8px; }
  .cancel {
    flex: 0 0 auto;
    background: none;
    border: 1px solid var(--border-3, #D9CBB5);
    color: var(--text, #1C1614);
    padding: 12px 16px;
    cursor: pointer;
    font-size: 10px;
    letter-spacing: 0.06em;
  }
  .submit {
    flex: 1;
    background: none;
    color: #B3A48F;
    border: 1px solid var(--border, #E4D9C7);
    padding: 12px;
    cursor: not-allowed;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
  }
  .submit.ready { background: var(--primary, #A93C40); color: #fff; border-color: var(--primary, #A93C40); cursor: pointer; }
  .error-note { color: var(--primary, #A93C40); font-size: 9.5px; margin: 0 0 10px; }
  .disclaimer { font-size: 9.5px; line-height: 1.7; color: var(--muted, #6B5F58); margin: 6px 0 0; text-align: center; }

  .done { text-align: center; padding: 8px 4px; }
  .check {
    display: inline-grid; place-items: center; width: 44px; height: 44px;
    background: var(--success, #2F7A63); color: #FFFBF2; font-size: 20px; margin-bottom: 14px;
  }
  .done h3 {
    font-weight: 800; font-stretch: 112%; font-size: 18px; text-transform: uppercase;
    letter-spacing: -0.01em; margin: 0 0 10px;
  }
  .done p { font-size: 13px; line-height: 1.6; color: var(--muted, #6B5F58); margin: 0 0 20px; }
</style>
