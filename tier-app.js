// ===== 定数 =====
const TIER_ORDER  = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D'];
const TIER_THRESHOLDS = [0.05, 0.15, 0.30, 0.50, 0.70, 0.85, 1.00];
const TIER_COLORS = {
  SSS: { bg: '#f59e0b', text: '#1f2937' },
  SS:  { bg: '#f97316', text: '#ffffff' },
  S:   { bg: '#eab308', text: '#1f2937' },
  A:   { bg: '#22c55e', text: '#ffffff' },
  B:   { bg: '#3b82f6', text: '#ffffff' },
  C:   { bg: '#9ca3af', text: '#ffffff' },
  D:   { bg: '#4b5563', text: '#ffffff' },
};
const ARROW_COLORS = { '↑': '#22c55e', '→': '#9ca3af', '↓': '#ef4444' };
const MAP_COLOR_PALETTE = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16'];
const MAP_COLOR_MAP = {};
MAPS.forEach((m, i) => { MAP_COLOR_MAP[m] = MAP_COLOR_PALETTE[i]; });
function mapColor(name, fallbackIndex) {
  return MAP_COLOR_MAP[name] || MAP_COLOR_PALETTE[fallbackIndex % MAP_COLOR_PALETTE.length];
}

// ===== アイコンパス =====
function getCharIconPath(charName) {
  // 相手キャラのアイコン（サバイバー視点→相手はハンター、ハンター視点→相手はサバイバー）
  return buildIconPath(charName, currentPerspective === 'survivor' ? 'hunter' : 'survivor');
}
function getMyCharIconPath(charName) {
  // 自分のキャラのアイコン（サバイバー視点→自分はサバイバー、ハンター視点→自分はハンター）
  return buildIconPath(charName, currentPerspective === 'survivor' ? 'survivor' : 'hunter');
}

// ===== 状態 =====
let matches           = [];
let currentPerspective = 'survivor'; // survivor: 相手ハンターTier / hunter: 相手サバイバーTier
let rankFilter        = [];           // 選択中の段位（空 = 全て）
let currentDetailChar = null;
let detailPage        = 1;
let detailResultFilter = 'all'; // 'all' | 'win' | 'loss' | 'draw'
let mapChart          = null;
let coPickChart       = null;
let banPickChart      = null;
let mapSortOrder      = 'count';
let mapSortDir        = 'desc';
let myCharSortOrder   = 'count';
let myCharSortDir     = 'desc';
let lastUpdated       = null;

// キャッシュ（再計算回避用）
let _cachedDetailStat = null;   // 詳細ページ用: 現在表示中キャラの stat オブジェクト

// イベントリスナー管理
let _rankFilterCloseHandler = null;

// ===== 接続モジュール =====
const _conn = createConnectModule({
  onConnected(m, lu) { matches = m; lastUpdated = lu; showTierPage(); },
  onNoData()         { showConnectPage(); }
});

function init() { _conn.startup(); }

// HTML onclick から呼ばれるグローバル関数
function connectWithSyncCode()      { _conn.connectWithSyncCode(); }
function connectWithJSON()           { _conn.connectWithJSON(); }
function connectWithJSONFile(event)  { _conn.connectWithJSONFile(event); }
function showDisconnectMenu() {
  if (_conn.disconnect()) {
    matches = []; lastUpdated = null; showConnectPage();
  }
}

// ===== 画面切替 =====
function showConnectPage() {
  document.getElementById('connect-page').classList.remove('hidden');
  document.getElementById('tier-page').classList.add('hidden');
  document.getElementById('detail-page').classList.add('hidden');
  window.scrollTo(0, 0);
}

function showTierPage() {
  document.getElementById('connect-page').classList.add('hidden');
  document.getElementById('tier-page').classList.remove('hidden');
  document.getElementById('detail-page').classList.add('hidden');
  window.scrollTo(0, 0);
  renderTierPage();
}

function showDetailPage(charName) {
  document.getElementById('connect-page').classList.add('hidden');
  document.getElementById('tier-page').classList.add('hidden');
  document.getElementById('detail-page').classList.remove('hidden');
  currentDetailChar  = charName;
  detailPage         = 1;
  detailResultFilter = 'all';
  mapSortOrder       = 'count';
  mapSortDir         = 'desc';
  myCharSortOrder    = 'count';
  myCharSortDir      = 'desc';
  if (coPickChart) { coPickChart.destroy(); coPickChart = null; }
  if (banPickChart) { banPickChart.destroy(); banPickChart = null; }
  window.scrollTo(0, 0);
  renderDetailPage(charName);
}

// ===== ハッシュルーティング =====
function handleHashChange() {
  const hash = decodeURIComponent(window.location.hash);
  if (matches.length === 0) { showConnectPage(); return; }
  if (hash.startsWith('#/detail/')) {
    showDetailPage(hash.replace('#/detail/', ''));
  } else {
    showTierPage();
  }
}

function navigate(path) {
  window.location.hash = path;
}

function navigateToDetail(charName) {
  navigate('/detail/' + encodeURIComponent(charName));
}

function goBack() {
  navigate('/');
}

// ===== 視点切替 =====
function switchPerspective(p) {
  currentPerspective = p;
  document.getElementById('btn-survivor').classList.toggle('active', p === 'survivor');
  document.getElementById('btn-hunter').classList.toggle('active', p === 'hunter');
  rankFilter = [];
  detailResultFilter = 'all';
  if (window.location.hash.startsWith('#/detail/')) {
    navigate('/');
  } else {
    renderTierPage();
  }
}

