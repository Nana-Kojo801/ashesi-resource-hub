import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Hub from "../components/Hub";
import { useResources } from "../lib/useResources";
import { slugifyCategory } from "../lib/categories";

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
export function HubPage({ mode }: { mode: Mode }) {
  const { resources, loading, error } = useResources();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const category =
    resources?.find((r) => slugifyCategory(r.category) === slug)?.category ||
    "";
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
    const title =
      resource?.title ||
      (resolvedMode === "people"
        ? "People"
        : resolvedMode === "emergency"
          ? "Urgent help"
          : resolvedMode === "search"
            ? "Search resources"
            : resolvedMode === "category"
              ? category
              : "Resources");
    document.title = `${title} · Ashesi Resource Hub`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        resource?.description ||
          "Find Ashesi links, forms and the people who can help. No account needed.",
      );
  }, [resource, category, resolvedMode]);

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
    navigate(url.pathname + url.search + url.hash);
  }

  if (loading)
    return (
      <main className="page-content" role="status">
        Loading resources…
      </main>
    );
  if (error)
    return (
      <main className="page-content">
        <h1>Could not load resources</h1>
        <p className="subtitle">Please refresh and try again.</p>
      </main>
    );
  if (missing)
    return (
      <main className="page-content">
        <h1>Resource not found</h1>
        <p className="subtitle">This resource may have been retired.</p>
        <Link className="outline-button" to="/">
          Browse resources
        </Link>
      </main>
    );
  return (
    <div onClick={followInternalLink}>
      <Hub
        key={location.key}
        mode={resolvedMode}
        resources={resources || []}
        category={category}
        resource={resource}
        navigate={navigate}
      />
    </div>
  );
}
