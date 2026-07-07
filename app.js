// ═══════════════════════════════════════════════
//  SUPABASE
// ═══════════════════════════════════════════════
// The publishable key is safe to ship in public code — Row Level Security
// on the database decides what any key-holder can actually do.
const SUPABASE_URL = 'https://vxykjkuqhtfrzfktymja.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oq2u0mXKoALbSCFTWu-iJQ_q1dO_zmB';
const APP_ID = 'disc-golf-tracker';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let sbUser = null;

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
let state = {
  tournaments: [],
  tRounds: [],
  leagues: [],
  leagueRounds: [],
  courses: [],
  pdgaRating: null,
  editingId: null
};

function normalizeState(s) {
  // Migration: old builds stored league rounds in 'leagues'.
  // New shape uses 'leagueRounds' for rounds and 'leagues' for league definitions.
  if (!Array.isArray(s.leagueRounds)) {
    if (Array.isArray(s.leagues) && s.leagues.some(x => x.courseId)) {
      s.leagueRounds = s.leagues.filter(x => x.courseId);
      s.leagues = s.leagues.filter(x => !x.courseId);
    } else {
      s.leagueRounds = [];
    }
  }
  // Ensure all arrays exist regardless of when the data was saved
  if (!Array.isArray(s.tournaments)) s.tournaments = [];
  if (!Array.isArray(s.tRounds)) s.tRounds = [];
  if (!Array.isArray(s.leagues)) s.leagues = [];
  if (!Array.isArray(s.courses)) s.courses = [];
  return s;
}

async function loadState() {
  const { data: row, error } = await sb.from('app_state')
    .select('data')
    .eq('app', APP_ID)
    .maybeSingle();
  if (error) { showToast('Failed to load data: ' + error.message); return; }
  if (row) {
    state = normalizeState(row.data);
  } else {
    // First sign-in for this account: if this browser has data saved from
    // the pre-cloud version, move it up to the cloud automatically.
    const local = localStorage.getItem('dgt-state');
    if (local) {
      try {
        state = normalizeState(JSON.parse(local));
        await saveStateNow();
        showToast('Local data moved to your cloud account');
      } catch(e) { console.warn('Could not migrate local data', e); }
    }
  }
}

function saveState() {
  saveStateNow().catch(err => showToast('Save failed: ' + err.message));
}

async function saveStateNow() {
  if (!sbUser) return;
  const { error } = await sb.from('app_state').upsert({
    user_id: sbUser.id,
    app: APP_ID,
    data: state,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

// ═══════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════
async function initApp() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) await startApp(session);
  else document.getElementById('login-screen').style.display = 'flex';
}

async function startApp(session) {
  sbUser = session.user;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('user-email').textContent = sbUser.email;
  document.getElementById('signout-btn').style.display = '';
  await loadState();
  renderDashboard();
}

function setLoginMsg(msg, isError) {
  const el = document.getElementById('login-msg');
  el.textContent = msg || '';
  el.style.color = isError ? 'var(--red)' : 'var(--accent)';
}

async function doSignIn() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return setLoginMsg('Enter your email and password.', true);
  setLoginMsg('Signing in…');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return setLoginMsg(error.message, true);
  setLoginMsg('');
  await startApp(data.session);
}

async function doSignUp() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return setLoginMsg('Enter an email and a password to create your account.', true);
  setLoginMsg('Creating account…');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return setLoginMsg(error.message, true);
  if (data.session) {
    setLoginMsg('');
    await startApp(data.session);
  } else {
    setLoginMsg('Account created — check your email for a confirmation link, then sign in here.');
  }
}

async function doSignOut() {
  await sb.auth.signOut();
  location.reload();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Sort state per table
const sortState = { tournaments: {}, trounds: {}, leagues: {} };


// ═══ SORTING ═══
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', e => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const col = th.dataset.col;
    const table = th.dataset.table;
    const ss = sortState[table];
    if (ss.col === col) { ss.dir = ss.dir === 'asc' ? 'desc' : 'asc'; }
    else { ss.col = col; ss.dir = 'asc'; }
    th.closest('table').querySelectorAll('th.sortable').forEach(h => h.classList.remove('sort-asc','sort-desc'));
    th.classList.add(ss.dir === 'asc' ? 'sort-asc' : 'sort-desc');
    if (table === 'tournaments') renderTournaments();
    if (table === 'trounds') renderTRounds();
    if (table === 'leagues') renderLeagues();
  });
});

function sortData(data, table, colValueFn) {
  const ss = sortState[table];
  if (!ss.col) return data;
  return [...data].sort((a, b) => {
    const av = colValueFn(a, ss.col);
    const bv = colValueFn(b, ss.col);
    if (av == null && bv == null) return 0;
    if (av == null) return 1; if (bv == null) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return ss.dir === 'asc' ? cmp : -cmp;
  });
}

function tournColVal(t, col) {
  if (col === 'name') return t.name || '';
  if (col === 'date') return t.date || '';
  if (col === 'tier') return t.tier || '';
  if (col === 'field') return t.field;
  if (col === 'place') return t.place;
  if (col === 'fee') return t.fee;
  if (col === 'prize') return t.prize != null ? t.prize - (t.fee||0) - (t.caddy||0) : null;
  return null;
}

function troundColVal(r, col) {
  if (col === 'roundNum') return r.roundNum;
  if (col === 'date') return r.date || '';
  if (col === 'tournament') return getTournamentName(r.tournamentId) || '';
  if (col === 'course') return getCourseName(r.courseId) || '';
  if (col === 'par') return r.par;
  if (col === 'score') return r.score;
  if (col === 'rel') return (r.score && r.par) ? r.score - r.par : null;
  if (col === 'rating') return r.rating;
  return null;
}

function leagueColVal(r, col) {
  if (col === 'date') return r.date || '';
  if (col === 'league') { const l = state.leagues.find(x => x.id === r.leagueId); return l ? l.name : ''; }
  if (col === 'course') return getCourseName(r.courseId) || '';
  if (col === 'par') return r.par;
  if (col === 'score') return r.score;
  if (col === 'rel') return (r.score && r.par) ? r.score - r.par : null;
  if (col === 'place') return r.place;
  if (col === 'field') return r.field;
  if (col === 'fee') return r.fee;
  if (col === 'cash') return r.cash;
  return null;
}

// ═══════════════════════════════════════════════
//  NAV
// ═══════════════════════════════════════════════
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const btns = document.querySelectorAll('nav button');
  btns.forEach(b => { if (b.getAttribute('onclick').includes("'" + name + "'")) b.classList.add('active'); });

  if (name === 'dashboard') renderDashboard();
  if (name === 'tournaments') { renderTournaments(); populateTournamentFilters(); }
  if (name === 't-rounds') { showPage('tournaments'); switchTournTab('rounds'); return; }
  if (name === 'leagues') { renderLeagues(); populateLeagueFilters(); renderLeagueDefinitions(); }
  if (name === 'courses') renderCourses();
  if (name === 'stats') renderStats();
}

