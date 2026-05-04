/* TN26 · 234 Seats · Majority 118 · Google Sheets Live */

const SHEET_ID    = '1170HdchakPRIZO4URqot2jfAhtkorl1tP9-Tpq80Ia0';
const SHEET_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
const MAJORITY    = 118;
const TOTAL_SEATS = 234;
const REFRESH_MS  = 12000;
let firstRender = true, victoryShown = false;

const PARTY_META = {
  tvk:    { color:'#c8f53f', bar:'#c8f53f', full:'Tamilaga Vettri Kazhagam' },
  dmk:    { color:'#9fa8da', bar:'#5c6bc0', full:'Dravida Munnetra Kazhagam Alliance' },
  admk:   { color:'#80c883', bar:'#3dab48', full:'All India ADMK Alliance' },
  ntk:    { color:'#ffb380', bar:'#f06c2a', full:'Naam Tamilar Katchi' },
  others: { color:'#8892a4', bar:'#6e7485', full:'Others & Independents' },
};

const ORDER = ['tvk','dmk','admk','ntk','others'];

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.split(',').map(c => c.replace(/^"|"$/g,'').trim()));
  if (lines.length < 2) return null;
  const headers = lines[0].map(h => h.toLowerCase());
  const parties = {};
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]; if (!row[0]) continue;
    const obj = {}; headers.forEach((h,idx) => obj[h] = row[idx] || '');
    const key = obj['party']?.toLowerCase(); if (!key) continue;
    parties[key] = { short: obj['short'] || key.toUpperCase(), seats: parseInt(obj['seats'])||0, won: parseInt(obj['won'])||0, leading: parseInt(obj['leading'])||0 };
  }
  ORDER.forEach(k => { if (!parties[k]) parties[k] = { short:k.toUpperCase(), seats:0, won:0, leading:0 }; });
  return parties;
}
async function fetchFromSheets() {
  const res = await fetch('data.json?_=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  const raw = json.results;
  const parties = {};
  ORDER.forEach(k => {
    const d = raw[k] || {};
    const won     = d.won     || 0;
    const leading = d.leading || 0;
    const seats   = d.seats   || (won + leading);
    parties[k] = {
      short: { tvk:'TVK', dmk:'DMK+', admk:'ADMK', ntk:'NTK', others:'OTH' }[k],
      seats:   seats,
      won:     won,
      leading: leading
    };
  });
  return parties;
}
function animateCount(el, newVal) {
  if (!el) return;
  const old = parseInt(el.textContent?.replace(/[^0-9]/g,'')) || 0;
  if (old === newVal) return;
  const dur = 750, start = performance.now();
  const tick = now => {
    const t = Math.min((now-start)/dur,1), e = 1-Math.pow(1-t,3);
    el.textContent = Math.round(old+(newVal-old)*e);
    t < 1 ? requestAnimationFrame(tick) : (el.textContent = newVal);
  };
  requestAnimationFrame(tick);
  el.classList.remove('seat-updated'); void el.offsetWidth; el.classList.add('seat-updated');
}

function getLeader(parties) {
  let leader = null, max = -1;
  for (const k in parties) if (parties[k].seats > max) { max = parties[k].seats; leader = {...parties[k], key:k}; }
  return leader;
}

function launchConfetti(color) {
  const c = document.getElementById('confetti'); c.innerHTML = '';
  const cols = [color,'#fff','#ffd700','#c8f53f','#7986cb'];
  for (let i = 0; i < 140; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    p.style.cssText = [`left:${Math.random()*100}vw`,`background:${cols[~~(Math.random()*cols.length)]}`,`animation-duration:${Math.random()*3+2}s`,`animation-delay:${Math.random()*3}s`,`width:${Math.random()*10+4}px`,`height:${Math.random()*10+4}px`,`border-radius:${Math.random()>.5?'50%':'2px'}`].join(';');
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

function renderStats(parties) {
  const total = Object.values(parties).reduce((s,p) => s+p.seats, 0);
  animateCount(document.getElementById('h-counting'), total);
  animateCount(document.getElementById('h-declared'), total);
  const pctEl = document.getElementById('h-pct');
  if (pctEl) pctEl.textContent = Math.round(total/TOTAL_SEATS*100) + '%';
}

function renderCards(parties) {
  const section = document.getElementById('party-cards'); if (!section) return;
  const leader = getLeader(parties);
  ORDER.forEach(key => {
    const p = parties[key], meta = PARTY_META[key] || {color:'#888',bar:'#6e7485',full:p.short};
    const isLd = leader?.key === key && p.seats > 0;
    const pct = Math.min(p.seats/MAJORITY*100,100);
    let sc = 'status-trailing', st = 'Trailing';
    if (p.seats >= MAJORITY) { sc='status-won'; st='✓ Majority'; }
    else if (isLd)           { sc='status-leading'; st='Leading'; }
    else if (p.seats > 0)    { sc='status-behind'; st='Behind'; }
    let card = document.getElementById(`card-${key}`);
    if (!card) {
      card = document.createElement('div'); card.id = `card-${key}`;
      card.className = 'card' + (isLd?' card-leading':'');
      card.style.setProperty('--c', meta.color); card.style.setProperty('--c-bar', meta.bar);
      card.innerHTML = `<div class="card-tag">${p.short}</div><div class="card-fullname">${meta.full}</div><div class="card-seats" id="cs-${key}">${p.seats}</div><div class="card-denom">/ 234 seats</div><div class="card-track"><div class="card-bar" id="cb-${key}" style="width:${pct}%;background:${meta.bar}"></div></div><div class="card-status ${sc}" id="cst-${key}">${st}</div>`;
      section.appendChild(card);
    } else {
      animateCount(document.getElementById(`cs-${key}`), p.seats);
      const bar = document.getElementById(`cb-${key}`); if (bar) bar.style.width = pct+'%';
      const stEl = document.getElementById(`cst-${key}`); if (stEl) { stEl.className=`card-status ${sc}`; stEl.textContent=st; }
      card.classList.toggle('card-leading', isLd);
    }
  });
}

function renderRace(parties) {
  const el = document.getElementById('race-bars'); if (!el) return;
  el.innerHTML = ['tvk','dmk','admk','ntk'].map(key => {
    const p = parties[key]; if (!p) return '';
    const meta = PARTY_META[key], pct = Math.min(p.seats/TOTAL_SEATS*100,100);
    return `<div class="race-row"><div class="race-name" style="color:${meta.color}">${p.short}</div><div class="race-track"><div class="race-fill" id="rf-${key}" style="width:${pct}%;background:${meta.bar}"></div><div class="race-maj-line"></div></div><div class="race-count" style="color:${meta.color}" id="rc-${key}">${p.seats}</div></div>`;
  }).join('');
}

function updateRace(parties) {
  ['tvk','dmk','admk','ntk'].forEach(key => {
    const p = parties[key]; if (!p) return;
    const fill = document.getElementById(`rf-${key}`), count = document.getElementById(`rc-${key}`);
    if (fill) fill.style.width = Math.min(p.seats/TOTAL_SEATS*100,100)+'%';
    if (count) animateCount(count, p.seats);
  });
}

function renderPartyTable(parties) {
  const el = document.getElementById('party-table'); if (!el) return;
  el.innerHTML = ORDER.map(key => {
    const p = parties[key]; if (!p) return '';
    const meta = PARTY_META[key];
    return `<div class="party-table-row"><div class="pt-name" style="color:${meta.color}">${p.short}</div><div class="pt-num">${p.won}</div><div class="pt-num">${p.leading}</div><div class="pt-total" style="color:${meta.color}">${p.seats}</div></div>`;
  }).join('');
}

function renderDonut(parties) {
  const canvas = document.getElementById('donut-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d'), cx=75, cy=75, r=65, inner=44, gap=2.5;
  const total = Object.values(parties).reduce((s,p)=>s+p.seats,0);
  ctx.clearRect(0,0,150,150);
  animateCount(document.getElementById('donut-num'), total);
  if (total===0) { ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.arc(cx,cy,inner,0,Math.PI*2,true); ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill(); return; }
  let angle = -Math.PI/2;
  ORDER.forEach(key => {
    const p = parties[key]; if (!p||p.seats===0) return;
    const meta = PARTY_META[key], arc = (p.seats/total)*Math.PI*2;
    ctx.beginPath(); ctx.arc(cx,cy,r,angle+gap/r,angle+arc-gap/r); ctx.arc(cx,cy,inner,angle+arc-gap/r,angle+gap/r,true); ctx.closePath();
    ctx.fillStyle = meta.bar; ctx.fill(); angle += arc;
  });
  const legend = document.getElementById('donut-legend');
  if (legend) legend.innerHTML = ORDER.map(key => {
    const p = parties[key]; if (!p||p.seats===0) return '';
    const meta = PARTY_META[key], pct = Math.round(p.seats/total*100);
    return `<div class="legend-row"><span class="legend-dot" style="background:${meta.bar}"></span><span class="legend-name">${p.short}</span><span class="legend-pct" style="color:${meta.color}">${pct}%</span></div>`;
  }).join('');
}

function renderInsights(parties) {
  const el = document.getElementById('insight-lines'); if (!el) return;
  const total = Object.values(parties).reduce((s,p)=>s+p.seats,0);
  const leader = getLeader(parties), pct = Math.round(total/TOTAL_SEATS*100);
  const lines = [];
  lines.push(`📊 ${pct}% of 234 seats declared — ${pct>=90?'result nearly certain.':pct>=50?'results taking shape.':'counting underway.'}`);
  if (leader && leader.seats > 0) {
    const needed = MAJORITY - leader.seats;
    lines.push(needed>0 ? `🎯 ${leader.short} needs ${needed} more seat${needed===1?'':'s'} for majority (118).` : `✅ ${leader.short} has crossed the majority mark of 118!`);
  } else { lines.push('🏁 No clear leader yet. All eyes on the count.'); }
  const sorted = Object.entries(parties).filter(([k])=>k!=='others').sort((a,b)=>b[1].seats-a[1].seats);
  if (sorted.length>=2 && sorted[0][1].seats>0) {
    const gap2 = sorted[0][1].seats - sorted[1][1].seats;
    if (gap2>0) lines.push(`📈 ${sorted[0][1].short} leads ${sorted[1][1].short} by ${gap2} seat${gap2===1?'':'s'}.`);
  }
  el.innerHTML = lines.map(l=>`<div class="insight-line"><span class="i-icon">${l.substring(0,2)}</span><span>${l.substring(2).trim()}</span></div>`).join('');
}

function updateTicker(parties) {
  const cls = {tvk:'t-tvk',dmk:'t-dmk',admk:'t-admk',ntk:'t-ntk',others:'t-oth'};
  const items = ORDER.map(k=>`<span class="t-item"><span class="${cls[k]}">${parties[k].short}</span> · ${parties[k].seats}</span>`);
  const sep = '<span class="t-sep">—</span>';
  const tc = document.getElementById('ticker-content');
  if (tc) tc.innerHTML = items.join('')+sep+items.join('');
}

function now() { return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}); }

function updateQuickview(parties) {
  const map = {dmk:'qv-dmk',admk:'qv-admk',tvk:'qv-tvk',ntk:'qv-ntk',others:'qv-oth'};
  Object.entries(map).forEach(([key,id]) => { const el=document.getElementById(id); if (el&&parties[key]) animateCount(el,parties[key].seats); });
  const t = now();
  const upd=document.getElementById('update-time'); if(upd) upd.textContent='Updated '+t;
  const badge=document.getElementById('last-updated'); if(badge) badge.textContent=t;
  const qvt=document.getElementById('qv-time'); if(qvt) qvt.textContent=t+' IST';
}

function renderAll(parties) {
  renderStats(parties); renderCards(parties);
  if (firstRender) { renderRace(parties); firstRender=false; } else { updateRace(parties); }
  renderPartyTable(parties); renderDonut(parties);
  renderInsights(parties); updateTicker(parties); updateQuickview(parties); checkVictory(parties);
}

function useMockData() {
  renderAll({tvk:{short:'TVK',seats:0,won:0,leading:0},dmk:{short:'DMK+',seats:0,won:0,leading:0},admk:{short:'ADMK',seats:0,won:0,leading:0},ntk:{short:'NTK',seats:0,won:0,leading:0},others:{short:'OTH',seats:0,won:0,leading:0}});
}

async function fetchData() {
  try { renderAll(await fetchFromSheets()); }
  catch(err) { console.warn('[TN26] Sheets fetch failed:', err.message); useMockData(); }
}

setInterval(()=>{ const el=document.getElementById('qv-time'); if(el) el.textContent=now()+' IST'; },1000);
fetchData();
setInterval(fetchData, REFRESH_MS);