// ===== フィルター =====
function getFilteredMatches() {
  let list = matches.filter(m => m.perspective === currentPerspective);
  if (rankFilter.length > 0) list = list.filter(m => rankFilter.includes(m.rank));
  return list;
}

function toggleFilterDrawer() {
  const drawer = document.getElementById('filter-drawer');
  const btn    = document.getElementById('filter-toggle-btn');
  const open   = drawer.classList.contains('hidden');
  drawer.classList.toggle('hidden', !open);
  btn.classList.toggle('active', open);
  if (open) buildRankFilterUI();
}

function buildRankFilterUI() {
  const used = new Set();
  matches.filter(m => m.perspective === currentPerspective).forEach(m => { if (m.rank) used.add(m.rank); });
  const ranks = RANKS.filter(r => used.has(r));

  const wrap = document.getElementById('rank-filter-wrap');
  if (ranks.length === 0) { wrap.innerHTML = '<span style="font-size:13px;color:#9ca3af;">段位データがありません</span>'; return; }

  const filterId = 'tier-rank-filter';
  wrap.innerHTML = '';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'multi-rank-trigger';
  trigger.setAttribute('data-filter', filterId);
  trigger.textContent = rankFilter.length === 0 ? '全段位' : rankFilter.join('・');
  trigger.onclick = () => {
    const dd = document.getElementById(filterId + '-dd');
    const isOpen = dd.classList.contains('open');
    dd.classList.toggle('open', !isOpen);
    trigger.classList.toggle('open', !isOpen);
  };

  const dd = document.createElement('div');
  dd.className = 'multi-rank-dropdown';
  dd.id = filterId + '-dd';

  // 全て
  const allItem = document.createElement('div');
  allItem.className = 'multi-rank-item all-item';
  allItem.innerHTML = `<input type="checkbox" id="${filterId}-all" ${rankFilter.length === 0 ? 'checked' : ''}><label for="${filterId}-all">全段位</label>`;
  allItem.querySelector('input').onchange = (e) => {
    if (e.target.checked) {
      rankFilter = [];
      dd.querySelectorAll('input[data-rank]').forEach(cb => cb.checked = false);
    }
    syncRankFilterUI(trigger, filterId);
    renderTierPage();
  };
  dd.appendChild(allItem);

  ranks.forEach(rank => {
    const item = document.createElement('div');
    item.className = 'multi-rank-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = `${filterId}-${rank}`;
    cb.setAttribute('data-rank', rank);
    cb.checked = rankFilter.includes(rank);
    cb.onchange = () => {
      rankFilter = Array.from(dd.querySelectorAll('input[data-rank]:checked')).map(el => el.getAttribute('data-rank'));
      allItem.querySelector('input').checked = rankFilter.length === 0;
      syncRankFilterUI(trigger, filterId);
      renderTierPage();
    };
    const label = document.createElement('label');
    label.htmlFor = cb.id;
    label.textContent = rank;
    item.appendChild(cb);
    item.appendChild(label);
    dd.appendChild(item);
  });

  wrap.appendChild(trigger);
  wrap.appendChild(dd);

  // 前回のリスナーを確実に解除
  if (_rankFilterCloseHandler) {
    document.removeEventListener('click', _rankFilterCloseHandler);
  }
  // ドロワー外クリックで閉じる
  _rankFilterCloseHandler = (e) => {
    if (!wrap.contains(e.target)) {
      dd.classList.remove('open');
      trigger.classList.remove('open');
    }
  };
  document.addEventListener('click', _rankFilterCloseHandler);
}

