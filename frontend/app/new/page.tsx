'use client';
import { ChangeEvent, DragEvent as ReactDragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { createRepo, uploadFile } from '@/lib/api';
import { Lock, Globe, FolderOpen, Upload, X } from 'lucide-react';
import axios from 'axios';

const LANGUAGES = ['Python','JavaScript','TypeScript','C','C++','Ruby','Go','Rust','Java','Swift','Kotlin'];

type PendingUpload = {
  file: File;
  path: string;
};

type DragFileSystemEntry = {
  isDirectory: boolean;
  isFile: boolean;
  fullPath: string;
  name: string;
};

type DragFileSystemFileEntry = DragFileSystemEntry & {
  file: (callback: (file: File) => void, errorCallback?: (error: DOMException) => void) => void;
};

type DragFileSystemDirectoryEntry = DragFileSystemEntry & {
  createReader: () => {
    readEntries: (
      successCallback: (entries: DragFileSystemEntry[]) => void,
      errorCallback?: (error: DOMException) => void,
    ) => void;
  };
};

type DragDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => DragFileSystemEntry | null;
  getAsFileSystemHandle?: () => Promise<FileSystemHandleLike>;
};

const isDirectoryEntry = (entry: DragFileSystemEntry): entry is DragFileSystemDirectoryEntry =>
  entry.isDirectory && typeof (entry as DragFileSystemDirectoryEntry).createReader === 'function';

const isFileEntry = (entry: DragFileSystemEntry): entry is DragFileSystemFileEntry =>
  entry.isFile && typeof (entry as DragFileSystemFileEntry).file === 'function';

type FileSystemHandleKind = 'file' | 'directory';

type FileSystemHandleLike = {
  kind: FileSystemHandleKind;
  name: string;
};

type FileSystemFileHandleLike = FileSystemHandleLike & {
  kind: 'file';
  getFile: () => Promise<File>;
};

type FileSystemDirectoryHandleLike = FileSystemHandleLike & {
  kind: 'directory';
  entries: () => AsyncIterableIterator<[string, FileSystemHandleLike]>;
};

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandleLike>;
};

const getRelativePath = (file: File) => {
  const maybeRelativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return maybeRelativePath && maybeRelativePath.length > 0 ? maybeRelativePath : file.name;
};

const readFileEntry = (entry: DragFileSystemFileEntry) =>
  new Promise<PendingUpload>((resolve, reject) => {
    entry.file(
      (file) => resolve({ file, path: entry.fullPath.replace(/^\/+/, '') || file.name }),
      reject,
    );
  });

const readDirectoryEntries = async (directory: DragFileSystemDirectoryEntry): Promise<PendingUpload[]> => {
  const reader = directory.createReader();
  const entries: DragFileSystemEntry[] = [];

  while (true) {
    const batch = await new Promise<DragFileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });

    if (batch.length === 0) break;
    entries.push(...batch);
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      if (isDirectoryEntry(entry)) {
        return readDirectoryEntries(entry);
      }

      if (isFileEntry(entry)) {
        return [await readFileEntry(entry)];
      }

      return [];
    }),
  );

  return files.flat();
};

const readHandle = async (handle: FileSystemHandleLike, prefix = ''): Promise<PendingUpload[]> => {
  if (handle.kind === 'file') {
    const file = await (handle as FileSystemFileHandleLike).getFile();
    return [{ file, path: `${prefix}${handle.name}` }];
  }

  const files: PendingUpload[] = [];
  for await (const [, childHandle] of (handle as FileSystemDirectoryHandleLike).entries()) {
    files.push(...await readHandle(childHandle, `${prefix}${handle.name}/`));
  }

  return files;
};

