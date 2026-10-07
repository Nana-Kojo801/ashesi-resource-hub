export function Skeleton({ width = "100%", className = "" }) {
  return <span aria-hidden="true" className={`skeleton ${className}`} style={{ width }} />;
}

// Only fetched content uses placeholders; the surrounding UI stays live.
export default function DataState({ kind = "resource", count = 3, error, retry }) {
  if (error) return (
    <div className="data-error" role="alert">
      <h2>Could not load these resources</h2>
      <p>Check your connection and try again.</p>
      <button className="outline-button" onClick={retry}>Try again</button>
    </div>
  );
  return <>
    <span className="sr-only" role="status">Loading {kind === "contact" ? "offices" : "resources"}…</span>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} aria-hidden="true" className={`${kind === "contact" ? "contact-row" : kind === "search" ? "search-result" : "resource-row"} skeleton-record`}>
        <div className={kind === "contact" ? "contact-content" : kind === "search" ? "search-result-content" : "resource-row-content"}>
          <div className="skeleton-copy"><Skeleton width="65%" className="skeleton-title" /><Skeleton width="92%" /><Skeleton width="72%" /></div>
          {kind !== "search" && <div className="skeleton-copy"><Skeleton width="76%" /><Skeleton width="55%" /></div>}
        </div>
        <div className={`action-dock ${kind === "contact" ? "contact-action" : kind === "search" ? "search-result-action" : "row-action"}`}><Skeleton width="62%" className="skeleton-button" /></div>
      </div>
    ))}
  </>;
}

export function DetailState({ error, retry }) {
  if (error) return <DataState error={error} retry={retry} />;
  return <div className="detail-loading" aria-busy="true">
    <span className="sr-only" role="status">Loading resource details…</span>
    <Skeleton width="70%" className="skeleton-heading" />
    <Skeleton width="90%" /><Skeleton width="65%" />
    <div className="detail-record">
      <dl className="detail-metadata">{["Type", "Access", "Destination", "Verification date"].map((label) => <div key={label}><dt>{label}</dt><dd><Skeleton width="85%" /></dd></div>)}</dl>
      <div className="action-dock detail-action"><Skeleton className="skeleton-button" /><Skeleton width="85%" /></div>
    </div>
  </div>;
}
