/* ─────────────────────────────────────────────
   TN26 · TAMIL NADU ELECTION 2026 · LIVE
   app.js  —  Dark Newsroom Edition
   ───────────────────────────────────────────── */

const MAJORITY    = 118;
const TOTAL_SEATS = 234;
const REFRESH     = 12000;

let prevSeats    = {};
let victoryShown = false;

const PARTY_META = {
  tvk:    { color: '#c8951a', bar: '#f9a825', full: 'Tamilaga Vettri Kazhagam',         alliance: 'TVK Alliance',  gaugeId: 'g-tvk'  },
  dmk:    { color: '#c62828', bar: '#e53935', full: 'Dravida Munnetra Kazhagam Alliance',alliance: 'DMK+ Alliance', gaugeId: 'g-dmk'  },
  admk:   { color: '#2e7d32', bar: '#43a047', full: 'All India ADMK Alliance',           alliance: 'ADMK+',         gaugeId: 'g-admk' },
  ntk:    { color: '#bf5000', bar: '#ef6c00', full: 'Naam Tamilar Katchi',               alliance: 'NTK',           gaugeId: 'g-ntk'  },
  others: { color: '#555',    bar: '#7b7b8a', full: 'Others & Independents',             alliance: 'Others',        gaugeId: null     },
};

const ALLIANCES = [
  { name: 'DMK+ Alliance', keys: ['dmk'],    color: '#e53935' },
  { name: 'ADMK+ Alliance',keys: ['admk'],   color: '#43a047' },
  { name: 'TVK Alliance',  keys: ['tvk'],    color: '#f9a825' },
  { name: 'NTK',           keys: ['ntk'],    color: '#ef6c00' },
  { name: 'Others',        keys: ['others'], color: '#7b7b8a' },
];



/* ── CONFETTI ── */
function launchConfetti(color) {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const cols = [color, '#fff', '#ffd700', '#00e676', '#ff6b6b'];
  for (let i = 0; i < 140; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = [
      `left:${Math.random()*100}vw`,
      `background:${cols[Math.floor(Math.random()*cols.length)]}`,
      `animation-duration:${Math.random()*3+2}s`,
      `animation-delay:${Math.random()*3}s`,
      `width:${Math.random()*10+4}px`,
      `height:${Math.random()*10+4}px`,
      `border-radius:${Math.random()>.5?'50%':'2px'}`,
    ].join(';');
    container.appendChild(piece);
  }
}

/* ── VICTORY CHECK ── */
function checkVictory(parties) {
  for (const key in parties) {
    if (key === 'others') continue;
    const p = parties[key];
    if (p.seats >= MAJORITY && !victoryShown) {
      victoryShown = true;
      const meta = PARTY_META[key] || {};
      document.getElementById('victory-party-name').textContent = p.short;
      document.getElementById('victory-party-name').style.color = meta.color || '#fff';
      document.getElementById('victory-seat-count').textContent = p.seats;
      document.getElementById('victory-seat-count').style.color = meta.color || '#fff';
      document.getElementById('victory-overlay').classList.remove('hidden');
      launchConfetti(meta.bar || '#fff');
    }
  }
}

/* ── ANIMATED COUNTER ── */
function animateCount(el, newVal) {
  const oldVal = parseInt(el.textContent) || 0;
  if (oldVal === newVal) return;
  const dur = 800, start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1-t, 3);
    el.textContent = Math.round(oldVal + (newVal - oldVal) * ease);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = newVal;
  };
  requestAnimationFrame(tick);
  el.classList.remove('seat-updated');
  void el.offsetWidth;
  el.classList.add('seat-updated');
}

/* ── GET LEADER ── */
function getLeader(parties) {
  let leader = null, max = -1;
  for (const k in parties) {
    if (parties[k].seats > max) { max = parties[k].seats; leader = { ...parties[k], key: k }; }
  }
  return leader;
}