// ═══════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════
function openModal(id, editId, prefillTournamentId) {
  state.editingId = editId || null;
  const overlay = document.getElementById(id);
  overlay.classList.add('open');

  if (id === 'modal-tournament') {
    populateCourseChecklist([]);
      const cf = document.getElementById('t-courses-filter'); if (cf) cf.value = '';
    if (editId) {
      const t = state.tournaments.find(x => x.id === editId);
      if (t) {
        document.getElementById('modal-tournament-title').textContent = 'Edit Tournament';
        document.getElementById('t-name').value = t.name || '';
        document.getElementById('t-date').value = t.date || '';
        document.getElementById('t-year').value = t.year || '';
        document.getElementById('t-location').value = t.location || '';
        document.getElementById('t-tier').value = t.tier || '';
        document.getElementById('t-division').value = t.division || 'MPO';
        document.getElementById('t-field').value = t.field || '';
        document.getElementById('t-days').value = t.numDays || '';
        document.getElementById('t-rounds').value = t.numRounds || '';
        onTournDaysChange();
        document.getElementById('t-place').value = t.place || '';
        document.getElementById('t-url').value = t.url || '';
        document.getElementById('t-fee').value = t.fee != null ? t.fee : '';
        document.getElementById('t-prize').value = t.prize != null ? t.prize : '';
        document.getElementById('t-caddy').value = t.caddy != null ? t.caddy : '';
        document.getElementById('t-notes').value = t.notes || '';
        populateCourseChecklist(t.courses || []);
        const cf = document.getElementById('t-courses-filter'); if (cf) cf.value = '';
      }
    } else {
      document.getElementById('modal-tournament-title').textContent = 'Add Tournament';
      clearForm(['t-name','t-date','t-days','t-location','t-tier','t-field','t-rounds','t-place','t-url','t-fee','t-prize','t-caddy','t-notes']);
      document.getElementById('t-year').value = '';
      document.getElementById('t-end-date').value = '';
      _inlineTournamentId = null;
      document.getElementById('t-rounds-section').style.display = 'none';
      document.getElementById('t-inline-round-form').style.display = 'none';
      document.getElementById('t-add-round-btn').style.display = 'block';
      document.getElementById('t-rounds-list').innerHTML = '';
      document.getElementById('t-save-btn').textContent = 'Save Tournament';
      document.getElementById('t-save-btn').onclick = saveTournament;
      document.getElementById('modal-tournament').querySelector('.modal-body').classList.remove('form-locked');
      document.getElementById('t-division').value = 'MPO';
    }
  }

  if (id === 'modal-tround') {
    populateSelect('tr-tournament', state.tournaments.map(t => ({v: t.id, l: t.name})), 'Select tournament…');
    // course select will be populated when tournament is chosen via onTRTournamentChange
    populateCourseSelectFiltered('tr-course', null);
    if (editId) {
      const r = state.tRounds.find(x => x.id === editId);
      if (r) {
        document.getElementById('modal-tround-title').textContent = 'Edit Round';
        document.getElementById('tr-date').value = r.date || '';
        document.getElementById('tr-year').value = r.year || '';
        document.getElementById('tr-tournament').value = r.tournamentId || '';
        populateCourseSelectFiltered('tr-course', r.tournamentId);
        document.getElementById('tr-course').value = r.courseId || '';
        document.getElementById('tr-round-num').value = r.roundNum || '';
        document.getElementById('tr-par').value = r.par || '';
        document.getElementById('tr-score').value = r.score || '';
        document.getElementById('tr-rating').value = r.rating || '';
        document.getElementById('tr-notes').value = r.notes || '';
        updateTRRelScore();
      }
    } else {
      document.getElementById('modal-tround-title').textContent = 'Add Tournament Round';
      clearForm(['tr-date','tr-round-num','tr-par','tr-score','tr-rating','tr-notes']);
      document.getElementById('tr-year').value = '';
      document.getElementById('tr-rel').value = '—';
      document.getElementById('tr-rel').style.color = 'var(--text-muted)';
      document.getElementById('tr-course').value = '';
      if (prefillTournamentId) {
        document.getElementById('tr-tournament').value = prefillTournamentId;
        populateCourseSelectFiltered('tr-course', prefillTournamentId);
        const _pt = state.tournaments.find(x => x.id === prefillTournamentId);
        if (_pt && _pt.date) {
          document.getElementById('tr-date').value = _pt.date;
          document.getElementById('tr-year').value = _pt.year || (_pt.date ? _pt.date.slice(0,4) : '');
        }
        if (_pt && _pt.courses && _pt.courses.length === 1) {
          document.getElementById('tr-course').value = _pt.courses[0];
        }
      } else {
        document.getElementById('tr-tournament').value = '';
      }
    }
  }

  if (id === 'modal-league') {
    populateCourseSelect('lg-course');
    populateLeagueSelect('lg-league');
    if (editId) {
      const r = state.leagueRounds.find(x => x.id === editId);
      if (r) {
        document.getElementById('modal-league-title').textContent = 'Edit League Round';
        document.getElementById('lg-date').value = r.date || '';
        document.getElementById('lg-year').value = r.year || '';
        document.getElementById('lg-league').value = r.leagueId || '';
        document.getElementById('lg-course').value = r.courseId || '';
        document.getElementById('lg-par').value = r.par || '';
        document.getElementById('lg-score').value = r.score || '';
        updateLGRelScore();
        document.getElementById('lg-place').value = r.place || '';
        document.getElementById('lg-field').value = r.field || '';
        document.getElementById('lg-fee').value = r.fee != null ? r.fee : '';
        document.getElementById('lg-cash').value = r.cash != null ? r.cash : '';
        document.getElementById('lg-notes').value = r.notes || '';
      }
    } else {
      document.getElementById('modal-league-title').textContent = 'Add League Round';
      clearForm(['lg-date','lg-par','lg-score','lg-place','lg-field','lg-fee','lg-cash','lg-notes']);
      document.getElementById('lg-year').value = '';
      document.getElementById('lg-league').value = '';
      document.getElementById('lg-course').value = '';
      document.getElementById('lg-rel').value = '—';
      document.getElementById('lg-rel').style.color = 'var(--text-muted)';
    }
  }

  if (id === 'modal-league-def') {
    if (editId) {
      const l = state.leagues.find(x => x.id === editId);
      if (l) {
        document.getElementById('modal-league-def-title').textContent = 'Edit League';
        document.getElementById('ld-name').value = l.name || '';
        document.getElementById('ld-day').value = l.day || '';
        document.getElementById('ld-location').value = l.location || '';
        document.getElementById('ld-notes').value = l.notes || '';
      }
    } else {
      document.getElementById('modal-league-def-title').textContent = 'Add League';
      clearForm(['ld-name','ld-day','ld-location','ld-notes']);
    }
  }

  if (id === 'modal-course') {
    if (editId) {
      const c = state.courses.find(x => x.id === editId);
      if (c) {
        document.getElementById('modal-course-title').textContent = 'Edit Course';
        document.getElementById('c-name').value = c.name || '';
        document.getElementById('c-location').value = c.location || '';
        document.getElementById('c-holes').value = c.holes || '';
        document.getElementById('c-notes').value = c.notes || '';
      }
    } else {
      document.getElementById('modal-course-title').textContent = 'Add Course';
      clearForm(['c-name','c-location','c-holes','c-notes']);
    }
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  state.editingId = null;
}

function clearForm(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function populateSelect(selectId, items, placeholder) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(i => {
    sel.innerHTML += `<option value="${i.v}">${i.l}</option>`;
  });
}

function switchTournTab(tab) {
  document.getElementById('tourn-view-rounds').style.display = tab === 'rounds' ? 'block' : 'none';
  document.getElementById('tourn-view-events').style.display = tab === 'events' ? 'block' : 'none';
  document.getElementById('tourn-tab-rounds').classList.toggle('lg-tab-active', tab === 'rounds');
  document.getElementById('tourn-tab-events').classList.toggle('lg-tab-active', tab === 'events');
  if (tab === 'rounds') { renderTRounds(); populateTRoundFilters(); }
  if (tab === 'events') { renderTournaments(); populateTournamentFilters(); }
}

function switchLeagueTab(tab) {
  document.getElementById('lg-view-rounds').style.display = tab === 'rounds' ? 'block' : 'none';
  document.getElementById('lg-view-manage').style.display = tab === 'manage' ? 'block' : 'none';
  document.getElementById('lg-tab-rounds').classList.toggle('lg-tab-active', tab === 'rounds');
  document.getElementById('lg-tab-manage').classList.toggle('lg-tab-active', tab === 'manage');
  if (tab === 'manage') renderLeagueDefinitions();
}

function showLeagueList() {
  document.getElementById('lg-list-view').style.display = 'block';
  document.getElementById('lg-detail-view').style.display = 'none';
}

function showLeagueDetail(id) {
  const l = state.leagues.find(x => x.id === id);
  if (!l) return;
  const rounds = state.leagueRounds.filter(r => r.leagueId === id).sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const fees = rounds.reduce((s,r) => s + (r.fee||0), 0);
  const cash = rounds.reduce((s,r) => s + (r.cash||0), 0);
  const net = cash - fees;
  const wins = rounds.filter(r => r.place === 1).length;
  const podiums = rounds.filter(r => r.place && r.place <= 3).length;
  const finishes = rounds.filter(r => r.place && r.field);
  const avgFinishPct = finishes.length ? (finishes.reduce((s,r) => s + r.place/r.field, 0) / finishes.length * 100).toFixed(1) : null;

  // Per-year breakdown
  const years = [...new Set(rounds.map(r => r.year).filter(Boolean))].sort().reverse();
  const yearRows = years.map(y => {
    const yr = rounds.filter(r => r.year == y);
    const yFees = yr.reduce((s,r) => s + (r.fee||0), 0);
    const yCash = yr.reduce((s,r) => s + (r.cash||0), 0);
    const yWins = yr.filter(r => r.place === 1).length;
    return `<tr>
      <td><strong>${y}</strong></td>
      <td>${yr.length}</td>
      <td>${yWins}</td>
      <td>${yr.filter(r => r.place && r.place <= 3).length}</td>
      <td class="text-red">${yFees ? fmtMoney(yFees) : '—'}</td>
      <td class="text-accent">${yCash ? fmtMoney(yCash) : '—'}</td>
      <td class="${(yCash-yFees) >= 0 ? 'text-accent' : 'text-red'}">${fmtMoney(yCash - yFees)}</td>
    </tr>`;
  }).join('');

  const html = `
    <div class="detail-panel">
      <div class="card-header">
        <div>
          <div class="card-title">${l.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${[l.day, l.location].filter(Boolean).join(' · ')}</div>
        </div>
        <div class="flex-center gap-8">
          <button class="btn btn-ghost btn-sm" onclick="openModal('modal-league-def','${l.id}')">Edit</button>
          <button class="btn btn-primary btn-sm" onclick="openModal('modal-league')">+ Add Round</button>
        </div>
      </div>
      <div class="card-body">
        <div class="grid-4 mb-16">
          <div class="stat-card accent"><div class="stat-label">Rounds Played</div><div class="stat-value">${rounds.length}</div></div>
          <div class="stat-card gold"><div class="stat-label">Wins</div><div class="stat-value">${wins}</div><div class="stat-sub">${podiums} podiums</div></div>
          <div class="stat-card ${net >= 0 ? 'accent' : 'red'}"><div class="stat-label">Net Earnings</div><div class="stat-value" style="font-size:26px">${fmtMoney(net)}</div></div>
          <div class="stat-card blue"><div class="stat-label">Avg Finish</div><div class="stat-value">${avgFinishPct ? 'Top ' + avgFinishPct + '%' : '—'}</div></div>
        </div>

        ${years.length ? `
        <p class="section-title">Season Breakdown</p>
        <div class="table-wrap mb-16">
          <table>
            <thead><tr><th>Season</th><th>Rounds</th><th>Wins</th><th>Podiums</th><th>Fees</th><th>Cash</th><th>Net</th></tr></thead>
            <tbody>${yearRows}</tbody>
          </table>
        </div>` : ''}

        <p class="section-title">All Rounds</p>
        ${rounds.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Course</th><th>Par</th><th>Score</th><th>+/−</th><th>Place</th><th>Field</th><th>Fee</th><th>Cash</th><th></th></tr></thead>
            <tbody>
              ${rounds.map(r => `<tr class="clickable" onclick="openModal('modal-league','${r.id}')">
                <td class="td-muted">${fmtDate(r.date)}</td>
                <td>${getCourseName(r.courseId)}</td>
                <td class="td-muted">${r.par||'—'}</td>
                <td><strong>${r.score||'—'}</strong></td>
                <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
                <td>${placeDisplay(r.place)}</td>
                <td class="td-muted">${r.field||'—'}</td>
                <td class="td-muted">${r.fee != null ? fmtMoney(r.fee) : '—'}</td>
                <td class="${r.cash != null ? (r.cash > 0 ? 'text-accent' : '') : ''}">${r.cash != null ? fmtMoney(r.cash) : '—'}</td>
                <td class="action-row" onclick="event.stopPropagation()">
                  <button class="btn btn-danger btn-sm delete-btn" onclick="deleteItem('league','${r.id}');showLeagueDetail('${l.id}')">✕</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<p style="color:var(--text-muted);font-size:14px">No rounds logged yet.</p>'}

        ${l.notes ? `<div style="font-size:13px;color:var(--text-muted);background:var(--surface2);padding:10px 12px;border-radius:6px;margin-top:16px">${l.notes}</div>` : ''}
      </div>
    </div>`;

  document.getElementById('lg-detail-content').innerHTML = html;
  document.getElementById('lg-list-view').style.display = 'none';
  document.getElementById('lg-detail-view').style.display = 'block';
}

function renderLeagueDefinitions() {
  const grid = document.getElementById('league-defs-grid');
  if (!grid) return;
  if (!state.leagues.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🥏</div><h3>No leagues yet</h3><p>Add your leagues first, then log rounds against them.</p>
    </div>`;
    return;
  }
  grid.innerHTML = [...state.leagues].sort((a,b) => a.name.localeCompare(b.name)).map(l => {
    const rounds = state.leagueRounds.filter(r => r.leagueId === l.id);
    const wins = rounds.filter(r => r.place === 1).length;
    const net = rounds.reduce((s,r) => s + (r.cash||0) - (r.fee||0), 0);
    const years = [...new Set(rounds.map(r => r.year).filter(Boolean))].sort();
    return `<div class="course-card">
      <div class="course-card-header">
        <div class="course-name">${l.name}</div>
        ${l.day || l.location ? `<div class="course-location">${[l.day, l.location].filter(Boolean).join(' · ')}</div>` : ''}
      </div>
      <div class="course-card-body">
        <div class="course-stats">
          <div class="course-stat"><div class="course-stat-val">${rounds.length}</div><div class="course-stat-lbl">Rounds</div></div>
          <div class="course-stat"><div class="course-stat-val">${wins}</div><div class="course-stat-lbl">Wins</div></div>
          <div class="course-stat"><div class="course-stat-val" style="font-size:16px;color:${net >= 0 ? 'var(--accent)' : 'var(--red)'}">${fmtMoney(net)}</div><div class="course-stat-lbl">Net</div></div>
          <div class="course-stat"><div class="course-stat-val" style="font-size:14px">${years.length ? years[0] + (years.length > 1 ? '–' + years[years.length-1] : '') : '—'}</div><div class="course-stat-lbl">Seasons</div></div>
        </div>
        <div class="action-row">
          <button class="btn btn-ghost btn-sm" onclick="showLeagueDetail('${l.id}')">View Details</button>
          <button class="btn btn-ghost btn-sm" onclick="openModal('modal-league-def','${l.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('leaguedef','${l.id}')">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function getLeagueName(id) {
  const l = state.leagues.find(x => x.id === id);
  return l ? l.name : 'Unknown';
}

function populateLeagueSelect(selectId) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">Select league…</option>';
  state.leagues.sort((a,b) => a.name.localeCompare(b.name)).forEach(l => {
    sel.innerHTML += `<option value="${l.id}">${l.name}</option>`;
  });
}

function filterCourseChecklist(query) {
  renderCourseList(getCurrentChipIds(), query);
}

function populateCourseChecklist(selectedIds) {
  renderCourseChips(selectedIds);
  renderCourseList(selectedIds, '');
}

function renderCourseChips(selectedIds) {
  const chips = document.getElementById('t-courses-chips');
  if (!chips) return;
  chips.innerHTML = selectedIds.map(id => {
    const c = state.courses.find(x => x.id === id);
    if (!c) return '';
    return `<span class="course-chip" data-id="${id}">
      ${c.name}
      <button type="button" onclick="removeCourseChip('${id}')" title="Remove">×</button>
    </span>`;
  }).join('');
  // Update placeholder visibility
  const filter = document.getElementById('t-courses-filter');
  if (filter) filter.placeholder = selectedIds.length ? '' : 'Search courses…';
}

function renderCourseList(selectedIds, query) {
  const list = document.getElementById('t-courses-list');
  if (!list) return;
  const q = query.toLowerCase();
  const unselected = state.courses
    .filter(c => !selectedIds.includes(c.id))
    .filter(c => !q || (c.name + ' ' + (c.location||'')).toLowerCase().includes(q))
    .sort((a,b) => a.name.localeCompare(b.name));
  if (!unselected.length && !state.courses.length) {
    list.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:13px;font-style:italic">No courses added yet.</div>';
    return;
  }
  if (!unselected.length) {
    list.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:13px;font-style:italic">All courses selected.</div>';
    return;
  }
  list.innerHTML = unselected.map(c => {
    const fullName = (c.name + (c.location ? ' ' + c.location : '')).toLowerCase();
    return `<div class="course-check-item" data-id="${c.id}" data-name="${fullName}" onclick="addCourseChip('${c.id}')">
      <span>${c.name}${c.location ? '<span style="color:var(--text-muted);font-size:12px"> — ' + c.location + '</span>' : ''}</span>
    </div>`;
  }).join('');
}

function getCurrentChipIds() {
  const chips = document.getElementById('t-courses-chips');
  if (!chips) return [];
  return [...chips.querySelectorAll('.course-chip')].map(el => el.dataset.id);
}

function addCourseChip(id) {
  const current = getCurrentChipIds();
  if (current.includes(id)) return;
  const newIds = [...current, id];
  renderCourseChips(newIds);
  renderCourseList(newIds, document.getElementById('t-courses-filter').value);
  document.getElementById('t-courses-filter').value = '';
}

function removeCourseChip(id) {
  const newIds = getCurrentChipIds().filter(x => x !== id);
  renderCourseChips(newIds);
  renderCourseList(newIds, document.getElementById('t-courses-filter').value);
}

function toggleCourseCheck(el) {
  // legacy stub — no longer used
}

function getSelectedCourses() {
  return getCurrentChipIds();
}

function onTRTournamentChange(tid) {
  populateCourseSelectFiltered('tr-course', tid);
  // If only one course, pre-select it
  const t = state.tournaments.find(x => x.id === tid);
  if (t && t.courses && t.courses.length === 1) {
    document.getElementById('tr-course').value = t.courses[0];
  }
}

function populateCourseSelectFiltered(selectId, tournamentId) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">Select course…</option>';
  const t = state.tournaments.find(x => x.id === tournamentId);
  const courseIds = t && t.courses && t.courses.length ? t.courses : null;
  const courses = state.courses
    .filter(c => !courseIds || courseIds.includes(c.id))
    .sort((a,b) => a.name.localeCompare(b.name));
  courses.forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.name}${c.location ? ' – ' + c.location : ''}</option>`;
  });
}

