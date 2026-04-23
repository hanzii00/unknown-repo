'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, GitFork, Eye, Code, AlertCircle, GitBranch, Copy, Check, Upload, Trash2, File } from 'lucide-react';
import { getRepo, starRepo, getIssues, getRepoFiles, uploadFile, deleteFile } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const LANG_COLORS: Record<string,string> = {
  Python:'#3572A5',JavaScript:'#f1e05a',TypeScript:'#2b7489',C:'#555555',Ruby:'#701516',Go:'#00ADD8',Rust:'#dea584',Java:'#b07219',
};

export default function RepoPage({ params }: { params: Promise<{ username: string; repo: string }> }) {
  const { username, repo: repoName } = React.use(params);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [repo, setRepo] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starring, setStarring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('code');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const repoRes = await getRepo(username, repoName);
        setRepo(repoRes.data);
      } catch (err) {
        setRepo(null);
      }

      try {
        const issuesRes = await getIssues(username, repoName);
        setIssues(issuesRes.data.results || issuesRes.data || []);
      } catch (err) {
        setIssues([]);
      }

      try {
        const filesRes = await getRepoFiles(username, repoName);
        const filesList = Array.isArray(filesRes.data) ? filesRes.data : filesRes.data?.results || [];
        setFiles(filesList);
      } catch (err) {
        setFiles([]);
      }

      setLoading(false);
    };

    loadData();
  }, [username, repoName]);

  const handleStar = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setStarring(true);
    try {
      const { data } = await starRepo(username, repoName);
      setRepo((r: any) => ({ ...r, is_starred: data.starred, stars_count: data.stars_count }));
    } finally { setStarring(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`git clone http://localhost:8000/api/repos/${username}/${repoName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadFile(username, repoName, file, file.name);
      const filesRes = await getRepoFiles(username, repoName);
      const filesList = Array.isArray(filesRes.data) ? filesRes.data : filesRes.data?.results || [];
      setFiles(filesList);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Delete this file?')) return;
    try {
      await deleteFile(username, repoName, fileId);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  if (loading) return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px' }}>
      <div className="skeleton" style={{ height:32, width:300, marginBottom:16 }} />
      <div className="skeleton" style={{ height:200, borderRadius:8 }} />
    </div>
  );

  if (!repo) return <div style={{ padding:60, textAlign:'center', color:'var(--text-secondary)' }}>Repository not found</div>;

  const tabs = [
    { id:'code', icon:<Code size={15}/>, label:'Code' },
    { id:'issues', icon:<AlertCircle size={15}/>, label:'Issues', count: issues.length },
  ];

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px 24px 0' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <GitBranch size={18} color="var(--text-secondary)" />
        <Link href={`/${username}`} style={{ color:'var(--text-link)', fontWeight:500, fontSize:18 }}>{username}</Link>
        <span style={{ color:'var(--text-secondary)', fontSize:20 }}>/</span>
        <span style={{ fontWeight:700, fontSize:18 }}>{repoName}</span>
        <span className="badge" style={{ background:'var(--bg-overlay)', color:'var(--text-secondary)', fontSize:12, border:'1px solid var(--border-default)' }}>{repo.visibility}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button
            onClick={handleStar}
            disabled={starring}
            className="btn btn-secondary"
            style={{ gap:6, color: repo.is_starred ? 'var(--accent-orange)' : 'var(--text-primary)' }}
          >
            <Star size={15} fill={repo.is_starred ? 'var(--accent-orange)' : 'none'} />
            {repo.is_starred ? 'Starred' : 'Star'} · {repo.stars_count}
          </button>
          <button className="btn btn-secondary" style={{ gap:6 }}>
            <GitFork size={15} /> Fork · {repo.forks_count}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid var(--border-default)', display:'flex', gap:0, marginBottom:0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', border:'none', background:'none',
              color: activeTab===tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab===tab.id ? '2px solid var(--accent-orange)' : '2px solid transparent',
              cursor:'pointer', fontSize:14, fontWeight: activeTab===tab.id ? 600 : 400 }}
          >
            {tab.icon} {tab.label}
            {'count' in tab && <span className="badge" style={{ background:'var(--bg-overlay)', color:'var(--text-secondary)', fontSize:11 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Code Tab */}
      {activeTab === 'code' && (
        <div style={{ paddingTop:24, display:'grid', gridTemplateColumns:'1fr 280px', gap:24 }}>
          <div>
            {/* Clone box */}
            <div className="card" style={{ overflow:'hidden', marginBottom:24 }}>
              <div style={{ padding:'12px 16px', background:'var(--bg-overlay)', borderBottom:'1px solid var(--border-default)', display:'flex', alignItems:'center', gap:8 }}>
                <GitBranch size={14} color="var(--accent-green)" />
                <span style={{ fontSize:13, fontWeight:500, color:'var(--accent-green)' }}>{repo.default_branch}</span>
                <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                  <button onClick={handleCopy} className="btn btn-primary" style={{ height:28, padding:'0 12px', fontSize:12 }}>
                    {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Clone</>}
                  </button>
                </div>
              </div>
              <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ background:'var(--bg-inset)', border:'1px solid var(--border-muted)', borderRadius:6, padding:'10px 14px', fontFamily:'JetBrains Mono, monospace', fontSize:13, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--text-secondary)' }}>git clone </span>
                  <span style={{ color:'var(--text-link)' }}>http://localhost:8000/api/{username}/{repoName}</span>
                </div>

                {/* Readme-style info */}
                <div style={{ padding:'16px', background:'var(--bg-overlay)', borderRadius:6, border:'1px solid var(--border-muted)' }}>
                  <h3 style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, marginBottom:12 }}>📄 {repoName}</h3>
                  {repo.description && <p style={{ color:'var(--text-secondary)', lineHeight:1.6, marginBottom:12 }}>{repo.description}</p>}
                  {repo.topics?.length > 0 && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {repo.topics.map((t: string) => (
                        <span key={t} className="badge" style={{ background:'rgba(47,129,247,0.15)', color:'var(--accent-blue)', fontSize:12 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:24, fontSize:13, color:'var(--text-secondary)', padding:'8px 0' }}>
                  {repo.language && (
                    <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span className="lang-dot" style={{ background: LANG_COLORS[repo.language]||'#8b949e' }} />
                      <b style={{ color:'var(--text-primary)' }}>{repo.language}</b>
                    </span>
                  )}
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}><Star size={13}/><b style={{ color:'var(--text-primary)' }}>{repo.stars_count}</b> stars</span>
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}><GitFork size={13}/><b style={{ color:'var(--text-primary)' }}>{repo.forks_count}</b> forks</span>
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}><AlertCircle size={13}/><Link href={`/${username}/${repoName}/issues`} style={{ color:'var(--text-primary)', textDecoration:'none' }}><b>{issues.length}</b> issues</Link></span>
                </div>
              </div>
            </div>

            {/* Files */}
            <div className="card" style={{ overflow:'hidden', marginBottom:24 }}>
              <div style={{ padding:'12px 16px', background:'var(--bg-overlay)', borderBottom:'1px solid var(--border-default)', display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
                <span style={{ fontWeight:600, fontSize:14 }}>📁 Files</span>
                {user?.username === username && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      style={{ display:'none' }}
                    />
                    <button
                      className="btn btn-secondary"
                      style={{ height:28, padding:'0 12px', fontSize:12, gap:6 }}
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={12}/> {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </>
                )}
              </div>
              {files.length === 0 ? (
                <div style={{ padding:'40px 24px', textAlign:'center', color:'var(--text-secondary)' }}>
                  <File size={32} style={{ margin:'0 auto 12px', opacity:0.3 }} />
                  <p style={{ fontSize:14 }}>No files yet. {user?.username === username ? 'Upload files to get started.' : ''}</p>
                </div>
              ) : (
                <div>
                  {files.map((file: any, i: number) => (
                    <div key={file.id} style={{ padding:'12px 16px', borderBottom: i<files.length-1?'1px solid var(--border-muted)':'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <File size={14} color="var(--accent-blue)" />
                        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:13 }}>{file.path}</span>
                        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>({(file.size/1024).toFixed(1)}KB)</span>
                      </div>
                      {user?.username === username && (
                        <button onClick={() => handleDeleteFile(file.id)} style={{ background:'none', border:'none', color:'var(--accent-red)', cursor:'pointer', padding:'4px 8px' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent issues preview */}
            {issues.length > 0 && (
              <div className="card" style={{ overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-default)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600 }}>Open Issues</span>
                  <Link href={`/${username}/${repoName}/issues`} style={{ fontSize:13 }}>View all</Link>
                </div>
                {issues.slice(0,3).map((iss: any) => (
                  <div key={iss.id} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-muted)', display:'flex', gap:10 }}>
                    <AlertCircle size={16} color="var(--accent-green)" style={{ marginTop:2, flexShrink:0 }} />
                    <div>
                      <Link href={`/${username}/${repoName}/issues/${iss.number}`} style={{ fontWeight:500, color:'var(--text-primary)', textDecoration:'none' }}>
                        {iss.title}
                      </Link>
                      <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>
                        #{iss.number} opened by {iss.author.username}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <aside style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <h3 style={{ fontSize:12, fontWeight:600, marginBottom:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:0.5 }}>About</h3>
              {repo.description && <p style={{ fontSize:14, lineHeight:1.6, marginBottom:12 }}>{repo.description}</p>}
              {repo.topics?.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                  {repo.topics.map((t: string) => (
                    <span key={t} className="badge" style={{ background:'rgba(47,129,247,0.15)', color:'var(--accent-blue)', fontSize:12 }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:14, color:'var(--text-secondary)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}><Star size={14}/>{repo.stars_count} stars</span>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}><Eye size={14}/>{repo.forks_count} watching</span>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}><GitFork size={14}/>{repo.forks_count} forks</span>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize:12, fontWeight:600, marginBottom:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:0.5 }}>Languages</h3>
              {repo.language ? (
                <div>
                  <div style={{ height:8, borderRadius:4, background:`linear-gradient(90deg, ${LANG_COLORS[repo.language]||'#8b949e'} 100%, transparent 100%)`, marginBottom:8 }} />
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                    <span className="lang-dot" style={{ background:LANG_COLORS[repo.language]||'#8b949e' }} />
                    <b>{repo.language}</b>
                    <span style={{ color:'var(--text-secondary)' }}>100%</span>
                  </div>
                </div>
              ) : <span style={{ color:'var(--text-secondary)', fontSize:13 }}>Not specified</span>}
            </div>
          </aside>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div style={{ paddingTop:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', gap:16, fontSize:14 }}>
              <span style={{ fontWeight:600 }}><AlertCircle size={14} style={{ display:'inline', marginRight:4 }}/>{issues.length} Open</span>
            </div>
            {isAuthenticated && (
              <Link href={`/${username}/${repoName}/issues/new`} className="btn btn-primary">New issue</Link>
            )}
          </div>
          <div className="card" style={{ overflow:'hidden' }}>
            {issues.length === 0 ? (
              <div style={{ padding:'60px 0', textAlign:'center', color:'var(--text-secondary)' }}>
                <AlertCircle size={40} style={{ margin:'0 auto 12px', opacity:0.3 }} />
                <p>No open issues</p>
              </div>
            ) : issues.map((iss: any, i: number) => (
              <div key={iss.id} style={{ padding:'16px', borderBottom: i<issues.length-1?'1px solid var(--border-muted)':'none', display:'flex', gap:12 }}>
                <AlertCircle size={16} color="var(--accent-green)" style={{ marginTop:2, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                    <Link href={`/${username}/${repoName}/issues/${iss.number}`} style={{ fontWeight:600, color:'var(--text-primary)', textDecoration:'none', fontSize:15 }}>
                      {iss.title}
                    </Link>
                    {iss.labels?.map((l: string) => (
                      <span key={l} className="badge" style={{ background:'rgba(63,185,80,0.15)', color:'var(--accent-green)', fontSize:11 }}>{l}</span>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>
                    #{iss.number} opened {new Date(iss.created_at).toLocaleDateString()} by {iss.author.username}
                    {iss.comments_count > 0 && <span style={{ marginLeft:12 }}>💬 {iss.comments_count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
