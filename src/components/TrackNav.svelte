<script>
  import Icon from "./Icon.svelte";
  import { categoryHref, detailHref } from "../lib/presentation";
  export let categories = [];
  export let current = "";
  export let people = false;
  export let report = false;
  export let resource = null;
  export let searching = false;
</script>

<aside class="sidebar">
  <h2>{report ? "Resource" : people ? "Directory" : "Browse resources"}</h2>
  <nav
    class="track-nav"
    aria-label={people
      ? "Directory"
      : report
        ? "Resource navigation"
        : "Browse resources"}
  >
    {#if report}
      <a href={detailHref(resource)}
        >{resource.slug === "maintenance-service-request"
          ? "Maintenance request"
          : resource.title}</a
      >
      <a
        class="selected"
        aria-current="page"
        href={`${detailHref(resource)}/report`}>Report a problem</a
      >
    {:else if people}
      <a
        class="selected"
        aria-current="page"
        href="/category/offices-and-people">All offices</a
      >
    {:else}
      <a
        class:selected={!current}
        aria-current={!current ? "page" : undefined}
        href={searching ? "/search" : "/"}
        >{searching ? "Search" : "All resources"}</a
      >
      {#each categories as name}
        <a
          class:selected={current === name}
          aria-current={current === name ? "page" : undefined}
          href={categoryHref(name)}>{name}</a
        >
      {/each}
    {/if}
  </nav>
  {#if !report}
    <div class="sidebar-foot">
      {#if people}<p>Need urgent help?</p>
        <a href="/emergency">Go to Emergency <Icon name="arrow" size={18} /></a
        >{:else}<em>No account needed.</em>{/if}
    </div>
  {/if}
</aside>