function populateCourseSelect(selectId) {
  const sel = document.getElementById(selectId);
  const isMulti = sel.multiple;
  if (!isMulti) sel.innerHTML = '<option value="">Select course…</option>';
  else sel.innerHTML = '';
  state.courses.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.name}${c.location ? ' – ' + c.location : ''}</option>`;
  });
}

// ═══════════════════════════════════════════════
//  SAVE HANDLERS
// ═══════════════════════════════════════════════
function saveTournament() {
  const name = document.getElementById('t-name').value.trim();
  if (!name) { showToast('Event name is required'); return; }
  const courses = getSelectedCourses();

  const dateVal = document.getElementById('t-date').value;
  const yearVal = document.getElementById('t-year').value || (dateVal ? dateVal.slice(0,4) : '');

  const obj = {
    id: state.editingId || uid(),
    name, date: dateVal, year: yearVal,
    location: document.getElementById('t-location').value.trim(),
    tier: document.getElementById('t-tier').value,
    division: document.getElementById('t-division').value,
    field: +document.getElementById('t-field').value || null,
    numDays: +document.getElementById('t-days').value || null,
    numRounds: +document.getElementById('t-rounds').value || null,
    place: +document.getElementById('t-place').value || null,
    url: document.getElementById('t-url').value.trim(),
    fee: document.getElementById('t-fee').value !== '' ? parseFloat(document.getElementById('t-fee').value) : null,
    prize: document.getElementById('t-prize').value !== '' ? parseFloat(document.getElementById('t-prize').value) : null,
    caddy: document.getElementById('t-caddy').value !== '' ? parseFloat(document.getElementById('t-caddy').value) : null,
    courses, notes: document.getElementById('t-notes').value.trim()
  };

  if (state.editingId) {
    const idx = state.tournaments.findIndex(x => x.id === state.editingId);
    state.tournaments[idx] = obj;
    showToast('Tournament updated');
    saveState();
    closeModal('modal-tournament');
    populateTournamentFilters();
    renderTournaments();
    renderDashboard();
  } else {
    state.tournaments.push(obj);
    _inlineTournamentId = obj.id;
    showToast('Tournament saved — add rounds below');
    saveState();
    populateTournamentFilters();
    renderTournaments();
    // Reveal rounds section, lock the form fields, update button
    document.getElementById('t-rounds-section').style.display = 'block';
    document.getElementById('t-save-btn').textContent = 'Done';
    document.getElementById('t-save-btn').onclick = function() { closeModal('modal-tournament'); };
    document.getElementById('modal-tournament').querySelector('.modal-body').classList.add('form-locked');
    renderInlineRounds();
    showInlineRoundForm();
  }
}

function calcEndDate(dateStr, days) {
  if (!dateStr || !days || days <= 1) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days - 1);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function onTournDateChange() {
  const d = document.getElementById('t-date').value;
  document.getElementById('t-year').value = d ? d.slice(0,4) : '';
  onTournDaysChange();
}

function onTournDaysChange() {
  const d = document.getElementById('t-date').value;
  const days = parseInt(document.getElementById('t-days').value);
  const el = document.getElementById('t-end-date');
  if (!d || !days || days <= 1) { el.value = d ? fmtDate(d) : '—'; return; }
  const start = new Date(d + 'T00:00:00');
  start.setDate(start.getDate() + days - 1);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  el.value = m[start.getMonth()] + ' ' + start.getDate() + ', ' + start.getFullYear();
}

function updateTIRRelScore() {
  const par = parseInt(document.getElementById('tir-par').value);
  const score = parseInt(document.getElementById('tir-score').value);
  const el = document.getElementById('tir-rel');
  if (!par || !score) { el.value = '—'; el.style.color = 'var(--text-muted)'; return; }
  const diff = score - par;
  if (diff === 0) { el.value = 'E'; el.style.color = 'var(--text)'; }
  else if (diff < 0) { el.value = diff; el.style.color = 'var(--accent)'; }
  else { el.value = '+' + diff; el.style.color = 'var(--text)'; }
}

function showInlineRoundForm() {
  const t = state.tournaments.find(x => x.id === _inlineTournamentId);
  document.getElementById('t-inline-round-form').style.display = 'block';
  document.getElementById('t-add-round-btn').style.display = 'none';
  // Populate course select — filtered to this tournament's courses
  populateCourseSelectFiltered('tir-course', _inlineTournamentId);
  // Pre-fill date from tournament
  if (t && t.date) {
    document.getElementById('tir-date').value = t.date;
    document.getElementById('tir-year').value = t.year || t.date.slice(0,4);
  }
  // Pre-fill course if only one
  if (t && t.courses && t.courses.length === 1) {
    document.getElementById('tir-course').value = t.courses[0];
  }
  // Auto-set round number to next available
  const existing = state.tRounds.filter(r => r.tournamentId === _inlineTournamentId);
  const usedNums = existing.map(r => r.roundNum).filter(Boolean);
  let next = 1;
  while (usedNums.includes(next)) next++;
  document.getElementById('tir-roundnum').value = next;
  // Reset score fields
  document.getElementById('tir-par').value = '';
  document.getElementById('tir-score').value = '';
  document.getElementById('tir-rating').value = '';
  document.getElementById('tir-rel').value = '—';
  document.getElementById('tir-rel').style.color = 'var(--text-muted)';
}

function hideInlineRoundForm() {
  document.getElementById('t-inline-round-form').style.display = 'none';
  document.getElementById('t-add-round-btn').style.display = 'block';
}

function renderInlineRounds() {
  const rounds = state.tRounds.filter(r => r.tournamentId === _inlineTournamentId)
    .sort((a,b) => (a.roundNum||99) - (b.roundNum||99));
  const list = document.getElementById('t-rounds-list');
  if (!rounds.length) { list.innerHTML = ''; return; }
  list.innerHTML = '<div style="padding:8px 0">' + rounds.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:14px">
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;color:var(--text-muted)">${r.roundNum ? 'R' + r.roundNum : '—'}</span>
      <span>${getCourseName(r.courseId)}</span>
      <span class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</span>
      <span style="color:var(--blue);font-weight:600">${r.rating || '—'}</span>
      <button class="btn btn-danger btn-sm" style="opacity:0.7" onclick="deleteInlineRound('${r.id}')">✕</button>
    </div>`).join('') + '</div>';
}

