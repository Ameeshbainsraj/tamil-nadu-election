// ── CONFIG ──
const MAJORITY = 118;
const TOTAL_SEATS = 234;
const REFRESH_INTERVAL = 12000;

// Party metadata — colours match the new systematic palette
const PARTY_META = {
  tvk:    { color: '#C0392B', full: 'Tamil Vettri Kazhagam',     alliance: 'TVK' },
  dmk:    { color: '#1A6B9A', full: 'Dravida Munnetra Kazhagam', alliance: 'DMK+' },
  admk:   { color: '#2E7D32', full: 'All India Anna DMK',        alliance: 'ADMK+' },
  others: { color: '#6D4C41', full: 'Others & Independents',     alliance: 'Others' },
};

const ALLIANCES = {
  'TVK Alliance':  { keys: ['tvk'],   color: '#C0392B' },
  'DMK+ Alliance': { keys: ['dmk'],   color: '#1A6B9A' },
  'ADMK+':         { keys: ['admk'],  color: '#2E7D32' },
  'Others':        { keys: ['others'],color: '#6D4C41' },
};

let prevSeats = {};
let victoryShown = false;

// ── CONFETTI ──
function launchConfetti(color) {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = [color, '#D4860A', '#F0A020', '#fff', '#1B7A3E'];
  for (let i = 0; i < 140; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}vw;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*3+2}s;
      animation-delay:${Math.random()*2.5}s;
      width:${Math.random()*8+4}px;
      height:${Math.random()*8+4}px;
      border-radius:${Math.random()>0.5?'50%':'2px'};
    `;
    container.appendChild(piece);
  }
}

// ── VICTORY ──
function checkVictory(parties) {
  for (const key in parties) {
    if (key === 'others') continue;
    const p = parties[key];
    if (p.seats >= MAJORITY && !victoryShown) {
      victoryShown = true;
      const meta = PARTY_META[key] || {};
      const nameEl = document.getElementById('victory-party-name');
      nameEl.textContent = p.short;
      nameEl.style.color = meta.color || '#fff';
      const countEl = document.getElementById('victory-seat-count');
      countEl.textContent = p.seats;
      countEl.style.color = meta.color || '#fff';
      document.getElementById('victory-overlay').classList.remove('hidden');
      launchConfetti(meta.color || '#D4860A');
    }
  }
}

// ── ANIMATED COUNTER ──
function animateCount(el, newVal) {
  const oldVal = parseInt(el.textContent) || 0;
  if (oldVal === newVal) return;
  const duration = 900;
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(oldVal + (newVal - oldVal) * ease);
    if (t < 1) requestAnimationFrame(update);
    else el.textContent = newVal;
  };
  requestAnimationFrame(update);
  el.classList.remove('seat-updated');
  void el.offsetWidth;
  el.classList.add('seat-updated');
}

// ── HELPERS ──
function getNeedsText(seats) {
  if (seats >= MAJORITY) return '✅ Majority Achieved';
  return `Needs ${MAJORITY - seats} more`;
}

function getLeader(parties) {
  let leader = null, max = -1;
  for (const key in parties) {
    if (parties[key].seats > max) {
      max = parties[key].seats;
      leader = { ...parties[key], key };
    }
  }
  return leader;
}

function getInsights(parties, leader) {
  const keys = Object.keys(parties);
  const counted = keys.reduce((s, k) => s + parties[k].seats, 0);
  const pct = Math.round((counted / TOTAL_SEATS) * 100);

  let meaning = `📊 ${pct}% of seats declared. Counting ongoing.`;
  if (pct === 0) meaning = '📊 Counting has just begun. No results yet.';
  if (pct > 80) meaning = `📊 ${pct}% declared — result is becoming very clear.`;

  const closest = leader
    ? `🏁 ${leader.short} leads with ${leader.seats} seats — needs ${Math.max(0, MAJORITY - leader.seats)} more for majority.`
    : '🏁 No clear leader yet.';

  const sorted = [...keys].sort((a, b) => parties[b].seats - parties[a].seats);
  let trend = '📈 Trend: Too early to call.';
  if (sorted.length >= 2 && counted > 0) {
    const first = parties[sorted[0]];
    const second = parties[sorted[1]];
    const gap = first.seats - second.seats;
    if (gap > 20) trend = `📈 ${first.short} has a commanding lead of ${gap} seats.`;
    else if (gap > 10) trend = `📈 ${first.short} pulling ahead by ${gap} seats.`;
    else if (gap <= 5 && counted > 20) trend = `⚡ Extremely tight — only ${gap} seats between the top two.`;
  }

  return { meaning, closest, trend };
}

// ── RENDER CARDS ──
function renderCards(parties) {
  const section = document.getElementById('party-cards');
  const keys = Object.keys(parties);
  const maxSeats = Math.max(...keys.map(k => parties[k].seats));

  keys.forEach(key => {
    const p = parties[key];
    const meta = PARTY_META[key] || { color: '#888', full: p.name, alliance: '' };
    const pct = Math.min((p.seats / MAJORITY) * 100, 100);
    const needsText = key === 'others' ? `${p.seats} seats counted` : getNeedsText(p.seats);
    const isLeader = p.seats === maxSeats && p.seats > 0;

    let card = document.getElementById(`card-${key}`);

    if (!card) {
      card = document.createElement('div');
      card.id = `card-${key}`;
      card.className = 'card';
      card.style.setProperty('--card-color', meta.color);
      card.innerHTML = `
        <div class="card-top-row">
          <div>
            <div class="card-party-tag" style="color:${meta.color}">${p.short}</div>
            <div class="card-party-name">${meta.full}</div>
          </div>
          <div class="card-alliance">${meta.alliance}</div>
        </div>
        <div class="card-seats" id="seats-${key}" style="color:${meta.color}">0</div>
        <div class="card-label">Seats Leading + Won</div>
        <div class="card-bar-track">
          <div class="card-bar" id="bar-${key}" style="width:0%"></div>
        </div>
        <div class="card-needs" id="needs-${key}">${needsText}</div>
      `;
      section.appendChild(card);
    }

    const seatsEl = document.getElementById(`seats-${key}`);
    const barEl   = document.getElementById(`bar-${key}`);
    const needsEl = document.getElementById(`needs-${key}`);

    if (seatsEl) animateCount(seatsEl, p.seats);
    if (barEl)   barEl.style.width = pct + '%';
    if (needsEl) {
      needsEl.textContent = needsText;
      needsEl.className   = 'card-needs' + (p.seats >= MAJORITY ? ' achieved' : '');
    }

    // Pulse flash on update
    if (prevSeats[key] !== undefined && prevSeats[key] !== p.seats) {
      card.style.outline = `2px solid ${meta.color}`;
      setTimeout(() => card.style.outline = '', 1200);
    }

    card.className = 'card' + (isLeader ? ' card-leading' : '');
  });
}

// ── RENDER DONUT ──
function renderDonut(parties) {
  const svg    = document.getElementById('donut-svg');
  const legend = document.getElementById('donut-legend');
  if (!svg || !legend) return;

  const keys  = Object.keys(parties);
  const total = keys.reduce((s, k) => s + parties[k].seats, 0);
  const cx = 70, cy = 70, r = 52, strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  svg.querySelectorAll('.donut-seg').forEach(el => el.remove());
  legend.innerHTML = '';

  if (total === 0) {
    legend.innerHTML = `<div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--ink-3);letter-spacing:1px">No results yet</div>`;
    return;
  }

  let cumulative = 0;
  keys.forEach(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { color: '#888' };
    const fraction = p.seats / total;
    const dash = fraction * circumference;
    const gap  = circumference - dash;
    // SVG arcs start at 3 o'clock; rotate to 12 o'clock
    const offset = circumference * 0.25 - cumulative * circumference;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'donut-seg');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', meta.color);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', offset);
    circle.style.transition = 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)';
    svg.appendChild(circle);

    cumulative += fraction;

    const pct = Math.round(fraction * 100);
    legend.innerHTML += `
      <div class="legend-item">
        <div class="legend-dot" style="background:${meta.color}"></div>
        <div class="legend-name">${p.short}</div>
        <div class="legend-val" style="color:${meta.color}">${p.seats}</div>
      </div>
    `;
  });
}

