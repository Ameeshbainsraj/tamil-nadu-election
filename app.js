/* ─────────────────────────────────────────────
   TAMIL NADU ELECTION 2026 · LIVE DASHBOARD
   app.js
   ───────────────────────────────────────────── */

const MAJORITY    = 118;
const TOTAL_SEATS = 234;
const REFRESH     = 12000;

let prevSeats    = {};
let victoryShown = false;

const PARTY_META = {
  tvk:    { color: '#b8860b', bar: '#c8951a', bg: '#fdf8ed', full: 'Tamil Vettri Kazhagam',     alliance: 'TVK Alliance' },
  dmk:    { color: '#b71c1c', bar: '#c62828', bg: '#fdf0f0', full: 'Dravida Munnetra Kazhagam',  alliance: 'DMK+ Alliance' },
  admk:   { color: '#1b5e20', bar: '#2e7d32', bg: '#f0f7f0', full: 'All India Anna DMK',         alliance: 'ADMK+' },
  ntk:    { color: '#1565c0', bar: '#1976d2', bg: '#eff4fd', full: 'Nam Tamilar Katchi',          alliance: 'NTK' },
  others: { color: '#4a148c', bar: '#6a1b9a', bg: '#f5f0fd', full: 'Others & Independents',      alliance: 'Others' },
};

const ALLIANCES = {
  'TVK Alliance': { keys: ['tvk'],    color: '#c8951a' },
  'DMK+':         { keys: ['dmk'],    color: '#c62828' },
  'ADMK+':        { keys: ['admk'],   color: '#2e7d32' },
  'NTK':          { keys: ['ntk'],    color: '#1976d2' },
  'Others':       { keys: ['others'], color: '#6a1b9a' },
};

/* ── CONFETTI ── */
function launchConfetti(color) {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const cols = [color, '#fff', '#ffd700', '#00e676', '#ff6b6b'];
  for (let i = 0; i < 140; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `background:${cols[Math.floor(Math.random() * cols.length)]}`,
      `animation-duration:${Math.random() * 3 + 2}s`,
      `animation-delay:${Math.random() * 3}s`,
      `width:${Math.random() * 10 + 4}px`,
      `height:${Math.random() * 10 + 4}px`,
      `border-radius:${Math.random() > .5 ? '50%' : '2px'}`,
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
      document.getElementById('victory-party-name').textContent  = p.short;
      document.getElementById('victory-party-name').style.color  = meta.color || '#fff';
      document.getElementById('victory-seat-count').textContent  = p.seats;
      document.getElementById('victory-seat-count').style.color  = meta.color || '#fff';
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
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(oldVal + (newVal - oldVal) * ease);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = newVal;
  };
  requestAnimationFrame(tick);
  el.classList.remove('seat-updated');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('seat-updated');
}

/* ── GET LEADER ── */
function getLeader(parties) {
  let leader = null, max = -1;
  for (const k in parties) {
    if (parties[k].seats > max) {
      max = parties[k].seats;
      leader = { ...parties[k], key: k };
    }
  }
  return leader;
}

/* ── INSIGHTS ── */
function getInsights(parties, leader) {
  const keys    = Object.keys(parties);
  const counted = keys.reduce((s, k) => s + parties[k].seats, 0);
  const pct     = Math.round(counted / TOTAL_SEATS * 100);

  let meaning = `📊 ${pct}% of seats declared (${counted}/${TOTAL_SEATS}). Counting ongoing.`;
  if (pct === 0) meaning = '📊 Counting has just begun. No results yet.';
  if (pct > 80)  meaning = `📊 ${pct}% declared — result is nearly certain.`;

  const closest = leader
    ? `🏁 ${leader.short} needs ${Math.max(0, MAJORITY - leader.seats)} more seats for majority (currently at ${leader.seats}).`
    : '🏁 No clear leader yet.';

  const sorted = [...keys].sort((a, b) => parties[b].seats - parties[a].seats);
  let trend = '📈 Trend: Too early to call.';
  if (sorted.length >= 2) {
    const f   = parties[sorted[0]];
    const s   = parties[sorted[1]];
    const gap = f.seats - s.seats;
    if (gap > 20)               trend = `📈 ${f.short} has a commanding lead of ${gap} seats over ${s.short}.`;
    else if (gap > 10)          trend = `📈 ${f.short} is pulling ahead — ${gap}-seat lead over ${s.short}.`;
    else if (gap <= 5 && counted > 20) trend = `⚡ Extremely tight race! Only ${gap} seats separate top two parties.`;
  }

  return { meaning, closest, trend };
}

