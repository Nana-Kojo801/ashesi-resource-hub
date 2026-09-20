import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ResourceCard } from '../components/ResourceCard';
import { SkeletonResourceRow } from '../components/Skeleton';
import { useResources } from '../lib/useResources';
import { categoryColor, slugifyCategory } from '../lib/categories';
import { runMotion } from '../lib/motion';

export function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { resources, loading } = useResources();

  const matches = (resources ?? []).filter((r) => slugifyCategory(r.category) === slug);
  const name = matches[0]?.category ?? slug ?? '';
  const color = categoryColor(name);

  useEffect(() => {
    if (!loading) runMotion();
  }, [loading, slug]);

  return (
    <Layout title={loading ? 'Category' : name}>
      <section className="wrap category-page">
        <button className="back mono" onClick={() => navigate(-1)}>← All categories</button>
        <div className="head">
          <span className="bar" style={{ background: color }}></span>
          {loading ? (
            <div className="skeleton" style={{ width: 220, height: 28 }} />
          ) : (
            <h1>{name}</h1>
          )}
          <span className="count mono">{loading ? '' : `${matches.length} resources`}</span>
        </div>
        <div className="rows">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonResourceRow key={i} />)
            : matches.map((r) => (
                <ResourceCard
                  key={r.slug}
                  slug={r.slug}
                  title={r.title}
                  description={r.description}
                  type={r.type}
                  access={r.access}
                  url={r.url}
                  category={name}
                  color={color}
                />
              ))}
        </div>
      </section>
    </Layout>
  );
}
