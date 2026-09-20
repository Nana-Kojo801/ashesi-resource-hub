import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SkeletonResourceRow } from '../components/Skeleton';
import { useResources } from '../lib/useResources';
import { runMotion } from '../lib/motion';

export function ContactsPage() {
  const navigate = useNavigate();
  const { resources, loading } = useResources();

  const contacts = (resources ?? []).filter(
    (r) => r.category === 'Offices & People' || r.type === 'Contact'
  );

  useEffect(() => {
    if (!loading) runMotion();
  }, [loading]);

  return (
    <Layout title="Contacts" description="All Ashesi office contacts — email and phone.">
      <section className="wrap category-page">
        <button className="back mono" onClick={() => navigate(-1)}>← Back</button>

        <div className="head">
          <span className="bar" style={{ background: '#B08968' }}></span>
          <h1>Contacts</h1>
          {!loading && (
            <span className="count mono">{contacts.length} contacts</span>
          )}
        </div>

        <div className="rows">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonResourceRow key={i} />)
            : contacts.map((r) => {
                const isEmail = r.url.startsWith('mailto:');
                const isPhone = r.url.startsWith('tel:');
                const display = r.url.replace(/^mailto:|^tel:/, '');

                return (
                  <a className="contact-row" href={r.url} key={r.slug}>
                    <span className="contact-icon">
                      {isEmail ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <path d="M4 5h16v14H4z"/><path d="m4 6 8 7 8-7"/>
                        </svg>
                      ) : isPhone ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <path d="M6.6 10.8a15.4 15.4 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                        </svg>
                      )}
                    </span>
                    <div className="contact-body">
                      <span className="contact-name">{r.title}</span>
                      <span className="contact-desc">{r.description}</span>
                      <span className="contact-link mono">{display}</span>
                    </div>
                    <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M9 5l7 7-7 7"/></svg>
                  </a>
                );
              })}
        </div>
      </section>
    </Layout>
  );
}
