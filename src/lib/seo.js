export const SITE_URL = "https://ashesiresourcehub.netlify.app";
export const SITE_NAME = "Ashesi Resource Hub";
export const SITE_DESCRIPTION = "Find Ashesi University portals, forms, office contacts and emergency numbers. Search by name or describe what you need. No account required.";
export const SHARE_IMAGE = `${SITE_URL}/social-card.png`;
export const normalizePath = (path) => path.replace(/\/+$/, "") || "/";

// Shared by the browser and static HTML head generator, so direct visits and
// client navigation describe the same page to crawlers and link previews.
/** @param {{mode: string, category?: string, resource?: import("./types").Resource | null, path?: string, resources?: import("./types").Resource[]}} input */
export function pageSeo({ mode, category = "", resource = null, path = "/", resources = [] }) {
  const canonicalPath = mode === "people" ? "/category/offices-and-people" : normalizePath(path);
  const label = mode === "missing" ? "Resource not found"
    : mode === "report" ? `Report a problem${resource ? ` · ${resource.title}` : ""}`
    : mode === "detail" ? resource?.title || "Resource details"
    : mode === "people" ? "Office contacts & people"
    : mode === "emergency" ? "Campus emergency contacts"
    : mode === "search" ? "Search Ashesi resources"
    : mode === "category" ? category || "Browse resources"
    : "Ashesi links, forms & contacts";
  const description = mode === "detail" && resource ? resource.description
    : mode === "people" ? "Find Ashesi office emails, telephone numbers and locations. Browse the full directory or search for the service you need."
    : mode === "emergency" ? "Find Ashesi campus security, health, support and Academic Affairs emergency contacts. Call or email the right team directly."
    : mode === "category" ? `Browse ${category} links, forms and services at Ashesi University. Find resource details and go directly to the official destination.`
    : mode === "report" ? "Report a broken link or outdated information in the Ashesi Resource Hub anonymously."
    : mode === "missing" ? "This resource may have been retired. Browse the Ashesi Resource Hub to find a current link or contact."
    : SITE_DESCRIPTION;
  const canonical = `${SITE_URL}${canonicalPath}`;
  const noindex = ["search", "report", "missing"].includes(mode);
  const site = { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: `${SITE_URL}/`, description: SITE_DESCRIPTION };
  const page = { "@type": ["home", "people", "category"].includes(mode) ? "CollectionPage" : "WebPage", "@id": `${canonical}#page`, name: label, url: canonical, description, isPartOf: { "@id": site["@id"] } };
  const entries = mode === "people" ? resources.filter((r) => r.category === "Offices & People")
    : mode === "category" ? resources.filter((r) => r.category === category)
    : mode === "home" ? resources : [];
  if (entries.length) page.mainEntity = { "@type": "ItemList", itemListElement: entries.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE_URL}/resource/${r.slug}` })) };
  if (resource && mode === "detail") page.about = { "@type": "Thing", name: resource.title, description: resource.description, url: resource.url };
  const crumbs = [{ name: "Resources", url: `${SITE_URL}/` }];
  if (resource && mode === "detail") crumbs.push({ name: resource.category, url: `${SITE_URL}/category/${resource.category.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}` });
  if (mode !== "home") crumbs.push({ name: label, url: canonical });
  const graph = [site, page];
  if (crumbs.length > 1 && !noindex) graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, item: r.url })) });
  return { title: `${label} · ${SITE_NAME}`, description, canonical, robots: noindex ? "noindex, follow" : "index, follow", structuredData: { "@context": "https://schema.org", "@graph": graph } };
}

export function applySeo(seo) {
  document.title = seo.title;
  const meta = (name, content, property = false) => {
    const attr = property ? "property" : "name";
    let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, name); document.head.append(tag); }
    tag.setAttribute("content", content);
  };
  meta("description", seo.description);
  meta("robots", seo.robots);
  for (const [name, content] of Object.entries({ "og:type": "website", "og:site_name": SITE_NAME, "og:title": seo.title, "og:description": seo.description, "og:url": seo.canonical, "og:image": SHARE_IMAGE, "og:image:width": "1200", "og:image:height": "630", "og:image:alt": "Ashesi Resource Hub — links, forms and people", "og:locale": "en_GH" })) meta(name, content, true);
  for (const [name, content] of Object.entries({ "twitter:card": "summary_large_image", "twitter:title": seo.title, "twitter:description": seo.description, "twitter:image": SHARE_IMAGE, "twitter:image:alt": "Ashesi Resource Hub — links, forms and people" })) meta(name, content);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
  canonical.href = seo.canonical;
  let script = document.getElementById("hub-structured-data");
  if (!script) { script = document.createElement("script"); script.id = "hub-structured-data"; script.type = "application/ld+json"; document.head.append(script); }
  script.textContent = JSON.stringify(seo.structuredData);
}
