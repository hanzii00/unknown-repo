'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Lock, Globe, Settings2, Trash2 } from 'lucide-react';
import { deleteRepo, getRepo, updateRepo } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const LANGUAGES = ['Python','JavaScript','TypeScript','C','C++','Ruby','Go','Rust','Java','Swift','Kotlin','PHP','C#','Shell'];

type RepoData = {
  name: string;
  description: string;
  visibility: string;
  language: string;
  default_branch: string;
  topics: string[];
};

export default function RepoSettingsPage({ params }: { params: Promise<{ username: string; repo: string }> }) {
  const { username, repo: repoName } = React.use(params);
  const router = useRouter();
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [repo, setRepo] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'public',
    language: '',
    default_branch: 'main',
    topics: '',
  });

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const loadRepo = async () => {
      try {
        const { data } = await getRepo(username, repoName);
        setRepo(data);
        setForm({
          name: data.name || '',
          description: data.description || '',
          visibility: data.visibility || 'public',
          language: data.language || '',
          default_branch: data.default_branch || 'main',
          topics: Array.isArray(data.topics) ? data.topics.join(', ') : '',
        });
      } catch {
        setRepo(null);
      } finally {
        setLoading(false);
      }
    };

    loadRepo();
  }, [username, repoName]);

  const isOwner = user?.username === username;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    setErrors({});
    setStatusMessage('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
        language: form.language.trim(),
        default_branch: form.default_branch.trim() || 'main',
        topics: form.topics.split(',').map((topic) => topic.trim()).filter(Boolean),
      };

      const { data } = await updateRepo(username, repoName, payload);
      setRepo(data);
      setStatusMessage('Repository settings saved.');

      if (data.name && data.name !== repoName) {
        router.replace(`/${username}/${data.name}/settings`);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError<Record<string, string[]>>(error)) {
        setErrors(error.response?.data || { non_field_errors: ['Failed to save repository settings.'] });
      } else {
        setErrors({ non_field_errors: ['Failed to save repository settings.'] });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || !repo) return;

    const confirmedName = window.prompt(`Type ${repo.name} to delete this repository permanently.`);
    if (confirmedName !== repo.name) return;

    setDeleting(true);
    try {
      await deleteRepo(username, repoName);
      router.push(`/${username}`);
    } catch {
      setErrors({ non_field_errors: ['Failed to delete repository.'] });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        <div className="skeleton" style={{ height: 28, width: 220, marginBottom: 16 }} />
        <div className="card skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (!repo) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Repository not found</div>;
  }

  if (!isAuthenticated || !isOwner) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <Settings2 size={28} style={{ margin: '0 auto 12px', color: 'var(--text-secondary)' }} />
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Repository settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Only the repository owner can manage these settings.</p>
          <Link href={`/${username}/${repoName}`} className="btn btn-secondary" style={{ marginTop: 16 }}>
            Back to repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <Link href={`/${username}/${repoName}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <ArrowLeft size={14} />
            Back to repository
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Repository settings</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            Manage <span style={{ color: 'var(--text-primary)' }}>{username}/{repo.name}</span> like GitHub settings.
          </p>
        </div>
        <span className="badge" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', fontSize: 12 }}>
          {repo.visibility}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        <aside className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(47,129,247,0.12)', color: 'var(--accent-blue)', fontWeight: 600 }}>
              General
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 6, color: 'var(--text-secondary)' }}>
              Danger Zone
            </div>
          </div>
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <form onSubmit={handleSave} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>General</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Update the repository name, description, topics, visibility, and defaults.
              </p>
            </div>

            {statusMessage && (
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(63,185,80,0.12)', color: 'var(--text-primary)', border: '1px solid rgba(63,185,80,0.25)' }}>
                {statusMessage}
              </div>
            )}

            {errors.non_field_errors && (
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(248,81,73,0.12)', color: 'var(--text-primary)', border: '1px solid rgba(248,81,73,0.25)' }}>
                {errors.non_field_errors[0]}
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Repository name</label>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
              {errors.name && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.name[0]}</p>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Description</label>
              <textarea
                className="input"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                style={{ resize: 'vertical', minHeight: 110 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Primary language</label>
                <select
                  className="input"
                  value={form.language}
                  onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                >
                  <option value="">Select language...</option>
                  {LANGUAGES.map((language) => <option key={language}>{language}</option>)}
                </select>
                {errors.language && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.language[0]}</p>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Default branch</label>
                <input
                  className="input"
                  value={form.default_branch}
                  onChange={(event) => setForm((current) => ({ ...current, default_branch: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Topics</label>
              <input
                className="input"
                value={form.topics}
                onChange={(event) => setForm((current) => ({ ...current, topics: event.target.value }))}
                placeholder="web, api, open-source"
              />
            </div>

            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Visibility</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { value: 'public', icon: <Globe size={18} />, label: 'Public', description: 'Anyone can view this repository.' },
                  { value: 'private', icon: <Lock size={18} />, label: 'Private', description: 'Only people you choose can view this repository.' },
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 16,
                      border: `1px solid ${form.visibility === option.value ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: form.visibility === option.value ? 'rgba(47,129,247,0.05)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={form.visibility === option.value}
                      onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                      style={{ accentColor: 'var(--accent-blue)' }}
                    />
                    {option.icon}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{option.label}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ minWidth: 150, justifyContent: 'center' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          <div className="card" style={{ padding: 24, borderColor: 'rgba(248,81,73,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(248,81,73,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Danger zone</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Deleting a repository is permanent. Issues, files, and settings will be removed.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', padding: 16, border: '1px solid rgba(248,81,73,0.25)', borderRadius: 8, background: 'rgba(248,81,73,0.05)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Delete this repository</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                  This cannot be undone.
                </div>
              </div>
              <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={15} />
                {deleting ? 'Deleting...' : 'Delete repository'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
