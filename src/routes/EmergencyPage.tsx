import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { runMotion } from '../lib/motion';

const EMERGENCY = [
  {
    tag: 'Security incident',
    who: 'Ashesi Security',
    number: '+233 201 722 818',
    icon: 'shield',
  },
  {
    tag: 'Medical emergency',
    who: 'Natembea Health Center',
    number: '+233 501 331 668',
    icon: 'cross',
  },
  {
    tag: 'Sexual misconduct',
    who: 'First response & reporting support',
    number: '+233 501 260 277',
    icon: 'alert',
  },
  {
    tag: 'General support',
    who: 'Ashesi general support line',
    number: '+233 501 673 669',
    icon: 'buoy',
  },
];

function tel(n: string) {
  return 'tel:' + n.replace(/[^0-9+]/g, '');
}

const ICONS: Record<string, string> = {
  shield: 'M12 3 4 6.4v5.8c0 4.6 3.2 8 8 9.8 4.8-1.8 8-5.2 8-9.8V6.4z|M12 8.6v4.6M12 16.4v1',
  cross: 'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8|M12 8.2v7.6M8.2 12h7.6',
  alert: 'M12 3.4 21 19.6H3z|M12 9.6v4.4M12 16.8v1',
  buoy: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2|M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2|M5.9 5.9 9.4 9.4M18.1 5.9 14.6 9.4M5.9 18.1l3.5-3.5M18.1 18.1l-3.5-3.5',
};

export function EmergencyPage() {
  const navigate = useNavigate();
  useEffect(() => {
    runMotion();
  }, []);

  return (
    <Layout title="Emergency" description="Campus safety numbers, one tap away.">
      <div className="emergency-top">
        <div className="wrap">
          <span className="sos-tag mono">SOS · Campus safety</span>
          <h1>If it's urgent, call now. Don't wait for a form.</h1>
        </div>
      </div>

      <section className="wrap back-link" style={{ paddingTop: 24, paddingBottom: 0 }}>
        <button className="mono" onClick={() => navigate(-1)}>← Back to the resource board</button>
      </section>

      <section className="wrap emergency-list">
        {EMERGENCY.map((e) => (
          <a className="emergency-row" href={tel(e.number)} key={e.tag}>
            <span className="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                {ICONS[e.icon].split('|').map((d, i) => (
                  <path d={d} key={i}></path>
                ))}
              </svg>
            </span>
            <span className="body">
              <span className="tag mono">{e.tag}</span>
              <span className="who">{e.who}</span>
            </span>
            <span className="number mono">{e.number}</span>
          </a>
        ))}

        <a className="emergency-row" href="mailto:hotline@ashesi.edu.gh">
          <span className="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M4 5h16v14H4z"></path><path d="m4 6 8 7 8-7"></path></svg>
          </span>
          <span className="body">
            <span className="tag mono">Academic emergency</span>
            <span className="who">Academic Affairs Hotline — 24/7 urgent academic assistance</span>
          </span>
          <span className="number mono">hotline@ashesi.edu.gh</span>
        </a>
      </section>

    </Layout>
  );
}
