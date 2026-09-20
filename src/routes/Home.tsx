import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SearchBox } from '../components/SearchBox';
import { CategorySection } from '../components/CategorySection';
import { SkeletonTabs, SkeletonCategorySection } from '../components/Skeleton';
import { useResources } from '../lib/useResources';
import { CATEGORY_COLORS, sortCategories, slugifyCategory } from '../lib/categories';
import { runMotion } from '../lib/motion';
import type { Resource } from '../lib/types';

const INTENT_CHIPS = [
  'my hostel AC is broken',
  'I need a transcript',
  'someone to talk to',
  'I want an internship',
  'check my meal plan',
];

export function Home() {
  const { resources, loading } = useResources();

  useEffect(() => {
    if (!loading) runMotion();
  }, [loading]);

  // Contacts & Emergency have their own dedicated surfaces (the emergency
  // page, and can be found via search) — the home board mirrors the design
  // prototype's "lines" (categories), which excluded the Offices & People
  // and Emergency groups from the tab-style browse grid.
  const boardResources = (resources ?? []).filter(
    (r) => r.category !== 'Offices & People' && r.category !== 'Emergency'
  );

  const byCategory = new Map<string, Resource[]>();
  for (const r of boardResources) {
    const list = byCategory.get(r.category) || [];
    list.push(r);
    byCategory.set(r.category, list);
  }
  const orderedNames = sortCategories([...byCategory.keys()]);

  return (
    <Layout title="Ashesi Resource Hub">
      <section className="hero wrap">
        <h1>Every official Ashesi link, on one board.</h1>
        <p>
          Portals, forms, bookings, offices and phone numbers — kept in one place
          and checked against official sources. Say what you need, even if you
          don't know what it's called.
        </p>
        <div className="search-slot">
          <SearchBox />
        </div>
        <div className="chips">
          {INTENT_CHIPS.map((c) => (
            <Link className="chip mono" to={`/?q=${encodeURIComponent(c)}`} key={c}>{c}</Link>
          ))}
        </div>
      </section>

      {loading ? (
        <>
          <div className="wrap"><SkeletonTabs /></div>
          <section className="wrap board">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCategorySection key={i} />
            ))}
          </section>
        </>
      ) : (
        <>
          <nav className="tabs wrap" aria-label="Browse by category">
            {orderedNames.map((name) => (
              <Link className="tab mono" to={`/category/${slugifyCategory(name)}`} key={name}>
                <span className="dot" style={{ background: CATEGORY_COLORS[name] || '#B3A48F' }}></span>
                {name}
              </Link>
            ))}
            <Link className="tab mono" to="/category/offices-and-people">
              <span className="dot" style={{ background: '#B08968' }}></span>
              Offices &amp; People
            </Link>
          </nav>

          <section className="wrap board">
            {orderedNames.map((name) => (
              <CategorySection
                key={name}
                name={name}
                slug={slugifyCategory(name)}
                color={CATEGORY_COLORS[name] || '#6B5F58'}
                resources={byCategory.get(name) || []}
              />
            ))}
          </section>
        </>
      )}
    </Layout>
  );
}
