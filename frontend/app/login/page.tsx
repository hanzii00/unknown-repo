'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch, Eye, EyeOff } from 'lucide-react';
import { login, getMe } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await login(form);
      setTokens(data.access, data.refresh);
      const me = await getMe();
      setUser(me.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <GitBranch size={40} style={{ margin:'0 auto 12px' }} />
          <h1 style={{ fontSize:24, fontWeight:700 }}>Sign in to GitClone</h1>
        </div>
        <div className="card" style={{ padding:24 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {error && (
              <div style={{ background:'rgba(248,81,73,0.1)', border:'1px solid var(--accent-red)', borderRadius:6, padding:'10px 14px', color:'var(--accent-red)', fontSize:13 }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ display:'block', marginBottom:6, fontWeight:500, fontSize:13 }}>Username</label>
              <input className="input" value={form.username} onChange={e => setForm({...form, username:e.target.value})} required autoFocus />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:6, fontWeight:500, fontSize:13 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})} required style={{ paddingRight:40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)' }}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'8px', fontSize:15 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <div className="card" style={{ padding:16, marginTop:12, textAlign:'center' }}>
          New to GitClone? <Link href="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
