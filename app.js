// ── CONFIG ──
const MAJORITY = 118;
const TOTAL_SEATS = 234;
const REFRESH_INTERVAL = 12000; // 12 seconds

// ── CONFETTI ──
function launchConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#f97316', '#3b82f6', '#22c55e', '#facc15', '#8b5cf6', '#ef4444'];
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

// ── VICTORY OVERLAY ──
let victoryShown = false;
function showVictory(partyName, seats) {
  if (victoryShown) return;
  victoryShown = true;
  document.getElementById('victory-party-name').textContent = partyName;
  document.getElementById('victory-seat-count').textContent = seats;
  document.getElementById('victory-overlay').classList.remove('hidden');
  launchConfetti();
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
    if (key === 'others') continue;
    if (parties[key].seats > max) {
      max = parties[key].seats;
      leader = parties[key];
    }
  }
  return leader;
}

// ── INSIGHT TEXT ──
function getInsights(parties, leader) {
  const tvk = parties.tvk.seats;
  const dmk = parties.dmk.seats;
  const counted = tvk + dmk + parties.others.seats;
  const pct = Math.round((counted / TOTAL_SEATS) * 100);

  let meaning = `📊 ${pct}% of seats declared. Counting is ongoing.`;
  if (pct === 0) meaning = '📊 Counting has just begun. No results yet.';
  if (pct > 80) meaning = `📊 ${pct}% declared. Result becoming clear.`;

  const closest = leader
    ? `🏁 ${leader.short} is closest to majority with ${leader.seats} seats.`
    : '🏁 No clear leader yet.';

  let trend = '📈 Trend: Too early to call.';
  if (tvk > dmk + 10) trend = '📈 Trend: TVK pulling ahead strongly.';
  else if (dmk > tvk + 10) trend = '📈 Trend: DMK pulling ahead strongly.';
  else if (Math.abs(tvk - dmk) <= 5 && counted > 20) trend = '📈 Trend: Very tight race between TVK & DMK.';

  return { meaning, closest, trend };
}

// ── RENDER ──
function render(data) {
  const { parties } = data;
  const tvk = parties.tvk.seats;
  const dmk = parties.dmk.seats;
  const others = parties.others.seats;

  // Seat numbers
  document.getElementById('tvk-seats').textContent = tvk;
  document.getElementById('dmk-seats').textContent = dmk;
  document.getElementById('others-seats').textContent = others;

  // Progress bars
  document.getElementById('tvk-bar').style.width = Math.min((tvk / MAJORITY) * 100, 100) + '%';
  document.getElementById('dmk-bar').style.width = Math.min((dmk / MAJORITY) * 100, 100) + '%';
  document.getElementById('others-bar').style.width = Math.min((others / TOTAL_SEATS) * 100, 100) + '%';

  // Needs text
  const tvkNeeds = document.getElementById('tvk-needs');
  const dmkNeeds = document.getElementById('dmk-needs');
  tvkNeeds.textContent = getNeedsText(tvk);
  dmkNeeds.textContent = getNeedsText(dmk);
  tvkNeeds.className = 'card-needs' + (tvk >= MAJORITY ? ' achieved' : '');
  dmkNeeds.className = 'card-needs' + (dmk >= MAJORITY ? ' achieved' : '');

  // Leading party
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

  // Last updated
  document.getElementById('last-updated').textContent =
    '🕐 ' + (data.last_updated || new Date().toLocaleTimeString());

  // Victory check
  if (tvk >= MAJORITY) showVictory(parties.tvk.short, tvk);
  if (dmk >= MAJORITY) showVictory(parties.dmk.short, dmk);
}

// ── FETCH & LOOP ──
async function fetchData() {
  try {
    const res = await fetch('data.json?t=' + Date.now());
    const data = await res.json();
    render(data);
  } catch (err) {
    console.error('Failed to load data.json:', err);
    document.getElementById('last-updated').textContent = '⚠️ Update failed';
  }
}

// Start
fetchData();
setInterval(fetchData, REFRESH_INTERVAL);