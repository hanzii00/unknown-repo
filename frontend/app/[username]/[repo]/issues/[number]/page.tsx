'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, MessageSquare, Send } from 'lucide-react';
import { getIssue, getComments, createComment } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function IssuePage({ params }: { params: Promise<{ username: string; repo: string; number: string }> }) {
  const { username, repo, number } = React.use(params);
  const { user, isAuthenticated } = useAuthStore();
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const issueRes = await getIssue(username, repo, parseInt(number));
        setIssue(issueRes.data);
      } catch (err) {
        setIssue(null);
      }

      try {
        const commentsRes = await getComments(username, repo, parseInt(number));
        setComments(commentsRes.data.results || commentsRes.data || []);
      } catch (err) {
        setComments([]);
      }

      setLoading(false);
    };

    loadData();
  }, [username, repo, number]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await createComment(username, repo, parseInt(number), newComment);
      setComments(c => [...c, data]);
      setNewComment('');
    } finally { setSubmitting(false); }
  };

  const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2f81f7,#3fb950)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      {[...Array(3)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 120, marginBottom: 16 }} />)}
    </div>
  );

  if (!issue) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Issue not found</div>;

  const isOpen = issue.state === 'open';

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px 40px' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
        <Link href={`/${username}/${repo}`}>{username}/{repo}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href={`/${username}/${repo}`}>Issues</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span>#{number}</span>
      </nav>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
          {issue.title} <span style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>#{issue.number}</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontWeight: 600, fontSize: 13, background: isOpen ? 'rgba(63,185,80,0.15)' : 'rgba(130,80,255,0.15)', color: isOpen ? 'var(--accent-green)' : 'var(--accent-purple)', border: `1px solid ${isOpen ? 'rgba(63,185,80,0.3)' : 'rgba(130,80,255,0.3)'}` }}>
            {isOpen ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            <b style={{ color: 'var(--text-primary)' }}>{issue.author.username}</b> opened this issue on {new Date(issue.created_at).toLocaleDateString()}
            {' · '}{comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', marginBottom: 24 }} />

      {/* Issue body */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Avatar name={issue.author.username} size={36} />
        <div style={{ flex: 1 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href={`/${issue.author.username}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}>{issue.author.username}</Link>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>commented on {new Date(issue.created_at).toLocaleDateString()}</span>
              <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(47,129,247,0.15)', color: 'var(--accent-blue)', fontSize: 11 }}>Author</span>
            </div>
            <div style={{ padding: '16px', minHeight: 60, fontSize: 14, lineHeight: 1.7, color: issue.body ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: issue.body ? 'normal' : 'italic' }}>
              {issue.body || 'No description provided.'}
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      {issue.labels?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, paddingLeft: 52 }}>
          {issue.labels.map((l: string) => (
            <span key={l} className="badge" style={{ background: 'rgba(63,185,80,0.15)', color: 'var(--accent-green)', fontSize: 12, border: '1px solid rgba(63,185,80,0.3)' }}>{l}</span>
          ))}
        </div>
      )}

      {/* Comments */}
      {comments.map((cmt: any) => (
        <div key={cmt.id} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <Avatar name={cmt.author.username} size={36} />
          <div style={{ flex: 1 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link href={`/${cmt.author.username}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}>{cmt.author.username}</Link>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>commented on {new Date(cmt.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ padding: '16px', fontSize: 14, lineHeight: 1.7 }}>{cmt.body}</div>
            </div>
          </div>
        </div>
      ))}

      {/* New Comment */}
      {isAuthenticated ? (
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <Avatar name={user?.username || ''} size={36} />
          <form onSubmit={handleComment} style={{ flex: 1 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={14} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Leave a comment</span>
              </div>
              <textarea
                className="input"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write your comment here..."
                style={{ border: 'none', borderRadius: 0, height: 120, resize: 'vertical', padding: '12px 16px', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <div style={{ padding: '10px 16px', background: 'var(--bg-overlay)', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" disabled={submitting || !newComment.trim()} style={{ gap: 6 }}>
                  <Send size={14} /> {submitting ? 'Sending...' : 'Comment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Link href="/login">Sign in</Link> to leave a comment
        </div>
      )}
    </div>
  );
}
