'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Link2, Building, Users, Star, GitFork } from 'lucide-react';
import { getUser, getUserRepos, followUser } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const LANG_COLORS: Record<string,string> = {
  Python:'#3572A5',JavaScript:'#f1e05a',TypeScript:'#2b7489',C:'#555555',Ruby:'#701516',Go:'#00ADD8',Rust:'#dea584',
};

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = React.use(params);
  const { user: me, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await getUser(username);
        setProfile(userRes.data);
        setFollowing(userRes.data.is_following);
      } catch (err) {
        setProfile(null);
      }

      try {
        const reposRes = await getUserRepos(username);
        setRepos(reposRes.data.results || reposRes.data || []);
      } catch (err) {
        setRepos([]);
      }

      setLoading(false);
    };

    loadData();
  }, [username]);

  const handleFollow = async () => {
    const { data } = await followUser(username);
    setFollowing(data.following);
    setProfile((p: any) => ({ ...p, followers_count: p.followers_count + (data.following ? 1 : -1) }));
  };

  if (loading) return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'280px 1fr', gap:24 }}>
      <div className="skeleton" style={{ height:300, borderRadius:8 }} />
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {[...Array(3)].map((_,i) => <div key={i} className="card skeleton" style={{ height:100 }} />)}
      </div>
    </div>
  );

  if (!profile) return <div style={{ padding:40, textAlign:'center', color:'var(--text-secondary)' }}>User not found</div>;

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'280px 1fr', gap:32 }}>
      {/* Sidebar */}
      <aside style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ width:'100%', aspectRatio:'1', borderRadius:'50%', background:'linear-gradient(135deg,#2f81f7,#bc8cff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, fontWeight:700, color:'#fff' }}>
          {profile.username[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>{profile.username}</h1>
          {profile.bio && <p style={{ color:'var(--text-secondary)', fontSize:14, marginTop:4, lineHeight:1.5 }}>{profile.bio}</p>}
        </div>
        {isAuthenticated && me?.username !== username && (
          <button onClick={handleFollow} className={`btn ${following?'btn-secondary':'btn-primary'}`} style={{ width:'100%', justifyContent:'center' }}>
            {following ? 'Unfollow' : 'Follow'}
          </button>
        )}
        <div style={{ display:'flex', gap:16, fontSize:14 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Users size={14}/><b>{profile.followers_count}</b> followers</span>
          <span>·</span>
          <span><b>{profile.following_count}</b> following</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:14, color:'var(--text-secondary)' }}>
          {profile.company && <span style={{ display:'flex', alignItems:'center', gap:8 }}><Building size={14}/>{profile.company}</span>}
          {profile.location && <span style={{ display:'flex', alignItems:'center', gap:8 }}><MapPin size={14}/>{profile.location}</span>}
          {profile.website && <a href={profile.website} style={{ display:'flex', alignItems:'center', gap:8 }}><Link2 size={14}/>{profile.website}</a>}
        </div>
      </aside>

      {/* Main */}
      <main>
        <div style={{ borderBottom:'1px solid var(--border-default)', marginBottom:24, display:'flex', gap:0 }}>
          {['Repositories', 'Stars'].map((tab,i) => (
            <button key={tab} style={{ padding:'8px 16px', border:'none', background:'none', color: i===0?'var(--text-primary)':'var(--text-secondary)', borderBottom: i===0?'2px solid var(--accent-orange)':'2px solid transparent', cursor:'pointer', fontSize:14, fontWeight: i===0?600:400 }}>
              {tab} {i===0 && <span className="badge" style={{ background:'var(--bg-overlay)', color:'var(--text-secondary)', marginLeft:6 }}>{repos.length}</span>}
            </button>
          ))}
        </div>

        {repos.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-secondary)' }}>No public repositories yet.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {repos.map((r,i) => (
              <div key={i} className="card fade-in" style={{ padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <Link href={`/${username}/${r.name}`} style={{ fontWeight:600, fontSize:15, color:'var(--text-link)' }}>{r.name}</Link>
                  <span className="badge" style={{ background:'var(--bg-overlay)', color:'var(--text-secondary)', fontSize:11 }}>{r.visibility}</span>
                </div>
                {r.description && <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:10 }}>{r.description}</p>}
                <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-secondary)' }}>
                  {r.language && <span style={{ display:'flex', alignItems:'center', gap:4 }}><span className="lang-dot" style={{ background:LANG_COLORS[r.language]||'#8b949e' }}/>{r.language}</span>}
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={12}/>{r.stars_count}</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><GitFork size={12}/>{r.forks_count}</span>
                  <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
