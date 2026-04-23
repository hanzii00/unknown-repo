'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, GitFork, Code2 } from 'lucide-react';
import { exploreRepos } from '@/lib/api';

const LANG_COLORS: Record<string,string> = {
  Python:'#3572A5',JavaScript:'#f1e05a',TypeScript:'#2b7489',
  C:'#555555',Ruby:'#701516',Go:'#00ADD8',Rust:'#dea584',
};

const LANGUAGES = ['Python','JavaScript','TypeScript','C','Ruby','Go','Rust','Java'];

export default function ExplorePage() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await exploreRepos({ q, language: lang });
      setRepos(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [lang]);

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px' }}>
      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:8 }}>Explore</h1>
      <p style={{ color:'var(--text-secondary)', marginBottom:28 }}>Discover interesting projects from the community</p>

      {/* Search + filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:240 }}>
          <Search size={14} color="var(--text-secondary)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
          <input className="input" style={{ paddingLeft:32 }} placeholder="Search repositories..." value={q}
            onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==='Enter' && fetch()} />
        </div>
        <select className="input" style={{ width:160 }} value={lang} onChange={e => setLang(e.target.value)}>
          <option value="">All languages</option>
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <button className="btn btn-primary" onClick={fetch}>Search</button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {[...Array(9)].map((_,i) => (
            <div key={i} className="card" style={{ padding:20, height:130 }}>
              <div className="skeleton" style={{ height:16, width:'55%', marginBottom:10 }} />
              <div className="skeleton" style={{ height:12, width:'90%', marginBottom:8 }} />
              <div className="skeleton" style={{ height:12, width:'40%' }} />
            </div>
          ))}
        </div>
      ) : repos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-secondary)' }}>
          <Code2 size={48} style={{ margin:'0 auto 16px', opacity:0.3 }} />
          <p style={{ fontSize:18, marginBottom:8 }}>No repositories found</p>
          <p>Try a different search term or language</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {repos.map((r,i) => (
            <div key={i} className="card fade-in" style={{ padding:20, display:'flex', flexDirection:'column', gap:10, transition:'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='#8b949e')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='var(--border-default)')}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <Link href={`/${r.owner.username}/${r.name}`} style={{ fontWeight:600, fontSize:15, color:'var(--text-link)' }}>
                  {r.owner.username}/{r.name}
                </Link>
              </div>
              {r.description && <p style={{ color:'var(--text-secondary)', fontSize:13, lineHeight:1.5 }}>{r.description}</p>}
              {r.topics?.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {r.topics.slice(0,4).map((t: string) => (
                    <span key={t} className="badge" style={{ background:'rgba(47,129,247,0.15)', color:'var(--accent-blue)', fontSize:11 }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-secondary)', marginTop:'auto' }}>
                {r.language && (
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span className="lang-dot" style={{ background: LANG_COLORS[r.language]||'#8b949e' }} />{r.language}
                  </span>
                )}
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={12}/>{r.stars_count}</span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><GitFork size={12}/>{r.forks_count}</span>
                <span style={{ marginLeft:'auto' }}>{new Date(r.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
