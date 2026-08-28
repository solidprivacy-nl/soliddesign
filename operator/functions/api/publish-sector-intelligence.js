const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const GITHUB_REPO = 'solidprivacy-nl/soliddesign';
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

async function authorize(request) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY
    }
  });
  if (!userResponse.ok) return false;

  const allowlistResponse = await fetch(`${SUPABASE_URL}/rest/v1/operator_allowlist?select=email&limit=1`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: 'application/json'
    }
  });
  if (!allowlistResponse.ok) return false;
  const rows = await allowlistResponse.json().catch(() => []);
  return Array.isArray(rows) && rows.length === 1;
}

function unwrapCodeFence(value) {
  const text = String(value || '').trim();
  const match = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return (match ? match[1] : text).trim();
}

function validateSectorKey(value) {
  const key = String(value || '').trim();
  return /^[a-z0-9][a-z0-9_-]{0,79}$/.test(key) ? key : null;
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
  if (missing.length) {
    return `Verplichte sectie ontbreekt: ${missing[0].replace(/^##\s*/, '')}.`;
  }
  const references = markdown.match(/https:\/\/[^\s)>\]]+/g) || [];
  if (references.length < 3) return 'Het onderzoeksresultaat bevat te weinig bronverwijzingen.';
  return null;
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

async function githubRequest(token, path, init = {}, allowedStatuses = []) {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SolidDesign-CMS',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {})
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok && !allowedStatuses.includes(response.status)) {
    const error = new Error(`GitHub request failed (${response.status}).`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return { status: response.status, payload };
}

async function publish(token, sectorKey, markdown) {
  const filePath = `sector-intelligence/${sectorKey}.md`;
  const current = await githubRequest(
    token,
    `/contents/${filePath}?ref=${BASE_BRANCH}`,
    { method: 'GET' },
    [404]
  );

  let currentSha = null;
  if (current.status === 200) {
    currentSha = current.payload?.sha || null;
    const existing = fromBase64(current.payload?.content || '').trim();
    if (existing === markdown.trim()) return { status: 'unchanged' };
  }

  const base = await githubRequest(token, `/branches/${BASE_BRANCH}`, { method: 'GET' });
  const baseSha = base.payload?.commit?.sha;
  if (!baseSha) throw new Error('Base branch kon niet worden bepaald.');

  const suffix = crypto.randomUUID().slice(0, 8);
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const branch = `sector-intelligence/${sectorKey}-${date}-${suffix}`;

  await githubRequest(token, '/git/refs', {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: baseSha
    })
  });

  const contentBody = {
    message: `Update Sector Intelligence for ${sectorKey}`,
    content: toBase64(`${markdown.trim()}\n`),
    branch
  };
  if (currentSha) contentBody.sha = currentSha;

  await githubRequest(token, `/contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify(contentBody)
  });

  await githubRequest(token, '/pulls', {
    method: 'POST',
    body: JSON.stringify({
      title: `Sector Intelligence: ${sectorKey}`,
      head: branch,
      base: BASE_BRANCH,
      body: `Sector Intelligence update submitted through the SolidDesign CMS.\n\nCanonical sector: \`${sectorKey}\`.\n\nRequires human review before merge.`
    })
  });

  return { status: 'submitted' };
}

export async function onRequestPost(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);

  const token = context.env?.GITHUB_SECTOR_INTELLIGENCE_TOKEN;
  if (!token) {
    return json({ error: 'Sectorinzichten publiceren is nog niet geconfigureerd.' }, 503);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Ongeldige JSON.' }, 400);
  }

  const sectorKey = validateSectorKey(body?.canonical_sector_key);
  if (!sectorKey) return json({ error: 'Ongeldige sector key.' }, 400);

  const markdown = unwrapCodeFence(body?.markdown);
  const validationError = validateMarkdown(markdown, sectorKey);
  if (validationError) return json({ error: validationError }, 400);

  try {
    const result = await publish(token, sectorKey, markdown);
    return json(result);
  } catch (error) {
    console.error('Sector Intelligence publication failed', error?.status || '', error?.payload || error);
    return json({ error: 'Sectorinzichten konden niet voor review worden opgeslagen.' }, 502);
  }
}
