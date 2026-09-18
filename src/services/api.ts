import {
  AuthSessionResponse,
  AutomationToken,
  Extension,
  InstanceStats,
  Meta,
  PaginatedList,
  PendingVersion,
  PrivacyDoc,
  ProblemDetails,
  PublishPayload,
  ReviewVersionPayload,
  Session,
  TermsDoc,
  UpdateUserPayload,
  User,
  UserRole,
  VersionInfo,
} from '../types/api';

const STORAGE_KEY_TOKEN = 'twexthub_auth_token';
const STORAGE_KEY_USER = 'twexthub_auth_user';

export function getDynamicApiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    // Dynamic URL matching the current host site
    return `${window.location.origin.replace(/\/+$/, '')}/api/v0`;
  }
  return 'https://twexts.sdisk.us/api/v0';
}

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

class ApiService {
  private token: string | null;

  constructor() {
    // Purge legacy manual server URL overrides to disallow changing server URL
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('twexthub_api_base_url');
    }
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TOKEN) : null;
  }

  getBaseUrl(): string {
    return getDynamicApiBase();
  }

  // Disallowed by user request - base URL is strictly dynamic to the hosting site
  setBaseUrl(_url: string) {
    // No-op: changing server URL is disallowed
  }

  resetBaseUrl() {
    // No-op
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }
    }
  }

  getStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setStoredUser(user: User | null) {
    if (typeof localStorage === 'undefined') return;
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Network request failed';
      throw new ApiError(`Unable to reach the TwextHub API at ${baseUrl}: ${msg}`, 0);
    }

    // 204 No Content has no body
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');

    if (!response.ok) {
      let problem: ProblemDetails | undefined;
      let plainMessage = `Request failed with status ${response.status} (${response.statusText})`;

      if (isJson) {
        try {
          const parsed = await response.json();
          problem = parsed as ProblemDetails;
          if (problem.detail) {
            plainMessage = problem.detail;
          } else if (problem.title) {
            plainMessage = problem.title;
          }
          if (problem.errors && problem.errors.length > 0) {
            const fieldErrors = problem.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
            plainMessage = `${plainMessage} (${fieldErrors})`;
          }
        } catch {
          // ignore parse error
        }
      } else {
        const text = await response.text().catch(() => '');
        if (text) {
          plainMessage = text;
        }
      }

      throw new ApiError(plainMessage, response.status, problem);
    }

    if (isJson) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    return text as unknown as T;
  }

  // --- Public Registry & Info Endpoints ---

  async getStats(): Promise<InstanceStats> {
    return this.request<InstanceStats>('/stats');
  }

  async getMeta(): Promise<Meta> {
    return this.request<Meta>('/meta');
  }

  async getExtensions(params?: { cursor?: string; limit?: number }): Promise<PaginatedList<Extension>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<PaginatedList<Extension>>(`/extensions${qs ? `?${qs}` : ''}`);
  }

  async searchExtensions(searchQuery: string, params?: { cursor?: string; limit?: number }): Promise<PaginatedList<Extension>> {
    const query = new URLSearchParams();
    if (searchQuery) query.set('q', searchQuery);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<PaginatedList<Extension>>(`/search${qs ? `?${qs}` : ''}`);
  }

  async getExtension(namespace: string, id: string): Promise<Extension> {
    return this.request<Extension>(`/extensions/${encodeURIComponent(namespace)}/${encodeURIComponent(id)}`);
  }

  async getTerms(): Promise<TermsDoc> {
    return this.request<TermsDoc>('/terms');
  }

  async getPrivacy(): Promise<PrivacyDoc> {
    return this.request<PrivacyDoc>('/privacy');
  }

  async getUsers(params?: { cursor?: string; limit?: number }): Promise<PaginatedList<User>> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<PaginatedList<User>>(`/users${qs ? `?${qs}` : ''}`);
  }

  async getUser(namespace: string): Promise<User> {
    return this.request<User>(`/users/${encodeURIComponent(namespace)}`);
  }

  // --- Auth Endpoints ---

  async login(credentials: { namespace: string; password: string }): Promise<AuthSessionResponse> {
    const res = await this.request<AuthSessionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(res.token);
    this.setStoredUser(res.user);
    return res;
  }

  async signup(payload: { namespace: string; password: string; displayName?: string }): Promise<AuthSessionResponse> {
    const res = await this.request<AuthSessionResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    this.setStoredUser(res.user);
    return res;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.request<void>('/auth/logout', { method: 'POST' });
      }
    } finally {
      this.setToken(null);
      this.setStoredUser(null);
    }
  }

  // GET /v0/auth/me - returns the caller's own authenticated account
  async getMe(): Promise<User> {
    const me = await this.request<User>('/auth/me');
    this.setStoredUser(me);
    return me;
  }

  // --- Authenticated User Operations ---

  async acceptTerms(version: number): Promise<void> {
    await this.request<void>('/terms/accept', {
      method: 'POST',
      body: JSON.stringify({ version }),
    });
    const current = this.getStoredUser();
    if (current) {
      current.termsAcceptedVersion = version;
      this.setStoredUser(current);
    }
  }

  async updateUser(namespace: string, data: UpdateUserPayload): Promise<User> {
    const updated = await this.request<User>(`/users/${encodeURIComponent(namespace)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const current = this.getStoredUser();
    if (current && current.namespace === namespace) {
      this.setStoredUser({ ...current, ...updated });
    }
    return updated;
  }

  async deleteUser(namespace: string): Promise<void> {
    await this.request<void>(`/users/${encodeURIComponent(namespace)}`, {
      method: 'DELETE',
    });
    const current = this.getStoredUser();
    if (current && current.namespace === namespace) {
      this.setToken(null);
      this.setStoredUser(null);
    }
  }

  async getSessions(params?: { namespace?: string; cursor?: string; limit?: number }): Promise<PaginatedList<Session>> {
    const query = new URLSearchParams();
    if (params?.namespace) query.set('namespace', params.namespace);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<PaginatedList<Session>>(`/sessions${qs ? `?${qs}` : ''}`);
  }

  async revokeSession(id: string): Promise<void> {
    await this.request<void>(`/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getTokens(params?: { namespace?: string; cursor?: string; limit?: number }): Promise<PaginatedList<AutomationToken>> {
    const query = new URLSearchParams();
    if (params?.namespace) query.set('namespace', params.namespace);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<PaginatedList<AutomationToken>>(`/tokens${qs ? `?${qs}` : ''}`);
  }

  async createToken(data: { name: string; scopes: string[]; expiresInDays?: number }): Promise<AutomationToken> {
    return this.request<AutomationToken>('/tokens', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateToken(id: string, data: { name?: string; scopes?: string[] }): Promise<AutomationToken> {
    return this.request<AutomationToken>(`/tokens/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteToken(id: string): Promise<void> {
    await this.request<void>(`/tokens/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- Version & Publishing Operations ---

  async publish(payload: PublishPayload): Promise<{ success: boolean; message?: string }> {
    const manifest = payload.manifest as Record<string, unknown>;
    const namespace = (manifest?.namespace || this.getStoredUser()?.namespace) as string;
    const id = (manifest?.id || manifest?.name) as string;

    if (namespace && id) {
      try {
        await this.request<VersionInfo>(`/@${encodeURIComponent(namespace)}/${encodeURIComponent(id)}/versions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return { success: true, message: `Extension @${namespace}/${id} uploaded successfully.` };
      } catch (err) {
        // Fallback to /publish or /extensions if scoped path returned 404
        if (err instanceof ApiError && err.status === 404) {
          try {
            await this.request<{ success?: boolean; message?: string }>('/publish', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            return { success: true, message: 'Extension published successfully.' };
          } catch {
            await this.request<{ success?: boolean; message?: string }>('/extensions', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            return { success: true, message: 'Extension published successfully.' };
          }
        }
        throw err;
      }
    }

    // Direct fallback
    const res = await this.request<{ success?: boolean; message?: string }>('/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: true, message: res?.message || 'Extension published successfully.' };
  }

  async deleteExtension(namespace: string, id: string): Promise<void> {
    await this.request<void>(`/@${encodeURIComponent(namespace)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async yankVersion(namespace: string, id: string, version: string): Promise<void> {
    await this.request<void>(`/@${encodeURIComponent(namespace)}/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}`, {
      method: 'DELETE',
    });
  }

  async downloadVersion(namespace: string, id: string, version: string): Promise<string> {
    return this.request<string>(`/@${encodeURIComponent(namespace)}/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}/download`, {
      headers: {
        Accept: 'text/javascript, application/javascript, */*',
      },
    });
  }

  // --- Admin Moderation & Administration Endpoints ---

  async listVersionsForReview(params?: { cursor?: string; limit?: number }): Promise<PaginatedList<PendingVersion>> {
    const query = new URLSearchParams();
    query.set('status', 'pending');
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    try {
      return await this.request<PaginatedList<PendingVersion>>(`/admin/pending?${qs}`);
    } catch {
      return await this.request<PaginatedList<PendingVersion>>(`/versions?${qs}`);
    }
  }

  async reviewVersion(namespace: string, id: string, version: string, payload: ReviewVersionPayload): Promise<VersionInfo> {
    try {
      return await this.request<VersionInfo>(`/@${encodeURIComponent(namespace)}/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return await this.request<VersionInfo>(`/@${encodeURIComponent(namespace)}/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }
  }

  async updateUserRole(namespace: string, payload: { role?: UserRole }): Promise<User> {
    try {
      return await this.request<User>(`/admin/users/${encodeURIComponent(namespace)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch {
      return await this.request<User>(`/users/${encodeURIComponent(namespace)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }
  }

  async updateTerms(body: string): Promise<TermsDoc> {
    try {
      return await this.request<TermsDoc>('/admin/terms', {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      });
    } catch {
      return await this.request<TermsDoc>('/terms', {
        method: 'PUT',
        body: JSON.stringify({ body }),
      });
    }
  }

  async updatePrivacyPolicy(body: string): Promise<PrivacyDoc> {
    try {
      return await this.request<PrivacyDoc>('/admin/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      });
    } catch {
      return await this.request<PrivacyDoc>('/privacy', {
        method: 'PUT',
        body: JSON.stringify({ body }),
      });
    }
  }
}

export const api = new ApiService();
