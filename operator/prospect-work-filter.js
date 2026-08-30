const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

let currentUserId = null;
let assignments = [];
let prospects = [];
let workFilter = 'ALL';
let applying = false;

function el(id) { return document.getElementById(id); }

function addStylesheet() {
  if (document.querySelector('link[data-prospect-work-filter-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './prospect-work-filter.css';
  link.dataset.prospectWorkFilterStyle = 'true';
  document.head.appendChild(link);
}

async function refreshData() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return false;
  currentUserId = session.user.id;

  const [assignmentResult, prospectResult] = await Promise.all([
    db.from('prospect_assignments').select('prospect_id,responsibility,user_id'),
    db.from('prospects').select('id,name,city,contact_status,updated_at').order('updated_at', { ascending: false })
  ]);
  if (assignmentResult.error) throw assignmentResult.error;
  if (prospectResult.error) throw prospectResult.error;
  assignments = assignmentResult.data || [];
  prospects = prospectResult.data || [];
  return true;
}

function baseFilteredProspects() {
  const q = el('searchInput')?.value.trim().toLowerCase() || '';
  const status = el('statusFilter')?.value || '';
  return prospects.filter((prospect) => {
    const matchesText = !q || `${prospect.name} ${prospect.city || ''}`.toLowerCase().includes(q);
    const matchesStatus = !status || (prospect.contact_status || 'qualified') === status;
    return matchesText && matchesStatus;
  });
}

function hasAssignment(prospectId, responsibility) {
  return assignments.some((item) => item.prospect_id === prospectId && item.responsibility === responsibility);
}

function matchesWorkFilter(prospectId) {
  if (workFilter === 'MINE') return assignments.some((item) => item.prospect_id === prospectId && item.user_id === currentUserId);
  if (workFilter === 'NO_CASE_LEAD') return !hasAssignment(prospectId, 'CASE_LEAD');
  if (workFilter === 'NO_DESIGN') return !hasAssignment(prospectId, 'DESIGN');
  if (workFilter === 'NO_OUTREACH') return !hasAssignment(prospectId, 'OUTREACH');
  return true;
}

function applyFilter() {
  if (applying) return;
  applying = true;
  try {
    const rows = [...document.querySelectorAll('#prospectList .prospect-row')];
    const base = baseFilteredProspects();
    let visible = 0;

    rows.forEach((row, index) => {
      const prospect = base[index];
      const show = Boolean(prospect) && matchesWorkFilter(prospect.id);
      row.classList.toggle('hidden', !show);
      if (prospect) row.dataset.prospectId = prospect.id;
      if (show) visible += 1;
    });

    const count = el('countText');
    if (count) count.textContent = workFilter === 'ALL' ? `${base.length} van ${prospects.length}` : `${visible} van ${prospects.length}`;
  } finally {
    applying = false;
  }
}

function scheduleApply() {
  queueMicrotask(applyFilter);
}

function installFilter() {
  const filters = document.querySelector('#activeProspectPane .filters');
  if (!filters || el('workAssignmentFilter')) return;

  const select = document.createElement('select');
  select.id = 'workAssignmentFilter';
  select.setAttribute('aria-label', 'Werkverdeling');
  select.innerHTML = `
    <option value="ALL">Alle werkverdelingen</option>
    <option value="MINE">Mijn werk</option>
    <option value="NO_CASE_LEAD">Zonder dossierhouder</option>
    <option value="NO_DESIGN">Zonder design</option>
    <option value="NO_OUTREACH">Zonder outreach</option>`;
  filters.appendChild(select);

  select.addEventListener('change', () => {
    workFilter = select.value;
    applyFilter();
  });

  el('searchInput')?.addEventListener('input', scheduleApply);
  el('statusFilter')?.addEventListener('change', scheduleApply);

  const list = el('prospectList');
  if (list) new MutationObserver(scheduleApply).observe(list, { childList: true });

  document.addEventListener('change', (event) => {
    if (!event.target.closest?.('[data-assignment]')) return;
    window.setTimeout(async () => {
      try {
        await refreshData();
        applyFilter();
      } catch (error) {
        console.error('Werkverdeling kon niet worden vernieuwd.', error);
      }
    }, 500);
  });

  applyFilter();
}

async function initialize() {
  if (!db) return;
  if (!await refreshData()) return;
  addStylesheet();
  installFilter();
}

initialize().catch(console.error);
db?.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') initialize().catch(console.error);
});
