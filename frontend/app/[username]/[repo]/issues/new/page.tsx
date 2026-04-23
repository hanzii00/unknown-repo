'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createIssue } from '@/lib/api';

export default function NewIssuePage({ params }: { params: { username: string; repo: string } }) {
  const { username, repo } = params;
  const router = useRouter();
  const [form, setForm] = useState({ title: '', body: '', labels: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, labels: form.labels.split(',').map(l => l.trim()).filter(Boolean) };
      const { data } = await createIssue(username, repo, payload);
      router.push(`/${username}/${repo}/issues/${data.number}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create issue');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <nav style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
          <Link href={`/${username}/${repo}`}>{username}/{repo}</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <Link href={`/${username}/${repo}`} onClick={e => { e.preventDefault(); router.back(); }}>Issues</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span>New issue</span>
        </nav>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>New Issue</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background:'rgba(248,81,73,0.1)', border:'1px solid var(--accent-red)', borderRadius:6, padding:'10px 14px', color:'var(--accent-red)', fontSize:13 }}>{error}</div>
          )}
          <div>
            <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required style={{ fontSize: 16, padding: '10px 14px' }} />
          </div>
          <div>
            <textarea
              className="input"
              placeholder="Leave a comment"
              value={form.body}
              onChange={e => setForm({...form, body: e.target.value})}
              style={{ height: 280, resize: 'vertical', padding: '12px 14px', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link href={`/${username}/${repo}`} className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '6px 20px' }}>
              {loading ? 'Submitting...' : 'Submit new issue'}
            </button>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Labels</h3>
            <input className="input" placeholder="bug, enhancement..." value={form.labels} onChange={e => setForm({...form, labels: e.target.value})} style={{ fontSize: 13 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Comma-separated labels</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
