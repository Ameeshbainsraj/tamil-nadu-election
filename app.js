// ── CONFIG ──
const MAJORITY = 118;
const TOTAL_SEATS = 234;
const REFRESH_INTERVAL = 12000;

const PARTY_META = {
  tvk:    { color: '#ff6b1a', glow: 'rgba(255,107,26,0.3)',  full: 'Tamil Vettri Kazhagam',       alliance: 'TVK' },
  dmk:    { color: '#3b9eff', glow: 'rgba(59,158,255,0.3)',  full: 'Dravida Munnetra Kazhagam',   alliance: 'DMK+' },
  admk:   { color: '#ff3d8a', glow: 'rgba(255,61,138,0.3)',  full: 'All India Anna DMK',          alliance: 'ADMK+' },
  others: { color: '#a855f7', glow: 'rgba(168,85,247,0.3)',  full: 'Others & Independents',       alliance: 'Others' },
};

// Alliance groupings: which party keys belong to which alliance
const ALLIANCES = {
  'TVK Alliance':  { keys: ['tvk'],          color: '#ff6b1a', glow: 'rgba(255,107,26,0.3)' },
  'DMK+ Alliance': { keys: ['dmk'],          color: '#3b9eff', glow: 'rgba(59,158,255,0.3)' },
  'ADMK+':         { keys: ['admk'],         color: '#ff3d8a', glow: 'rgba(255,61,138,0.3)' },
  'Others':        { keys: ['others'],       color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
};

let prevSeats = {};
let victoryShown = false;

// ── CONFETTI ──
function launchConfetti(color) {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = [color, '#ffffff', '#ffd700', '#00e676', '#ff6b6b'];
  for (let i = 0; i < 160; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}vw;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*3+2}s;
      animation-delay:${Math.random()*3}s;
      width:${Math.random()*10+4}px;
      height:${Math.random()*10+4}px;
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
      nameEl.style.textShadow = `0 0 80px ${meta.glow}`;
      document.getElementById('victory-seat-count').textContent = p.seats;
      document.getElementById('victory-seat-count').style.color = meta.color || '#fff';
      document.getElementById('victory-overlay').classList.remove('hidden');
      launchConfetti(meta.color || '#ffffff');
    }
  }
}

