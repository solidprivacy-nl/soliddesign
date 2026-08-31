const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const REPO = 'solidprivacy-nl/soliddesign';
const ROOT = 'sector-intelligence';
const BASE_BRANCH = 'main';
const MAX_MARKDOWN_BYTES = 180000;
const REQUIRED_HEADINGS = [
  '## Quality bar',
  '## Strong recurring patterns',
  '## Creative opportunities',
  '## Patterns to avoid',
  '## Sector references',
  '## Principles distilled from the evidence',
  '## Weak / uncertain conclusions'
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function authorizationHeader(request) {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value : null;
}

async function authorize(request) {
  const authorization = authorizationHeader(request);
  if (!authorization) return false;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/operator_is_active_team_member`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  if (!response.ok) return false;
  return (await response.json().catch(() => false)) === true;
}

function validKey(value) {
  const key = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(key) ? key : null;
}

function unwrapCodeFence(value) {
  const text = String(value || '').trim();
  const match = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return (match ? match[1] : text).trim();
}

function validateMarkdown(markdown, sectorKey) {
  if (!markdown) return 'Het onderzoeksresultaat is leeg.';
  if (new TextEncoder().encode(markdown).byteLength > MAX_MARKDOWN_BYTES) {
    return 'Het onderzoeksresultaat is te groot.';
  }
  const frontMatter = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontMatter) return 'Front matter ontbreekt.';
  const sectorMatch = frontMatter[1].match(/^sector_key:\s*([a-z0-9_-]+)\s*$/m);
  if (!sectorMatch || sectorMatch[1] !== sectorKey) {
    return 'De sector key in het onderzoeksresultaat komt niet overeen met de gekozen sector.';
  }
  if (!/^# Sector Design Intelligence\b/m.test(markdown)) {
    return 'De titel van het Sector Intelligence-document ontbreekt.';
  }
  const missing = REQUIRED_HEADINGS.filter((heading) => !markdown.includes(heading));
  if (missing.length) return `Verplichte sectie ontbreekt: ${missing[0].replace(/^##\s*/, '')}.`;
  const references = markdown.match(/https:\/\/[^\s)>\]]+/g) || [];
  if (references.length < 3) return 'Het onderzoeksresultaat bevat te weinig bronverwijzingen.';
  return null;
}

function metadata(markdown, fallbackKey) {
  const frontMatter = String(markdown || '').match(/^---\s*\n([\s\S]*?)\n---/);
  const text = frontMatter?.[1] || '';
  const field = (name) => text.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'))?.[1]?.replace(/^['"]|['"]$/g, '').trim() || null;
  return {
    canonical_sector_key: fallbackKey,
    research_label: field('research_label') || fallbackKey.replaceAll('_', ' '),
    researched_at: field('researched_at')
  };
}

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(String(value || '').replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function github(path, token, init = {}, allowedStatuses = []) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SolidDesign-CMS',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(init.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
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

async function readMarkdown(key, ref, token) {
  const result = await github(`/contents/${ROOT}/${key}.md?ref=${encodeURIComponent(ref)}`, token, {}, [404]);
  if (result.status === 404) return null;
  return fromBase64(result.payload?.content || '').trim();
}

function pendingPullForKey(pulls, key) {
  return (Array.isArray(pulls) ? pulls : []).find((pull) => {
    const match = String(pull?.title || '').match(/^Sector Intelligence:\s*([a-z0-9][a-z0-9_-]{0,62})$/i);
    return validKey(match?.[1]) === key;
  }) || null;
}

async function openPulls(token) {
  const result = await github('/pulls?state=open&per_page=100', token);
  return Array.isArray(result.payload) ? result.payload : [];
}

async function listSectors(token) {
  const [filesResult, pulls] = await Promise.all([
    github(`/contents/${ROOT}?ref=${BASE_BRANCH}`, token),
    openPulls(token)
  ]);
  const rows = new Map();

  for (const file of Array.isArray(filesResult.payload) ? filesResult.payload : []) {
    const match = String(file?.name || '').match(/^([a-z0-9][a-z0-9_-]{0,62})\.md$/);
    const key = validKey(match?.[1]);
    if (!key || key.toLowerCase() === 'readme') continue;
    rows.set(key, {
      canonical_sector_key: key,
      status: 'AVAILABLE',
      published_ref: BASE_BRANCH,
      pending_ref: null
    });
  }

  for (const pull of pulls) {
    const match = String(pull?.title || '').match(/^Sector Intelligence:\s*([a-z0-9][a-z0-9_-]{0,62})$/i);
    const key = validKey(match?.[1]);
    if (!key) continue;
    const current = rows.get(key);
    rows.set(key, {
      canonical_sector_key: key,
      status: current ? 'UPDATE_PENDING_REVIEW' : 'PENDING_REVIEW',
      published_ref: current?.published_ref || null,
      pending_ref: pull?.head?.ref || null
    });
  }

  const hydrated = await Promise.all([...rows.values()].map(async (row) => {
    const preferredRef = row.pending_ref || row.published_ref;
    const markdown = preferredRef ? await readMarkdown(row.canonical_sector_key, preferredRef, token) : null;
    const meta = metadata(markdown, row.canonical_sector_key);
    return {
      canonical_sector_key: row.canonical_sector_key,
      research_label: meta.research_label,
      researched_at: meta.researched_at,
      status: row.status,
      has_published: Boolean(row.published_ref),
      has_pending_review: Boolean(row.pending_ref)
    };
  }));

  return hydrated.sort((a, b) => a.research_label.localeCompare(b.research_label, 'nl'));
}

async function detailForKey(key, version, token) {
  if (version === 'pending') {
    const pulls = await openPulls(token);
    const pull = pendingPullForKey(pulls, key);
    if (!pull?.head?.ref) return null;
    const markdown = await readMarkdown(key, pull.head.ref, token);
    if (!markdown) return null;
    return { ...metadata(markdown, key), version: 'pending', content: markdown };
  }
  const markdown = await readMarkdown(key, BASE_BRANCH, token);
  if (!markdown) return null;
  return { ...metadata(markdown, key), version: 'published', content: markdown };
}

async function submitResearch(key, markdown, token) {
  const pulls = await openPulls(token);
  if (pendingPullForKey(pulls, key)) {
    const error = new Error('pending review exists');
    error.status = 409;
    throw error;
  }

  const current = await github(`/contents/${ROOT}/${key}.md?ref=${BASE_BRANCH}`, token, {}, [404]);
  let currentSha = null;
  if (current.status === 200) {
    currentSha = current.payload?.sha || null;
    const existing = fromBase64(current.payload?.content || '').trim();
    if (existing === markdown.trim()) return { status: 'unchanged' };
  }

  const base = await github(`/branches/${BASE_BRANCH}`, token);
  const baseSha = base.payload?.commit?.sha;
  if (!baseSha) throw new Error('base unavailable');

  const suffix = crypto.randomUUID().slice(0, 8);
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const branch = `sector-intelligence/${key}-${date}-${suffix}`;

  await github('/git/refs', token, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
  });

  const contentBody = {
    message: `Update Sector Intelligence for ${key}`,
    content: toBase64(`${markdown.trim()}\n`),
    branch
  };
  if (currentSha) contentBody.sha = currentSha;

  await github(`/contents/${ROOT}/${key}.md`, token, {
    method: 'PUT',
    body: JSON.stringify(contentBody)
  });

  await github('/pulls', token, {
    method: 'POST',
    body: JSON.stringify({
      title: `Sector Intelligence: ${key}`,
      head: branch,
      base: BASE_BRANCH,
      body: 'Sector Intelligence update submitted through the SolidDesign CMS. Human review is required before publication.'
    })
  });
  return { status: 'submitted' };
}