function syncRankFilterUI(trigger, filterId) {
  trigger.textContent = rankFilter.length === 0 ? '全段位' : rankFilter.join('・');
  const badge = document.getElementById('filter-badge');
  if (rankFilter.length > 0) {
    badge.textContent = rankFilter.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ===== Tier表ページ描画 =====
function renderTierPage() {
  const fm = getFilteredMatches();
  const totalSurvivor = matches.filter(m => m.perspective === 'survivor').length;
  const totalHunter   = matches.filter(m => m.perspective === 'hunter').length;
  const currentTotal  = fm.length;

  // stats ヘッダー
  const lu = lastUpdated
    ? new Date(lastUpdated).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '不明';
  document.getElementById('stats-header').innerHTML = `
    <span>サバイバー: <strong>${totalSurvivor}試合</strong></span>
    <span>ハンター: <strong>${totalHunter}試合</strong></span>
    <span class="last-updated">最終更新: ${lu}</span>
  `;

  // ロック判定
  const lock   = document.getElementById('lock-screen');
  const content = document.getElementById('tier-content');
  if (currentTotal < 50) {
    lock.classList.remove('hidden');
    content.classList.add('hidden');
    const pct = Math.min(currentTotal / 50 * 100, 100);
    document.getElementById('lock-progress-bar').style.width = pct + '%';
    document.getElementById('lock-progress-text').textContent = `${currentTotal} / 50試合`;
    document.getElementById('lock-message').textContent = `あと${50 - currentTotal}試合記録すると解放されます`;
    return;
  }
  lock.classList.add('hidden');
  content.classList.remove('hidden');

  const statsMap = computeCharStats(fm);
  const { tiered, notAppeared } = assignTiers(statsMap);

  // 週データを1回だけ算出し、急上昇・Tier表トレンドで共有
  const weeks = getLastTwoCompletedWeeks();
  const thisWeekMatches = filterByDateRange(fm, weeks.thisWeek.start, weeks.thisWeek.end);
  const lastWeekMatches = filterByDateRange(fm, weeks.lastWeek.start, weeks.lastWeek.end);
  const weekData = { thisWeekMatches, lastWeekMatches };

  renderRisingChar(weekData);
  renderPriorityCards(statsMap);
  renderTierTable(tiered, weekData);
  renderNoEncounter(notAppeared);
}

// ===== キャラ統計計算 =====
function computeCharStats(fm) {
  const chars   = currentPerspective === 'survivor' ? HUNTERS : SURVIVORS;
  const total   = fm.length;
  const statsMap = {};

  chars.forEach(char => {
    statsMap[char] = {
      char, appeared: 0, wins: 0, losses: 0, draws: 0,
      maps: {}, myChars: {}, coPick: {}, banPick: {}, banTotal: 0
    };
  });

  fm.forEach(m => {
    const iWin  = (currentPerspective === 'survivor' && m.result === 'survivor_win') ||
                  (currentPerspective === 'hunter'   && m.result === 'hunter_win');
    const isDraw = m.result === 'draw';

    if (currentPerspective === 'survivor') {
      const h = m.opponentHunter;
      if (h && statsMap[h]) {
        addMatchToStat(statsMap[h], m, iWin, isDraw);
        // BAN集計
        if (m.bannedCharacters && m.bannedCharacters.length > 0) {
          statsMap[h].banTotal++;
          m.bannedCharacters.forEach(bc => {
            if (bc) statsMap[h].banPick[bc] = (statsMap[h].banPick[bc] || 0) + 1;
          });
        }
      }
    } else {
      const survs = m.opponentSurvivors || [];
      survs.forEach(s => {
        if (s && statsMap[s]) {
          addMatchToStat(statsMap[s], m, iWin, isDraw);
          // 同時pick カウント
          survs.forEach(other => {
            if (other && other !== s) {
              statsMap[s].coPick[other] = (statsMap[s].coPick[other] || 0) + 1;
            }
          });
        }
      });
    }
  });

  // 派生値
  const opponentTotal = total;
  Object.values(statsMap).forEach(s => {
    s.pickRate  = opponentTotal > 0 ? s.appeared / opponentTotal * 100 : 0;
    const contested = s.wins + s.losses;
    if (contested > 0)      { s.winRate = s.wins / contested * 100; }
    else if (s.draws > 0)   { s.winRate = 50; } // 引き分けのみ → 中立
    else                    { s.winRate = null; }
    // 脅威度 = ピック率 × (100 - 自分の勝率)。よく出会い、かつ勝てていない相手ほど高スコア
    s.dangerScore = s.appeared > 0
      ? s.pickRate * (100 - (s.winRate ?? 100))
      : 0;
  });

  return statsMap;
}

function addMatchToStat(s, m, iWin, isDraw) {
  s.appeared++;
  if (iWin) s.wins++; else if (isDraw) s.draws++; else s.losses++;
  if (m.map) {
    s.maps[m.map] = s.maps[m.map] || { appeared: 0, wins: 0, losses: 0, draws: 0 };
    s.maps[m.map].appeared++;
    if (iWin) s.maps[m.map].wins++; else if (isDraw) s.maps[m.map].draws++; else s.maps[m.map].losses++;
  }
  if (m.myCharacter) {
    s.myChars[m.myCharacter] = s.myChars[m.myCharacter] || { appeared: 0, wins: 0, losses: 0, draws: 0 };
    s.myChars[m.myCharacter].appeared++;
    if (iWin) s.myChars[m.myCharacter].wins++; else if (isDraw) s.myChars[m.myCharacter].draws++; else s.myChars[m.myCharacter].losses++;
  }
}

// ===== Tier割り当て =====
function assignTiers(statsMap) {
  const appeared    = Object.values(statsMap).filter(s => s.appeared > 0);
  const notAppeared = Object.values(statsMap).filter(s => s.appeared === 0);

  appeared.sort((a, b) => b.pickRate - a.pickRate);
  const n = appeared.length;

  const tiered = { SSS: [], SS: [], S: [], A: [], B: [], C: [], D: [] };
  appeared.forEach((s, i) => {
    const pct = (i + 1) / n;
    let tier = 'D';
    for (let t = 0; t < TIER_ORDER.length; t++) {
      if (pct <= TIER_THRESHOLDS[t]) { tier = TIER_ORDER[t]; break; }
    }
    s.tier = tier;
    tiered[tier].push(s);
  });

  return { tiered, notAppeared };
}

// ===== 急上昇キャラ =====
function renderRisingChar(weekData) {
  const sec = document.getElementById('rising-section');
  const thisMatches = weekData.thisWeekMatches;
  const lastMatches = weekData.lastWeekMatches;

  if (thisMatches.length === 0 || lastMatches.length === 0) {
    sec.classList.add('hidden');
    return;
  }

  const chars = currentPerspective === 'survivor' ? HUNTERS : SURVIVORS;
  const rising = chars
    .map(char => ({
      char,
      diff: pickRateOf(char, thisMatches) - pickRateOf(char, lastMatches),
      thisPR: pickRateOf(char, thisMatches),
    }))
    .filter(d => d.diff >= 5)
    .sort((a, b) => b.diff - a.diff);

  if (rising.length === 0) {
    sec.classList.add('hidden');
    return;
  }

  const top = rising[0];
  const diffText = `+${top.diff.toFixed(1)}%`;
  const iconSrc = getCharIconPath(top.char);

  sec.classList.remove('hidden');
  sec.innerHTML = `
    <div class="priority-heading">📈 急上昇キャラ</div>
    <div class="rising-card" onclick="navigateToDetail('${escapeHTML(top.char)}')">
      <img class="rising-card-icon" src="${iconSrc}" alt="${escapeHTML(top.char)}" onerror="this.style.display='none'">
      <div class="rising-card-info">
        <div class="rising-card-name">${escapeHTML(top.char)}</div>
        <div class="rising-card-sub">今週のピック率 ${top.thisPR.toFixed(1)}%</div>
      </div>
      <div class="rising-card-badge">↑ ${diffText}</div>
    </div>
  `;
}

// ===== 脅威キャラカード =====
function renderPriorityCards(statsMap) {
  const top3 = Object.values(statsMap)
    .filter(s => s.appeared > 0)
    .sort((a, b) => b.dangerScore - a.dangerScore)
    .slice(0, 4);

  const heading = document.getElementById('priority-heading');
  if (heading) {
    const prioritySideLabel = currentPerspective === 'survivor' ? 'ハンター' : 'サバイバー';
    heading.textContent = `⚠️ 脅威${prioritySideLabel}`;
  }

  const container = document.getElementById('priority-cards');
  if (top3.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = top3.map((s, i) => `
    <div class="priority-card" onclick="navigateToDetail('${escapeHTML(s.char)}')">
      <img class="priority-card-icon" src="${getCharIconPath(s.char)}" alt="${escapeHTML(s.char)}" onerror="this.style.display='none'">
      <span class="priority-rank">${i + 1}位</span>
      <span class="priority-name">${escapeHTML(s.char)}</span>
      <span class="priority-score">スコア ${Math.round(s.dangerScore).toLocaleString()}</span>
    </div>
  `).join('');
}

// ===== Tier表描画 =====
function renderTierTable(tiered, weekData) {
  let html = '<p class="tier-desc-text">※ あなた自身の対戦データをもとに算出した流行度Tier表です</p><div class="tier-rows">';
  TIER_ORDER.forEach(t => {
    const chars = tiered[t] || [];
    const c = TIER_COLORS[t];
    html += `<div class="tier-row">
      <div class="tier-label" style="background:${c.bg};color:${c.text};">${t}</div>
      <div class="tier-chars">
        ${chars.map(s => {
          const trend = computeTrend(s.char, weekData);
          const arrowBadge = trend ? `<span class="tier-icon-arrow" style="color:${ARROW_COLORS[trend.arrow]}">${trend.arrow}</span>` : '';
          return `<button type="button" class="tier-char-btn" title="${escapeHTML(s.char)}" onclick="navigateToDetail('${escapeHTML(s.char)}')"><img class="tier-char-icon" src="${getCharIconPath(s.char)}" alt="${escapeHTML(s.char)}" onerror="this.style.display='none'">${arrowBadge}</button>`;
        }).join('')}
        ${chars.length === 0 ? '<span class="tier-empty">-</span>' : ''}
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('tier-table').innerHTML = html;
}

// ===== 未対戦 =====
function renderNoEncounter(notAppeared) {
  const sec = document.getElementById('no-encounter-section');
  const con = document.getElementById('no-encounter-chars');
  if (notAppeared.length === 0) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  con.innerHTML = notAppeared.map(s => `<img class="no-encounter-icon" src="${getCharIconPath(s.char)}" alt="${escapeHTML(s.char)}" title="${escapeHTML(s.char)}" onerror="this.style.display='none'">`).join('');
}

// ===== 前週比トレンド =====
// weekDataOrFm: { thisWeekMatches, lastWeekMatches } または fm 配列
function computeTrend(charName, weekDataOrFm) {
  let thisMatches, lastMatches;
  if (weekDataOrFm && weekDataOrFm.thisWeekMatches) {
    // キャッシュ済み週データ
    thisMatches = weekDataOrFm.thisWeekMatches;
    lastMatches = weekDataOrFm.lastWeekMatches;
  } else {
    // fm 配列から算出（詳細ページからの呼び出し）
    const weeks = getLastTwoCompletedWeeks();
    thisMatches = filterByDateRange(weekDataOrFm, weeks.thisWeek.start, weeks.thisWeek.end);
    lastMatches = filterByDateRange(weekDataOrFm, weeks.lastWeek.start, weeks.lastWeek.end);
  }
  if (thisMatches.length === 0 || lastMatches.length === 0) return null;

  const thisPR = pickRateOf(charName, thisMatches);
  const lastPR = pickRateOf(charName, lastMatches);
  const diff   = thisPR - lastPR;
  return {
    diff, thisPR, lastPR,
    arrow: diff >= 3 ? '↑' : diff <= -3 ? '↓' : '→',
  };
}

function getLastTwoCompletedWeeks() {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  // 直近の日曜を求める（今日が日曜なら7日前）
  const lastSun = new Date(now);
  lastSun.setDate(now.getDate() - (dow === 0 ? 7 : dow));
  lastSun.setHours(23, 59, 59, 999);

  const lastMon = new Date(lastSun);
  lastMon.setDate(lastSun.getDate() - 6);
  lastMon.setHours(0, 0, 0, 0);

  const prevSun = new Date(lastMon);
  prevSun.setDate(lastMon.getDate() - 1);
  prevSun.setHours(23, 59, 59, 999);

  const prevMon = new Date(prevSun);
  prevMon.setDate(prevSun.getDate() - 6);
  prevMon.setHours(0, 0, 0, 0);

  return {
    thisWeek: { start: lastMon, end: lastSun },
    lastWeek: { start: prevMon, end: prevSun },
  };
}

function filterByDateRange(list, start, end) {
  return list.filter(m => {
    const d = new Date(m.date || m.timestamp);
    return d >= start && d <= end;
  });
}

function pickRateOf(charName, list) {
  if (list.length === 0) return 0;
  let count = 0;
  if (currentPerspective === 'survivor') {
    count = list.filter(m => m.opponentHunter === charName).length;
  } else {
    count = list.filter(m => (m.opponentSurvivors || []).includes(charName)).length;
  }
  return count / list.length * 100;
}

// ===== 詳細ページ描画 =====
function renderDetailPage(charName) {
  const fm       = getFilteredMatches();
  const statsMap = computeCharStats(fm);
  const s        = statsMap[charName];
  _cachedDetailStat = s; // ソート関数用にキャッシュ

  // ヘッダー
  const charIconEl = document.getElementById('detail-char-icon');
  charIconEl.src = getCharIconPath(charName);
  charIconEl.alt = charName;
  document.getElementById('detail-char-name').textContent = charName;
  const { tiered } = assignTiers(statsMap);
  let tier = 'D';
  TIER_ORDER.forEach(t => { if (tiered[t].find(x => x.char === charName)) tier = t; });
  const badge = document.getElementById('detail-tier-badge');
  badge.textContent = tier;
  badge.className   = `detail-tier-badge tier-${tier}`;

  if (!s || s.appeared === 0) {
    ['detail-summary','detail-trend','detail-map','detail-mychar','detail-copick','detail-history']
      .forEach(id => { document.getElementById(id).innerHTML = `<p class="no-data-text">データがありません</p>`; });
    return;
  }

  renderDetailSummary(s);
  renderDetailTrend(charName, fm);
  renderDetailMap(s);
  renderDetailMyChar(s);
  document.getElementById('detail-copick').classList.remove('hidden');
  if (currentPerspective === 'hunter') {
    renderDetailCopick(s);
  } else {
    renderDetailBanPick(s);
  }
  renderDetailHistory(charName, fm);
}

// ① サマリー
function renderDetailSummary(s) {
  const wr  = s.winRate !== null ? s.winRate.toFixed(1) + '%' : '-';
  const pr  = s.pickRate.toFixed(1) + '%';
  const ds  = s.appeared > 0 ? Math.round(s.dangerScore).toLocaleString() : '-';
  document.getElementById('detail-summary').innerHTML = `
    <div class="detail-section-title">サマリー</div>
    <div class="summary-grid">
      <div class="summary-item"><div class="summary-value">${s.appeared}</div><div class="summary-label">対戦数</div></div>
      <div class="summary-item"><div class="summary-value">${wr}</div><div class="summary-label">自分の勝率</div></div>
      <div class="summary-item"><div class="summary-value">${pr}</div><div class="summary-label">ピック率</div></div>
      <div class="summary-item"><div class="summary-value">${ds}</div><div class="summary-label">脅威度スコア※</div></div>
    </div>
    <div class="danger-breakdown">※独自の基準でスコアを算出しています</div>
  `;
}

// ② トレンド
function renderDetailTrend(charName, fm) {
  const trend = computeTrend(charName, fm);
  const container = document.getElementById('detail-trend');
  if (!trend) {
    container.innerHTML = `<div class="detail-section-title">前週比トレンド</div><p class="no-data-text">先週・今週どちらかのデータがありません</p>`;
    return;
  }
  const color    = ARROW_COLORS[trend.arrow];
  const diffText = trend.diff >= 0 ? `+${trend.diff.toFixed(1)}%` : `${trend.diff.toFixed(1)}%`;
  container.innerHTML = `
    <div class="detail-section-title">前週比トレンド</div>
    <div class="trend-display">
      <div>
        <div class="trend-week-label">今週のピック率</div>
        <div class="trend-week-value">${trend.thisPR.toFixed(1)}%</div>
      </div>
      <div class="trend-arrow-big" style="color:${color}">←</div>
      <div>
        <div class="trend-week-label">先週（${diffText}）</div>
        <div class="trend-week-value">${trend.lastPR.toFixed(1)}%</div>
      </div>
    </div>
  `;
}

// ③ マップ
function renderDetailMap(s) {
  const container = document.getElementById('detail-map');
  const rawData   = Object.entries(s.maps).filter(([, d]) => d.appeared > 0);

  if (rawData.length === 0) {
    container.innerHTML = `<div class="detail-section-title">マップ分布</div><p class="no-data-text">データがありません</p>`;
    return;
  }

  // グラフ用：常に試合数降順
  const chartData = [...rawData].sort((a, b) => b[1].appeared - a[1].appeared);
  const colorMap  = {};
  chartData.forEach(([map], i) => { colorMap[map] = mapColor(map, i); });

  // テーブル用：ユーザー選択ソート
  const tableData = [...rawData].sort((a, b) => {
    let diff;
    if (mapSortOrder === 'count') {
      diff = b[1].appeared - a[1].appeared;
    } else {
      const wrA = (a[1].wins + a[1].losses) > 0 ? a[1].wins / (a[1].wins + a[1].losses) : 0.5;
      const wrB = (b[1].wins + b[1].losses) > 0 ? b[1].wins / (b[1].wins + b[1].losses) : 0.5;
      diff = wrB - wrA;
    }
    return mapSortDir === 'asc' ? -diff : diff;
  });

  const showSort = rawData.length >= 3;
  const sortBtns = showSort ? `
    <div class="sort-control">
      <button type="button" class="sort-key-btn${mapSortOrder === 'count' ? ' active' : ''}" onclick="switchMapSort('count')">試合数</button>
      <button type="button" class="sort-key-btn${mapSortOrder === 'winrate' ? ' active' : ''}" onclick="switchMapSort('winrate')">勝率</button>
      <div class="sort-divider"></div>
      <button type="button" class="sort-arrow-btn${mapSortDir === 'desc' ? ' active' : ''}" onclick="switchMapSortDir('desc')">↓</button>
      <button type="button" class="sort-arrow-btn${mapSortDir === 'asc' ? ' active' : ''}" onclick="switchMapSortDir('asc')">↑</button>
    </div>` : '';

  container.innerHTML = `
    <div class="detail-section-title">マップ分布</div>
    <div class="map-pie-layout">
      <div class="map-pie-canvas-wrap"><canvas id="detail-map-chart"></canvas></div>
      <div class="map-table-wrap">
        ${sortBtns}
        <div class="map-table">
          <div class="map-table-header"><span style="width:10px"></span><span class="map-name">マップ</span><span class="map-count">試合</span><span class="map-wr">勝率</span></div>
          ${tableData.map(([map, d]) => {
            const wr = (d.wins + d.losses) > 0 ? (d.wins / (d.wins + d.losses) * 100).toFixed(1) + '%' : '-';
            return `<div class="map-table-row">
              <span class="map-color-dot" style="background:${colorMap[map]}"></span>
              <span class="map-name">${escapeHTML(map)}</span>
              <span class="map-count">${d.appeared}</span>
              <span class="map-wr">${wr}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  if (mapChart) { mapChart.destroy(); mapChart = null; }
  const isDark = document.body.classList.contains('dark-mode');
  const ctx = document.getElementById('detail-map-chart').getContext('2d');
  const chartColors = chartData.map(([map]) => colorMap[map]);
  mapChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartData.map(([m]) => m),
      datasets: [{ data: chartData.map(([, d]) => d.appeared), backgroundColor: chartColors, borderWidth: 2, borderColor: isDark ? '#222238' : '#fff' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}試合` } }
      }
    },
    plugins: [{
      id: 'mapInitials',
      afterDraw(chart) {
        const { ctx: c, data } = chart;
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((arc, i) => {
          const angle = arc.endAngle - arc.startAngle;
          if (angle < 0.3) return;
          const mid   = arc.startAngle + angle / 2;
          const r     = (arc.outerRadius + arc.innerRadius) / 2;
          const x     = arc.x + Math.cos(mid) * r;
          const y     = arc.y + Math.sin(mid) * r;
          c.save();
          c.fillStyle    = '#fff';
          c.font         = 'bold 11px sans-serif';
          c.textAlign    = 'center';
          c.textBaseline = 'middle';
          c.shadowColor  = 'rgba(0,0,0,0.6)';
          c.shadowBlur   = 3;
          c.fillText(data.labels[i].charAt(0), x, y);
          c.restore();
        });
      }
    }]
  });
}

function switchMapSort(order) {
  mapSortOrder = order;
  if (_cachedDetailStat) renderDetailMap(_cachedDetailStat);
}

function switchMapSortDir(dir) {
  mapSortDir = dir;
  if (_cachedDetailStat) renderDetailMap(_cachedDetailStat);
}

// ④ 自キャラ別
function renderDetailMyChar(s) {
  const all = Object.entries(s.myChars).filter(([, d]) => d.appeared > 0);

  const container = document.getElementById('detail-mychar');
  if (all.length === 0) {
    container.innerHTML = `<div class="detail-section-title">自キャラ別勝率</div><p class="no-data-text">データがありません</p>`;
    return;
  }

  const data = [...all].sort((a, b) => {
    let diff;
    if (myCharSortOrder === 'count') {
      diff = b[1].appeared - a[1].appeared;
    } else {
      const wrA = (a[1].wins + a[1].losses) > 0 ? a[1].wins / (a[1].wins + a[1].losses) : -1;
      const wrB = (b[1].wins + b[1].losses) > 0 ? b[1].wins / (b[1].wins + b[1].losses) : -1;
      diff = wrB - wrA;
    }
    return myCharSortDir === 'asc' ? -diff : diff;
  });

  const showSort = all.length >= 3;

  container.innerHTML = `
    <div class="detail-section-title">自キャラ別勝率</div>
    ${showSort ? `
    <div class="sort-control">
      <button type="button" class="sort-key-btn${myCharSortOrder === 'count' ? ' active' : ''}" onclick="switchMyCharSort('count')">試合数</button>
      <button type="button" class="sort-key-btn${myCharSortOrder === 'winrate' ? ' active' : ''}" onclick="switchMyCharSort('winrate')">勝率</button>
      <div class="sort-divider"></div>
      <button type="button" class="sort-arrow-btn${myCharSortDir === 'desc' ? ' active' : ''}" onclick="switchMyCharSortDir('desc')">↓</button>
      <button type="button" class="sort-arrow-btn${myCharSortDir === 'asc' ? ' active' : ''}" onclick="switchMyCharSortDir('asc')">↑</button>
    </div>` : ''}
    <div class="mychar-table-header"><span class="mychar-name">キャラ</span><span class="mychar-count">試合数</span><span class="mychar-wr">勝率</span></div>
    ${data.map(([char, d]) => {
      const wr = (d.wins + d.losses) > 0 ? (d.wins / (d.wins + d.losses) * 100).toFixed(1) + '%' : '-';
      return `<div class="mychar-row"><img class="tier-row-icon" src="${getMyCharIconPath(char)}" alt="" onerror="this.style.display='none'"><span class="mychar-name">${escapeHTML(char)}</span><span class="mychar-count">${d.appeared}試合</span><span class="mychar-wr">${wr}</span></div>`;
    }).join('')}
  `;
}

function switchMyCharSort(order) {
  myCharSortOrder = order;
  if (_cachedDetailStat) renderDetailMyChar(_cachedDetailStat);
}

function switchMyCharSortDir(dir) {
  myCharSortDir = dir;
  if (_cachedDetailStat) renderDetailMyChar(_cachedDetailStat);
}

// ⑤ 同時pick（ハンター視点のみ）
function renderDetailCopick(s) {
  const data = Object.entries(s.coPick)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('detail-copick');
  if (data.length === 0) {
    container.innerHTML = `<div class="detail-section-title">同時pickが多いキャラ</div><p class="no-data-text">データがありません</p>`;
    return;
  }

  container.innerHTML = `
    <div class="detail-section-title">同時pickが多いキャラ</div>
    <div class="copick-list">
      ${data.map(([char, count], i) => {
        const pct = s.appeared > 0 ? (count / s.appeared * 100).toFixed(1) : '-';
        return `<div class="copick-item">
          <span class="copick-rank">${i + 1}位</span>
          <img class="tier-row-icon" src="${getCharIconPath(char)}" alt="" onerror="this.style.display='none'">
          <span class="copick-name">${escapeHTML(char)}</span>
          <span class="copick-pct">${count}/${s.appeared}試合（${pct}%）</span>
        </div>`;
      }).join('')}
    </div>
    <div class="copick-chart-wrap"><canvas id="copick-bar-chart"></canvas></div>
  `;

  if (coPickChart) { coPickChart.destroy(); coPickChart = null; }
  const isDark = document.body.classList.contains('dark-mode');
  const ctx = document.getElementById('copick-bar-chart').getContext('2d');

  coPickChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(([char]) => char),
      datasets: [{
        data: data.map(([, count]) => count),
        backgroundColor: isDark ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.7)',
        borderColor:     isDark ? '#60a5fa' : '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => data[items[0].dataIndex][0],
            label: ctx => `${ctx.raw}試合`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 }, maxRotation: 45 },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 }, stepSize: 1 },
          grid: { color: isDark ? '#2e2e48' : '#f1f5f9' }
        }
      }
    }
  });
}