// ── ANIMATED COUNTER ──
function animateCount(el, newVal) {
  const oldVal = parseInt(el.textContent) || 0;
  if (oldVal === newVal) return;
  const duration = 800;
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

// ── NEEDS TEXT ──
function getNeedsText(seats) {
  if (seats >= MAJORITY) return '✅ Majority Achieved!';
  return `Needs ${MAJORITY - seats} more to win`;
}

// ── LEADING PARTY ──
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

// ── INSIGHTS ──
function getInsights(parties, leader) {
  const keys = Object.keys(parties);
  const counted = keys.reduce((s, k) => s + parties[k].seats, 0);
  const pct = Math.round((counted / TOTAL_SEATS) * 100);

  let meaning = `📊 ${pct}% of seats declared. Counting ongoing.`;
  if (pct === 0) meaning = '📊 Counting has just begun. No results yet.';
  if (pct > 80) meaning = `📊 ${pct}% declared — result is becoming very clear.`;

  const closest = leader
    ? `🏁 ${leader.short} is closest to majority with ${leader.seats} seats — needs ${Math.max(0, MAJORITY - leader.seats)} more.`
    : '🏁 No clear leader yet.';

  const sorted = [...keys].sort((a, b) => parties[b].seats - parties[a].seats);
  let trend = '📈 Trend: Too early to call.';
  if (sorted.length >= 2) {
    const first = parties[sorted[0]];
    const second = parties[sorted[1]];
    const gap = first.seats - second.seats;
    if (gap > 20) trend = `📈 ${first.short} has a commanding lead of ${gap} seats.`;
    else if (gap > 10) trend = `📈 ${first.short} pulling ahead by ${gap} seats.`;
    else if (gap <= 5 && counted > 20) trend = `⚡ Extremely tight race — only ${gap} seats between top two!`;
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
    const meta = PARTY_META[key] || { color: '#888', glow: 'rgba(136,136,136,0.2)', full: p.name, alliance: '' };
    const pct = Math.min((p.seats / MAJORITY) * 100, 100);
    const needsText = key === 'others' ? `${p.seats} seats counted` : getNeedsText(p.seats);
    const isLeader = p.seats === maxSeats && p.seats > 0;

    let card = document.getElementById(`card-${key}`);

    if (!card) {
      card = document.createElement('div');
      card.id = `card-${key}`;
      card.className = 'card' + (isLeader ? ' card-leading' : '');
      card.style.cssText = `--card-color:${meta.color};--card-glow:${meta.glow};border-top:2px solid ${meta.color};`;
      card.innerHTML = `
        <div class="card-glow-bg" style="background:${meta.glow}"></div>
        <div class="card-top-row">
          <div>
            <div class="card-party-tag" style="color:${meta.color}">${p.short}</div>
            <div class="card-party-name">${meta.full}</div>
          </div>
          <div class="card-alliance" style="border-color:${meta.color};color:${meta.color}">${meta.alliance}</div>
        </div>
        <div class="card-seats" id="seats-${key}" style="color:${meta.color};text-shadow:0 0 40px ${meta.glow}">0</div>
        <div class="card-label">SEATS LEADING + WON</div>
        <div class="card-bar-track">
          <div class="card-bar" id="bar-${key}" style="background:${meta.color};box-shadow:0 0 12px ${meta.color};width:0%"></div>
        </div>
        <div class="card-needs ${p.seats >= MAJORITY ? 'achieved' : ''}" id="needs-${key}">${needsText}</div>
      `;
      section.appendChild(card);
    }

    const seatsEl = document.getElementById(`seats-${key}`);
    const barEl = document.getElementById(`bar-${key}`);
    const needsEl = document.getElementById(`needs-${key}`);

    if (seatsEl) animateCount(seatsEl, p.seats);
    if (barEl) barEl.style.width = pct + '%';
    if (needsEl) {
      needsEl.textContent = needsText;
      needsEl.className = 'card-needs' + (p.seats >= MAJORITY ? ' achieved' : '');
    }

    if (prevSeats[key] !== undefined && prevSeats[key] !== p.seats) {
      card.style.boxShadow = `0 0 40px ${meta.glow}, 0 0 80px ${meta.glow}`;
      setTimeout(() => card.style.boxShadow = '', 1500);
    }

    card.className = 'card' + (isLeader ? ' card-leading' : '');
  });
}

// ── RENDER DONUT CHART ──
function renderDonut(parties) {
  const svg = document.getElementById('donut-svg');
  const legend = document.getElementById('donut-legend');
  if (!svg || !legend) return;

  const keys = Object.keys(parties);
  const total = keys.reduce((s, k) => s + parties[k].seats, 0);
  const cx = 70, cy = 70, r = 54, strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  // Remove old segments (keep the base circle)
  svg.querySelectorAll('.donut-seg').forEach(el => el.remove());

  legend.innerHTML = '';

  if (total === 0) {
    legend.innerHTML = `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px">No results yet</div>`;
    return;
  }

  let offset = 0;
  // rotate start from top (-90deg = -circumference/4 offset)
  const startOffset = circumference * 0.25;

  keys.forEach(key => {
    const p = parties[key];
    const meta = PARTY_META[key] || { color: '#888' };
    const fraction = p.seats / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'donut-seg');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', meta.color);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', startOffset - offset * circumference);
    circle.style.transition = 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)';
    circle.style.filter = `drop-shadow(0 0 6px ${meta.color})`;
    svg.appendChild(circle);

    offset += fraction;

    // Legend item
    const pct = total > 0 ? Math.round(fraction * 100) : 0;
    legend.innerHTML += `
      <div class="legend-item">
        <div class="legend-dot" style="background:${meta.color};box-shadow:0 0 6px ${meta.color}"></div>
        <div class="legend-name">${p.short}</div>
        <div class="legend-val" style="color:${meta.color}">${p.seats}</div>
      </div>
    `;
  });
}

