// ── CONFIG ──
const MAJORITY = 118;
const TOTAL_SEATS = 234;
const REFRESH_INTERVAL = 12000;

const SHEET_ID = '2PACX-1vSa1i5BKO3-c2Lm3Gxcc9XLo7qeMhEFKzZtlnXt84Hb03W8wu7f91LvsKs7brLBK07K9t6YBwh2AZL5';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&single=true&output=csv`;
// ── PARSE CSV ──
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => obj[h] = values[idx]);
    rows.push(obj);
  }
  return rows;
}

// ── BUILD DATA OBJECT FROM SHEET ──
function buildData(rows) {
  const data = { parties: {}, last_updated: new Date().toLocaleTimeString() };
  rows.forEach(row => {
    const key = row.party.toLowerCase();
    data.parties[key] = {
      name: row.party,
      short: row.party,
      seats: parseInt(row.seats) || 0,
      won: parseInt(row.won) || 0
    };
  });
  return data;
}

// ── CONFETTI ──
function launchConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#f97316','#3b82f6','#22c55e','#facc15','#8b5cf6','#ef4444'];
  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (Math.random() * 3 + 2) + 's';
    piece.style.animationDelay = (Math.random() * 3) + 's';
    piece.style.width = (Math.random() * 8 + 5) + 'px';
    piece.style.height = (Math.random() * 8 + 5) + 'px';
    container.appendChild(piece);
  }
}

// ── VICTORY ──
let victoryShown = false;
function checkVictory(parties) {
  for (const key in parties) {
    if (key === 'others') continue;
    const p = parties[key];
    if (p.seats >= MAJORITY && !victoryShown) {
      victoryShown = true;
      document.getElementById('victory-party-name').textContent = p.short;
      document.getElementById('victory-seat-count').textContent = p.seats;
      document.getElementById('victory-overlay').classList.remove('hidden');
      launchConfetti();
    }
  }
}

// ── NEEDS TEXT ──
function getNeedsText(seats) {
  if (seats >= MAJORITY) return '✅ Majority Achieved!';
  return `Needs ${MAJORITY - seats} more to win`;
}

// ── LEADING PARTY ──
function getLeader(parties) {
  let leader = null;
  let max = -1;
  for (const key in parties) {
    if (parties[key].seats > max) {
      max = parties[key].seats;
      leader = parties[key];
    }
  }
  return leader;
}

// ── INSIGHTS ──
function getInsights(parties, leader) {
  const keys = Object.keys(parties);
  const counted = keys.reduce((sum, k) => sum + parties[k].seats, 0);
  const pct = Math.round((counted / TOTAL_SEATS) * 100);

  let meaning = `📊 ${pct}% of seats declared. Counting ongoing.`;
  if (pct === 0) meaning = '📊 Counting has just begun. No results yet.';
  if (pct > 80) meaning = `📊 ${pct}% declared. Result becoming clear.`;

  const closest = leader
    ? `🏁 ${leader.short} is closest to majority with ${leader.seats} seats.`
    : '🏁 No clear leader yet.';

  // Find top 2
  const sorted = keys.sort((a, b) => parties[b].seats - parties[a].seats);
  let trend = '📈 Trend: Too early to call.';
  if (sorted.length >= 2) {
    const first = parties[sorted[0]];
    const second = parties[sorted[1]];
    if (first.seats - second.seats > 10) {
      trend = `📈 Trend: ${first.short} pulling ahead strongly.`;
    } else if (Math.abs(first.seats - second.seats) <= 5 && counted > 20) {
      trend = `📈 Trend: Very tight race between ${first.short} & ${second.short}.`;
    }
  }

  return { meaning, closest, trend };
}

// ── RENDER ──
function render(data) {
  const { parties } = data;

  // Clear old cards
  const cardsSection = document.querySelector('.party-cards');
  cardsSection.innerHTML = '';

  const colorMap = {
    tvk: '#f97316',
    dmk: '#3b82f6',
    admk: '#ec4899',
    others: '#8b5cf6'
  };

  const defaultColors = ['#22c55e','#facc15','#06b6d4','#a855f7'];
  let colorIdx = 0;

  Object.keys(parties).forEach(key => {
    const p = parties[key];
    const color = colorMap[key] || defaultColors[colorIdx++ % defaultColors.length];
    const pct = Math.min((p.seats / MAJORITY) * 100, 100);
    const needsText = key === 'others'
      ? `${p.seats} seats total`
      : getNeedsText(p.seats);

    cardsSection.innerHTML += `
      <div class="card" style="--accent:${color}">
        <div class="card-party-tag" style="color:${color}">${p.short}</div>
        <div class="card-party-name">${p.name}</div>
        <div class="card-seats" style="color:${color}">${p.seats}</div>
        <div class="card-label">SEATS LEADING + WON</div>
        <div class="card-bar-track">
          <div class="card-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="card-needs ${p.seats >= MAJORITY ? 'achieved' : ''}">${needsText}</div>
      </div>`;
  });

  // Add top border accent via CSS var
  document.querySelectorAll('.card').forEach(card => {
    card.style.setProperty('--accent', card.style.getPropertyValue('--accent'));
    const tag = card.querySelector('.card-party-tag');
    if (tag) {
      card.style.borderTop = `3px solid ${tag.style.color}`;
    }
  });

  // Leading
  const leader = getLeader(parties);
  if (leader) {
    document.getElementById('leading-party').textContent = leader.short;
    document.getElementById('leading-sub').textContent =
      `${leader.name} · ${leader.seats} seats`;
  }

  // Insights
  const insights = getInsights(parties, leader);
  document.getElementById('insight-meaning').textContent = insights.meaning;
  document.getElementById('insight-closest').textContent = insights.closest;
  document.getElementById('insight-trend').textContent = insights.trend;

  // Timestamp
  document.getElementById('last-updated').textContent = '🕐 ' + data.last_updated;

  // Victory
  checkVictory(parties);
}

async function fetchData() {
  try {
    const jsonURL = `https://opensheet.elk.sh/1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0/Sheet1`;
    const res = await fetch(jsonURL);
    const rows = await res.json();
    const data = {
      last_updated: new Date().toLocaleTimeString(),
      parties: {}
    };
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
  }
}
// ── START ──
fetchData();
setInterval(fetchData, REFRESH_INTERVAL);