// ⑤b BANが多いキャラ（サバイバー視点のみ）
function renderDetailBanPick(s) {
  const data = Object.entries(s.banPick)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('detail-copick');
  if (data.length === 0) {
    container.innerHTML = `<div class="detail-section-title">BANが多いキャラ</div><p class="no-data-text">データがありません</p>`;
    return;
  }

  const base = s.banTotal || s.appeared;
  container.innerHTML = `
    <div class="detail-section-title">BANが多いキャラ</div>
    <div class="copick-list">
      ${data.map(([char, count], i) => {
        const pct = base > 0 ? (count / base * 100).toFixed(1) : '-';
        return `<div class="copick-item">
          <span class="copick-rank">${i + 1}位</span>
          <img class="tier-row-icon" src="${buildIconPath(char, 'survivor')}" alt="" onerror="this.style.display='none'">
          <span class="copick-name">${escapeHTML(char)}</span>
          <span class="copick-pct">${count}/${base}試合（${pct}%）</span>
        </div>`;
      }).join('')}
    </div>
    <div class="copick-chart-wrap"><canvas id="banpick-bar-chart"></canvas></div>
  `;

  if (banPickChart) { banPickChart.destroy(); banPickChart = null; }
  const isDark = document.body.classList.contains('dark-mode');
  const ctx = document.getElementById('banpick-bar-chart').getContext('2d');

  banPickChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(([char]) => char),
      datasets: [{
        data: data.map(([, count]) => count),
        backgroundColor: isDark ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.7)',
        borderColor:     isDark ? '#60a5fa' : '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => data[items[0].dataIndex][0],
            label: ctx => `${ctx.raw}試合`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 }, maxRotation: 45 },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 }, stepSize: 1 },
          grid: { color: isDark ? '#2e2e48' : '#f1f5f9' }
        }
      }
    }
  });
}

