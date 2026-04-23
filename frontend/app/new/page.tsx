'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { createRepo } from '@/lib/api';
import { Lock, Globe } from 'lucide-react';

const LANGUAGES = ['Python','JavaScript','TypeScript','C','C++','Ruby','Go','Rust','Java','Swift','Kotlin'];

export default function NewRepoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name:'', description:'', visibility:'public', language:'', topics:'' });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({}); setLoading(true);
    try {
      const payload = { ...form, topics: form.topics.split(',').map(t=>t.trim()).filter(Boolean) };
      await createRepo(payload);
      router.push(`/${user?.username}/${form.name}`);
    } catch (err: any) {
      setErrors(err.response?.data || {});
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:680, margin:'40px auto', padding:'0 24px' }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>Create a new repository</h1>
      <p style={{ color:'var(--text-secondary)', marginBottom:28 }}>A repository contains all project files, including the revision history.</p>
      <hr style={{ border:'none', borderTop:'1px solid var(--border-default)', marginBottom:28 }} />

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div style={{ display:'flex', gap:16, alignItems:'flex-end' }}>
          <div style={{ flex:0.4 }}>
            <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>Owner</label>
            <div className="input" style={{ background:'var(--bg-default)', display:'flex', alignItems:'center', gap:8, cursor:'default', color:'var(--text-secondary)' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg,#2f81f7,#bc8cff)', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              {user?.username}
            </div>
          </div>
          <div style={{ color:'var(--text-secondary)', fontSize:24, paddingBottom:6 }}>/</div>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>Repository name <span style={{ color:'var(--accent-red)' }}>*</span></label>
            <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="my-awesome-project" required />
            {errors.name && <p style={{ color:'var(--accent-red)', fontSize:12, marginTop:4 }}>{errors.name[0]}</p>}
          </div>
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>Description <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>(optional)</span></label>
          <input className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short description of your project" />
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>Primary language</label>
          <select className="input" value={form.language} onChange={e=>setForm({...form,language:e.target.value})}>
            <option value="">Select language...</option>
            {LANGUAGES.map(l=><option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>Topics <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>(comma separated)</span></label>
          <input className="input" value={form.topics} onChange={e=>setForm({...form,topics:e.target.value})} placeholder="web, api, open-source" />
        </div>

        <hr style={{ border:'none', borderTop:'1px solid var(--border-default)' }} />

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontWeight:600, fontSize:14 }}>Visibility</p>
          {[
            { value:'public', icon:<Globe size={18}/>, label:'Public', desc:'Anyone on the internet can see this repository.' },
            { value:'private', icon:<Lock size={18}/>, label:'Private', desc:'You choose who can see and commit to this repository.' },
          ].map(opt => (
            <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:12, padding:16, border:`1px solid ${form.visibility===opt.value?'var(--accent-blue)':'var(--border-default)'}`, borderRadius:6, cursor:'pointer', background: form.visibility===opt.value?'rgba(47,129,247,0.05)':'transparent', transition:'all 0.15s' }}>
              <input type="radio" name="visibility" value={opt.value} checked={form.visibility===opt.value} onChange={e=>setForm({...form,visibility:e.target.value})} style={{ accentColor:'var(--accent-blue)' }} />
              {opt.icon}
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{opt.label}</div>
                <div style={{ color:'var(--text-secondary)', fontSize:13 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <hr style={{ border:'none', borderTop:'1px solid var(--border-default)' }} />

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf:'flex-start', padding:'8px 20px', fontSize:15 }}>
          {loading ? 'Creating...' : 'Create repository'}
        </button>
      </form>
    </div>
  );
}