// ── RENDER ALLIANCE PANEL ──
function renderAlliances(parties) {
  const container = document.getElementById('alliance-bars');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(ALLIANCES).forEach(([allianceName, alliance]) => {
    const totalSeats = alliance.keys.reduce((sum, k) => sum + (parties[k]?.seats || 0), 0);
    const pct = Math.min((totalSeats / TOTAL_SEATS) * 100, 100);
    const majorityPct = (MAJORITY / TOTAL_SEATS) * 100;
    const atMajority = totalSeats >= MAJORITY;

    container.innerHTML += `
      <div class="alliance-row">
        <div class="alliance-row-top">
          <div class="alliance-name" style="color:${alliance.color}">${allianceName}</div>
          <div class="alliance-seats" style="color:${alliance.color};text-shadow:0 0 20px ${alliance.glow}">${totalSeats}</div>
        </div>
        <div class="alliance-track">
          <div class="alliance-fill" style="width:${pct}%;background:linear-gradient(90deg,${alliance.color},${alliance.color}88);box-shadow:0 0 12px ${alliance.color}66;"></div>
          <div class="majority-line-marker"></div>
        </div>
        ${atMajority ? `<div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--win);letter-spacing:2px;margin-top:4px">✅ MAJORITY ACHIEVED</div>` : ''}
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
    const main = document.querySelector('main');
    const bottomGrid = document.querySelector('.bottom-grid');
    main.insertBefore(meter, bottomGrid);
  }

  const meterBars = document.getElementById('meter-bars');
  meterBars.innerHTML = '';

  const keys = Object.keys(parties).filter(k => k !== 'others');
  keys.sort((a, b) => parties[b].seats - parties[a].seats);

  keys.forEach(key => {
    const p = parties[key];
    const meta = PARTY_META[key] || { color: '#888', glow: 'rgba(136,136,136,0.2)' };
    const pct = Math.min((p.seats / MAJORITY) * 100, 100);

    meterBars.innerHTML += `
      <div class="meter-row">
        <div class="meter-party-name" style="color:${meta.color}">${p.short}</div>
        <div class="meter-track">
          <div class="meter-fill" style="width:${pct}%;background:linear-gradient(90deg,${meta.color},${meta.color}aa);box-shadow:0 0 15px ${meta.color}66"></div>
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

  const keys = Object.keys(parties);
  const items = keys.map(key => {
    const p = parties[key];
    const meta = PARTY_META[key] || { color: '#888' };
    return `<span class="ticker-item"><span style="color:${meta.color};font-weight:700">${p.short}</span>&nbsp;<span style="color:#fff">${p.seats}</span> seats</span><span class="ticker-sep">·</span>`;
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
    const meta = PARTY_META[leader.key] || {};
    const leadEl = document.getElementById('leading-party');
    leadEl.textContent = leader.short;
    leadEl.style.color = meta.color || 'var(--win)';
    leadEl.style.textShadow = `0 0 40px ${meta.glow || 'transparent'}`;
    document.getElementById('leading-sub').textContent = `${leader.seats} seats · ${meta.full || ''}`;
  }

  const insights = getInsights(parties, leader);
  document.getElementById('insight-meaning').textContent = insights.meaning;
  document.getElementById('insight-closest').textContent = insights.closest;
  document.getElementById('insight-trend').textContent = insights.trend;
  document.getElementById('last-updated').textContent = '🕐 ' + new Date().toLocaleTimeString();

  prevSeats = {};
  Object.keys(parties).forEach(k => prevSeats[k] = parties[k].seats);

  checkVictory(parties);
}

// ── FETCH ──
async function fetchData() {
  try {
    const res = await fetch(`https://opensheet.elk.sh/1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0/Sheet1`);
    const rows = await res.json();
    const data = { last_updated: new Date().toLocaleTimeString(), parties: {} };
    rows.forEach(row => {
      const key = row.party.toLowerCase();
      data.parties[key] = {
        name: row.party,
        short: row.party,
        seats: parseInt(row.seats) || 0,
        won: parseInt(row.won) || 0
      };
    });
    render(data);
  } catch (err) {
    console.error('Fetch failed:', err);
    document.getElementById('last-updated').textContent = '⚠️ Update failed';

    // Fallback demo data so the UI still renders
    render({
      last_updated: new Date().toLocaleTimeString(),
      parties: {
        tvk:    { name: 'TVK',    short: 'TVK',    seats: 0, won: 0 },
        dmk:    { name: 'DMK',    short: 'DMK',    seats: 0, won: 0 },
        admk:   { name: 'ADMK',   short: 'ADMK',   seats: 0, won: 0 },
        others: { name: 'Others', short: 'Others', seats: 0, won: 0 },
      }
    });
  }
}

fetchData();
setInterval(fetchData, REFRESH_INTERVAL);