// ── RENDER ALLIANCES ──
function renderAlliances(parties) {
  const container = document.getElementById('alliance-bars');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(ALLIANCES).forEach(([name, alliance]) => {
    const total = alliance.keys.reduce((s, k) => s + (parties[k]?.seats || 0), 0);
    const pct   = Math.min((total / TOTAL_SEATS) * 100, 100);
    const won   = total >= MAJORITY;

    container.innerHTML += `
      <div class="alliance-row">
        <div class="alliance-row-top">
          <div class="alliance-name" style="color:${alliance.color}">${name}</div>
          <div class="alliance-seats" style="color:${alliance.color}">${total}</div>
        </div>
        <div class="alliance-track">
          <div class="alliance-fill" style="width:${pct}%;background:${alliance.color}"></div>
          <div class="majority-line-marker"></div>
        </div>
        ${won ? `<div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--win);letter-spacing:2px;margin-top:4px">✅ MAJORITY ACHIEVED</div>` : ''}
      </div>
    `;
  });
}

// ── RENDER MAJORITY METER ──
function renderMajorityMeter(parties) {
  let meter = document.getElementById('majority-meter-section');
  if (!meter) {
    meter = document.createElement('section');
    meter.id = 'majority-meter-section';
    meter.className = 'majority-meter-section';
    meter.innerHTML = `
      <div class="meter-header">
        <div class="meter-header-label">Race to Majority</div>
        <div class="meter-header-sub">First to 118 wins</div>
      </div>
      <div class="meter-bars" id="meter-bars"></div>
    `;
    const main       = document.querySelector('main');
    const bottomGrid = document.querySelector('.bottom-grid');
    main.insertBefore(meter, bottomGrid);
  }

  const meterBars = document.getElementById('meter-bars');
  meterBars.innerHTML = '';

  const keys = Object.keys(parties)
    .filter(k => k !== 'others')
    .sort((a, b) => parties[b].seats - parties[a].seats);

  keys.forEach(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { color: '#888' };
    const pct  = Math.min((p.seats / MAJORITY) * 100, 100);

    meterBars.innerHTML += `
      <div class="meter-row">
        <div class="meter-party-name" style="color:${meta.color}">${p.short}</div>
        <div class="meter-track">
          <div class="meter-fill" style="width:${pct}%;background:${meta.color}"></div>
          <div class="meter-goal-line"></div>
        </div>
        <div class="meter-count" style="color:${meta.color}">${p.seats}</div>
      </div>
    `;
  });
}

// ── RENDER TICKER ──
function renderTicker(parties) {
  let ticker = document.getElementById('ticker');
  if (!ticker) {
    ticker = document.createElement('div');
    ticker.id = 'ticker';
    ticker.className = 'ticker';
    ticker.innerHTML = `<div class="ticker-inner" id="ticker-inner"></div>`;
    document.body.insertBefore(ticker, document.querySelector('footer'));
  }

  const items = Object.keys(parties).map(key => {
    const p    = parties[key];
    const meta = PARTY_META[key] || { color: '#888' };
    return `<span class="ticker-item"><span style="color:${meta.color};font-weight:700">${p.short}</span>&nbsp;${p.seats} seats</span><span class="ticker-sep"> · </span>`;
  }).join('');

  document.getElementById('ticker-inner').innerHTML = items + items;
}

// ── MAIN RENDER ──
function render(data) {
  const { parties } = data;

  renderCards(parties);
  renderDonut(parties);
  renderAlliances(parties);
  renderMajorityMeter(parties);
  renderTicker(parties);

  const leader = getLeader(parties);
  if (leader) {
    const meta   = PARTY_META[leader.key] || {};
    const leadEl = document.getElementById('leading-party');
    leadEl.textContent = leader.short;
    leadEl.style.color = meta.color || '#fff';
    document.getElementById('leading-sub').textContent =
      `${leader.seats} seats · ${meta.full || ''}`;
  }

  const insights = getInsights(parties, leader);
  document.getElementById('insight-meaning').textContent = insights.meaning;
  document.getElementById('insight-closest').textContent = insights.closest;
  document.getElementById('insight-trend').textContent   = insights.trend;
  document.getElementById('last-updated').textContent    =
    'Updated ' + new Date().toLocaleTimeString();

  prevSeats = {};
  Object.keys(parties).forEach(k => prevSeats[k] = parties[k].seats);

  checkVictory(parties);
}

// ── FETCH ──
async function fetchData() {
  try {
    const res  = await fetch(`https://opensheet.elk.sh/1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0/Sheet1`);
    const rows = await res.json();
    const data = { parties: {} };
    rows.forEach(row => {
      const key = row.party.toLowerCase();
      data.parties[key] = {
        name:  row.party,
        short: row.party,
        seats: parseInt(row.seats) || 0,
        won:   parseInt(row.won)   || 0,
      };
    });
    render(data);
  } catch (err) {
    console.error('Fetch failed:', err);
    document.getElementById('last-updated').textContent = '⚠ Update failed';
    // Fallback skeleton so UI still shows
    render({
      parties: {
        tvk:    { name:'TVK',    short:'TVK',    seats:0, won:0 },
        dmk:    { name:'DMK',    short:'DMK',    seats:0, won:0 },
        admk:   { name:'ADMK',   short:'ADMK',   seats:0, won:0 },
        others: { name:'Others', short:'Others', seats:0, won:0 },
      }
    });
  }
}

fetchData();
setInterval(fetchData, REFRESH_INTERVAL);