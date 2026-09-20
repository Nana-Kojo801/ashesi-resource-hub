import { Link } from 'react-router-dom';
import { ResourceCard } from './ResourceCard';
import type { Resource } from '../lib/types';

export interface CategorySectionProps {
  name: string;
  slug: string;
  color: string;
  resources: Resource[];
}

export function CategorySection({ name, slug, color, resources }: CategorySectionProps) {
  return (
    <section className="category-section" data-reveal>
      <div className="section-head">
        <span className="bar" style={{ background: color }}></span>
        <h2 className="section-name">{name}</h2>
        <span className="count mono">{resources.length}</span>
        <Link className="see-all mono" to={`/category/${slug}`}>See all →</Link>
      </div>
      <div className="rows">
        {resources.slice(0, 5).map((r) => (
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
  );
}
