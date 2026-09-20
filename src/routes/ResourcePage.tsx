import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FlagButton } from '../components/FlagButton';
import { Skeleton } from '../components/Skeleton';
import { useResources } from '../lib/useResources';
import { categoryColor } from '../lib/categories';
import { runMotion } from '../lib/motion';

export function ResourcePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { resources, loading, error } = useResources();

  const resource = (resources ?? []).find((r) => r.slug === slug);

  useEffect(() => {
    if (!loading) runMotion();
  }, [loading, slug]);

  if (!loading && !resource) {
    return (
      <Layout title="Not found">
        <div className="wrap detail-wrap">
          <p>That resource wasn't found{error ? ' (failed to load data).' : '.'}</p>
          <button className="back mono" onClick={() => navigate(-1)}>← Back to the board</button>
        </div>
      </Layout>
    );
  }

  if (loading || !resource) {
    return (
      <Layout title="Resource">
        <div className="wrap detail-wrap">
          <Skeleton width={80} height={12} style={{ marginBottom: 18 }} />
          <article className="drawer">
            <div className="drawer-top" style={{ background: 'var(--border-2)' }}></div>
            <div className="drawer-body">
              <Skeleton width={100} height={10} style={{ marginBottom: 10 }} />
              <Skeleton width="70%" height={30} style={{ marginBottom: 14 }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="90%" height={14} style={{ marginBottom: 22 }} />
              <div className="alias-chips" style={{ marginBottom: 22 }}>
                <Skeleton width={80} height={22} />
                <Skeleton width={100} height={22} />
              </div>
              <div className="kv">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="kv-row" key={i}>
                    <Skeleton width={60} height={10} />
                    <Skeleton width={120} height={12} />
                  </div>
                ))}
              </div>
              <Skeleton width="100%" height={48} style={{ marginBottom: 12 }} />
              <Skeleton width="100%" height={48} />
            </div>
          </article>
        </div>
      </Layout>
    );
  }

  const { title, description, type, access, url, category, aliases } = resource;
  const color = categoryColor(category);

  let host = url.replace(/^mailto:/, '').replace(/^tel:/, '');
  if (/^https?:\/\//.test(url)) host = url.replace(/^https?:\/\//, '').split('/')[0];
  const isExternalLink = /^https?:\/\//.test(url);

  return (
    <Layout title={title} description={description}>
      <div className="wrap detail-wrap">
        <button className="back mono" onClick={() => navigate(-1)}>← Back</button>

        <article className="drawer">
          <div className="drawer-top" style={{ background: color }}></div>
          <div className="drawer-body">
            <span className="cat-label mono" style={{ color }}>{category}</span>
            <h1>{title}</h1>
            <p className="desc">{description}</p>

            {aliases && aliases.length > 0 && (
              <div className="aliases">
                <p className="aliases-label mono">Students also call it</p>
                <div className="alias-chips">
                  {aliases.map((a) => (
                    <span className="alias-chip mono" key={a}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            <dl className="kv">
              <div className="kv-row">
                <dt className="mono">Type</dt>
                <dd>{type}</dd>
              </div>
              <div className="kv-row">
                <dt className="mono">Access</dt>
                <dd>{access}</dd>
              </div>
              <div className="kv-row">
                <dt className="mono">Goes to</dt>
                <dd>{host}</dd>
              </div>
              <div className="kv-row">
                <dt className="mono">Verified</dt>
                <dd>2026-09-19</dd>
              </div>
            </dl>

            <a
              className="open-btn mono"
              href={url}
              target={isExternalLink ? '_blank' : undefined}
              rel={isExternalLink ? 'noopener noreferrer' : undefined}
            >
              Open resource
            </a>

            <div className="flag-slot">
              <FlagButton resourceSlug={slug!} resourceTitle={title} />
            </div>
          </div>
        </article>
      </div>
    </Layout>
  );
}
