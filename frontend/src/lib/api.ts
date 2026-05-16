// Centralized API client for communicating with the Express backend
function getApiBase(): string {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL;
  if (configuredBase) return configuredBase;

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    return `${window.location.origin}/_/backend`;
  }

  return 'http://localhost:5000';
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('decismart_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBase()}/api${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });
  } catch {
    throw new Error('Unable to reach the API server. Please check the deployment or network connection.');
  }

  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new Error(json?.message || `API error ${res.status}`);
  }

  return json as T;
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: User } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: name, email, password }),
    }),

  me: () =>
    request<{ success: boolean; data: User }>('/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};

// ─────────────────────────────────────────────
// Admin – Stats & Activity
// ─────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    request<{
      success: boolean;
      data: {
        users: { total: number; active: number; admins: number };
        decisions: { total: number; completed: number };
        recommendations: { total: number };
      };
    }>('/admin/stats'),

  getRecentActivity: (limit = 20) =>
    request<{ success: boolean; data: ActivityItem[] }>(
      `/admin/activity?limit=${limit}`
    ),

  getAnalytics: () =>
    request<{
      success: boolean;
      data: {
        totalDecisions: number;
        completedDecisions: number;
        totalAlternatives: number;
        totalCriteria: number;
        decisionTrend: Array<{ date: string; count: number }>;
        decisionsByStatus: Array<{ name: string; value: number }>;
        dayOfWeekStats: Array<{ day: string; decisions: number }>;
        topUsers: Array<{ name: string; decisions: number }>;
      };
    }>('/admin/analytics'),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.role) q.set('role', params.role);
    return request<PaginatedResponse<AdminUserRow>>(`/admin/users?${q.toString()}`);
  },

  toggleUserStatus: (userId: string) =>
    request<{ success: boolean; data: AdminUserRow }>(`/admin/users/${userId}/toggle`, {
      method: 'PUT',
    }),

  updateUserRole: (userId: string, role: 'user' | 'admin') =>
    request<{ success: boolean; data: AdminUserRow }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId: string, hard = false) =>
    request<{ success: boolean }>(`/admin/users/${userId}?hard=${hard}`, {
      method: 'DELETE',
    }),

  createUser: (full_name: string, email: string, password: string) =>
    request<{ success: boolean; data: AdminUserRow }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    }),

  updateUser: (userId: string, data: { full_name?: string; email?: string }) =>
    request<{ success: boolean; data: AdminUserRow }>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Decisions
  getDecisions: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return request<PaginatedResponse<AdminDecisionRow>>(`/admin/decisions?${q.toString()}`);
  },

  deleteDecision: (id: string) =>
    request<{ success: boolean }>(`/admin/decisions/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────
// Decisions (User-facing)
// ─────────────────────────────────────────────
export const decisionsApi = {
  // BUG FIX: Added missing getDecisions and deleteDecision methods
  getDecisions: (params?: { limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return request<{ success: boolean; data: Decision[] }>(`/decisions?${q.toString()}`);
  },

  deleteDecision: (id: string) =>
    request<{ success: boolean }>(`/decisions/${id}`, { method: 'DELETE' }),

  list: () =>
    request<{ success: boolean; data: Decision[] }>('/decisions'),

  get: (id: string) =>
    request<{ success: boolean; data: Decision }>(`/decisions/${id}`),

  create: (payload: { title: string; description?: string; context?: string }) =>
    request<{ success: boolean; data: Decision }>('/decisions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Decision>) =>
    request<{ success: boolean; data: Decision }>(`/decisions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/decisions/${id}`, { method: 'DELETE' }),

  addAlternative: (id: string, name: string) =>
    request<{ success: boolean; data: any }>(`/decisions/${id}/alternatives`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  addCriteria: (id: string, name: string, weight: number) =>
    request<{ success: boolean; data: any }>(`/decisions/${id}/criteria`, {
      method: 'POST',
      body: JSON.stringify({ name, weight, type: 'benefit' }),
    }),

  upsertScores: (id: string, scores: Array<{ alternative_id: string; criteria_id: string; raw_value: number }>) =>
    request<{ success: boolean; data: any }>(`/decisions/${id}/scores`, {
      method: 'POST',
      body: JSON.stringify({ scores }),
    }),

  runAnalysis: (id: string, method: string = 'SAW') =>
    request<{ success: boolean; data: any }>(`/decisions/${id}/analysis/run`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    }),

  getAnalysis: (id: string) =>
    request<{ success: boolean; data: any }>(`/decisions/${id}/analysis`),
};

// ─────────────────────────────────────────────
// History
// ─────────────────────────────────────────────
export const historyApi = {
  list: () =>
    request<PaginatedResponse<any>>('/history'),
  
  getStats: () =>
    request<{
      success: boolean;
      data: {
        total_actions: number;
        decisions_created: number;
        decisions_created_this_month: number;
        analyses_run: number;
        decisions_viewed: number;
      };
    }>('/history/stats'),
};

// ─────────────────────────────────────────────
// Analysis
// ─────────────────────────────────────────────
export const analysisApi = {
  getDecisionAnalysis: (id: string) =>
    request<{ success: boolean; data: unknown }>(`/decisions/${id}/analysis`),
};

// ─────────────────────────────────────────────
// AI Assistant
// ─────────────────────────────────────────────
export const aiApi = {
  suggestCriteria: (title: string, context?: string) =>
    request<{ success: boolean; data: Array<{ name: string; weight: number; type: string }> }>('/ai/suggest-criteria', {
      method: 'POST',
      body: JSON.stringify({ title, context }),
    }),

  suggestAlternatives: (title: string, context?: string, criteria?: Array<{ name: string }>) =>
    request<{ success: boolean; data: Array<{ name: string; description?: string }> }>('/ai/suggest-alternatives', {
      method: 'POST',
      body: JSON.stringify({ title, context, criteria }),
    }),

  suggestScores: (title: string, context: string, criteria: Array<{ name: string }>, alternatives: string[]) =>
    request<{ success: boolean; data: number[][] }>('/ai/suggest-scores', {
      method: 'POST',
      body: JSON.stringify({ title, context, criteria, alternatives }),
    }),
};

// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminDecisionRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  users?: { email: string; full_name: string };
  alternatives?: [{ count: number }];
  criteria?: [{ count: number }];
}

export interface Decision {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  created_at: string;
  users?: { email: string; full_name: string };
  decisions?: { id: string; title: string };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
