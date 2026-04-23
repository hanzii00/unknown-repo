'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, GitBranch } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { searchUsers, exploreRepos } from '@/lib/api';

export default function Navbar() {
  const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const [usersRes, reposRes] = await Promise.all([
          searchUsers(query),
          exploreRepos({ q: query }),
        ]);
        setResults([
          ...usersRes.data.slice(0, 3).map((u: any) => ({ ...u, _type: 'user' })),
          ...reposRes.data.slice(0, 3).map((r: any) => ({ ...r, _type: 'repo' })),
        ]);
        setShowResults(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <nav style={{ background: '#161b22', borderBottom: '1px solid #30363d', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16, height: 62 }}>
        <Link href="/" style={{ color: '#fff', display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <GitBranch size={22} color="#fff" />
          <span style={{ fontWeight: 700, fontSize: 17, fontFamily: 'JetBrains Mono, monospace', letterSpacing: -0.5 }}>GitClone</span>
        </Link>

        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} color="var(--text-secondary)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, height: 32, fontSize:13 }}
            placeholder="Search or jump to..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {showResults && results.length > 0 && (
            <div className="card fade-in" style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200 }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{ padding:'8px 12px', cursor:'pointer', display:'flex', gap:8, alignItems:'center', borderBottom: i < results.length-1 ? '1px solid var(--border-muted)' : 'none' }}
                  onMouseDown={() => {
                    r._type === 'user' ? router.push(`/${r.username}`) : router.push(`/${r.owner.username}/${r.name}`);
                    setShowResults(false); setQuery('');
                  }}
                >
                  <span style={{ color:'var(--text-secondary)', fontSize:11 }}>{r._type === 'user' ? 'USER' : 'REPO'}</span>
                  <span>{r._type === 'user' ? r.username : `${r.owner.username}/${r.name}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
          <Link href="/explore" style={{ color:'var(--text-secondary)', textDecoration:'none', fontSize:14, padding:'4px 8px' }}>Explore</Link>
          {isAuthenticated ? (
            <>
              <Link href="/new" className="btn btn-secondary" style={{ height:30, padding:'0 10px' }}><Plus size={15}/> New</Link>
              <Link href="/dashboard" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#2f81f7,#bc8cff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </Link>
              <button className="btn btn-secondary" style={{ height:30, padding:'0 10px' }} onClick={() => { logout(); router.push('/'); }}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary" style={{ height:30, padding:'0 12px' }}>Sign in</Link>
              <Link href="/register" className="btn btn-primary" style={{ height:30, padding:'0 12px' }}>Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
