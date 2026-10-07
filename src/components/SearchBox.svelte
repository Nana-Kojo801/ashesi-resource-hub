<script>
  import { createEventDispatcher } from "svelte";
  import Icon from "./Icon.svelte";
  export let query = "";
  export let placeholder = "Describe what you need…";
  export let showIcon = false;
  const dispatch = createEventDispatcher();
  function update() {
    dispatch("query", query);
  }
</script>

<form class="search-box" role="search" on:submit|preventDefault={update}>
  {#if showIcon}<span class="search-icon"><Icon name="search" size={23} /></span
    >{/if}
  <input
    id="resource-search"
    type="search"
    bind:value={query}
    on:input={update}
    {placeholder}
    aria-label={placeholder.replace("…", "")}
    autocomplete="off"
  />
  {#if query}<button
      class="clear-search"
      type="button"
      aria-label="Clear search"
      on:click={() => {
        query = "";
        update();
        document.getElementById("resource-search")?.focus();
      }}><Icon name="close" size={18} /></button
    >{/if}
  <button class="search-submit" type="submit" aria-label="Search"
    ><Icon name="arrow" size={26} /></button
  >
</form>
