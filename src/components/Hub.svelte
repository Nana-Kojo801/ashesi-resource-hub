<script>
  import { onMount } from "svelte";
  import Fuse from "fuse.js";
  import Icon from "./Icon.svelte";
  import TrackNav from "./TrackNav.svelte";
  import ResourceRow from "./ResourceRow.svelte";
  import ContactRow from "./ContactRow.svelte";
  import SearchBox from "./SearchBox.svelte";
  import FlagButton from "./FlagButton.svelte";
  import { CATEGORY_ORDER, sortCategories } from "../lib/categories";
  import {
    actionLabel,
    academicSlugs,
    categoryHref,
    detailHref,
    displayType,
    external,
    prioritize,
    starterSlugs,
  } from "../lib/presentation";

  export let mode = "home";
  export let resources = [];
  export let category = "";
  export let resource = null;
  let query = "";
  let typeFilter = "All resources";
  let showAll = false;
  const search = new Fuse(resources, {
    keys: [
      { name: "aliases", weight: 0.5 },
      { name: "title", weight: 0.3 },
      { name: "description", weight: 0.2 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
  });
  $: categories = sortCategories([
    ...new Set(resources.map((r) => r.category)),
  ]).filter((c) => c !== "Emergency");
  $: searching =
    mode === "search" || (mode === "home" && query.trim().length > 0);
  $: people = mode === "people";
  $: current = mode === "detail" ? resource.category : category;
  // A verbatim student phrase should resolve to its intended resource. Use
  // fuzzy search when no title or alias is an exact match.
  $: exactMatches = resources.filter((r) =>
    [r.title, ...r.aliases].some(
      (value) => value.toLowerCase() === query.trim().toLowerCase(),
    ),
  );
  $: matched =
    query.trim().length >= 2
      ? exactMatches.length
        ? exactMatches
        : search.search(query.trim()).map((r) => r.item)
      : [];
  $: categoryResources = prioritize(
    resources.filter((r) => r.category === category),
    category === CATEGORY_ORDER[0] ? academicSlugs : [],
  );
  $: filtered = (
    query.trim().length >= 2
      ? matched.filter((r) => r.category === category)
      : categoryResources
  ).filter(
    (r) =>
      typeFilter === "All resources" ||
      displayType(r) === (typeFilter === "Portals" ? "Portal" : "Form"),
  );
  $: contacts = prioritize(
    (query.trim().length >= 2 ? matched : resources).filter(
      (r) => r.category === "Offices & People",
    ),
    ["academic-registry", "information-technology", "finance"],
  );
  $: start = starterSlugs
    .map((slug) => resources.find((r) => r.slug === slug))
    .filter(Boolean);
  $: hotline = resources.find((r) => r.slug === "academic-affairs-hotline");
  $: host = resource
    ? resource.url
        .replace(/^mailto:|^tel:/, "")
        .replace(/^https?:\/\//, "")
        .split("/")[0]
    : "";
  $: resourceAction = resource
    ? resource.type === "Form"
      ? "Open form"
      : actionLabel(resource.url) === "Open"
        ? "Open resource"
        : actionLabel(resource.url)
    : "";
  const quickLinks = [
    ["student-portal-camu-services", "CAMU", "Student portal and services"],
    ["canvas-lms", "Canvas", "Courses and learning"],
    ["meal-plan-subscriber-portal", "Meal plan", "Dining and meal balances"],
    ["webprint", "WebPrint", "Print, scan and top up"],
  ];
  const emergency = [
    ["emergency-security-incident", "Security incident", "Ashesi Security"],
    [
      "emergency-medical-emergency",
      "Medical emergency",
      "Natembea Health Center",
    ],
    [
      "emergency-sexual-misconduct",
      "Sexual misconduct",
      "First response & reporting support",
    ],
    [
      "emergency-general-support",
      "General support",
      "Ashesi general support line",
    ],
  ];
  function number(url) {
    return url
      .replace("tel:", "")
      .replace(/^(\+233)(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  }
  function setQuery(value) {
    query = value;
    showAll = false;
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }
  onMount(() => {
    query = new URLSearchParams(window.location.search).get("q") || "";
    if (mode === "search") document.getElementById("resource-search")?.focus();
  });
</script>

<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Ashesi Resource Hub home"
    ><span class="brand-mark" aria-hidden="true"></span><span
      >Ashesi Resource Hub</span
    ></a
  >
  <nav class="desktop-nav" aria-label="Main navigation">
    <a class:active={!people && mode !== "emergency"} href="/">Resources</a>
    <a class:active={people} href="/category/offices-and-people">People</a>
  </nav>
  <a
    class="emergency-link"
    class:active={mode === "emergency"}
    href="/emergency">Emergency</a
  >
</header>
<div
  class="app-layout"
  class:full-width={mode === "emergency"}
  class:directory-layout={people}
>
  {#if mode !== "emergency"}<TrackNav
      {categories}
      {current}
      {people}
      report={mode === "report"}
      {resource}
      {searching}
    />{/if}
  <main
    id="main"
    class="page-content"
    class:home-page={mode === "home" && !searching}
    class:category-page={mode === "category"}
    class:search-page={searching}
    class:people-page={people}
    class:detail-page={mode === "detail"}
    class:report-page={mode === "report"}
    class:emergency-page={mode === "emergency"}
  >
    {#if mode === "emergency"}
      <a class="back-link mobile-only" href="/"
        ><Icon name="back" size={18} />Resources</a
      >
      <div class="emergency-heading">
        <h1>Urgent help</h1>
        <p class="subtitle">Campus emergency contacts, ready to call.</p>
      </div>
      <div class="emergency-directory">
        {#each emergency as [slug, label, provider]}
          {@const entry = resources.find((r) => r.slug === slug)}
          {#if entry}<article class="emergency-row">
              <div class="emergency-content">
                <div>
                  <h2>{label}</h2>
                  <p>{provider}</p>
                </div>
                <a class="phone-number" href={entry.url}>{number(entry.url)}</a>
              </div>
              <div class="action-dock emergency-action">
                <a class="primary-button" href={entry.url}
                  >Call now<span class="sr-only">: {provider}</span></a
                >
              </div>
            </article>{/if}
        {/each}
        {#if hotline}<article class="emergency-row hotline-row">
            <div class="emergency-content">
              <div>
                <h2>Academic Affairs Hotline</h2>
                <p>Urgent academic assistance</p>
              </div>
              <a class="phone-number" href={hotline.url}
                >{hotline.url.replace("mailto:", "")}</a
              >
            </div>
            <div class="action-dock emergency-action">
              <a class="primary-button" href={hotline.url}>Email hotline</a>
            </div>
          </article>{/if}
      </div>
    {:else if mode === "report"}
      <a class="back-link mobile-only" href={detailHref(resource)}
        ><Icon name="back" size={18} />Back to resource</a
      >
      <h1>Flag a problem</h1>
      <p class="subtitle">{resource.title}</p>
      <FlagButton resourceSlug={resource.slug} resourceTitle={resource.title} />
    {:else if mode === "detail"}
      <div class="breadcrumb">
        <a href="/">Resources</a><span>/</span><a
          href={categoryHref(resource.category)}>{resource.category}</a
        >
      </div>
      <a class="back-link" href={categoryHref(resource.category)}
        ><Icon name="back" size={20} />Back to {resource.category}</a
      >
      <h1>{resource.title}</h1>
      <p class="subtitle detail-description">{resource.description}</p>
      <div class="detail-record">
        <dl class="detail-metadata">
          <div>
            <dt>Type</dt>
            <dd>{resource.type}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{resource.access}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>
              <a
                href={resource.url}
                target={external(resource.url) ? "_blank" : undefined}
                rel={external(resource.url) ? "noopener noreferrer" : undefined}
                >{host} <Icon name="external" size={16} /></a
              >
            </dd>
          </div>
          <div>
            <dt>Verification date</dt>
            <dd>19 Sep 2026</dd>
          </div>
        </dl>
        <div class="action-dock detail-action">
          <a
            class="primary-button"
            href={resource.url}
            target={external(resource.url) ? "_blank" : undefined}
            rel={external(resource.url) ? "noopener noreferrer" : undefined}
            >{resourceAction} <Icon name="external" size={18} /></a
          >{#if external(resource.url)}<p>
              {host === "forms.office.com"
                ? "Opens Microsoft Forms"
                : "Opens the resource"} in a new tab.
            </p>{/if}
        </div>
      </div>
      {#if resource.aliases.length}<section class="aliases">
          <h2>Students also call it</h2>
          <ul>
            {#each resource.aliases.slice(0, 5) as alias}<li>{alias}</li>{/each}
          </ul>
        </section>{/if}
      <div class="flag-prompt">
        <span>Something wrong with this link?</span><a
          class="outline-button"
          href={`${detailHref(resource)}/report`}>Flag a problem</a
        >
      </div>
    {:else if people}
      <h1>Who can help?</h1>
      <p class="subtitle">Find the right office and contact them directly.</p>
      <SearchBox
        bind:query
        placeholder="Search offices or services…"
        showIcon
        on:query={(e) => setQuery(e.detail)}
      />
      <div class="contact-list" aria-live="polite">
        {#each contacts.slice(0, showAll || query ? undefined : 3) as contact}<ContactRow
            resource={contact}
          />{/each}
        {#if !contacts.length}<div class="empty-state">
            <h2>No offices found</h2>
            <p>Try a different name or service.</p>
            <button on:click={() => setQuery("")}>Clear search</button>
          </div>{/if}
      </div>
      {#if !showAll && !query && contacts.length > 3}<button
          class="more-resources directory-continuation"
          on:click={() => (showAll = true)}
          >View all offices <Icon name="arrow" size={18} /></button
        >{/if}
    {:else if mode === "category"}
      <div class="breadcrumb">
        <a href="/">Resources</a><span>/</span><span>{category}</span>
      </div>
      <h1>{category}</h1>
      <p class="subtitle">
        {category === "Academic & Administration"
          ? "Portals, forms and services for your academic journey."
          : `Explore ${category.toLowerCase()} resources.`}
      </p>
      <div class="category-select mobile-only">
        <select
          aria-label="Browse resources"
          value={categoryHref(category)}
          on:change={(e) => window.location.assign(e.currentTarget.value)}
          ><option value="/">All resources</option
          >{#each categories as name}<option value={categoryHref(name)}
              >{name}</option
            >{/each}</select
        ><Icon name="chevron" size={18} />
      </div>
      <SearchBox
        bind:query
        placeholder="Search this category…"
        on:query={(e) => setQuery(e.detail)}
      />
      <div class="filter-tabs" aria-label="Filter by type">
        {#each ["All resources", "Portals", "Forms"] as label}<button
            class:active={typeFilter === label}
            aria-pressed={typeFilter === label}
            on:click={() => {
              typeFilter = label;
              showAll = false;
            }}>{label}</button
          >{/each}
      </div>
      <div class="resource-list" aria-live="polite">
        {#each filtered.slice(0, showAll || query || typeFilter !== "All resources" ? undefined : 5) as entry}<ResourceRow
            resource={entry}
          />{/each}{#if !filtered.length}<div class="empty-state">
            <h2>No matching resources</h2>
            <p>Try another phrase or choose a different resource type.</p>
          </div>{/if}
      </div>
      {#if category === "Academic & Administration"}<div
          class="category-footer"
        >
          Looking for a person? <a href="/resource/academic-registry"
            >View Academic Registry <Icon name="arrow" size={18} /></a
          >
        </div>{/if}
      {#if !showAll && !query && typeFilter === "All resources" && filtered.length > 5}<button
          class="more-resources directory-continuation"
          on:click={() => (showAll = true)}
          >View all resources <Icon name="arrow" size={18} /></button
        >{/if}
    {:else}
      <h1>{searching ? "Search resources" : "Where do you need to go?"}</h1>
      <p class="subtitle">Find a link, a form, or someone who can help.</p>
      <SearchBox
        bind:query
        placeholder="Describe what you need…"
        on:query={(e) => setQuery(e.detail)}
      />
      {#if searching}
        <section class="search-results" aria-live="polite">
          <h2 class="section-track">Results</h2>
          <p class="result-count">
            {matched.length}
            {matched.length === 1 ? "result" : "results"}
          </p>
          {#each matched.slice(0, showAll ? undefined : 12) as entry}
            <article class="search-result">
              <div class="search-result-content">
                <h2><a href={detailHref(entry)}>{entry.title}</a></h2>
                <p class="result-category">{entry.category}</p>
                <p>{entry.description}</p>
                <div class="result-metadata">
                  {entry.type}<span>·</span>{entry.access}
                </div>
                {#if entry.aliases.length}<div class="result-aliases">
                    <h3>Also called</h3>
                    <p>
                      {(entry.slug === "maintenance-service-request"
                        ? ["my ac is broken", "fix my room", "hostel problem"]
                        : entry.aliases.slice(0, 3)
                      ).join("　/　")}
                    </p>
                  </div>{/if}
              </div>
              <div class="action-dock search-result-action">
                <a
                  class="primary-button"
                  href={entry.url}
                  target={external(entry.url) ? "_blank" : undefined}
                  rel={external(entry.url) ? "noopener noreferrer" : undefined}
                  >{entry.type === "Form"
                    ? "Open form"
                    : actionLabel(entry.url)}
                  <Icon name="external" size={18} /></a
                ><a class="text-link" href={detailHref(entry)}
                  >View details <Icon name="arrow" size={18} /></a
                >
              </div>
            </article>
          {/each}
          {#if !matched.length}<div class="empty-state">
              <h2>
                {query.trim().length < 2
                  ? "What are you looking for?"
                  : "No matches yet"}
              </h2>
              <p>
                {query.trim().length < 2
                  ? "Enter at least two characters to search the directory."
                  : "Try a different phrase, or browse a category below."}
              </p>
            </div>{/if}
          {#if matched.length > 12 && !showAll}<button
              class="more-resources"
              on:click={() => (showAll = true)}>Show all results</button
            >{/if}
        </section>
        <section class="another-route">
          <h2>Try another route</h2>
          <p>Try another phrase or browse a category.</p>
          <nav aria-label="Alternative categories">
            <a href={categoryHref("Support & Wellbeing")}
              ><strong class="alternative-title">Support &amp; Wellbeing</strong
              ><span>Housing, facilities, health and personal support.</span></a
            ><a href={categoryHref("Housing")}
              ><strong class="alternative-title">Housing</strong><span
                >Residential life and accommodation.</span
              ></a
            ><a href={categoryHref("Offices & People")}
              ><strong class="alternative-title">Offices &amp; People</strong
              ><span>Find the right office or person to contact.</span></a
            >
          </nav>
        </section>
      {:else}
        <div class="suggestions">
          <span>Try:</span>
          <div>
            <a href="/?q=transcript">Get a transcript</a><a
              href="/?q=my%20AC%20is%20broken">Fix something in my room</a
            ><a href="/?q=internship">Find an internship</a>
          </div>
        </div>
        <div class="mobile-browse mobile-only">
          <label for="category-picker">Browse resources</label>
          <div class="category-select">
            <select
              id="category-picker"
              on:change={(e) => window.location.assign(e.currentTarget.value)}
              ><option value="/">All resources</option
              >{#each categories as name}<option value={categoryHref(name)}
                  >{name}</option
                >{/each}</select
            ><Icon name="chevron" size={18} />
          </div>
        </div>
        <section class="everyday">
          <h2>Everyday links</h2>
          <div class="quick-links">
            {#each quickLinks as [slug, title, desc]}{@const entry =
                resources.find((r) => r.slug === slug)}{#if entry}<a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  ><div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                  <Icon name="arrow" size={19} /></a
                >{/if}{/each}
          </div>
        </section>
        <section class="starter-section">
          <h2>Start here</h2>
          <div class="resource-list">
            {#each start as entry}<ResourceRow resource={entry} home />{/each}
          </div>
        </section>
      {/if}
    {/if}
  </main>
</div>
{#if mode !== "emergency" && mode !== "report"}
  <nav class="mobile-nav" aria-label="Main navigation">
    <a class:active={!people && !searching} href="/"
      ><Icon name="resource" size={23} /><span>Resources</span></a
    ><a class:active={searching} href="/search"
      ><Icon name="search" size={24} /><span>Search</span></a
    ><a class:active={people} href="/category/offices-and-people"
      ><Icon name="people" size={24} /><span>People</span></a
    >
  </nav>
{/if}
