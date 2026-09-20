import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { CATEGORY_COLORS } from '../lib/categories';

interface LayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const stripeColors = Object.entries(CATEGORY_COLORS)
  .filter(([name]) => name !== 'Emergency')
  .map(([, color]) => color);

export function Layout({ title, description = 'Every official Ashesi link, on one board.', children }: LayoutProps) {
  useEffect(() => {
    document.title = `${title} · Ashesi Resource Hub`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);

  return (
    <div className="page">
      <div className="stripe" aria-hidden="true">
        {stripeColors.map((c, i) => (
          <span key={i} style={{ background: c }}></span>
        ))}
      </div>

      <header className="site-header">
        <div className="wrap header-inner">
          <Link to="/" className="logo" aria-label="Ashesi Resource Hub">
            <span className="logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="square"><path d="M4 6h16M4 12h10M4 18h13"></path></svg>
            </span>
            <span className="wordmark">Resource Hub</span>
          </Link>
          <span className="spacer"></span>
          <Link to="/contacts" className="contacts-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Contacts
          </Link>
          <Link to="/emergency" className="sos-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"><path d="M12 3 4 6.4v5.8c0 4.6 3.2 8 8 9.8 4.8-1.8 8-5.2 8-9.8V6.4z"></path><path d="M12 8.6v4.6M12 16.6v.9"></path></svg>
            SOS
          </Link>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="wrap">
          <p>Ashesi Resource Hub — a student-facing directory of official Ashesi links. Not affiliated content is never linked. Something wrong? Open any resource and flag it.</p>
        </div>
      </footer>
    </div>
  );
}