// ⑥ 試合履歴
function renderDetailHistory(charName, fm) {
  // このキャラとの試合を抽出
  let charMatches = currentPerspective === 'survivor'
    ? fm.filter(m => m.opponentHunter === charName)
    : fm.filter(m => (m.opponentSurvivors || []).includes(charName));

  // 勝敗フィルター
  if (detailResultFilter !== 'all') {
    charMatches = charMatches.filter(m => getResultLabel(m) === detailResultFilter);
  }

  // 日付降順、同日はid（入力時刻）降順
  charMatches = [...charMatches].sort((a, b) => {
    const dateDiff = new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp);
    if (dateDiff !== 0) return dateDiff;
    return (b.id || 0) - (a.id || 0);
  });

  const total      = charMatches.length;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  if (detailPage > totalPages) detailPage = 1;
  const pageItems  = charMatches.slice((detailPage - 1) * 20, detailPage * 20);

  const filterBtns = [
    { type: 'all',  label: '全' },
    { type: 'win',  label: '勝' },
    { type: 'loss', label: '敗' },
    { type: 'draw', label: '分' },
  ].map(({ type, label }) => {
    const act = detailResultFilter === type;
    return `<button type="button" class="history-filter-btn${act ? ' active' : ''}" onclick="setHistoryFilter('${type}')">${label}</button>`;
  }).join('');

  let html = `
    <div class="detail-section-title">試合履歴</div>
    <div class="history-filter-row">${filterBtns}</div>
  `;

  if (pageItems.length === 0) {
    html += '<p class="no-data-text">該当する試合がありません</p>';
  } else {
    html += '<div class="history-list">';
    pageItems.forEach(m => {
      const rl    = getResultLabel(m);
      const label = { win: '勝', loss: '敗', draw: '分' }[rl];
      const date  = m.date || (m.timestamp ? m.timestamp.substring(0, 10) : '');
      const rankIconHTML = m.rank ? `<img class="history-rank-icon" src="ranks/${m.perspective}s/${m.rank}.PNG" alt="${escapeHTML(m.rank)}" title="${escapeHTML(m.rank)}" onerror="this.textContent=this.alt">` : '';
      const vsRowHTML = (() => {
        const iconImg = (src, alt) => `<img class="history-co-icon" src="${src}" alt="${escapeHTML(alt)}" title="${escapeHTML(alt)}" onerror="this.style.display='none'">`;
        if (currentPerspective === 'hunter') {
          const survs = [...(m.opponentSurvivors || [])].sort((a, b) => a === charName ? -1 : b === charName ? 1 : 0);
          const mySide  = m.myCharacter ? iconImg(getMyCharIconPath(m.myCharacter), m.myCharacter) : '';
          const oppSide = survs.map(s => iconImg(buildIconPath(s, 'survivor'), s)).join('');
          return `<div class="history-vs-row">${rankIconHTML}<div class="history-vs-side">${mySide}</div><span class="history-vs-text">vs</span><div class="history-vs-side">${oppSide}</div></div>`;
        } else {
          const allies  = [m.myCharacter, ...(m.teammates || [])].filter(Boolean);
          const mySide  = allies.map(s => iconImg(buildIconPath(s, 'survivor'), s)).join('');
          const oppSide = m.opponentHunter ? iconImg(buildIconPath(m.opponentHunter, 'hunter'), m.opponentHunter) : '';
          return `<div class="history-vs-row">${rankIconHTML}<div class="history-vs-side">${mySide}</div><span class="history-vs-text">vs</span><div class="history-vs-side">${oppSide}</div></div>`;
        }
      })();
      html += `<div class="history-item">
        <span class="history-result ${rl}">${label}</span>
        <span class="history-info">${escapeHTML(date)}　${escapeHTML(m.map || '')}${m.escapeCount !== undefined ? `　脱出${m.escapeCount}人` : ''}</span>
        ${vsRowHTML}
        ${m.comment ? `<span class="history-comment">${escapeHTML(m.comment)}</span>` : ''}
      </div>`;
    });
    html += '</div>';
    if (totalPages > 1) html += renderPaginationHTML(detailPage, totalPages);
  }

  document.getElementById('detail-history').innerHTML = html;
}