function deleteInlineRound(id) {
  state.tRounds = state.tRounds.filter(x => x.id !== id);
  saveState();
  renderInlineRounds();
  renderTournaments();
  renderDashboard();
}

function saveInlineRound() {
  if (!_inlineTournamentId) return;
  const cid = document.getElementById('tir-course').value;
  if (!cid) { showToast('Course is required'); return; }
  const dateVal = document.getElementById('tir-date').value;
  const yearVal = document.getElementById('tir-year').value || (dateVal ? dateVal.slice(0,4) : '');
  const roundNumVal = +document.getElementById('tir-roundnum').value || null;
  // Duplicate check
  if (roundNumVal) {
    const dupe = state.tRounds.find(r => r.tournamentId === _inlineTournamentId && r.roundNum === roundNumVal);
    if (dupe) {
      const override = confirm(`Round ${roundNumVal} is already logged. Save anyway?`);
      if (!override) return;
    }
  }
  const obj = {
    id: uid(), date: dateVal, year: yearVal,
    tournamentId: _inlineTournamentId, courseId: cid,
    roundNum: roundNumVal,
    par: +document.getElementById('tir-par').value || null,
    score: +document.getElementById('tir-score').value || null,
    rating: +document.getElementById('tir-rating').value || null,
    notes: ''
  };
  state.tRounds.push(obj);
  saveState();
  populateTRoundFilters();
  renderInlineRounds();
  renderTournaments();
  showToast('Round saved');
  // Reset for next round
  showInlineRoundForm();
}

function updateTRRelScore() {
  const par = parseInt(document.getElementById('tr-par').value);
  const score = parseInt(document.getElementById('tr-score').value);
  const el = document.getElementById('tr-rel');
  if (!par || !score) {
    el.value = '—';
    el.style.color = 'var(--text-muted)';
    return;
  }
  const diff = score - par;
  if (diff === 0) {
    el.value = 'E';
    el.style.color = 'var(--text)';
  } else if (diff < 0) {
    el.value = diff;
    el.style.color = 'var(--accent)';
  } else {
    el.value = '+' + diff;
    el.style.color = 'var(--text)';
  }
}

function saveTRound() {
  const tid = document.getElementById('tr-tournament').value;
  const cid = document.getElementById('tr-course').value;
  if (!tid || !cid) { showToast('Tournament and course are required'); return; }

  const dateVal = document.getElementById('tr-date').value;
  const yearVal = document.getElementById('tr-year').value || (dateVal ? dateVal.slice(0,4) : '');
  const roundNumVal = +document.getElementById('tr-round-num').value || null;

  // Duplicate round check: same tournament + same round number already exists (not editing that exact round)
  if (roundNumVal && !state.editingId) {
    const dupe = state.tRounds.find(r => r.tournamentId === tid && r.roundNum === roundNumVal);
    if (dupe) {
      const override = confirm(
        `Round ${roundNumVal} for this tournament is already logged (${fmtDate(dupe.date)} — ${getCourseName(dupe.courseId)}).\n\nSave anyway?`
      );
      if (!override) return;
    }
  }

  const obj = {
    id: state.editingId || uid(),
    date: dateVal, year: yearVal,
    tournamentId: tid, courseId: cid,
    roundNum: roundNumVal,
    par: +document.getElementById('tr-par').value || null,
    score: +document.getElementById('tr-score').value || null,
    rating: +document.getElementById('tr-rating').value || null,
    notes: document.getElementById('tr-notes').value.trim()
  };

  if (state.editingId) {
    const idx = state.tRounds.findIndex(x => x.id === state.editingId);
    state.tRounds[idx] = obj;
    showToast('Round updated');
  } else {
    state.tRounds.push(obj);
    showToast('Round added');
  }
  saveState();
  closeModal('modal-tround');
  populateTRoundFilters();
  renderTournaments();
  renderDashboard();
  if (_detailTournamentId && document.getElementById('tourn-panel-overlay').classList.contains('open')) {
    showTournamentDetail(_detailTournamentId);
  } else {
    renderTRounds();
  }
}

function saveLeague() {
  const leagueId = document.getElementById('lg-league').value;
  const cid = document.getElementById('lg-course').value;
  if (!leagueId || !cid) { showToast('League and course are required'); return; }

  const dateVal = document.getElementById('lg-date').value;
  const yearVal = document.getElementById('lg-year').value || (dateVal ? dateVal.slice(0,4) : '');

  const obj = {
    id: state.editingId || uid(),
    date: dateVal, year: yearVal,
    leagueId, courseId: cid,
    par: +document.getElementById('lg-par').value || null,
    score: +document.getElementById('lg-score').value || null,
    place: +document.getElementById('lg-place').value || null,
    field: +document.getElementById('lg-field').value || null,
    fee: document.getElementById('lg-fee').value !== '' ? parseFloat(document.getElementById('lg-fee').value) : null,
    cash: document.getElementById('lg-cash').value !== '' ? parseFloat(document.getElementById('lg-cash').value) : null,
    notes: document.getElementById('lg-notes').value.trim()
  };

  if (state.editingId) {
    const idx = state.leagueRounds.findIndex(x => x.id === state.editingId);
    state.leagueRounds[idx] = obj;
    showToast('Round updated');
  } else {
    state.leagueRounds.push(obj);
    showToast('Round added');
  }
  saveState();
  closeModal('modal-league');
  populateLeagueFilters();
  renderLeagues();
  renderLeagueDefinitions();
  renderDashboard();
}

function showCourseDropdown(val) {
  const dd = document.getElementById('ld-course-dropdown');
  if (!dd) return;
  const query = val.toLowerCase();
  const matches = state.courses
    .filter(c => !query || c.name.toLowerCase().includes(query))
    .sort((a,b) => a.name.localeCompare(b.name));
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = matches.map(c => {
    const label = c.name + (c.location ? ' <span style="color:var(--text-muted);font-size:12px">– ' + c.location + '</span>' : '');
    return `<div style="padding:9px 12px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--border)"
      onmousedown="selectCourse('${c.name.replace(/'/g,"\'")}')"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">${label}</div>`;
  }).join('');
  dd.style.display = 'block';
}

function selectCourse(name) {
  document.getElementById('ld-location').value = name;
  hideCourseDropdown();
}

function hideCourseDropdown() {
  const dd = document.getElementById('ld-course-dropdown');
  if (dd) dd.style.display = 'none';
}

function updateLGRelScore() {
  const par = parseInt(document.getElementById('lg-par').value);
  const score = parseInt(document.getElementById('lg-score').value);
  const el = document.getElementById('lg-rel');
  if (!par || !score) { el.value = '—'; el.style.color = 'var(--text-muted)'; return; }
  const diff = score - par;
  if (diff === 0) { el.value = 'E'; el.style.color = 'var(--text)'; }
  else if (diff < 0) { el.value = diff; el.style.color = 'var(--accent)'; }
  else { el.value = '+' + diff; el.style.color = 'var(--text)'; }
}

function prefillLeagueCourse(leagueId) {
  if (!leagueId) return;
  const league = state.leagues.find(x => x.id === leagueId);
  if (!league || !league.location) return;
  // Match home course name against saved courses
  const match = state.courses.find(c =>
    c.name.toLowerCase() === league.location.toLowerCase() ||
    league.location.toLowerCase().startsWith(c.name.toLowerCase())
  );
  if (match) document.getElementById('lg-course').value = match.id;
}

function saveLeagueDef() {
  const name = document.getElementById('ld-name').value.trim();
  if (!name) { showToast('League name is required'); return; }
  const obj = {
    id: state.editingId || uid(),
    name,
    day: document.getElementById('ld-day').value.trim(),
    location: document.getElementById('ld-location').value.trim(),
    notes: document.getElementById('ld-notes').value.trim()
  };
  if (state.editingId) {
    state.leagues[state.leagues.findIndex(x => x.id === state.editingId)] = obj;
    showToast('League updated');
  } else {
    state.leagues.push(obj);
    showToast('League added');
  }
  saveState(); closeModal('modal-league-def');
  setTimeout(() => { renderLeagueDefinitions(); renderDashboard(); }, 0);
  if (document.getElementById('page-leagues').classList.contains('active')) renderLeagues();
}

function saveCourse() {
  const name = document.getElementById('c-name').value.trim();
  if (!name) { showToast('Course name is required'); return; }
  const obj = {
    id: state.editingId || uid(),
    name,
    location: document.getElementById('c-location').value.trim(),
    holes: +document.getElementById('c-holes').value || null,
    notes: document.getElementById('c-notes').value.trim()
  };

  if (state.editingId) {
    const idx = state.courses.findIndex(x => x.id === state.editingId);
    state.courses[idx] = obj;
    showToast('Course updated');
  } else {
    state.courses.push(obj);
    showToast('Course added');
  }
  saveState();
  closeModal('modal-course');
  renderCourses();
  renderTournaments();
  renderTRounds();
  renderLeagues();
}

function refreshAll() {
  // Re-render every active view so nothing goes stale
  populateTournamentFilters();
  populateTRoundFilters();
  populateLeagueFilters();
  renderTournaments();
  renderTRounds();
  renderLeagues();
  renderCourses();
  renderLeagueDefinitions();
  renderDashboard();
  // If detail panel is open, refresh it too
  if (_detailTournamentId && document.getElementById('tourn-panel-overlay').classList.contains('open')) {
    showTournamentDetail(_detailTournamentId);
  }
}

