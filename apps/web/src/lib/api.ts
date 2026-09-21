const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const API_URL = rawApiUrl.replace(/\/+$/, '');

export function getTargetUrl(cleanPath: string): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const forceDirect = process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true';
    if (!forceDirect && !isLocalhost) {
      return `/api-proxy${cleanPath}`;
    }
  }
  return `${API_URL}${cleanPath}`;
}

export class ApiError extends Error {
  code: string;
  fieldErrors?: Record<string, string[]>;
  constructor(body: { code?: string; message?: string; fieldErrors?: Record<string, string[]> }) {
    super(body.message || 'Request failed');
    this.code = body.code || 'ERROR';
    this.fieldErrors = body.fieldErrors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = getTargetUrl(cleanPath);
  try {
    const res = await fetch(fullUrl, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data);
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new Error(`Tidak dapat terhubung ke backend (${fullUrl}): ${msg}`);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
};

export type Me = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  authProvider: string;
  mustChangePassword: boolean;
  timezone: string;
  theme: string;
  density: string;
  language: string;
  notifyApprovals: boolean;
  notifyConflicts: boolean;
  notifyReviews: boolean;
  notifyTasks: boolean;
  role: { id: string; code: string; name: string };
  division: { id: string; code: string; name: string } | null;
  permissions: string[];
};

export function hasPermission(me: Me | null, ...codes: string[]) {
  if (!me) return false;
  return codes.some((c) => me.permissions.includes(c));
}