async function removeBranch(ref, token) {
  if (!ref) return;
  await github(`/git/refs/heads/${encodeURIComponent(ref)}`, token, { method: 'DELETE' }, [404, 422]);
}

async function reviewResearch(key, action, token) {
  const pulls = await openPulls(token);
  const pull = pendingPullForKey(pulls, key);
  if (!pull?.number) {
    const error = new Error('pending review missing');
    error.status = 404;
    throw error;
  }

  if (action === 'approve') {
    await github(`/pulls/${pull.number}/merge`, token, {
      method: 'PUT',
      body: JSON.stringify({
        merge_method: 'squash',
        commit_title: `Publish Sector Intelligence: ${key}`
      })
    });
    await removeBranch(pull?.head?.ref, token);
    return { status: 'published' };
  }

  if (action === 'reject') {
    await github(`/pulls/${pull.number}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' })
    });
    await removeBranch(pull?.head?.ref, token);
    return { status: 'rejected' };
  }

  const error = new Error('unsupported review action');
  error.status = 400;
  throw error;
}

export async function onRequestGet(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);
  const token = context.env?.GITHUB_SECTOR_INTELLIGENCE_TOKEN || '';
  const url = new URL(context.request.url);
  const key = validKey(url.searchParams.get('key'));
  const version = url.searchParams.get('version') === 'pending' ? 'pending' : 'published';

  try {
    if (key) {
      const detail = await detailForKey(key, version, token);
      if (!detail) return json({ error: 'Sectoronderzoek niet gevonden.' }, 404);
      return json({ sector: detail });
    }
    return json({ sectors: await listSectors(token) });
  } catch (error) {
    console.error('Sector Intelligence read failed', error?.status || '', error?.payload || error);
    return json({ error: 'Sectoronderzoek kon niet worden geladen.' }, 502);
  }
}

export async function onRequestPost(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);
  const token = context.env?.GITHUB_SECTOR_INTELLIGENCE_TOKEN;
  if (!token) return json({ error: 'Sectoronderzoek is nog niet volledig geconfigureerd.' }, 503);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Ongeldige invoer.' }, 400);
  }

  const action = String(body?.action || 'submit');
  const key = validKey(body?.canonical_sector_key);
  if (!key) return json({ error: 'Ongeldige sector.' }, 400);

  try {
    if (action === 'submit') {
      const markdown = unwrapCodeFence(body?.markdown);
      const validationError = validateMarkdown(markdown, key);
      if (validationError) return json({ error: validationError }, 400);
      return json(await submitResearch(key, markdown, token));
    }
    if (action === 'approve' || action === 'reject') {
      return json(await reviewResearch(key, action, token));
    }
    return json({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    console.error('Sector Intelligence mutation failed', action, error?.status || '', error?.payload || error);
    if (error?.status === 409) return json({ error: 'Er staat al onderzoek voor deze sector ter beoordeling.' }, 409);
    if (error?.status === 404) return json({ error: 'Er staat geen onderzoek voor deze sector ter beoordeling.' }, 404);
    if (action === 'submit') return json({ error: 'Onderzoeksresultaat kon niet voor beoordeling worden opgeslagen.' }, 502);
    return json({ error: 'De beoordeling kon niet worden verwerkt.' }, 502);
  }
}
