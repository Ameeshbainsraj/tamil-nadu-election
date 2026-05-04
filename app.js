/* ═══════════════════════════════════════════
   TN26 · LIVE APP
   Data source: Google Sheets (public CSV)
   Sheet ID: 1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0
═══════════════════════════════════════════

   ── HOW TO USE YOUR GOOGLE SHEET ──
   Your sheet must be:
   1. File → Share → "Anyone with the link" → Viewer
   2. Columns must be exactly:
      party | short | seats | won | leading

   Example rows:
   party   | short | seats | won | leading
   tvk     | TVK   | 110   | 85  | 25
   dmk     | DMK+  | 50    | 38  | 12
   admk    | ADMK  | 56    | 40  | 16
   ntk     | NTK   | 0     | 0   | 0
   others  | OTH   | 9     | 7   | 2

═══════════════════════════════════════════ */

const SHEET_ID  = '1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

const MAJORITY    = 118;
const TOTAL_SEATS = 234;
const REFRESH     = 12000;
let firstRender   = true;
let victoryShown  = false;

const PARTY_META = {
  tvk:    { color:'#c8f53f', bar:'#c8f53f', full:'Tamilaga Vettri Kazhagam',           alliance:'TVK Alliance',  gaugeId:'g-tvk'  },
  dmk:    { color:'#7986cb', bar:'#5c6bc0', full:'Dravida Munnetra Kazhagam Alliance',  alliance:'DMK+ Alliance', gaugeId:'g-dmk'  },
  admk:   { color:'#3dab48', bar:'#3dab48', full:'All India ADMK Alliance',             alliance:'ADMK+ Alliance',gaugeId:'g-admk' },
  ntk:    { color:'#f06c2a', bar:'#f06c2a', full:'Naam Tamilar Katchi',                 alliance:'NTK',           gaugeId:'g-ntk'  },
  others: { color:'#6e7485', bar:'#6e7485', full:'Others & Independents',               alliance:'Others',        gaugeId:null     },
};

const ALLIANCES = [
  { name:'TVK Alliance',  keys:['tvk'],    color:'#c8f53f' },
  { name:'DMK+ Alliance', keys:['dmk'],    color:'#7986cb' },
  { name:'ADMK+ Alliance',keys:['admk'],   color:'#3dab48' },
  { name:'NTK',           keys:['ntk'],    color:'#f06c2a' },
  { name:'Others',        keys:['others'], color:'#6e7485' },
];

/* ══════════════════════════════
   GOOGLE SHEETS CSV PARSER
══════════════════════════════ */
function parseCSV(text) {
  const lines = text.trim().split('\n').map(l =>
    l.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
  );
  if (lines.length < 2) return null;

  const headers = lines[0].map(h => h.toLowerCase());
  const parties = {};

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row[0]) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = row[idx] || '');

    const key = obj['party']?.toLowerCase();
    if (!key) continue;
    parties[key] = {
      short:   obj['short']   || key.toUpperCase(),
      seats:   parseInt(obj['seats'])   || 0,
      won:     parseInt(obj['won'])     || 0,
      leading: parseInt(obj['leading']) || 0,
    };
  }

  // Ensure all 5 parties exist
  ['tvk','dmk','admk','ntk','others'].forEach(k => {
    if (!parties[k]) parties[k] = { short: k.toUpperCase(), seats:0, won:0, leading:0 };
  });

  return parties;
}

