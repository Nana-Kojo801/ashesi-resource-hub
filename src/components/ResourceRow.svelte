<script>
  import Icon from "./Icon.svelte";
  import {
    detailHref,
    displayType,
    external,
    summary,
  } from "../lib/presentation";
  export let resource;
  export let home = false;
  $: type =
    home && resource.slug === "writing-center"
      ? "Resource"
      : displayType(resource);
  $: showAccess = [
    "student-portal-camu-services",
    "maintenance-service-request",
  ].includes(resource.slug);
</script>

<article
  class="resource-row"
  class:camu={resource.slug === "student-portal-camu-services"}
>
  <div class="resource-row-content">
    <div class="resource-copy">
      <h3>
        <a href={detailHref(resource)}
          >{home && resource.slug === "student-portal-camu-services"
            ? "Student Portal / CAMU"
            : resource.title}</a
        >
      </h3>
      <p>{summary(resource)}</p>
    </div>
    <div class="resource-meta">
      {#if resource.slug === "student-portal-camu-services"}<a
          href={detailHref(resource)}>{type}</a
        >{:else}<span>{type}</span>{/if}{#if showAccess}<span class="meta-dot"
          >·</span
        ><span>{resource.access}</span>{/if}
    </div>
    <a class="details-link" href={detailHref(resource)}
      >Details<span class="sr-only"> for {resource.title}</span></a
    >
  </div>
  <a
    class="action-dock row-action"
    href={resource.url}
    target={external(resource.url) ? "_blank" : undefined}
    rel={external(resource.url) ? "noopener noreferrer" : undefined}
  >
    Open <Icon name="external" size={16} /><span class="sr-only">
      {resource.title}{external(resource.url) ? " (opens a new tab)" : ""}</span
    >
  </a>
</article>
