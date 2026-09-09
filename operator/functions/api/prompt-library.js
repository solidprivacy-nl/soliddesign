import { fromBase64, githubRequest, toBase64 } from '../_shared/github-repo.js';

const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const ROOT = 'prompts/library';
const BASE_BRANCH = 'main';
const MAX_PROMPT_BYTES = 200000;
const MAX_FIELDS = 12;
const ALLOWED_CONTROLS = new Set(['text', 'url', 'textarea']);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function bearer(request) {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value : null;
}

function jwtSubject(authorization) {
  try {
    const token = authorization.slice('Bearer '.length);
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return typeof decoded?.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

async function caller(request) {
  const authorization = bearer(request);
  const userId = authorization ? jwtSubject(authorization) : null;
  if (!authorization || !userId) return null;
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/team_members?select=user_id,role,active&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        Authorization: authorization,
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Accept: 'application/json'
      }
    }
  );
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  return row?.active === true ? row : null;
}

function repositoryToken(env) {
  return env?.GITHUB_CONTENT_TOKEN || env?.GITHUB_SECTOR_INTELLIGENCE_TOKEN || '';
}

function validSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug) ? slug : null;
}

function boundedText(value, max) {
  const text = String(value || '').trim();
  return text && text.length <= max ? text : null;
}

function parseFrontMatter(markdown) {
  const text = String(markdown || '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const values = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!raw) continue;
    try {
      values[key] = JSON.parse(raw);
    } catch {
      values[key] = raw;
    }
  }
  return { values, body: match[2].trim() };
}

function normalizeFields(value) {
  if (!Array.isArray(value) || value.length > MAX_FIELDS) return null;
  const seen = new Set();
  const fields = [];
  for (const raw of value) {
    const key = String(raw?.key || '').trim().toLowerCase();
    const label = boundedText(raw?.label, 80);
    const control = String(raw?.control || 'text').trim().toLowerCase();
    const placeholder = String(raw?.placeholder || '').trim().slice(0, 240);
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key) || seen.has(key) || !label || !ALLOWED_CONTROLS.has(control)) return null;
    seen.add(key);
    fields.push({ key, label, control, placeholder, required: raw?.required === true });
  }
  return fields;
}

function promptFromMarkdown(slug, markdown, sha = null, includeBody = false) {
  const parsed = parseFrontMatter(markdown);
  if (!parsed) return null;
  const title = boundedText(parsed.values.title, 120);
  const category = boundedText(parsed.values.category, 80);
  const description = boundedText(parsed.values.description, 500);
  const invocation = parsed.values.invocation && typeof parsed.values.invocation === 'object'
    ? parsed.values.invocation
    : {};
  const intro = boundedText(invocation.intro || 'Lees en volg deze SolidDesign-prompt volledig:', 500);
  const fields = normalizeFields(invocation.fields || []);
  if (!title || !category || !description || !intro || !fields) return null;
  return {
    slug,
    title,
    category,
    description,
    invocation: { intro, fields },
    ...(sha ? { sha } : {}),
    ...(includeBody ? { body: parsed.body } : {})
  };
}

function validatePrompt(input) {
  const slug = validSlug(input?.slug);
  const title = boundedText(input?.title, 120);
  const category = boundedText(input?.category, 80);
  const description = boundedText(input?.description, 500);
  const intro = boundedText(input?.invocation?.intro, 500);
  const fields = normalizeFields(input?.invocation?.fields || []);
  const body = String(input?.body || '').trim();
  if (!slug) return { error: 'Ongeldige prompt-slug.' };
  if (!title || !category || !description || !intro || !fields) return { error: 'Promptmetadata of invoervelden zijn ongeldig.' };
  if (!body) return { error: 'Promptinhoud is leeg.' };
  if (new TextEncoder().encode(body).byteLength > MAX_PROMPT_BYTES) return { error: 'Promptinhoud is te groot.' };
  return { prompt: { slug, title, category, description, invocation: { intro, fields }, body } };
}

function serializePrompt(prompt) {
  return [
    '---',
    `title: ${JSON.stringify(prompt.title)}`,
    `category: ${JSON.stringify(prompt.category)}`,
    `description: ${JSON.stringify(prompt.description)}`,
    `invocation: ${JSON.stringify(prompt.invocation)}`,
    '---',
    prompt.body.trim(),
    ''
  ].join('\n');
}

async function readPrompt(slug, token, includeBody = false) {
  const result = await githubRequest(`/contents/${ROOT}/${slug}.md?ref=${BASE_BRANCH}`, token, {}, [404]);
  if (result.status === 404) return null;
  const markdown = fromBase64(result.payload?.content || '');
  return promptFromMarkdown(slug, markdown, result.payload?.sha || null, includeBody);
}

