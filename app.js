// ── CONFIG ──
const MAJORITY = 118;
const TOTAL_SEATS = 234;
const REFRESH_INTERVAL = 12000;
const REAL_SHEET_ID = '1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0';

const PARTY_META = {
  tvk:    { color: '#ff6b1a', glow: 'rgba(255,107,26,0.3)',  full: 'Tamil Vettri Kazhagam',       alliance: 'TVK' },
  dmk:    { color: '#3b9eff', glow: 'rgba(59,158,255,0.3)',  full: 'Dravida Munnetra Kazhagam',   alliance: 'DMK+' },
  admk:   { color: '#ff3d8a', glow: 'rgba(255,61,138,0.3)',  full: 'All India Anna DMK',          alliance: 'ADMK+' },
  others: { color: '#a855f7', glow: 'rgba(168,85,247,0.3)',  full: 'Others & Independents',       alliance: 'Others' },
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
      document.getElementById('victory-party-name').textContent = p.short;
      document.getElementById('victory-party-name').style.color = meta.color || '#fff';
      document.getElementById('victory-party-name').style.textShadow = `0 0 80px ${meta.glow}`;
      document.getElementById('victory-seat-count').textContent = p.seats;
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

  keys.forEach(key => {
    const p = parties[key];
    const meta = PARTY_META[key] || { color: '#888', glow: 'rgba(136,136,136,0.2)', full: p.name, alliance: '' };
    const pct = Math.min((p.seats / MAJORITY) * 100, 100);
    const needsText = key === 'others' ? `${p.seats} seats` : getNeedsText(p.seats);
    const isLeader = p.seats === Math.max(...keys.map(k => parties[k].seats));

    let card = document.getElementById(`card-${key}`);

    if (!card) {
      // Create card
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

    // Update existing card
    const seatsEl = document.getElementById(`seats-${key}`);
    const barEl = document.getElementById(`bar-${key}`);
    const needsEl = document.getElementById(`needs-${key}`);

    if (seatsEl) animateCount(seatsEl, p.seats);
    if (barEl) barEl.style.width = pct + '%';
    if (needsEl) {
      needsEl.textContent = needsText;
      needsEl.className = 'card-needs' + (p.seats >= MAJORITY ? ' achieved' : '');
    }

    // Pulse card if updated
    if (prevSeats[key] !== undefined && prevSeats[key] !== p.seats) {
      card.style.boxShadow = `0 0 40px ${meta.glow}, 0 0 80px ${meta.glow}`;
      setTimeout(() => card.style.boxShadow = '', 1500);
    }

    card.className = 'card' + (isLeader ? ' card-leading' : '');
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
      <div class="meter-label">
        <span>RACE TO MAJORITY</span>
        <span class="meter-sub">First to 118 wins</span>
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
          <div class="meter-mark"></div>
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
    return `<span class="ticker-item"><span style="color:${meta.color};font-weight:700">${p.short}</span> <span style="color:#fff">${p.seats}</span> seats</span><span class="ticker-sep">·</span>`;
  }).join('');

  document.getElementById('ticker-inner').innerHTML = items + items;
}

// ── MAIN RENDER ──
function render(data) {
  const { parties } = data;

  renderCards(parties);
  renderMajorityMeter(parties);
  renderTicker(parties);

  const leader = getLeader(parties);
  if (leader) {
    const meta = PARTY_META[leader.key] || {};
    document.getElementById('leading-party').textContent = leader.short;
    document.getElementById('leading-party').style.color = meta.color || 'var(--win)';
    document.getElementById('leading-party').style.textShadow = `0 0 40px ${meta.glow || 'transparent'}`;
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
        name: row.party, short: row.party,
        seats: parseInt(row.seats) || 0,
        won: parseInt(row.won) || 0
      };
    });
    render(data);
  } catch (err) {
    console.error('Fetch failed:', err);
    document.getElementById('last-updated').textContent = '⚠️ Update failed';
  }
}

fetchData();
setInterval(fetchData, REFRESH_INTERVAL);