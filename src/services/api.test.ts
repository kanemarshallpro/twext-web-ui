import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { paginated, makeUser } from '../test/testUtils';

const JSON_HEADERS = { 'content-type': 'application/json' };

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = JSON_HEADERS,
): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('ApiService', () => {
  const fetchMock = vi.fn();
  const baseUrl = `${window.location.origin}/api/v0`;

  beforeEach(() => {
    localStorage.clear();
    api.setToken(null);
    api.setStoredUser(null);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('derives the base URL from window.location.origin', () => {
    expect(api.getBaseUrl()).toBe(`${window.location.origin}/api/v0`);
  });

  it('keeps setBaseUrl a no-op', () => {
    const before = api.getBaseUrl();
    api.setBaseUrl('https://evil.example/api/v0');
    expect(api.getBaseUrl()).toBe(before);
  });

  it('GETs a JSON endpoint and parses the payload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ published: 12, pending: 3, authors: 5 }));
    await expect(api.getStats()).resolves.toEqual({ published: 12, pending: 3, authors: 5 });
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/stats`,
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    );
  });

  it('serializes cursor and limit query parameters', async () => {
    fetchMock.mockResolvedValue(jsonResponse(paginated([])));
    await api.getExtensions({ cursor: 'abc', limit: 6 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/extensions?cursor=abc&limit=6`);
  });

  it('searchExtensions sends the q parameter', async () => {
    fetchMock.mockResolvedValue(jsonResponse(paginated([])));
    await api.searchExtensions('gamepad', { limit: 12 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/search?q=gamepad&limit=12`);
  });

  it('URL-encodes namespace and id path segments', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeUser()));
    await api.getExtension('a/b', 'c d');
    expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/extensions/a%2Fb/c%20d`);
  });

  it('attaches a Bearer authorization header when a token is present', async () => {
    api.setToken('tok-abc');
    fetchMock.mockResolvedValue(jsonResponse(paginated([])));
    await api.getExtensions();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/extensions'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok-abc' }),
      }),
    );
  });

  it('login POSTs JSON and persists token + user to localStorage', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ token: 'tok-123', user: makeUser() }));
    const res = await api.login({ namespace: 'kane', password: 'secret' });
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ namespace: 'kane', password: 'secret' }),
      }),
    );
    expect(res.token).toBe('tok-123');
    expect(localStorage.getItem('twexthub_auth_token')).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem('twexthub_auth_user')!)).toEqual(makeUser());
    expect(api.getToken()).toBe('tok-123');
  });

  it('surfaces an RFC 7807 problem+json payload as a typed ApiError', async () => {
    const problem = {
      type: 'about:blank',
      title: 'Unprocessable Entity',
      status: 422,
      detail: 'Namespace already registered.',
      errors: [{ field: 'namespace', message: 'is taken' }],
    };
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(problem), {
          status: 422,
          headers: { 'content-type': 'application/problem+json' },
        }),
      ),
    );
    await expect(api.signup({ namespace: 'kane', password: 'xxxx1234' })).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        status: 422,
        problem: expect.objectContaining({ detail: 'Namespace already registered.' }),
      }),
    );
    await expect(api.signup({ namespace: 'kane', password: 'xxxx1234' })).rejects.toThrow(
      'Namespace already registered. (namespace: is taken)',
    );
  });

  it('throws ApiError with status 0 on network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.getStats()).rejects.toEqual(
      expect.objectContaining({ name: 'ApiError', status: 0 }),
    );
    await expect(api.getStats()).rejects.toThrow(/Unable to reach the TwextHub API/);
  });

  it('resolves undefined for 204 No Content responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api.acceptTerms(2)).resolves.toBeUndefined();
  });

  it('logout revokes the session server-side then clears local credentials', async () => {
    api.setToken('tok-123');
    api.setStoredUser(makeUser());
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await api.logout();
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/auth/logout`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(api.getToken()).toBeNull();
    expect(localStorage.getItem('twexthub_auth_token')).toBeNull();
    expect(localStorage.getItem('twexthub_auth_user')).toBeNull();
  });

  it('publish falls back to /publish when the scoped version endpoint 404s', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ title: 'Not Found', status: 404, detail: 'missing' }, 404),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Uploaded via fallback.' }));
    const manifest = { namespace: 'kane', id: 'demo', name: 'Demo', version: '1.0.0' };
    const result = await api.publish({ manifest, code: 'console.log(1);' });
    expect(result).toEqual({ success: true, message: 'Extension published successfully.' });
    expect(fetchMock.mock.calls[1][0]).toBe(`${baseUrl}/publish`);
  });

  it('getMe refreshes the stored user profile', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeUser({ role: 'admin' })));
    const me = await api.getMe();
    expect(api.getStoredUser()).toEqual(makeUser({ role: 'admin' }));
    expect(me.role).toBe('admin');
  });
});
