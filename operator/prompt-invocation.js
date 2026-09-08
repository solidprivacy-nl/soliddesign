(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.internalOrigin || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const cache = new Map();

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om een prompt te gebruiken.');
    return session;
  }

  async function prompt(slug, { refresh = false } = {}) {
    const key = String(slug || '').trim().toLowerCase();
    if (!key) throw new Error('Prompt ontbreekt.');
    if (!refresh && cache.has(key)) return cache.get(key);
    const session = await sessionOrThrow();
    const response = await fetch(`/api/prompt-library?slug=${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Prompt kon niet worden geladen (${response.status}).`);
    if (!payload.prompt) throw new Error('Promptdefinitie ontbreekt.');
    cache.set(key, payload.prompt);
    return payload.prompt;
  }

  function promptUrl(slug) {
    return `${String(CONFIG.internalOrigin).replace(/\/$/, '')}/prompts/library/${encodeURIComponent(slug)}.md`;
  }

  function render(definition, values = {}) {
    const lines = [definition.invocation?.intro || 'Lees en volg deze SolidDesign-prompt volledig:', promptUrl(definition.slug)];
    for (const field of definition.invocation?.fields || []) {
      const supplied = String(values[field.key] ?? '').trim();
      const fallback = field.required ? `[${field.placeholder || field.label}]` : (field.placeholder ? `[${field.placeholder}]` : '');
      const value = supplied || fallback;
      if (!value && !field.required) continue;
      lines.push('', `${field.label}:`, value);
    }
    return lines.join('\n').trim();
  }

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      if (!ok) throw new Error('De tekst kon niet naar het klembord worden gekopieerd.');
    }
  }

  async function copy(slug, values = {}) {
    const definition = await prompt(slug);
    const text = render(definition, values);
    await writeClipboard(text);
    return { definition, text };
  }

  window.SOLIDDESIGN_PROMPTS = Object.freeze({ prompt, promptUrl, render, copy, writeClipboard });
})();