async function listPrompts(token) {
  const result = await githubRequest(`/contents/${ROOT}?ref=${BASE_BRANCH}`, token, {}, [404]);
  if (result.status === 404) return [];
  const files = (Array.isArray(result.payload) ? result.payload : [])
    .filter((item) => item?.type === 'file' && /^[a-z0-9][a-z0-9-]{0,62}\.md$/.test(item.name || ''));
  const prompts = await Promise.all(files.map(async (file) => {
    const slug = file.name.slice(0, -3);
    return await readPrompt(slug, token, false);
  }));
  return prompts.filter(Boolean).sort((a, b) => a.title.localeCompare(b.title, 'nl'));
}

async function savePrompt(input, token) {
  const validated = validatePrompt(input);
  if (validated.error) return { error: validated.error, status: 400 };
  const prompt = validated.prompt;
  const existing = await githubRequest(`/contents/${ROOT}/${prompt.slug}.md?ref=${BASE_BRANCH}`, token, {}, [404]);
  const expectedSha = String(input?.sha || '').trim() || null;
  if (existing.status === 200 && (!expectedSha || expectedSha !== existing.payload?.sha)) {
    return { error: 'Deze prompt is inmiddels gewijzigd. Vernieuw en probeer opnieuw.', status: 409 };
  }
  if (existing.status === 404 && expectedSha) {
    return { error: 'De prompt bestaat niet meer. Vernieuw en probeer opnieuw.', status: 409 };
  }

  const body = {
    message: `${existing.status === 200 ? 'Update' : 'Add'} operator prompt: ${prompt.slug}`,
    content: toBase64(serializePrompt(prompt)),
    branch: BASE_BRANCH
  };
  if (existing.status === 200) body.sha = existing.payload.sha;

  const result = await githubRequest(`/contents/${ROOT}/${prompt.slug}.md`, token, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return { prompt: { ...prompt, body: undefined, sha: result.payload?.content?.sha || null }, status: 200 };
}

async function deletePrompt(input, token) {
  const slug = validSlug(input?.slug);
  const expectedSha = String(input?.sha || '').trim();
  if (!slug || !expectedSha) return { error: 'Ongeldige verwijderactie.', status: 400 };
  const existing = await githubRequest(`/contents/${ROOT}/${slug}.md?ref=${BASE_BRANCH}`, token, {}, [404]);
  if (existing.status === 404) return { error: 'Prompt bestaat niet meer.', status: 404 };
  if (existing.payload?.sha !== expectedSha) return { error: 'Deze prompt is inmiddels gewijzigd. Vernieuw en probeer opnieuw.', status: 409 };
  await githubRequest(`/contents/${ROOT}/${slug}.md`, token, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `Remove operator prompt: ${slug}`,
      sha: expectedSha,
      branch: BASE_BRANCH
    })
  });
  return { deleted: true, slug, status: 200 };
}

export async function onRequestGet(context) {
  const member = await caller(context.request);
  if (!member) return json({ error: 'Niet geautoriseerd.' }, 401);
  const token = repositoryToken(context.env);
  const url = new URL(context.request.url);
  const slug = validSlug(url.searchParams.get('slug'));
  const includeBody = url.searchParams.get('body') === '1';
  if (includeBody && member.role !== 'ADMIN') return json({ error: 'Alleen een Admin kan promptinhoud bekijken.' }, 403);

  try {
    if (slug) {
      const prompt = await readPrompt(slug, token, includeBody);
      if (!prompt) return json({ error: 'Prompt niet gevonden.' }, 404);
      return json({ prompt, can_manage: member.role === 'ADMIN' });
    }
    return json({ prompts: await listPrompts(token), can_manage: member.role === 'ADMIN' });
  } catch (error) {
    console.error('Prompt Library read failed', error?.status || '', error?.payload || error);
    return json({ error: 'Promptbibliotheek kon niet worden geladen.' }, 502);
  }
}

export async function onRequestPost(context) {
  const member = await caller(context.request);
  if (!member) return json({ error: 'Niet geautoriseerd.' }, 401);
  if (member.role !== 'ADMIN') return json({ error: 'Alleen een Admin kan prompts wijzigen.' }, 403);
  const token = repositoryToken(context.env);
  if (!token) return json({ error: 'Repositorybeheer is nog niet geconfigureerd.' }, 503);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Ongeldige invoer.' }, 400);
  }

  try {
    const result = body?.action === 'delete'
      ? await deletePrompt(body, token)
      : await savePrompt(body, token);
    if (result.error) return json({ error: result.error }, result.status);
    const { status, ...payload } = result;
    return json(payload, status);
  } catch (error) {
    console.error('Prompt Library mutation failed', error?.status || '', error?.payload || error);
    return json({ error: 'Promptwijziging kon niet worden opgeslagen.' }, 502);
  }
}
