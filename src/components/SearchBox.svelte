<script>
  import { onMount } from 'svelte';
  import Fuse from 'fuse.js';

  /** @type {Array<{slug:string,title:string,description:string,category:string,aliases:string[],url:string}>} */
  let index = [];
  let fuse = null;
  let query = '';
  let results = [];
  let loaded = false;

  onMount(async () => {
    try {
      const res = await fetch('/search-index.json');
      index = await res.json();
      fuse = new Fuse(index, {
        keys: [
          { name: 'aliases', weight: 0.5 },
          { name: 'title', weight: 0.3 },
          { name: 'description', weight: 0.2 },
        ],
        threshold: 0.35,
        includeScore: true,
      });
      loaded = true;
    } catch (e) {
      // Search index failed to load (offline first visit, etc). Fail quietly —
      // the browse-by-category flow still works without search.
      loaded = false;
    }
  });

  function onInput(e) {
    query = e.target.value;
    if (!fuse || query.trim().length < 2) {
      results = [];
      return;
    }
    results = fuse.search(query).slice(0, 12).map((r) => r.item);
  }

  function clear() {
    query = '';
    results = [];
  }
</script>

<div class="searchbox">
  <div class="input-wrap">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
    <input
      type="text"
      value={query}
      on:input={onInput}
      placeholder="Say what you need — “CareerOS”, “my hostel AC is broken”…"
      aria-label="Search resources"
    />
    {#if query}
      <button class="clear" type="button" on:click={clear} aria-label="Clear search">×</button>
    {/if}
  </div>

  {#if query.trim().length >= 2}
    <div class="results">
      {#if results.length === 0}
        <p class="empty mono">No matches. Try a different word, or browse a category below.</p>
      {:else}
        {#each results as r (r.slug)}
          <a class="result-row" href={`/resource/${r.slug}`}>
            <div class="result-body">
              <span class="result-title">{r.title}</span>
              <span class="result-desc">{r.description}</span>
            </div>
            <span class="result-cat mono">{r.category}</span>
          </a>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .searchbox { position: relative; width: 100%; }
  .input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--input-bg, #FFFBF2);
    border: 1px solid var(--border-3, #D9CBB5);
    padding: 13px 14px;
    color: var(--muted-2, #4A403B);
  }
  .input-wrap:focus-within { border-color: var(--text, #1C1614); }
  .input-wrap input {
    flex: 1;
    border: none;
    background: none;
    font-size: 14px;
    color: var(--text, #1C1614);
  }
  .clear {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    color: var(--muted, #6B5F58);
    padding: 0 2px;
  }
  .results {
    margin-top: 8px;
    border: 1px solid var(--border-2, #ECE1CE);
    background: var(--card, #FFFDF7);
    max-height: 60vh;
    overflow-y: auto;
  }
  .empty {
    padding: 16px;
    font-size: 10.5px;
    color: var(--muted, #6B5F58);
    text-align: center;
  }
  .result-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-2, #ECE1CE);
    color: var(--text, #1C1614);
  }
  .result-row:last-child { border-bottom: none; }
  .result-row:hover { background: #FFFBF0; }
  .result-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
  .result-title { font-size: 13.5px; font-weight: 700; }
  .result-desc {
    font-size: 12px;
    color: var(--muted, #6B5F58);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .result-cat {
    flex: 0 0 auto;
    font-size: 8.5px;
    color: var(--muted-2, #4A403B);
    white-space: nowrap;
  }
</style>
