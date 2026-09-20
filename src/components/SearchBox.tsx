import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { Skeleton } from './Skeleton';

interface SearchItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  aliases: string[];
  url: string;
}

export function SearchBox() {
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/resources.json')
      .then((res) => res.json())
      .then((data: SearchItem[]) => {
        if (cancelled) return;
        fuseRef.current = new Fuse(data, {
          keys: [
            { name: 'aliases', weight: 0.5 },
            { name: 'title', weight: 0.3 },
            { name: 'description', weight: 0.2 },
          ],
          threshold: 0.35,
          includeScore: true,
        });
        setIndexLoaded(true);
      })
      .catch(() => {
        // Search index failed to load (offline first visit, etc). Fail
        // quietly — the browse-by-category flow still works without search.
        if (!cancelled) setIndexLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (!fuseRef.current || value.trim().length < 2) {
      setResults([]);
      return;
    }
    setResults(fuseRef.current.search(value).slice(0, 12).map((r) => r.item));
  }

  function clear() {
    setQuery('');
    setResults([]);
  }

  if (!indexLoaded) {
    return (
      <div className="searchbox">
        <div className="input-wrap skeleton-input" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
          <Skeleton height={16} width="70%" />
        </div>
      </div>
    );
  }

  return (
    <div className="searchbox">
      <div className="input-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
        <input
          type="text"
          value={query}
          onChange={onInput}
          placeholder="Say what you need — “CareerOS”, “my hostel AC is broken”…"
          aria-label="Search resources"
        />
        {query && (
          <button className="clear" type="button" onClick={clear} aria-label="Clear search">×</button>
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="results">
          {results.length === 0 ? (
            <p className="empty mono">No matches. Try a different word, or browse a category below.</p>
          ) : (
            results.map((r) => (
              <Link className="result-row" to={`/resource/${r.slug}`} key={r.slug}>
                <div className="result-body">
                  <span className="result-title">{r.title}</span>
                  <span className="result-desc">{r.description}</span>
                </div>
                <span className="result-cat mono">{r.category}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
