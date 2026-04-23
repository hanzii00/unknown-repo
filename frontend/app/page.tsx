'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, GitFork, Code2, BookOpen, Users, Zap } from 'lucide-react';
import { exploreRepos } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#2b7489',
  C: '#555555', Ruby: '#701516', Go: '#00ADD8', Rust: '#dea584',
  Java: '#b07219', 'C++': '#f34b7d', Swift: '#ffac45',
};

function RepoCard({ repo }: { repo: any }) {
  return (
    <div className="card fade-in" style={{ padding: 16, display:'flex', flexDirection:'column', gap:8, transition:'border-color 0.15s', cursor:'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b949e')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <Link href={`/${repo.owner.username}/${repo.name}`} style={{ fontWeight:600, fontSize:15, color:'var(--text-link)' }}>
          {repo.owner.username}/{repo.name}
        </Link>
        <span className="badge" style={{ background:'rgba(47,129,247,0.15)', color:'var(--accent-blue)', fontSize:11 }}>
          {repo.visibility}
        </span>
      </div>
      {repo.description && <p style={{ color:'var(--text-secondary)', fontSize:13, lineHeight:1.5 }}>{repo.description}</p>}
      <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:'auto', fontSize:12, color:'var(--text-secondary)' }}>
        {repo.language && (
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span className="lang-dot" style={{ background: LANG_COLORS[repo.language] || '#8b949e' }} />
            {repo.language}
          </span>
        )}
        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={12} />{repo.stars_count}</span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}><GitFork size={12} />{repo.forks_count}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exploreRepos().then(r => { setRepos(r.data.slice(0, 6)); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)', borderBottom: '1px solid var(--border-default)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', background:'rgba(47,129,247,0.1)', border:'1px solid rgba(47,129,247,0.3)', borderRadius:20, marginBottom:24, fontSize:13, color:'var(--accent-blue)' }}>
            <Zap size={13} /> Open source collaboration platform
          </div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight:800, lineHeight:1.1, letterSpacing:-2, marginBottom:20 }}>
            Build software.<br />
            <span style={{ background:'linear-gradient(135deg,#2f81f7,#bc8cff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Together.
            </span>
          </h1>
          <p style={{ fontSize:18, color:'var(--text-secondary)', maxWidth:540, margin:'0 auto 32px', lineHeight:1.6 }}>
            GitClone is where developers store, manage, and collaborate on code. Ship better software, faster.
          </p>
          {!isAuthenticated ? (
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/register" className="btn btn-primary" style={{ fontSize:16, padding:'10px 28px' }}>Create free account</Link>
              <Link href="/explore" className="btn btn-secondary" style={{ fontSize:16, padding:'10px 28px' }}>Explore repos</Link>
            </div>
          ) : (
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/dashboard" className="btn btn-primary" style={{ fontSize:16, padding:'10px 28px' }}>Go to dashboard</Link>
              <Link href="/new" className="btn btn-secondary" style={{ fontSize:16, padding:'10px 28px' }}>New repository</Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ borderBottom:'1px solid var(--border-default)', background:'var(--bg-default)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'20px 24px', display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap' }}>
          {[
            { icon: <Code2 size={18}/>, label: 'Repositories', value: repos.length + '+' },
            { icon: <Users size={18}/>, label: 'Developers', value: '100+' },
            { icon: <BookOpen size={18}/>, label: 'Languages', value: '20+' },
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-secondary)' }}>
              {s.icon}
              <span style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', fontFamily:'JetBrains Mono,monospace' }}>{s.value}</span>
              <span style={{ fontSize:14 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending repos */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:700 }}>Trending repositories</h2>
          <Link href="/explore" style={{ color:'var(--text-link)', fontSize:14 }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {[...Array(6)].map((_,i) => (
              <div key={i} className="card" style={{ padding:16, height:120 }}>
                <div className="skeleton" style={{ height:16, width:'60%', marginBottom:8 }} />
                <div className="skeleton" style={{ height:12, width:'90%', marginBottom:8 }} />
                <div className="skeleton" style={{ height:12, width:'40%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {repos.map((r,i) => <RepoCard key={i} repo={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
