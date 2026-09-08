export const SOLIDDESIGN_REPOSITORY = 'solidprivacy-nl/soliddesign';

export function toBase64(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value) {
  const binary = atob(String(value || '').replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function githubRequest(path, token, init = {}, allowedStatuses = []) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SolidDesign-CMS',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(init.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`https://api.github.com/repos/${SOLIDDESIGN_REPOSITORY}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(10000)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok && !allowedStatuses.includes(response.status)) {
    const error = new Error(`repository operation failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return { status: response.status, payload };
}