/* ══════════════════════════════
   FETCH FROM GOOGLE SHEETS
══════════════════════════════ */
async function fetchFromSheets() {
  const res = await fetch(SHEET_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Sheets fetch failed');
  const text = await res.text();
  const parties = parseCSV(text);
  if (!parties) throw new Error('Parse failed');
  return parties;
}

/* ══════════════════════════════
   UTILITIES
══════════════════════════════ */
function animateCount(el, newVal) {
  if (!el) return;
  const oldVal = parseInt(el.textContent?.replace('%','')) || 0;
  if (oldVal === newVal) return;
  const dur = 750, start = performance.now();
  const tick = now => {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(oldVal + (newVal - oldVal) * ease);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = newVal;
  };
  requestAnimationFrame(tick);
  el.classList.remove('seat-updated');
  void el.offsetWidth;
  el.classList.add('seat-updated');
}

function getLeader(parties) {
  let leader = null, max = -1;
  for (const k in parties) {
    if (parties[k].seats > max) { max = parties[k].seats; leader = { ...parties[k], key: k }; }
  }
  return leader;
}

function launchConfetti(color) {
  const c = document.getElementById('confetti');
  c.innerHTML = '';
  const cols = [color, '#fff', '#ffd700', '#c8f53f', '#7986cb'];
  for (let i = 0; i < 130; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = [
      `left:${Math.random()*100}vw`,
      `background:${cols[Math.floor(Math.random()*cols.length)]}`,
      `animation-duration:${Math.random()*3+2}s`,
      `animation-delay:${Math.random()*3}s`,
      `width:${Math.random()*10+4}px`,
      `height:${Math.random()*10+4}px`,
      `border-radius:${Math.random()>.5?'50%':'2px'}`,
    ].join(';');
    c.appendChild(p);
  }
}

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

/* ══════════════════════════════
   RENDER FUNCTIONS
══════════════════════════════ */

function renderGauge(parties) {
  // No separate SVG gauge in new design — stats row handles totals
  const total = Object.values(parties).reduce((s, p) => s + p.seats, 0);
  animateCount(document.getElementById('h-counting'), total);
  animateCount(document.getElementById('h-declared'), total);
  const pctEl = document.getElementById('h-pct');
  if (pctEl) {
    const pct = Math.round(total / TOTAL_SEATS * 100);
    pctEl.textContent = pct + '%';
  }
}

function renderCards(parties) {
  const section = document.getElementById('party-cards');
  if (!section) return;
  const leader = getLeader(parties);

  Object.keys(parties).forEach(key => {
    const p = parties[key];
    const meta = PARTY_META[key] || { color:'#888', bar:'#6e7485', full: p.short };
    const isLeader = leader?.key === key && p.seats > 0;
    const pct = Math.min(p.seats / MAJORITY * 100, 100);

    let statusClass = 'status-trailing', statusText = 'Trailing';
    if (p.seats >= MAJORITY)  { statusClass = 'status-won';     statusText = '✓ Majority'; }
    else if (isLeader)        { statusClass = 'status-leading';  statusText = 'Leading'; }
    else if (p.seats > 0)     { statusClass = 'status-behind';   statusText = 'Behind'; }

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
        <div class="card-seats" id="cs-${key}">${p.seats}</div>
        <div class="card-denom">/ 234</div>
        <div class="card-track"><div class="card-bar" id="cb-${key}" style="width:${pct}%;background:${meta.bar}"></div></div>
        <div class="card-status ${statusClass}" id="cst-${key}">${statusText}</div>
      `;
      section.appendChild(card);
    } else {
      animateCount(document.getElementById(`cs-${key}`), p.seats);
      const bar = document.getElementById(`cb-${key}`);
      if (bar) bar.style.width = pct + '%';
      const st = document.getElementById(`cst-${key}`);
      if (st) { st.className = `card-status ${statusClass}`; st.textContent = statusText; }
      card.classList.toggle('card-leading', isLeader);
    }
  });
}

function renderAllianceSb(parties) {
  const el = document.getElementById('alliance-sb');
  if (!el) return;
  el.innerHTML = ALLIANCES.map(a => {
    const seats = a.keys.reduce((s, k) => s + (parties[k]?.seats || 0), 0);
    const pct = Math.min(seats / MAJORITY * 100, 100);
    return `
      <div class="alliance-sb-row">
        <div class="alliance-sb-top">
          <span class="alliance-sb-name" style="color:${a.color}">${a.name}</span>
          <span class="alliance-sb-seats" style="color:${a.color}">${seats}</span>
        </div>
        <div class="alliance-sb-track">
          <div class="alliance-sb-fill" style="width:${pct}%;background:${a.color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRace(parties) {
  const el = document.getElementById('race-bars');
  if (!el) return;
  const order = ['tvk','dmk','admk','ntk'];
  el.innerHTML = order.map(key => {
    const p = parties[key];
    if (!p) return '';
    const meta = PARTY_META[key];
    const pct = Math.min(p.seats / TOTAL_SEATS * 100, 100);
    return `
      <div class="race-row">
        <div class="race-name" style="color:${meta.color}">${p.short}</div>
        <div class="race-track">
          <div class="race-fill" id="rf-${key}" style="width:${pct}%;background:${meta.bar}"></div>
          <div class="race-maj-line"></div>
        </div>
        <div class="race-count" style="color:${meta.color}" id="rc-${key}">${p.seats}</div>
      </div>
    `;
  }).join('');
}

function updateRace(parties) {
  ['tvk','dmk','admk','ntk'].forEach(key => {
    const p = parties[key];
    if (!p) return;
    const fill  = document.getElementById(`rf-${key}`);
    const count = document.getElementById(`rc-${key}`);
    if (fill)  fill.style.width = Math.min(p.seats / TOTAL_SEATS * 100, 100) + '%';
    if (count) animateCount(count, p.seats);
  });
}

function renderDonut(parties) {
  const canvas = document.getElementById('donut-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 70, cy = 70, r = 60, inner = 40, gap = 2.5;
  const total = Object.values(parties).reduce((s, p) => s + p.seats, 0);

  ctx.clearRect(0, 0, 140, 140);
  animateCount(document.getElementById('donut-num'), total);

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    return;
  }

  const order = ['tvk','dmk','admk','ntk','others'];
  let startAngle = -Math.PI / 2;
  order.forEach(key => {
    const p = parties[key];
    if (!p || p.seats === 0) return;
    const meta = PARTY_META[key];
    const sliceAngle = (p.seats / total) * Math.PI * 2;
    const s = startAngle + gap / r;
    const e = startAngle + sliceAngle - gap / r;
    ctx.beginPath();
    ctx.arc(cx, cy, r, s, e);
    ctx.arc(cx, cy, inner, e, s, true);
    ctx.closePath();
    ctx.fillStyle = meta.bar;
    ctx.fill();
    startAngle += sliceAngle;
  });

  const legend = document.getElementById('donut-legend');
  if (legend) {
    legend.innerHTML = order.map(key => {
      const p = parties[key];
      if (!p || p.seats === 0) return '';
      const meta = PARTY_META[key];
      const pct  = Math.round(p.seats / total * 100);
      return `
        <div class="legend-row">
          <span class="legend-dot" style="background:${meta.bar}"></span>
          <span class="legend-name">${p.short}</span>
          <span class="legend-pct" style="color:${meta.color}">${pct}%</span>
        </div>
      `;
    }).join('');
  }
}

function renderInsights(parties) {
  const el = document.getElementById('insight-lines');
  if (!el) return;
  const total  = Object.values(parties).reduce((s, p) => s + p.seats, 0);
  const leader = getLeader(parties);
  const pct    = Math.round(total / TOTAL_SEATS * 100);
  const lines  = [];

  lines.push(`📊 ${pct}% declared — ${pct>=90?'result is nearly certain.':pct>=50?'results taking shape.':'counting underway.'}`);
  if (leader && leader.seats > 0) {
    const needed = MAJORITY - leader.seats;
    if (needed > 0) lines.push(`🎯 ${leader.short} needs ${needed} more seat${needed===1?'':'s'} for majority.`);
    else            lines.push(`✅ ${leader.short} has crossed the majority mark!`);
  } else {
    lines.push('🏁 No clear leader yet.');
  }
  const sorted = Object.entries(parties).filter(([k]) => k!=='others').sort((a,b) => b[1].seats-a[1].seats);
  if (sorted.length>=2 && sorted[0][1].seats > 0) {
    const lead = sorted[0][1].seats - sorted[1][1].seats;
    if (lead > 0) lines.push(`📈 ${sorted[0][1].short} leads ${sorted[1][1].short} by ${lead} seats.`);
  }

  el.innerHTML = lines.map(l =>
    `<div class="insight-line"><span class="i-icon">${l.substring(0,2)}</span><span>${l.substring(2).trim()}</span></div>`
  ).join('');
}

function updateTicker(parties) {
  const colorClass = { tvk:'t-tvk', dmk:'t-dmk', admk:'t-admk', ntk:'t-ntk', others:'t-oth' };
  const items = ['tvk','dmk','admk','ntk','others'].map(key => {
    const p = parties[key];
    return `<span class="t-item"><span class="${colorClass[key]}">${p.short}</span> · ${p.seats}</span>`;
  });
  const sep = '<span class="t-sep">—</span>';
  const tc = document.getElementById('ticker-content');
  if (tc) tc.innerHTML = items.join('') + sep + items.join('');
}

function updateQuickview(parties) {
  const map = { dmk:'qv-dmk', admk:'qv-admk', tvk:'qv-tvk', ntk:'qv-ntk', others:'qv-oth' };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el && parties[key]) animateCount(el, parties[key].seats);
  });
  const t = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  const upd = document.getElementById('update-time');
  if (upd) upd.textContent = 'Updated ' + t;
  const badge = document.getElementById('last-updated');
  if (badge) badge.textContent = t;
}

