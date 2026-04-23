'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch } from 'lucide-react';
import { register } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({}); setLoading(true);
    try {
      const { data } = await register(form);
      setTokens(data.access, data.refresh);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setErrors(err.response?.data || { non_field_errors: ['Registration failed'] });
    } finally { setLoading(false); }
  };

  const f = (field: string) => ({ value: (form as any)[field], onChange: (e: any) => setForm({...form, [field]: e.target.value}) });

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <GitBranch size={40} style={{ margin:'0 auto 12px' }} />
          <h1 style={{ fontSize:24, fontWeight:700 }}>Create your account</h1>
        </div>
        <div className="card" style={{ padding:24 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {['username','email','password'].map(field => (
              <div key={field}>
                <label style={{ display:'block', marginBottom:6, fontWeight:500, fontSize:13, textTransform:'capitalize' }}>{field}</label>
                <input className="input" type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} {...f(field)} required minLength={field==='password'?8:undefined} />
                {errors[field] && <p style={{ color:'var(--accent-red)', fontSize:12, marginTop:4 }}>{errors[field][0]}</p>}
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'8px', fontSize:15 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
        <div className="card" style={{ padding:16, marginTop:12, textAlign:'center' }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