/* ── RENDER CARDS ── */
function renderCards(parties) {
  const section  = document.getElementById('party-cards');
  const maxSeats = Math.max(...Object.keys(parties).map(k => parties[k].seats));

  Object.keys(parties).forEach(key => {
    const p        = parties[key];
    const meta     = PARTY_META[key] || { color: '#888', bar: '#888', bg: '#f5f5f5', full: p.name, alliance: '' };
    const isLeader = p.seats === maxSeats && p.seats > 0;
    const pct      = Math.min(p.seats / MAJORITY * 100, 100);
    const toMaj    = Math.max(0, MAJORITY - p.seats);
    const needsText = p.seats >= MAJORITY ? '✅ Majority achieved!' : `${toMaj} more needed`;

    let card = document.getElementById(`card-${key}`);
    if (!card) {
      card = document.createElement('div');
      card.id = `card-${key}`;
      card.className = 'card' + (isLeader ? ' card-leading' : '');
      card.style.cssText = `--c:${meta.color};--c-bar:${meta.bar};`;
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-tag">${p.short}</div>
            <div class="card-fullname">${meta.full}</div>
          </div>
          <div class="card-alliance">${meta.alliance}</div>
        </div>
        <div class="card-seats" id="seats-${key}" style="color:${meta.color}">0</div>
        <div class="card-label">Seats Won + Leading</div>
        <div class="card-track">
          <div class="card-bar" id="bar-${key}" style="background:${meta.bar};width:0%"></div>
        </div>
        <div class="card-needs" id="needs-${key}">${needsText}</div>
      `;
      section.appendChild(card);
    }

    const sEl = document.getElementById(`seats-${key}`);
    const bEl = document.getElementById(`bar-${key}`);
    const nEl = document.getElementById(`needs-${key}`);

    if (sEl) animateCount(sEl, p.seats);
    if (bEl) bEl.style.width = pct + '%';
    if (nEl) {
      nEl.textContent = needsText;
      nEl.className   = 'card-needs' + (p.seats >= MAJORITY ? ' won' : '');
    }

    // Flash outline on seat change
    if (prevSeats[key] !== undefined && prevSeats[key] !== p.seats) {
      card.style.outline = `2px solid ${meta.color}`;
      setTimeout(() => card.style.outline = '', 1200);
    }

    card.className = 'card' + (isLeader ? ' card-leading' : '');
  });
}

/* ── RENDER DONUT ── */
function renderDonut(parties) {
  const svg    = document.getElementById('donut-svg');
  const legend = document.getElementById('donut-legend');
  if (!svg || !legend) return;

  const keys  = Object.keys(parties);
  const total = keys.reduce((s, k) => s + parties[k].seats, 0);

  svg.querySelectorAll('.dseg').forEach(el => el.remove());
  legend.innerHTML = '';

  if (total === 0) {
    legend.innerHTML = '<div class="legend-empty">No results yet</div>';
    return;
  }

  const r = 54, circ = 2 * Math.PI * r, startOffset = circ * 0.25;
  let offset = 0;

  keys.forEach(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { color: '#888', bar: '#888' };
    const frac = p.seats / total;
    const dash = frac * circ;
    const gap  = circ - dash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'dseg');
    circle.setAttribute('cx', 70);
    circle.setAttribute('cy', 70);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', meta.bar);
    circle.setAttribute('stroke-width', 20);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', startOffset - offset * circ);
    circle.style.transition = 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)';
    svg.appendChild(circle);
    offset += frac;

    legend.innerHTML += `
      <div class="legend-row">
        <div class="legend-dot" style="background:${meta.bar}"></div>
        <div class="legend-name">${p.short}</div>
        <div class="legend-val" style="color:${meta.bar}">${p.seats}</div>
      </div>
    `;
  });
}

/* ── RENDER ALLIANCES ── */
function renderAlliances(parties) {
  const container = document.getElementById('alliance-bars');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(ALLIANCES).forEach(([name, al]) => {
    const seats    = al.keys.reduce((s, k) => s + (parties[k]?.seats || 0), 0);
    const pct      = Math.min(seats / TOTAL_SEATS * 100, 100);
    const achieved = seats >= MAJORITY;

    container.innerHTML += `
      <div class="alliance-row">
        <div class="alliance-top">
          <div class="alliance-name" style="color:${al.color}">${name}</div>
          <div class="alliance-seats" style="color:${al.color}">${seats}</div>
        </div>
        <div class="alliance-track">
          <div class="alliance-fill" style="width:${pct}%;background:${al.color}"></div>
          <div class="alliance-maj-marker"></div>
        </div>
        ${achieved ? '<div class="alliance-achieved">✓ MAJORITY ACHIEVED</div>' : ''}
      </div>
    `;
  });
}

/* ── RENDER RACE BARS ── */
function renderRace(parties) {
  const container = document.getElementById('race-bars');
  if (!container) return;
  container.innerHTML = '';

  const keys = Object.keys(parties)
    .filter(k => k !== 'others')
    .sort((a, b) => parties[b].seats - parties[a].seats);

  keys.forEach(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { color: '#888', bar: '#888' };
    const pct  = Math.min(p.seats / MAJORITY * 100, 100);

    container.innerHTML += `
      <div class="race-row">
        <div class="race-name" style="color:${meta.color}">${p.short}</div>
        <div class="race-track">
          <div class="race-fill" style="width:${pct}%;background:${meta.bar}"></div>
          <div class="race-maj-line"></div>
        </div>
        <div class="race-count" style="color:${meta.bar}">${p.seats}</div>
      </div>
    `;
  });
}

/* ── RENDER TICKER ── */
function renderTicker(parties) {
  const inner = document.getElementById('ticker-inner');
  if (!inner) return;
  const items = Object.keys(parties).map(k => {
    const p    = parties[k];
    const meta = PARTY_META[k] || { bar: '#888' };
    return `<span class="ticker-item">${p.short} <span style="color:${meta.bar};font-weight:500">${p.seats}</span></span><span class="ticker-sep">·</span>`;
  }).join('');
  inner.innerHTML = items + items; // doubled for seamless loop
}

/* ── MAIN RENDER ── */
function render(data) {
  const { parties } = data;
  const keys        = Object.keys(parties);
  const declared    = keys.reduce((s, k) => s + parties[k].seats, 0);
  const declaredPct = Math.round(declared / TOTAL_SEATS * 100);

  // Hero stats
  document.getElementById('hero-declared').textContent          = declared;
  document.getElementById('strip-declared').textContent         = declared;
  document.getElementById('hero-progress-bar').style.width      = declaredPct + '%';

  // All panels
  renderCards(parties);
  renderDonut(parties);
  renderAlliances(parties);
  renderRace(parties);
  renderTicker(parties);

  // Leader
  const leader = getLeader(parties);
  if (leader) {
    const meta = PARTY_META[leader.key] || {};
    const lp   = document.getElementById('leading-party');
    const hp   = document.getElementById('hero-leading-party');
    lp.textContent  = leader.short;
    lp.style.color  = meta.color || 'var(--win)';
    hp.textContent  = leader.short;
    hp.style.color  = meta.color || '#fff';
    document.getElementById('leading-sub').textContent      = `${leader.seats} seats · ${meta.full || ''}`;
    document.getElementById('hero-leading-sub').textContent = `${leader.seats} seats — needs ${Math.max(0, MAJORITY - leader.seats)} more`;
  }

  // Insights
  const ins = getInsights(parties, leader);
  document.getElementById('insight-meaning').textContent = ins.meaning;
  document.getElementById('insight-closest').textContent = ins.closest;
  document.getElementById('insight-trend').textContent   = ins.trend;

  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

  // Save seats for next diff
  prevSeats = {};
  keys.forEach(k => prevSeats[k] = parties[k].seats);

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
    render({ parties });
  } catch (err) {
    console.error('Fetch failed:', err);
    document.getElementById('last-updated').textContent = '⚠ Update failed';
    // Render empty fallback so the UI doesn't break
    render({
      parties: {
        tvk:    { name: 'TVK',    short: 'TVK',    seats: 0, won: 0 },
        dmk:    { name: 'DMK',    short: 'DMK',    seats: 0, won: 0 },
        admk:   { name: 'ADMK',   short: 'ADMK',   seats: 0, won: 0 },
        ntk:    { name: 'NTK',    short: 'NTK',    seats: 0, won: 0 },
        others: { name: 'Others', short: 'Others', seats: 0, won: 0 },
      },
    });
  }
}

/* ── BOOT ── */
fetchData();
setInterval(fetchData, REFRESH);