export type PendingUpload = {
  file: File;
  path: string;
};

export type PreparedUploads = {
  accepted: PendingUpload[];
  rejectedPaths: string[];
  rejectedCount: number;
  totalSelected: number;
};

const IGNORED_SEGMENTS = new Set([
  '.git',
  '.hg',
  '.svn',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'vendor',
  'venv',
  '.venv',
  '__pycache__',
]);

const MAX_UPLOAD_FILES = 250;
const MAX_TOTAL_UPLOAD_BYTES = 50 * 1024 * 1024;

const normalizePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+/, '').trim();

const shouldIgnorePath = (path: string) => {
  const segments = normalizePath(path)
    .split('/')
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);

  return segments.some((segment) => IGNORED_SEGMENTS.has(segment));
};

export const prepareUploads = (uploads: PendingUpload[]): PreparedUploads => {
  const deduped = new Map<string, PendingUpload>();

  for (const upload of uploads) {
    const normalizedPath = normalizePath(upload.path);
    if (!normalizedPath) continue;
    deduped.set(normalizedPath, { ...upload, path: normalizedPath });
  }

  const accepted: PendingUpload[] = [];
  const rejectedPaths: string[] = [];
  let totalBytes = 0;

  for (const upload of deduped.values()) {
    if (shouldIgnorePath(upload.path)) {
      rejectedPaths.push(upload.path);
      continue;
    }

    if (accepted.length >= MAX_UPLOAD_FILES) {
      rejectedPaths.push(upload.path);
      continue;
    }

    if (totalBytes + upload.file.size > MAX_TOTAL_UPLOAD_BYTES) {
      rejectedPaths.push(upload.path);
      continue;
    }

    accepted.push(upload);
    totalBytes += upload.file.size;
  }

  return {
    accepted,
    rejectedPaths: rejectedPaths.slice(0, 5),
    rejectedCount: rejectedPaths.length,
    totalSelected: deduped.size,
  };
};

export const formatRejectedUploadsMessage = ({ accepted, rejectedCount, rejectedPaths, totalSelected }: PreparedUploads) => {
  if (rejectedCount === 0) return '';

  const examples = rejectedPaths.length > 0 ? ` Skipped: ${rejectedPaths.join(', ')}.` : '';
  return `Added ${accepted.length} of ${totalSelected} files. ${rejectedCount} file${rejectedCount === 1 ? '' : 's'} were skipped because they were ignored folders or exceeded the upload safety limit.${examples}`;
};