/* ── RENDER GAUGE ── */
function renderGauge(parties) {
  const totalDeclared = Object.keys(parties).reduce((s, k) => s + parties[k].seats, 0);
  const gaugeEl = document.getElementById('gauge-total');
  if (gaugeEl) animateCount(gaugeEl, totalDeclared);

  // Arc length = 283 (half circle with r=90, circumference = PI*90 ≈ 283)
  const ARC = 283;
  const keys = ['dmk', 'tvk', 'admk', 'ntk'];
  let cumPct = 0;

  // Build sorted by seats desc for stacking
  keys.forEach(key => {
    const p = parties[key];
    if (!p) return;
    const meta = PARTY_META[key];
    if (!meta || !meta.gaugeId) return;
    const el = document.getElementById(meta.gaugeId);
    if (!el) return;
    const pct = p.seats / TOTAL_SEATS;
    const dash = pct * ARC;
    const gap  = ARC - dash;
    // Each arc starts from cumulative offset
    el.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    el.setAttribute('stroke-dashoffset', -cumPct * ARC);
    cumPct += pct;
  });
}

/* ── RENDER PARTY CARDS ── */
function renderCards(parties) {
  const section  = document.getElementById('party-cards');
  if (!section) return;
  const maxSeats = Math.max(...Object.values(parties).map(p => p.seats));

  const leader = getLeader(parties);

  Object.keys(parties).forEach(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { color: '#888', bar: '#7b7b8a', full: p.short, alliance: '' };
    const isLeader = leader && leader.key === key && p.seats > 0;
    const pct  = Math.min(p.seats / MAJORITY * 100, 100);

    // Determine status
    let statusClass = 'status-trailing', statusText = 'TRAILING';
    if (p.seats >= MAJORITY) { statusClass = 'status-won';     statusText = '✓ MAJORITY'; }
    else if (isLeader)       { statusClass = 'status-leading'; statusText = 'LEADING';    }
    else if (p.seats > 0)    { statusClass = 'status-behind';  statusText = 'BEHIND';     }

    let card = document.getElementById(`card-${key}`);
    if (!card) {
      card = document.createElement('div');
      card.id = `card-${key}`;
      card.className = 'card' + (isLeader ? ' card-leading' : '');
      card.style.setProperty('--c', meta.color);
      card.style.setProperty('--c-bar', meta.bar);
      card.innerHTML = `
        <div class="card-tag">${p.short}</div>
        <div class="card-fullname">${meta.full}</div>
        <div class="card-seats" id="seats-${key}" style="color:${meta.bar}">0</div>
        <div class="card-denom">/ 234</div>
        <div class="card-track"><div class="card-bar" id="bar-${key}" style="background:${meta.bar};width:0%"></div></div>
        <span class="card-status ${statusClass}" id="status-${key}">${statusText}</span>
      `;
      section.appendChild(card);
    }

    const sEl = document.getElementById(`seats-${key}`);
    const bEl = document.getElementById(`bar-${key}`);
    const stEl = document.getElementById(`status-${key}`);

    if (sEl) animateCount(sEl, p.seats);
    if (bEl) bEl.style.width = pct + '%';
    if (stEl) { stEl.textContent = statusText; stEl.className = `card-status ${statusClass}`; }

    if (prevSeats[key] !== undefined && prevSeats[key] !== p.seats) {
      card.style.outline = `1px solid ${meta.bar}`;
      setTimeout(() => card.style.outline = '', 1200);
    }
    card.className = 'card' + (isLeader ? ' card-leading' : '');
  });
}

