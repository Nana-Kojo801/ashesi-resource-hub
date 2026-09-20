import { Link } from 'react-router-dom';

export interface ResourceCardProps {
  slug: string;
  title: string;
  description: string;
  type: string;
  access: string;
  url: string;
  category: string;
  color: string;
  aliasHit?: string | null;
}

const ACCESS_COLOR: Record<string, string> = {
  Public: '#276852',
  'Ashesi login required': '#8A6015',
  'Ashesi students': '#6B5F58',
  'External service': '#86603D',
  'Ashesi community': '#86603D',
};

export function ResourceCard({ slug, title, description, type, access, url, category, color, aliasHit = null }: ResourceCardProps) {
  const accessColor = ACCESS_COLOR[access] || '#6B5F58';
  let host = url.replace(/^mailto:/, '').replace(/^tel:/, '');
  if (/^https?:\/\//.test(url)) host = url.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <Link className="resource-row" to={`/resource/${slug}`} data-category={category}>
      <span className="spine" style={{ background: color }}></span>
      <div className="row-body">
        <div className="row-top">
          <h3 className="row-title">{title}</h3>
          {aliasHit && <span className="alias-badge mono">also called "{aliasHit}"</span>}
        </div>
        <p className="row-desc">{description}</p>
        <div className="row-meta mono">
          <span>{type}</span>
          <span className="dot">·</span>
          <span style={{ color: accessColor }}>{access}</span>
          <span className="dot">·</span>
          <span className="host">{host}</span>
        </div>
      </div>
      <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M9 5l7 7-7 7"></path></svg>
    </Link>
  );
}
