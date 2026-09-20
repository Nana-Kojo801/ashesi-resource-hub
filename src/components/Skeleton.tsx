import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  className?: string;
}

/** A single shimmering block. Compose several into page-specific shapes
 * (title bar, description bar, meta line, etc.) rather than writing a
 * bespoke skeleton per page. */
export function Skeleton({ width = '100%', height = 14, style, className }: SkeletonProps) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/** Skeleton shaped like a ResourceCard row: spine + title bar + desc bar + meta line. */
export function SkeletonResourceRow() {
  return (
    <div className="resource-row skeleton-row">
      <span className="spine skeleton" style={{ background: 'var(--border-2)' }} />
      <div className="row-body">
        <Skeleton width="55%" height={15} style={{ marginBottom: 6 }} />
        <Skeleton width="85%" height={13} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonCategorySection() {
  return (
    <section className="category-section" aria-hidden="true">
      <div className="section-head">
        <Skeleton width={16} height={3} />
        <Skeleton width={140} height={15} style={{ marginLeft: 10 }} />
      </div>
      <div className="rows">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonResourceRow key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonTabs() {
  return (
    <div className="tabs" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width={110} height={30} />
      ))}
    </div>
  );
}