/* ── RENDER ALLIANCE SIDEBAR ── */
function renderAllianceSidebar(parties) {
  const container = document.getElementById('alliance-sidebar');
  if (!container) return;
  container.innerHTML = '';

  ALLIANCES.forEach(al => {
    const seats = al.keys.reduce((s, k) => s + (parties[k]?.seats || 0), 0);
    const pct   = Math.min(seats / TOTAL_SEATS * 100, 100);
    const div   = document.createElement('div');
    div.className = 'alliance-sb-row';
    div.innerHTML = `
      <div class="alliance-sb-top">
        <span class="alliance-sb-name" style="color:${al.color}">${al.name}</span>
        <span class="alliance-sb-seats" style="color:${al.color}">${seats}</span>
      </div>
      <div class="alliance-sb-track">
        <div class="alliance-sb-fill" style="width:${pct}%;background:${al.color}"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

/* ── RENDER PARTY TABLE ── */
function renderPartyTable(parties) {
  const tbody = document.getElementById('party-table-rows');
  if (!tbody) return;
  tbody.innerHTML = '';

  Object.keys(parties).forEach(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { bar: '#888' };
    const won  = p.won  || 0;
    const lead = p.seats - won;
    const row  = document.createElement('div');
    row.className = 'party-table-row';
    row.innerHTML = `
      <span class="pt-name" style="color:${meta.bar}">${p.short}</span>
      <span class="pt-num">${won}</span>
      <span class="pt-num">${Math.max(0, lead)}</span>
      <span class="pt-total" style="color:${meta.bar}">${p.seats}</span>
    `;
    tbody.appendChild(row);
  });
}

/* ── RENDER TICKER ── */
function renderTicker(parties) {
  const inner = document.getElementById('ticker-inner');
  if (!inner) return;
  const colorMap = { tvk:'t-tvk', dmk:'t-dmk', admk:'t-admk', ntk:'t-ntk', others:'t-oth' };
  let html = '';
  Object.keys(parties).forEach(k => {
    const p  = parties[k];
    const cl = colorMap[k] || 't-oth';
    html += `<span class="ticker-item">${p.short} <span class="${cl}">${p.seats}</span></span><span class="ticker-sep">·</span>`;
  });
  inner.innerHTML = html + html; // doubled for seamless loop
}

/* ── RENDER QUICK VIEW ── */
function renderQuickView(parties) {
  const map = { dmk: 'qv-dmk', admk: 'qv-admk', tvk: 'qv-tvk', ntk: 'qv-ntk', others: 'qv-oth' };
  Object.keys(map).forEach(k => {
    const el = document.getElementById(map[k]);
    if (el && parties[k]) animateCount(el, parties[k].seats);
  });
  // update live clock
  const ct = document.getElementById('qv-time');
  if (ct) ct.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true }) + ' IST';
}



/* ── HEADER STATS ── */
function renderHeaderStats(parties) {
  const declared = Object.keys(parties).reduce((s, k) => s + parties[k].seats, 0);
  const hc = document.getElementById('h-counting');
  if (hc) animateCount(hc, declared);
  // won / leading: for display just show total won and total declared
  const won = Object.keys(parties).reduce((s, k) => s + (parties[k].won || 0), 0);
  const hl = document.getElementById('h-wonlead');
  if (hl) hl.textContent = `${won} / ${declared}`;
}

/* ── MAIN RENDER ── */
function render(data) {
  const { parties } = data;

  renderCards(parties);
  renderGauge(parties);
  renderAllianceSidebar(parties);
  renderPartyTable(parties);
  renderTicker(parties);
  renderQuickView(parties);
  renderHeaderStats(parties);


  document.getElementById('last-updated').textContent =
    'Updated ' + new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true });

  prevSeats = {};
  Object.keys(parties).forEach(k => prevSeats[k] = parties[k].seats);

  checkVictory(parties);
}

/* ── FETCH ── */
async function fetchData() {
  try {
    const res  = await fetch('https://opensheet.elk.sh/1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0/Sheet1');
    const rows = await res.json();
    const parties = {};
    rows.forEach(row => {
      const key = row.party.toLowerCase();
      parties[key] = {
        name:  row.party,
        short: row.party,
        seats: parseInt(row.seats) || 0,
        won:   parseInt(row.won)   || 0,
      };
    });
    // Ensure all keys exist
    ['tvk','dmk','admk','ntk','others'].forEach(k => {
      if (!parties[k]) parties[k] = { name: k.toUpperCase(), short: k.toUpperCase(), seats: 0, won: 0 };
    });
    render({ parties });
  } catch (err) {
    console.error('Fetch failed:', err);
    document.getElementById('last-updated').textContent = '⚠ Update failed';
    render({
      parties: {
        tvk:    { name: 'TVK',    short: 'TVK',    seats: 0, won: 0 },
        dmk:    { name: 'DMK+',   short: 'DMK+',   seats: 0, won: 0 },
        admk:   { name: 'ADMK+',  short: 'ADMK+',  seats: 0, won: 0 },
        ntk:    { name: 'NTK',    short: 'NTK',    seats: 0, won: 0 },
        others: { name: 'Others', short: 'OTH',    seats: 0, won: 0 },
      },
    });
  }
}

/* ── BOOT ── */
fetchData();
setInterval(fetchData, REFRESH);