function setHistoryFilter(type) {
  detailResultFilter = type;
  detailPage = 1;
  renderDetailHistory(currentDetailChar, getFilteredMatches());
}

function changePage(page) {
  detailPage = page;
  renderDetailHistory(currentDetailChar, getFilteredMatches());
  document.getElementById('detail-history').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPaginationHTML(cur, total) {
  let html = '<div class="pagination">';
  html += `<button class="page-btn" ${cur === 1 ? 'disabled' : ''} onclick="changePage(${cur - 1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (i === cur) {
      html += `<button class="page-btn current">${i}</button>`;
    } else if (i === 1 || i === total || Math.abs(i - cur) <= 1) {
      html += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
    } else if (Math.abs(i - cur) === 2) {
      html += '<span class="page-ellipsis">…</span>';
    }
  }
  html += `<button class="page-btn" ${cur === total ? 'disabled' : ''} onclick="changePage(${cur + 1})">›</button>`;
  html += '</div>';
  return html;
}

// ===== ユーティリティ =====
function getResultLabel(m) {
  if (currentPerspective === 'survivor') {
    if (m.result === 'survivor_win') return 'win';
    if (m.result === 'hunter_win')   return 'loss';
    return 'draw';
  } else {
    if (m.result === 'hunter_win')   return 'win';
    if (m.result === 'survivor_win') return 'loss';
    return 'draw';
  }
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', () => {
  init();
  window.addEventListener('hashchange', handleHashChange);
});