function renderAll(parties) {
  renderGauge(parties);
  renderCards(parties);
  renderAllianceSb(parties);
  if (firstRender) { renderRace(parties); firstRender = false; }
  else             { updateRace(parties); }
  renderDonut(parties);
  renderInsights(parties);
  updateTicker(parties);
  updateQuickview(parties);
  checkVictory(parties);

  // Update quickview time
  const t = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  const qvt = document.getElementById('qv-time');
  if (qvt) qvt.textContent = t + ' IST';
}

/* ══════════════════════════════
   FALLBACK DATA
══════════════════════════════ */
function useMockData() {
  renderAll({
    tvk:    { short:'TVK',  seats:0, won:0, leading:0 },
    dmk:    { short:'DMK+', seats:0, won:0, leading:0 },
    admk:   { short:'ADMK', seats:0, won:0, leading:0 },
    ntk:    { short:'NTK',  seats:0, won:0, leading:0 },
    others: { short:'OTH',  seats:0, won:0, leading:0 },
  });
}

/* ══════════════════════════════
   MAIN FETCH LOOP
══════════════════════════════ */
async function fetchData() {
  try {
    const parties = await fetchFromSheets();
    renderAll(parties);
  } catch (err) {
    console.warn('Google Sheets fetch failed, using fallback.', err.message);
    useMockData();
  }
}

/* Clock */
setInterval(() => {
  const t = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  const el = document.getElementById('qv-time');
  if (el) el.textContent = t + ' IST';
}, 1000);

fetchData();
setInterval(fetchData, REFRESH);