export default function NewRepoPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [form, setForm] = useState({ name:'', description:'', visibility:'public', language:'', topics:'' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const preventWindowDrop = (event: DragEvent) => {
      event.preventDefault();
    };

    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);

    return () => {
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, []);

  useEffect(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.setAttribute('webkitdirectory', '');
    fileInputRef.current.setAttribute('directory', '');
  }, []);

  const totalUploadSize = useMemo(
    () => files.reduce((sum, current) => sum + current.file.size, 0),
    [files],
  );

  const mergeFiles = (incoming: PendingUpload[]) => {
    setFiles((current) => {
      const fileMap = new Map(current.map((item) => [item.path, item]));
      for (const item of incoming) {
        fileMap.set(item.path, item);
      }
      return Array.from(fileMap.values()).sort((a, b) => a.path.localeCompare(b.path));
    });
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).map((file) => ({
      file,
      path: getRelativePath(file),
    }));
    mergeFiles(selectedFiles);
    event.target.value = '';
  };

  const handleDrop = async (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const items = Array.from(event.dataTransfer.items || []) as DragDataTransferItem[];
    if (items.length === 0) {
      mergeFiles(Array.from(event.dataTransfer.files || []).map((file) => ({ file, path: getRelativePath(file) })));
      return;
    }

    const uploads: PendingUpload[] = [];

    for (const item of items) {
      const handle = await item.getAsFileSystemHandle?.();
      if (handle) {
        uploads.push(...await readHandle(handle));
        continue;
      }

      const entry = item.webkitGetAsEntry?.();

      if (entry && isDirectoryEntry(entry)) {
        uploads.push(...await readDirectoryEntries(entry));
        continue;
      }

      const droppedFile = item.getAsFile();
      if (entry && isFileEntry(entry) && droppedFile) {
        uploads.push({
          file: droppedFile,
          path: entry.fullPath.replace(/^\/+/, '') || getRelativePath(droppedFile),
        });
        continue;
      }

      if (droppedFile) {
        uploads.push({ file: droppedFile, path: getRelativePath(droppedFile) });
      }
    }

    if (uploads.length > 0) {
      mergeFiles(uploads);
    }
  };

  const handleChooseFolder = async () => {
    const directoryPicker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
    if (directoryPicker) {
      const handle = await directoryPicker();
      mergeFiles(await readHandle(handle));
      return;
    }

    fileInputRef.current?.click();
  };

  const removePendingFile = (path: string) => {
    setFiles((current) => current.filter((item) => item.path !== path));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setErrors({}); setLoading(true);
    try {
      const payload = {
        ...form,
        topics: form.topics.split(',').map(t => t.trim()).filter(Boolean),
      };
      const { data } = await createRepo(user.username, payload);
      for (const item of files) {
        await uploadFile(user.username, data.name, item.file, item.path, data.default_branch || 'main');
      }
      router.push(`/${user.username}/${data.name}`);
    } catch (err: unknown) {
      if (axios.isAxiosError<Record<string, string[]>>(err)) {
        setErrors(err.response?.data || {});
      } else {
        setErrors({ non_field_errors: ['Failed to create repository.'] });
      }
    } finally { setLoading(false); }
  };

  if (!user) return null;

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
                {user.username[0].toUpperCase()}
              </div>
              {user.username}
            </div>
          </div>
          <div style={{ color:'var(--text-secondary)', fontSize:24, paddingBottom:6 }}>/</div>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>
              Repository name <span style={{ color:'var(--accent-red)' }}>*</span>
            </label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="my-awesome-project"
              required
            />
            {errors.name && <p style={{ color:'var(--accent-red)', fontSize:12, marginTop:4 }}>{errors.name[0]}</p>}
          </div>
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>
            Description <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>(optional)</span>
          </label>
          <input className="input" value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Short description of your project" />
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>Primary language</label>
          <select className="input" value={form.language} onChange={e => setForm({...form, language:e.target.value})}>
            <option value="">Select language...</option>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>
            Topics <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>(comma separated)</span>
          </label>
          <input className="input" value={form.topics} onChange={e => setForm({...form, topics:e.target.value})} placeholder="web, api, open-source" />
        </div>

        <div>
          <label style={{ display:'block', marginBottom:6, fontWeight:600, fontSize:14 }}>
            Starter files <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>(optional)</span>
          </label>
          <div
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={handleChooseFolder}
            style={{
              border:`1px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border-default)'}`,
              borderRadius:8,
              padding:'24px 20px',
              background:isDragging ? 'rgba(47,129,247,0.08)' : 'var(--bg-overlay)',
              cursor:'pointer',
              transition:'all 0.15s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelection}
              {...({ webkitdirectory: true, directory: true } as Record<string, boolean>)}
              style={{ display:'none' }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ width:40, height:40, borderRadius:999, background:'rgba(47,129,247,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-blue)' }}>
                {files.length > 0 ? <FolderOpen size={18} /> : <Upload size={18} />}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  Drop files or a folder here
                </div>
                <div style={{ color:'var(--text-secondary)', fontSize:13 }}>
                  Click to browse, or drag your project in before creating the repository.
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  handleChooseFolder();
                }}
                style={{ padding:'6px 12px', fontSize:13 }}
              >
                Choose folder
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.removeAttribute('webkitdirectory');
                  fileInputRef.current?.removeAttribute('directory');
                  fileInputRef.current?.click();
                  fileInputRef.current?.setAttribute('webkitdirectory', '');
                  fileInputRef.current?.setAttribute('directory', '');
                }}
                style={{ padding:'6px 12px', fontSize:13 }}
              >
                Choose files
              </button>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop:16, borderTop:'1px solid var(--border-default)', paddingTop:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:13, marginBottom:10 }}>
                  <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{files.length} file{files.length === 1 ? '' : 's'} ready</span>
                  <span style={{ color:'var(--text-secondary)' }}>{(totalUploadSize / 1024).toFixed(1)} KB total</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:220, overflowY:'auto' }}>
                  {files.map((item) => (
                    <div key={item.path} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border-default)', borderRadius:6, background:'var(--bg-default)' }}>
                      <FolderOpen size={14} color="var(--accent-blue)" />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {item.path}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                          {(item.file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removePendingFile(item.path);
                        }}
                        style={{ border:'none', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', padding:4 }}
                        aria-label={`Remove ${item.path}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <hr style={{ border:'none', borderTop:'1px solid var(--border-default)' }} />

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontWeight:600, fontSize:14 }}>Visibility</p>
          {[
            { value:'public', icon:<Globe size={18}/>, label:'Public', desc:'Anyone on the internet can see this repository.' },
            { value:'private', icon:<Lock size={18}/>, label:'Private', desc:'You choose who can see and commit to this repository.' },
          ].map(opt => (
            <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:12, padding:16, border:`1px solid ${form.visibility===opt.value?'var(--accent-blue)':'var(--border-default)'}`, borderRadius:6, cursor:'pointer', background: form.visibility===opt.value?'rgba(47,129,247,0.05)':'transparent', transition:'all 0.15s' }}>
              <input type="radio" name="visibility" value={opt.value} checked={form.visibility===opt.value} onChange={e => setForm({...form, visibility:e.target.value})} style={{ accentColor:'var(--accent-blue)' }} />
              {opt.icon}
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{opt.label}</div>
                <div style={{ color:'var(--text-secondary)', fontSize:13 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <hr style={{ border:'none', borderTop:'1px solid var(--border-default)' }} />

        <button className="btn btn-primary" type="submit" disabled={loading || !form.name} style={{ alignSelf:'flex-start', padding:'8px 20px', fontSize:15 }}>
          {loading ? 'Creating...' : 'Create repository'}
        </button>
      </form>
    </div>
  );
}