function deleteItem(type, id) {
  if (!confirm('Delete this entry?')) return;
  if (type === 'tournament') {
    state.tournaments = state.tournaments.filter(x => x.id !== id);
    renderTournaments();
    renderDashboard();
  } else if (type === 'tround') {
    state.tRounds = state.tRounds.filter(x => x.id !== id);
    renderTournaments();
    renderDashboard();
    if (_detailTournamentId) showTournamentDetail(_detailTournamentId); else renderTRounds();
  } else if (type === 'league') {
    state.leagueRounds = state.leagueRounds.filter(x => x.id !== id);
    renderLeagues();
    renderLeagueDefinitions();
    renderDashboard();
  } else if (type === 'course') {
    state.courses = state.courses.filter(x => x.id !== id);
    renderCourses();
    renderTournaments();
    renderTRounds();
  } else if (type === 'leaguedef') {
    state.leagues = state.leagues.filter(x => x.id !== id);
    renderLeagueDefinitions();
  }
  saveState();
  showToast('Deleted');
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════
function getCourseName(id) {
  const c = state.courses.find(x => x.id === id);
  return c ? c.name : 'Unknown';
}

function getTournamentName(id) {
  const t = state.tournaments.find(x => x.id === id);
  return t ? t.name : 'Unknown';
}

function relScore(score, par) {
  if (!score || !par) return '—';
  const diff = score - par;
  if (diff === 0) return 'E';
  return (diff > 0 ? '+' : '') + diff;
}

function relScoreClass(score, par) {
  if (!score || !par) return '';
  const diff = score - par;
  if (diff < 0) return 'text-accent';
  if (diff > 0) return 'text-red';
  return '';
}

function fmtDate(d) {
  if (!d) return '—';
  const parts = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(parts[1])-1]} ${parseInt(parts[2])}, ${parts[0]}`;
}

function fmtMoney(v) {
  if (v == null || v === '') return '—';
  return '$' + parseFloat(v).toFixed(2);
}

function avg(arr) {
  const valid = arr.filter(x => x != null && !isNaN(x));
  if (!valid.length) return null;
  return valid.reduce((a,b) => a+b, 0) / valid.length;
}

function placeDisplay(p) {
  if (!p) return '—';
  if (p === 1) return `<span class="place-1">🥇 1st</span>`;
  if (p <= 3) return `<span class="place-top3">${p}${ord(p)}</span>`;
  return `${p}${ord(p)}`;
}

function ord(n) {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

function tierBadge(tier) {
  if (!tier) return '';
  const map = { 'A-Tier':'badge-gold','B-Tier':'badge-green','C-Tier':'badge-blue','NT':'badge-red','Major':'badge-red','Pro Tour':'badge-red' };
  return `<span class="badge ${map[tier]||'badge-gray'}">${tier}</span>`;
}

function divBadge(div) {
  if (!div) return '';
  return `<span class="badge badge-gray">${div}</span>`;
}

function courseRoundsData(courseId) {
  const tr = state.tRounds.filter(r => r.courseId === courseId);
  const lr = state.leagueRounds.filter(r => r.courseId === courseId);
  const ratings = tr.filter(r => r.rating).map(r => r.rating);
  return {
    tourneyRounds: tr.length,
    leagueRounds: lr.length,
    avgRating: ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(0) : null,
    bestRating: ratings.length ? Math.max(...ratings) : null,
    worstRating: ratings.length ? Math.min(...ratings) : null,
    tourneys: [...new Set(tr.map(r => r.tournamentId))].map(getTournamentName)
  };
}

// ═══════════════════════════════════════════════
//  FILTER POPULATORS
// ═══════════════════════════════════════════════
function populateTournamentFilters() {
  const years = [...new Set(state.tournaments.map(t => t.year).filter(Boolean))].sort().reverse();
  const sel = document.getElementById('filter-tourn-year');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  sel.value = cur;
}

function populateTRoundFilters() {
  const sel1 = document.getElementById('filter-tr-tourn');
  const sel2 = document.getElementById('filter-tr-course');
  const sel3 = document.getElementById('filter-tr-year');
  const cur1 = sel1.value, cur2 = sel2.value, cur3 = sel3.value;
  sel1.innerHTML = '<option value="">All Tournaments</option>' + state.tournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  sel2.innerHTML = '<option value="">All Courses</option>' + [...state.courses].sort((a,b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const years = [...new Set(state.tRounds.map(r => r.year).filter(Boolean))].sort().reverse();
  sel3.innerHTML = '<option value="">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  sel1.value = cur1; sel2.value = cur2; sel3.value = cur3;
}

function populateLeagueFilters() {
  const sel1 = document.getElementById('filter-lg-league');
  const cur1 = sel1.value;
  sel1.innerHTML = '<option value="">All Leagues</option>' + [...state.leagues].sort((a,b) => a.name.localeCompare(b.name)).map(l => `<option value="${l.id}">${l.name}</option>`).join('');
  sel1.value = cur1;
  const sel2 = document.getElementById('filter-lg-course');
  const cur2 = sel2.value;
  sel2.innerHTML = '<option value="">All Courses</option>' + [...state.courses].sort((a,b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  sel2.value = cur2;
  const years = [...new Set(state.leagueRounds.map(r => r.year).filter(Boolean))].sort().reverse();
  const sel3 = document.getElementById('filter-lg-year');
  const cur3 = sel3.value;
  sel3.innerHTML = '<option value="">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  sel3.value = cur3;
}

// ═══════════════════════════════════════════════
//  RENDER: TOURNAMENTS
// ═══════════════════════════════════════════════
function renderTournaments() {
  const filterYear = document.getElementById('filter-tourn-year').value;
  const filterTier = document.getElementById('filter-tourn-tier').value;
  const filterDiv = document.getElementById('filter-tourn-div').value;
  const search = document.getElementById('filter-tourn-search').value.toLowerCase();

  let data = [...state.tournaments];

  if (filterYear) data = data.filter(t => t.year == filterYear);
  if (filterTier) data = data.filter(t => t.tier === filterTier);
  if (filterDiv) data = data.filter(t => t.division === filterDiv);
  if (search) data = data.filter(t => t.name.toLowerCase().includes(search) || (t.location||'').toLowerCase().includes(search));

  if (sortState.tournaments.col) {
    data = sortData(data, 'tournaments', tournColVal);
  } else {
    data.sort((a,b) => (b.date||'').localeCompare(a.date||''));
  }

  const tbody = document.getElementById('tournaments-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="11">No tournaments yet. Add your first event!</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(t => {
    const coursePills = (t.courses||[]).map(getCourseName);
    const roundsLogged = state.tRounds.filter(r => r.tournamentId === t.id).length;
    const roundsTotal = t.numRounds || null;
    const roundsDisplay = roundsTotal
      ? `<span style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:${roundsLogged >= roundsTotal ? 'var(--accent)' : 'var(--gold)'}">${roundsLogged}</span><span style="color:var(--text-muted);font-size:13px"> / ${roundsTotal}</span>`
      : `<span style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:var(--text-muted)">${roundsLogged}</span>`;
    const profit = t.prize != null ? (t.prize - (t.fee||0) - (t.caddy||0)) : null;
    return `<tr class="clickable" onclick="showTournamentDetail('${t.id}')">
      <td><strong>${t.name}</strong>${t.url ? ` <a href="${t.url}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent);font-size:12px;margin-left:4px">↗</a>` : ''}</td>
      <td class="td-muted">${fmtDate(t.date)}</td>
      <td class="td-muted">${t.location||'—'}</td>
      <td>${tierBadge(t.tier)}</td>
      <td>${divBadge(t.division)}</td>
      <td>${placeDisplay(t.place)}</td>
      <td class="${profit != null ? (profit >= 0 ? 'text-accent' : 'text-red') : ''}">${profit != null ? fmtMoney(profit) : '—'}</td>
      <td>${roundsDisplay}</td>
      <td style="min-width:140px">${coursePills.length ? coursePills.map(n => `<span style="display:inline-block;background:var(--surface2);border:1px solid var(--border);border-radius:4px;font-size:11px;font-weight:600;padding:2px 7px;margin:2px 2px 2px 0;white-space:nowrap">${n}</span>`).join('') : '<span class="td-muted">—</span>'}</td>
      <td class="action-row" onclick="event.stopPropagation()">
        <button class="btn btn-danger btn-sm delete-btn" onclick="deleteItem('tournament','${t.id}')">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function showTournamentDetail(id) {
  _detailTournamentId = id;
  const t = state.tournaments.find(x => x.id === id);
  if (!t) return;
  const rounds = state.tRounds.filter(r => r.tournamentId === id).sort((a,b) => {
    if (a.roundNum && b.roundNum && a.roundNum !== b.roundNum) return a.roundNum - b.roundNum;
    return (a.date||'').localeCompare(b.date||'');
  });
  const ratings = rounds.filter(r => r.rating).map(r => r.rating);
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(0) : null;
  const totalScore = rounds.filter(r => r.score).reduce((a,b) => a + b.score, 0);
  const totalPar = rounds.filter(r => r.par).reduce((a,b) => a + b.par, 0);

  const profit = t.prize != null ? (t.prize - (t.fee||0) - (t.caddy||0)) : null;

  const html = `
    <div class="detail-panel">
      <div class="card-header">
        <div>
          <div class="card-title">${t.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${fmtDate(t.date)}${t.numDays && t.numDays > 1 ? ' – ' + calcEndDate(t.date, t.numDays) : ''}${t.location ? ' · ' + t.location : ''}${t.year ? ' · ' + t.year : ''}${t.numRounds ? ' · <span style="color:' + (rounds.length >= t.numRounds ? 'var(--accent)' : 'var(--gold)') + ';font-weight:600">' + rounds.length + ' / ' + t.numRounds + ' rounds</span>' : ''}</div>
        </div>
        <div class="flex-center gap-8">
          ${tierBadge(t.tier)} ${divBadge(t.division)}
          <button class="btn btn-ghost btn-sm" onclick="openModal('modal-tournament','${t.id}')">Edit</button>
          <button class="modal-close" onclick="closeTournamentDetail()" style="margin-left:4px">✕</button>
        </div>
      </div>
      <div class="card-body">
        <div class="grid-4 mb-16">
          <div class="stat-card accent">
            <div class="stat-label">Placing</div>
            <div class="stat-value">${t.place ? t.place + ord(t.place) : '—'}</div>
            ${t.field ? `<div class="stat-sub">of ${t.field}</div>` : ''}
          </div>
          <div class="stat-card blue">
            <div class="stat-label">Avg Rating</div>
            <div class="stat-value">${avgRating || '—'}</div>
          </div>
          <div class="stat-card gold">
            <div class="stat-label">Total Score</div>
            <div class="stat-value">${totalScore ? relScore(totalScore, totalPar) : '—'}</div>
            ${totalScore ? `<div class="stat-sub">${totalScore} throws</div>` : ''}
          </div>
          <div class="stat-card ${profit != null ? (profit >= 0 ? 'accent' : 'red') : ''}">
            <div class="stat-label">Net</div>
            <div class="stat-value">${profit != null ? fmtMoney(profit) : '—'}</div>
            ${t.fee != null ? `<div class="stat-sub">Fee: ${fmtMoney(t.fee)}${t.caddy ? ' + Caddy: ' + fmtMoney(t.caddy) : ''}</div>` : ''}
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <p class="section-title" style="flex:1;margin-bottom:0">Rounds</p>
          <button class="btn btn-primary btn-sm" style="margin-left:16px;flex-shrink:0" onclick="openModal('modal-tround',null,'${t.id}')">+ Add Round</button>
        </div>
        ${rounds.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Round</th><th>Date</th><th>Course</th><th>Par</th><th>Score</th><th>+/−</th><th>Rating</th><th></th></tr></thead>
            <tbody>
              ${rounds.map(r => `
              <tr class="clickable" onclick="openModal('modal-tround','${r.id}')">
                <td style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;color:var(--text-muted)">${r.roundNum ? 'R' + r.roundNum : '—'}</td>
                <td class="td-muted">${fmtDate(r.date)}</td>
                <td>${getCourseName(r.courseId)}</td>
                <td class="td-muted">${r.par||'—'}</td>
                <td><strong>${r.score||'—'}</strong></td>
                <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
                <td>${r.rating ? `<strong>${r.rating}</strong>` : '—'}</td>
                <td class="action-row" onclick="event.stopPropagation()">
                  <button class="btn btn-danger btn-sm delete-btn" onclick="deleteItem('tround','${r.id}')">✕</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<p style="color:var(--text-muted);font-size:14px">No rounds logged yet. <button class="btn btn-primary btn-sm" onclick="openModal(\'modal-tround\')">Add Round</button></p>'}

        ${t.notes ? `<div class="mt-8" style="font-size:13px;color:var(--text-muted);background:var(--surface2);padding:10px 12px;border-radius:6px;margin-top:16px">${t.notes}</div>` : ''}
      </div>
    </div>`;

  document.getElementById('tournament-detail-content').innerHTML = html;
  document.getElementById('tourn-panel-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTournamentDetail() {
  _detailTournamentId = null;
  document.getElementById('tourn-panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeTournPanel(e) {
  if (e.target === document.getElementById('tourn-panel-overlay')) {
    closeTournamentDetail();
  }
}

function showTournamentList() {
  closeTournamentDetail();
}

// ═══════════════════════════════════════════════
//  RENDER: T-ROUNDS
// ═══════════════════════════════════════════════
function renderTRounds() {
  const fTourn = document.getElementById('filter-tr-tourn').value;
  const fCourse = document.getElementById('filter-tr-course').value;
  const fYear = document.getElementById('filter-tr-year').value;

  let data = [...state.tRounds];
  if (fTourn) data = data.filter(r => r.tournamentId === fTourn);
  if (fCourse) data = data.filter(r => r.courseId === fCourse);
  if (fYear) data = data.filter(r => r.year == fYear);

  if (sortState.trounds.col) {
    data = sortData(data, 'trounds', troundColVal);
  } else {
    data.sort((a,b) => (b.date||'').localeCompare(a.date||''));
  }

  const tbody = document.getElementById('trounds-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="9">No rounds yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => `<tr class="clickable" onclick="openModal('modal-tround','${r.id}')">
    <td class="td-muted">${fmtDate(r.date)}</td>
    <td>${getTournamentName(r.tournamentId)}</td>
    <td style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;color:var(--text-muted)">${r.roundNum ? 'R' + r.roundNum : '—'}</td>
    <td>${getCourseName(r.courseId)}</td>
    <td class="td-muted">${r.par||'—'}</td>
    <td><strong>${r.score||'—'}</strong></td>
    <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
    <td>${r.rating ? `<span class="badge badge-blue">${r.rating}</span>` : '—'}</td>
    <td class="action-row" onclick="event.stopPropagation()">
      <button class="btn btn-danger btn-sm delete-btn" onclick="deleteItem('tround','${r.id}')">✕</button>
    </td>
  </tr>`).join('');
}

// ═══════════════════════════════════════════════
//  RENDER: LEAGUES
// ═══════════════════════════════════════════════
function renderLeagues() {
  const fLeague = document.getElementById('filter-lg-league').value;
  const fCourse = document.getElementById('filter-lg-course').value;
  const fYear = document.getElementById('filter-lg-year').value;

  let data = [...state.leagueRounds];
  if (fLeague) data = data.filter(r => r.leagueId === fLeague);
  if (fCourse) data = data.filter(r => r.courseId === fCourse);
  if (fYear) data = data.filter(r => r.year == fYear);

  if (sortState.leagues.col) {
    data = sortData(data, 'leagues', leagueColVal);
  } else {
    data.sort((a,b) => (b.date||'').localeCompare(a.date||''));
  }

  const tbody = document.getElementById('leagues-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="11">No league rounds yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => `<tr class="clickable" onclick="openModal('modal-league','${r.id}')">
    <td class="td-muted">${fmtDate(r.date)}</td>
    <td>${getLeagueName(r.leagueId)}</td>
    <td>${getCourseName(r.courseId)}</td>
    <td class="td-muted">${r.par||'—'}</td>
    <td><strong>${r.score||'—'}</strong></td>
    <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
    <td>${placeDisplay(r.place)}</td>
    <td class="td-muted">${r.field||'—'}</td>
    <td class="td-muted">${r.fee != null ? fmtMoney(r.fee) : '—'}</td>
    <td class="${r.cash != null ? (r.cash > 0 ? 'text-accent' : '') : ''}">${r.cash != null ? fmtMoney(r.cash) : '—'}</td>
    <td class="action-row" onclick="event.stopPropagation()">
      <button class="btn btn-danger btn-sm delete-btn" onclick="deleteItem('league','${r.id}')">✕</button>
    </td>
  </tr>`).join('');
}

// ═══════════════════════════════════════════════
//  RENDER: COURSES
// ═══════════════════════════════════════════════
function renderCourses() {
  const grid = document.getElementById('courses-grid');
  if (!state.courses.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🏌️</div>
      <h3>No courses yet</h3>
      <p>Add your first course to get started.</p>
    </div>`;
    return;
  }

  const sorted = [...state.courses].sort((a,b) => a.name.localeCompare(b.name));
  grid.innerHTML = sorted.map(c => {
    const d = courseRoundsData(c.id);
    return `<div class="course-card">
      <div class="course-card-header">
        <div class="course-name">${c.name}</div>
        ${c.location ? `<div class="course-location">${c.location}</div>` : ''}
      </div>
      <div class="course-card-body">
        <div class="course-stats">
          <div class="course-stat">
            <div class="course-stat-val">${d.tourneyRounds}</div>
            <div class="course-stat-lbl">Tournament Rounds</div>
          </div>
          <div class="course-stat">
            <div class="course-stat-val">${d.leagueRounds}</div>
            <div class="course-stat-lbl">League Rounds</div>
          </div>
          <div class="course-stat">
            <div class="course-stat-val" style="color:var(--blue)">${d.avgRating || '—'}</div>
            <div class="course-stat-lbl">Avg Rating</div>
          </div>
          <div class="course-stat">
            <div class="course-stat-val" style="font-size:16px">
              ${d.bestRating ? `<span style="color:var(--accent)">${d.bestRating}</span>` : '—'}
              ${d.worstRating && d.bestRating !== d.worstRating ? `<span style="color:var(--text-muted);font-size:13px"> / ${d.worstRating}</span>` : ''}
            </div>
            <div class="course-stat-lbl">Best / Worst</div>
          </div>
        </div>
        ${d.tourneys.length ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Tourneys: ${d.tourneys.slice(0,3).join(', ')}${d.tourneys.length > 3 ? ` +${d.tourneys.length-3} more` : ''}</div>` : ''}
        <div class="action-row">
          <button class="btn btn-ghost btn-sm" onclick="showCourseDetail('${c.id}')">View Details</button>
          <button class="btn btn-ghost btn-sm" onclick="openModal('modal-course','${c.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('course','${c.id}')">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function showCourseDetail(id) {
  const c = state.courses.find(x => x.id === id);
  if (!c) return;
  const d = courseRoundsData(c.id);
  const trounds = state.tRounds.filter(r => r.courseId === id).sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const lrounds = state.leagueRounds.filter(r => r.courseId === id).sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const tourneys = [...new Set(trounds.map(r => r.tournamentId))].map(tid => state.tournaments.find(t => t.id === tid)).filter(Boolean);

  const html = `
    <div class="detail-panel">
      <div class="card-header">
        <div>
          <div class="card-title">${c.name}</div>
          ${c.location ? `<div style="font-size:13px;color:var(--text-muted);margin-top:2px">${c.location}${c.holes ? ' · ' + c.holes + ' holes' : ''}</div>` : ''}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openModal('modal-course','${c.id}')">Edit</button>
      </div>
      <div class="card-body">
        <div class="grid-4 mb-16">
          <div class="stat-card accent"><div class="stat-label">Tournament Rounds</div><div class="stat-value">${d.tourneyRounds}</div></div>
          <div class="stat-card blue"><div class="stat-label">Avg Rating</div><div class="stat-value">${d.avgRating || '—'}</div></div>
          <div class="stat-card accent"><div class="stat-label">Best Rating</div><div class="stat-value">${d.bestRating || '—'}</div></div>
          <div class="stat-card red"><div class="stat-label">Worst Rating</div><div class="stat-value">${d.worstRating || '—'}</div></div>
        </div>

        ${tourneys.length ? `
        <p class="section-title">Tournaments at this Course</p>
        <div class="table-wrap mb-16">
          <table>
            <thead><tr><th>Tournament</th><th>Date</th><th>Tier</th><th>Place</th></tr></thead>
            <tbody>
              ${tourneys.map(t => `<tr onclick="showPage('tournaments');setTimeout(()=>showTournamentDetail('${t.id}'),50)" style="cursor:pointer">
                <td><strong>${t.name}</strong></td>
                <td class="td-muted">${fmtDate(t.date)}</td>
                <td>${tierBadge(t.tier)}</td>
                <td>${placeDisplay(t.place)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        ${trounds.length ? `
        <p class="section-title">Tournament Rounds Here</p>
        <div class="table-wrap mb-16">
          <table>
            <thead><tr><th>Date</th><th>Tournament</th><th>Par</th><th>Score</th><th>+/-</th><th>Rating</th></tr></thead>
            <tbody>
              ${trounds.map(r => `<tr>
                <td class="td-muted">${fmtDate(r.date)}</td>
                <td>${getTournamentName(r.tournamentId)}</td>
                <td class="td-muted">${r.par||'—'}</td>
                <td><strong>${r.score||'—'}</strong></td>
                <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
                <td>${r.rating ? `<span class="badge badge-blue">${r.rating}</span>` : '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        ${lrounds.length ? `
        <p class="section-title">League Rounds Here (${lrounds.length})</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>League</th><th>Par</th><th>Score</th><th>+/-</th><th>Place</th></tr></thead>
            <tbody>
              ${lrounds.slice(0,8).map(r => `<tr>
                <td class="td-muted">${fmtDate(r.date)}</td>
                <td>${getLeagueName(r.leagueId)}</td>
                <td class="td-muted">${r.par||'—'}</td>
                <td><strong>${r.score||'—'}</strong></td>
                <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
                <td>${placeDisplay(r.place)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
      </div>
    </div>`;

  document.getElementById('course-detail-content').innerHTML = html;
  document.getElementById('courses-list-view').style.display = 'none';
  document.getElementById('course-detail-view').style.display = 'block';
}

function showCourseList() {
  document.getElementById('courses-list-view').style.display = 'block';
  document.getElementById('course-detail-view').style.display = 'none';
}

// ═══════════════════════════════════════════════
//  RENDER: DASHBOARD
// ═══════════════════════════════════════════════
function renderDashboard() {
  // PDGA Rating
  const ratingInput = document.getElementById('pdga-rating-input');
  if (state.pdgaRating) ratingInput.value = state.pdgaRating;

  // Stat cards
  const allRatings = state.tRounds.filter(r => r.rating).map(r => r.rating);
  const avgRating = allRatings.length ? (allRatings.reduce((a,b)=>a+b,0)/allRatings.length).toFixed(0) : null;
  const topFinish = state.tournaments.filter(t => t.place).sort((a,b) => a.place - b.place)[0];
  const totalProfit = state.tournaments.reduce((s,t) => {
    if (t.prize != null) return s + t.prize - (t.fee||0) - (t.caddy||0);
    return s;
  }, 0);
  const lgProfit = state.leagueRounds.reduce((s,r) => s + (r.cash != null ? r.cash : 0) - (r.cash != null ? (r.fee||0) : 0), 0);

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card accent">
      <div class="stat-label">Career Events</div>
      <div class="stat-value">${state.tournaments.length}</div>
      <div class="stat-sub">${state.tRounds.length} rated rounds</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">Avg Round Rating</div>
      <div class="stat-value">${avgRating || '—'}</div>
      <div class="stat-sub">${allRatings.length} rated rounds</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-label">Best Finish</div>
      <div class="stat-value">${topFinish ? topFinish.place + ord(topFinish.place) : '—'}</div>
      <div class="stat-sub">${topFinish ? topFinish.name : ''}</div>
    </div>
    <div class="stat-card ${totalProfit >= 0 ? 'accent' : 'red'}">
      <div class="stat-label">Tournament Net</div>
      <div class="stat-value" style="font-size:26px">${fmtMoney(totalProfit)}</div>
      <div class="stat-sub">League: ${fmtMoney(lgProfit)}</div>
    </div>`;

  // Recent tourneys
  const recentT = [...state.tournaments].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);
  document.getElementById('dash-recent-tourneys').innerHTML = recentT.length ? `
    <table>
      <thead><tr><th>Event</th><th>Date</th><th>Place</th></tr></thead>
      <tbody>${recentT.map(t => `<tr onclick="showPage('tournaments');setTimeout(()=>showTournamentDetail('${t.id}'),50)" style="cursor:pointer">
        <td><strong>${t.name}</strong></td>
        <td class="td-muted" style="white-space:nowrap">${fmtDate(t.date)}</td>
        <td>${placeDisplay(t.place)}</td>
      </tr>`).join('')}</tbody>
    </table>` : `<div class="empty-state" style="padding:24px"><p>No tournaments yet.</p></div>`;

  // Recent leagues
  const recentL = [...state.leagueRounds].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);
  document.getElementById('dash-recent-leagues').innerHTML = recentL.length ? `
    <table>
      <thead><tr><th>League</th><th>Date</th><th>Place</th><th>+/-</th></tr></thead>
      <tbody>${recentL.map(r => `<tr>
        <td><strong>${getLeagueName(r.leagueId)}</strong></td>
        <td class="td-muted" style="white-space:nowrap">${fmtDate(r.date)}</td>
        <td>${placeDisplay(r.place)}</td>
        <td class="${relScoreClass(r.score,r.par)}">${relScore(r.score,r.par)}</td>
      </tr>`).join('')}</tbody>
    </table>` : `<div class="empty-state" style="padding:24px"><p>No league rounds yet.</p></div>`;

  // Rating chart
  renderRatingChart('dash-rating-chart');

  // Top courses
  const courseAvgs = state.courses.map(c => {
    const ratings = state.tRounds.filter(r => r.courseId === c.id && r.rating).map(r => r.rating);
    return { name: c.name, avg: avg(ratings), count: ratings.length };
  }).filter(c => c.count > 0).sort((a,b) => b.avg - a.avg).slice(0,6);

  const maxAvg = courseAvgs.length ? Math.max(...courseAvgs.map(c => c.avg)) : 1;
  const minAvg = courseAvgs.length ? Math.min(...courseAvgs.map(c => c.avg)) : 0;
  document.getElementById('dash-top-courses').innerHTML = courseAvgs.length ? courseAvgs.map(c => `
    <div style="margin-bottom:10px">
      <div class="flex space-between mb-4">
        <span style="font-size:13px;font-weight:600">${c.name}</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:var(--accent)">${c.avg.toFixed(0)}</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${((c.avg - minAvg + 1) / (maxAvg - minAvg + 1) * 100).toFixed(1)}%;background:var(--accent-light);border-radius:3px;transition:width 0.4s"></div>
      </div>
    </div>`) .join('') : '<p style="color:var(--text-muted);font-size:14px">No rated rounds yet.</p>';
}

function renderRatingChart(containerId) {
  const rounds = [...state.tRounds].filter(r => r.rating && r.date).sort((a,b) => a.date.localeCompare(b.date));
  const container = document.getElementById(containerId);
  if (!rounds.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:14px">No rated rounds to chart yet.</p>';
    return;
  }

  const W = 560, H = 120, pad = { top: 12, right: 12, bottom: 20, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const ratings = rounds.map(r => r.rating);
  const minR = Math.min(...ratings) - 20;
  const maxR = Math.max(...ratings) + 20;

  const xScale = i => pad.left + (i / (rounds.length - 1 || 1)) * innerW;
  const yScale = v => pad.top + innerH - ((v - minR) / (maxR - minR)) * innerH;

  const pts = rounds.map((r,i) => `${xScale(i).toFixed(1)},${yScale(r.rating).toFixed(1)}`).join(' ');
  const area = `${pad.left},${pad.top + innerH} ` + pts + ` ${xScale(rounds.length-1)},${pad.top + innerH}`;

  const avgR = (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(0);
  const avgY = yScale(+avgR).toFixed(1);

  const xLabels = [];
  if (rounds.length > 1) {
    [0, Math.floor(rounds.length/2), rounds.length-1].forEach(i => {
      if (rounds[i]) xLabels.push({ x: xScale(i), label: rounds[i].date.slice(0,7) });
    });
  }

  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#52b788" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#52b788" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${area}" fill="url(#rg)"/>
    <polyline points="${pts}" fill="none" stroke="#52b788" stroke-width="2" stroke-linejoin="round"/>
    <line x1="${pad.left}" y1="${avgY}" x2="${pad.left+innerW}" y2="${avgY}" stroke="#c9a84c" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="${pad.left+innerW+2}" y="${+avgY+4}" fill="#c9a84c" font-size="10" font-family="Barlow Condensed,sans-serif">${avgR}</text>
    ${xLabels.map(l => `<text x="${l.x}" y="${H-2}" fill="#7a7568" font-size="9" font-family="Barlow,sans-serif" text-anchor="middle">${l.label}</text>`).join('')}
    <text x="${pad.left-4}" y="${yScale(maxR-18)}" fill="#7a7568" font-size="9" font-family="Barlow Condensed,sans-serif" text-anchor="end">${(maxR-20)}</text>
    <text x="${pad.left-4}" y="${yScale(minR+18)}" fill="#7a7568" font-size="9" font-family="Barlow Condensed,sans-serif" text-anchor="end">${(minR+20)}</text>
    ${rounds.map((r,i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(r.rating).toFixed(1)}" r="3" fill="#2d6a4f" stroke="#fff" stroke-width="1.5">
      <title>${r.date} - ${getTournamentName(r.tournamentId)}: ${r.rating}</title>
    </circle>`).join('')}
  </svg>`;
}

// ═══════════════════════════════════════════════
//  RENDER: STATS
// ═══════════════════════════════════════════════
function renderStats() {
  // Tournament stats
  const finishes = state.tournaments.filter(t => t.place && t.field);
  const avgPlace = finishes.length ? (finishes.reduce((s,t) => s + t.place/t.field, 0) / finishes.length * 100).toFixed(1) : null;
  const allRatings = state.tRounds.filter(r => r.rating).map(r => r.rating);
  const best = allRatings.length ? Math.max(...allRatings) : null;
  const worst = allRatings.length ? Math.min(...allRatings) : null;
  const avgR = allRatings.length ? (allRatings.reduce((a,b)=>a+b,0)/allRatings.length).toFixed(0) : null;
  const wins = state.tournaments.filter(t => t.place === 1).length;

  document.getElementById('stats-tourn').innerHTML = `
    <div class="stat-card accent"><div class="stat-label">Events</div><div class="stat-value">${state.tournaments.length}</div><div class="stat-sub">${state.tRounds.length} rounds</div></div>
    <div class="stat-card blue"><div class="stat-label">Avg Rating</div><div class="stat-value">${avgR || '—'}</div><div class="stat-sub">All-time</div></div>
    <div class="stat-card gold"><div class="stat-label">Best Rating</div><div class="stat-value">${best || '—'}</div></div>
    <div class="stat-card accent"><div class="stat-label">Wins</div><div class="stat-value">${wins}</div><div class="stat-sub">${avgPlace ? 'Avg: top ' + avgPlace + '%' : ''}</div></div>`;

  // League stats
  const lgRounds = state.leagueRounds;
  const lgWins = lgRounds.filter(r => r.place === 1).length;
  const lgPodiums = lgRounds.filter(r => r.place && r.place <= 3).length;
  const lgFees = lgRounds.reduce((s,r) => s + (r.fee||0), 0);
  const lgCash = lgRounds.reduce((s,r) => s + (r.cash||0), 0);
  const lgNet = lgCash - lgFees;

  document.getElementById('stats-league').innerHTML = `
    <div class="stat-card accent"><div class="stat-label">League Rounds</div><div class="stat-value">${lgRounds.length}</div></div>
    <div class="stat-card gold"><div class="stat-label">Wins</div><div class="stat-value">${lgWins}</div><div class="stat-sub">${lgPodiums} podiums</div></div>
    <div class="stat-card ${lgNet >= 0 ? 'accent' : 'red'}"><div class="stat-label">Net Earnings</div><div class="stat-value" style="font-size:26px">${fmtMoney(lgNet)}</div></div>
    <div class="stat-card blue"><div class="stat-label">Cash In / Out</div><div class="stat-value" style="font-size:22px">${fmtMoney(lgCash)}</div><div class="stat-sub">Fees: ${fmtMoney(lgFees)}</div></div>`;

  // Tier placements
  const tiers = ['Major','NT','Pro Tour','A-Tier','B-Tier','C-Tier','Other'];
  const tierData = tiers.map(tier => {
    const events = state.tournaments.filter(t => t.tier === tier);
    if (!events.length) return null;
    const top10 = events.filter(t => t.place && t.place <= 10).length;
    const avgFin = events.filter(t=>t.place).length ? (events.filter(t=>t.place).reduce((s,t)=>s+t.place,0)/events.filter(t=>t.place).length).toFixed(1) : null;
    return { tier, count: events.length, top10, avgFin };
  }).filter(Boolean);

  document.getElementById('stats-tier-placements').innerHTML = tierData.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>Tier</th><th>Events</th><th>Top 10s</th><th>Avg Place</th></tr></thead>
      <tbody>${tierData.map(d => `<tr>
        <td>${tierBadge(d.tier)}</td>
        <td>${d.count}</td>
        <td>${d.top10}</td>
        <td>${d.avgFin || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<p style="color:var(--text-muted);font-size:14px">No data yet.</p>';

  // Financials
  const tFees = state.tournaments.reduce((s,t) => s + (t.fee||0) + (t.caddy||0), 0);
  const tPrize = state.tournaments.filter(t => t.prize != null).reduce((s,t) => s + t.prize, 0);
  const tNet = state.tournaments.filter(t => t.prize != null).reduce((s,t) => s + t.prize - (t.fee||0) - (t.caddy||0), 0);
  const overallNet = tNet + lgNet;

  document.getElementById('stats-financials').innerHTML = `
    <div style="display:grid;gap:10px">
      <div style="background:var(--surface2);border-radius:8px;padding:12px 16px">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Tournament Fees Paid</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;color:var(--red)">${fmtMoney(tFees)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:12px 16px">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Tournament Earnings</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;color:var(--accent)">${fmtMoney(tPrize)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:12px 16px">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Overall Net (All)</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;color:${overallNet >= 0 ? 'var(--accent)' : 'var(--red)'}">${fmtMoney(overallNet)}</div>
      </div>
    </div>`;

  // Rating by year
  const yearRatings = {};
  state.tRounds.filter(r => r.rating && r.year).forEach(r => {
    if (!yearRatings[r.year]) yearRatings[r.year] = [];
    yearRatings[r.year].push(r.rating);
  });
  const yearKeys = Object.keys(yearRatings).sort();
  document.getElementById('stats-rating-by-year').innerHTML = yearKeys.length ? yearKeys.map(y => {
    const ratings = yearRatings[y];
    const a = (ratings.reduce((s,v)=>s+v,0)/ratings.length).toFixed(0);
    const mx = Math.max(...ratings);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800">${y}</span>
      <span style="font-size:13px;color:var(--text-muted)">${ratings.length} rounds</span>
      <span>Avg: <strong style="color:var(--accent)">${a}</strong></span>
      <span>Best: <strong style="color:var(--blue)">${mx}</strong></span>
    </div>`;
  }).join('') : '<p style="color:var(--text-muted);font-size:14px">No rated rounds yet.</p>';

  // Best/worst
  const allRoundsRated = state.tRounds.filter(r => r.rating).sort((a,b) => b.rating - a.rating);
  const bests = allRoundsRated.slice(0,3);
  const worsts = allRoundsRated.slice(-3).reverse();
  document.getElementById('stats-best-worst').innerHTML = `
    <p class="section-title">Top Rated Rounds</p>
    ${bests.length ? bests.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:600;font-size:14px">${getTournamentName(r.tournamentId)}</div>
        <div style="font-size:12px;color:var(--text-muted)">${getCourseName(r.courseId)} · ${fmtDate(r.date)}</div>
      </div>
      <span class="badge badge-green" style="font-size:16px;padding:4px 10px">${r.rating}</span>
    </div>`).join('') : '<p style="color:var(--text-muted);font-size:14px">No data.</p>'}
    <p class="section-title" style="margin-top:16px">Lowest Rated Rounds</p>
    ${worsts.length ? worsts.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:600;font-size:14px">${getTournamentName(r.tournamentId)}</div>
        <div style="font-size:12px;color:var(--text-muted)">${getCourseName(r.courseId)} · ${fmtDate(r.date)}</div>
      </div>
      <span class="badge badge-red" style="font-size:16px;padding:4px 10px">${r.rating}</span>
    </div>`).join('') : ''}`;

  // Course averages table
  const courseAvgs = state.courses.map(c => {
    const rounds = state.tRounds.filter(r => r.courseId === c.id && r.rating);
    if (!rounds.length) return null;
    const ratings = rounds.map(r => r.rating);
    return {
      name: c.name, location: c.location,
      count: rounds.length,
      avg: (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(0),
      best: Math.max(...ratings),
      worst: Math.min(...ratings)
    };
  }).filter(Boolean).sort((a,b) => b.avg - a.avg);

  document.getElementById('stats-course-avgs').innerHTML = courseAvgs.length ? `
    <table>
      <thead><tr><th>Course</th><th>Location</th><th>Rounds</th><th>Avg Rating</th><th>Best</th><th>Worst</th></tr></thead>
      <tbody>${courseAvgs.map(c => `<tr>
        <td><strong>${c.name}</strong></td>
        <td class="td-muted">${c.location||'—'}</td>
        <td class="td-muted">${c.count}</td>
        <td><span class="badge badge-blue">${c.avg}</span></td>
        <td style="color:var(--accent);font-weight:600">${c.best}</td>
        <td style="color:var(--red)">${c.worst}</td>
      </tr>`).join('')}</tbody>
    </table>` : '<p style="color:var(--text-muted);font-size:14px">No rated tournament rounds yet.</p>';

  // Division history
  const divs = {};
  state.tournaments.forEach(t => {
    const d = t.division || 'Unknown';
    if (!divs[d]) divs[d] = { count: 0, wins: 0, years: new Set() };
    divs[d].count++;
    if (t.place === 1) divs[d].wins++;
    if (t.year) divs[d].years.add(t.year);
  });

  document.getElementById('stats-divisions').innerHTML = Object.keys(divs).length ? `
    <div class="grid-3">
      ${Object.entries(divs).sort((a,b) => b[1].count - a[1].count).map(([div, data]) => `
        <div style="background:var(--surface2);border-radius:8px;padding:14px 16px;border:1px solid var(--border)">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:var(--accent)">${div}</div>
          <div style="font-size:14px;margin-top:4px">${data.count} events · ${data.wins} win${data.wins !== 1 ? 's' : ''}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${[...data.years].sort().join(', ')}</div>
        </div>`).join('')}
    </div>` : '<p style="color:var(--text-muted);font-size:14px">No tournament data yet.</p>';
}

// ═══════════════════════════════════════════════
//  PDGA RATING
// ═══════════════════════════════════════════════
function savePDGARating(val) {
  state.pdgaRating = val ? +val : null;
  saveState();
  showToast('Rating saved');
}

// ═══════════════════════════════════════════════
//  IMPORT / EXPORT
// ═══════════════════════════════════════════════
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dg-tracker-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.tournaments !== undefined || imported.courses !== undefined) {
        if (confirm('This will REPLACE all current data. Continue?')) {
          state = { tournaments: [], tRounds: [], leagueRounds: [], leagues: [], courses: [], pdgaRating: null, ...imported };
          saveState();
          showToast('Data imported successfully');
          showPage('dashboard');
        }
      } else {
        showToast('Invalid file format');
      }
    } catch(err) {
      showToast('Failed to import: invalid JSON');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ═══════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ═══════════════════════════════════════════════
//  CLOSE MODAL — WITH DIRTY CHECK
// ═══════════════════════════════════════════════
function isModalDirty(modalId) {
  const modal = document.getElementById(modalId);
  const inputs = modal.querySelectorAll('input, textarea');
  for (const el of inputs) {
    if (el.type === 'file') continue;
    if (el.value.trim() !== '') return true;
  }
  const selects = modal.querySelectorAll('select');
  for (const sel of selects) {
    if (sel.multiple) {
      if ([...sel.selectedOptions].length > 0) return true;
    } else {
      if (sel.value !== '') return true;
    }
  }
  return false;
}

function maybeCloseModal(modalId) {
  // If editing an existing record, just close — data is already saved
  if (state.editingId) { closeModal(modalId); return; }
  if (isModalDirty(modalId)) {
    showAbandonConfirm(modalId);
  } else {
    closeModal(modalId);
  }
}

function showAbandonConfirm(modalId) {
  const dlg = document.getElementById('abandon-dialog');
  dlg.dataset.target = modalId;
  dlg.classList.add('open');
}

document.getElementById('abandon-cancel').addEventListener('click', () => {
  document.getElementById('abandon-dialog').classList.remove('open');
});

document.getElementById('abandon-confirm').addEventListener('click', () => {
  const modalId = document.getElementById('abandon-dialog').dataset.target;
  document.getElementById('abandon-dialog').classList.remove('open');
  closeModal(modalId);
});

document.getElementById('abandon-dialog').addEventListener('click', e => {
  if (e.target === document.getElementById('abandon-dialog')) {
    document.getElementById('abandon-dialog').classList.remove('open');
  }
});

// Overlay click — use dirty check
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) maybeCloseModal(overlay.id);
  });
});

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
// Prevent scroll from changing number input values
document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
}, { passive: true });

initApp();
