import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useMatches } from "react-router-dom";
import Hub from "../components/Hub";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useResources } from "../lib/useResources";
import { applySeo, pageSeo } from "../lib/seo";
import { CATEGORY_ORDER, slugifyCategory } from "../lib/categories";

type Mode =
  | "home"
  | "search"
  | "category"
  | "people"
  | "detail"
  | "report"
  | "emergency"
  | "missing";

// Preserve main's React Router and cached resource loading. Reuse the approved
// React view with the approved markup and shared design tokens.
export function HubPage() {
  const matches = useMatches();
  const mode = (matches[matches.length - 1].handle as { mode: Mode })?.mode || "missing";
  const { resources, loading, error, retry } = useResources();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchState, setSearchState] = useState({ key: location.key, active: !!new URLSearchParams(location.search).get("q") });
  const searching = mode === "search" || (mode === "home" &&
    (searchState.key === location.key ? searchState.active : !!new URLSearchParams(location.search).get("q")));

  const category =
    resources?.find((r) => slugifyCategory(r.category) === slug)?.category ||
    ((loading || error) ? CATEGORY_ORDER.find((name) => slugifyCategory(name) === slug) : "") || "";
  const resource = resources?.find((r) => r.slug === slug) || null;
  const resolvedMode =
    mode === "category" && category === "Offices & People" ? "people" : mode;
  const missing =
    !loading &&
    !error &&
    (mode === "missing" ||
      (mode === "category" && !category) ||
      ((mode === "detail" || mode === "report") && !resource));

  useEffect(() => {
    if (loading && (mode === "detail" || mode === "report")) return;
    const seo = pageSeo({
      mode: missing ? "missing" : searching ? "search" : resolvedMode,
      category, resource, resources: resources || [], path: location.pathname,
    });
    if (error) seo.robots = "noindex, follow";
    applySeo(seo);
  }, [resource, resources, category, resolvedMode, missing, searching, mode, loading, error, location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  function followInternalLink(event: React.MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (
      !anchor ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.target === "_blank" ||
      anchor.hasAttribute("download")
    )
      return;
    const url = new URL(anchor.href);
    if (
      url.origin !== window.location.origin ||
      !/^https?:$/.test(url.protocol)
    )
      return;
    if (
      url.hash &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    )
      return;
    event.preventDefault();
    navigateSmoothly(url.pathname + url.search + url.hash);
  }

  function navigateSmoothly(href: string) {
    navigate(href, {
      // Mobile animates only content, keeping fixed navigation outside snapshots.
      viewTransition: window.matchMedia("(min-width: 761px)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }

  return (
    <div onClick={followInternalLink}>
      <AppHeader mode={mode} people={resolvedMode === "people"} />
      <Hub
        key={location.key}
        mode={missing ? "missing" : resolvedMode}
        resources={resources || []}
        category={category}
        resource={resource}
        navigate={navigateSmoothly}
        loading={loading}
        error={error}
        retry={retry}
        resourceSlug={slug || ""}
        onSearchChange={(active) => setSearchState({ key: location.key, active })}
      />
      <BottomNav mode={mode} people={resolvedMode === "people"} searching={searching} />
    </div>
  );
}
