'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Star, GitFork, Lock, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getUserRepos } from '@/lib/api';

const LANG_COLORS: Record<string,string> = {
  Python:'#3572A5',JavaScript:'#f1e05a',TypeScript:'#2b7489',C:'#555555',Ruby:'#701516',Go:'#00ADD8',Rust:'#dea584',
};

export default function DashboardPage() {
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!user) return;
    getUserRepos(user.username).then(r => { setRepos(r.data.results || r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) return null;

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'280px 1fr', gap:24 }}>
      {/* Sidebar */}
      <aside>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'24px 0' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#2f81f7,#bc8cff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, color:'#fff' }}>
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:700, fontSize:18 }}>{user.username}</div>
            {user.bio && <div style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>{user.bio}</div>}
          </div>
          <div style={{ display:'flex', gap:20, fontSize:13 }}>
            <span><b>{user.followers_count}</b> <span style={{ color:'var(--text-secondary)' }}>followers</span></span>
            <span><b>{user.following_count}</b> <span style={{ color:'var(--text-secondary)' }}>following</span></span>
          </div>
          <Link href={`/${user.username}`} className="btn btn-secondary" style={{ width:'100%', justifyContent:'center' }}>View profile</Link>
        </div>
      </aside>

      {/* Main */}
      <main>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:20, fontWeight:700 }}>Your repositories</h2>
          <Link href="/new" className="btn btn-primary"><Plus size={15}/> New</Link>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[...Array(4)].map((_,i) => <div key={i} className="card skeleton" style={{ height:100 }} />)}
          </div>
        ) : repos.length === 0 ? (
          <div className="card" style={{ padding:40, textAlign:'center' }}>
            <p style={{ color:'var(--text-secondary)', marginBottom:16 }}>You don't have any repositories yet.</p>
            <Link href="/new" className="btn btn-primary"><Plus size={15}/> Create repository</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {repos.map((r,i) => (
              <div key={i} className="card fade-in" style={{ padding:20, display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    {r.visibility === 'private' ? <Lock size={14} color="var(--text-secondary)"/> : <Globe size={14} color="var(--text-secondary)"/>}
                    <Link href={`/${user.username}/${r.name}`} style={{ fontWeight:600, fontSize:15, color:'var(--text-link)' }}>{r.name}</Link>
                    <span className="badge" style={{ background:'var(--bg-overlay)', color:'var(--text-secondary)', fontSize:11 }}>{r.visibility}</span>
                  </div>
                  {r.description && <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{r.description}</p>}
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-secondary)' }}>
                    {r.language && <span style={{ display:'flex', alignItems:'center', gap:4 }}><span className="lang-dot" style={{ background:LANG_COLORS[r.language]||'#8b949e' }}/>{r.language}</span>}
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={12}/>{r.stars_count}</span>
                    <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
