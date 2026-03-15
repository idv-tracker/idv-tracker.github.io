// ===== ダークモード（ちらつき防止） =====
(function () {
  if (localStorage.getItem('identity5_dark_mode') === 'on') {
    document.body.classList.add('dark-mode');
  }
})();

// ===== 定数 =====
const SURVIVORS = ['幸運児', '医師', '弁護士', '泥棒', '庭師', 'マジシャン', '冒険家', '傭兵', '祭司', '空軍', '機械技師', 'オフェンス', '心眼', '調香師', 'カウボーイ', '踊り子', '占い師', '納棺師', '探鉱者', '呪術師', '野人', '曲芸師', '一等航海士', 'バーメイド', 'ポストマン', '墓守', '「囚人」', '昆虫学者', '画家', 'バッツマン', '玩具職人', '患者', '「心理学者」', '小説家', '「少女」', '泣きピエロ', '教授', '骨董商', '作曲家', '記者', '航空エンジニア', '応援団', '人形師', '火災調査員', '「レディ・ファウロ」', '「騎士」', '気象学者', '弓使い', '「脱出マスター」', '幻灯師', '闘牛士'];
const HUNTERS  = ['復讐者', '道化師', '断罪狩人', 'リッパー', '結魂者', '芸者', '白黒無常', '写真家', '狂眼', '黄衣の王', '夢の魔女', '泣き虫', '魔トカゲ', '血の女王', 'ガードNo.26', '「使徒」', 'ヴァイオリニスト', '彫刻師', 'アンデッド', '破輪', '漁師', '蝋人形師', '「悪夢」', '書記官', '隠者', '夜の番人', 'オペラ歌手', '「フールズ・ゴールド」', '時空の影', '「足萎えの羊」', '「フラバルー」', '雑貨商', '「ビリヤードプレイヤー」', '「女王蜂」'];
const RANKS    = ['1段', '2段', '3段', '4段', '5段', '6段', '7段', '最高峰'];

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
const MAPS = ['軍需工場', '赤の教会', '聖心病院', '湖景村', '月の河公園', 'レオの思い出', '永眠町', '中華街', '罪の森'];
const MAP_COLOR_PALETTE = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16'];
const MAP_COLOR_MAP = {};
MAPS.forEach((m, i) => { MAP_COLOR_MAP[m] = MAP_COLOR_PALETTE[i]; });
function mapColor(name, fallbackIndex) {
  return MAP_COLOR_MAP[name] || MAP_COLOR_PALETTE[fallbackIndex % MAP_COLOR_PALETTE.length];
}

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD11HYRuGLn0N4_eFhXfTK5R-3QyJ4RsSo",
  authDomain: "idvtracker.firebaseapp.com",
  projectId: "idvtracker",
  storageBucket: "idvtracker.firebasestorage.app",
  messagingSenderId: "1027492627968",
  appId: "1:1027492627968:web:ad567e2e79b3a1574bbae5"
};

// ===== アイコンパス =====
function buildIconPath(charName, type) {
  const folder = type === 'hunter' ? 'hunters' : 'survivors';
  const prefix = type === 'hunter' ? 'hunter' : 'survivor';
  let name = charName.replace(/[「」]/g, '');
  const nameMap = {
    'フールズ・ゴールド': 'フールズゴールド',
    'ガードNo.26': 'ガードNO.26',
    '闘牛士': '闘牛師',
  };
  name = nameMap[name] || name;
  return `icons/${folder}/${prefix}_${name}.PNG`;
}
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
let db                = null;
let mapChart          = null;
let coPickChart       = null;
let mapSortOrder      = 'count';
let lastUpdated       = null;

// ===== 初期化 =====
function init() {
  initFirebase();

  // 既存アプリの sync code を共有して自動接続
  const syncCode = localStorage.getItem('identity5_sync_code');
  if (syncCode) {
    loadFromFirebase(syncCode);
    return;
  }

  // ローカルキャッシュ（JSON インポート用）
  const cached = localStorage.getItem('tier_local_data');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      matches     = parsed.matches || [];
      lastUpdated = parsed.lastUpdated || null;
      showTierPage();
      return;
    } catch (_) {}
  }

  showConnectPage();
}

// ===== Firebase =====
function initFirebase() {
  try {
    if (typeof firebase === 'undefined') return;
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
  } catch (e) {
    console.warn('Firebase init failed:', e);
  }
}

async function loadFromFirebase(syncCode) {
  if (!db) {
    // Firebase 未使用でも cache があれば使う
    fallbackToCache();
    return;
  }
  try {
    const snap = await db.collection('idv_tracker').doc(syncCode).get();
    if (snap.exists) {
      const data = snap.data();
      matches     = data.matches || [];
      lastUpdated = data.lastModified || null;
      localStorage.setItem('tier_local_data', JSON.stringify({ matches, lastUpdated }));
      showTierPage();
    } else {
      fallbackToCache();
    }
  } catch (_) {
    fallbackToCache();
  }
}

function fallbackToCache() {
  const cached = localStorage.getItem('tier_local_data');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      matches     = parsed.matches || [];
      lastUpdated = parsed.lastUpdated || null;
      showTierPage();
      return;
    } catch (_) {}
  }
  showConnectPage();
}

// ===== 接続UI =====
async function connectWithSyncCode() {
  const code = document.getElementById('sync-code-input').value.trim();
  if (!code) { alert('同期コードを入力してください'); return; }
  localStorage.setItem('identity5_sync_code', code);
  await loadFromFirebase(code);
}

function connectWithJSON() {
  const text = document.getElementById('json-input').value.trim();
  if (!text) { alert('データを貼り付けてください'); return; }
  importJSONText(text);
}

function connectWithJSONFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('json-input').value = e.target.result;
    connectWithJSON();
  };
  reader.readAsText(file);
}

function importJSONText(text) {
  try {
    const data = JSON.parse(text);
    if (!data.matches || !Array.isArray(data.matches)) {
      alert('データの形式が正しくありません');
      return;
    }
    matches     = data.matches;
    lastUpdated = new Date().toISOString();
    localStorage.setItem('tier_local_data', JSON.stringify({ matches, lastUpdated }));
    showTierPage();
  } catch (_) {
    alert('JSONの解析に失敗しました');
  }
}

function showDisconnectMenu() {
  if (!confirm('接続を解除しますか？\n（データは削除されません）')) return;
  localStorage.removeItem('identity5_sync_code');
  localStorage.removeItem('tier_local_data');
  matches     = [];
  lastUpdated = null;
  showConnectPage();
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
  if (coPickChart) { coPickChart.destroy(); coPickChart = null; }
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

  // ドロワー外クリックで閉じる
  document.addEventListener('click', function closeDD(e) {
    if (!wrap.contains(e.target)) {
      dd.classList.remove('open');
      trigger.classList.remove('open');
      document.removeEventListener('click', closeDD);
    }
  });
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

  renderPriorityCards(statsMap);
  renderTierTable(tiered, fm);
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
      maps: {}, myChars: {}, coPick: {}
    };
  });

  fm.forEach(m => {
    const iWin  = (currentPerspective === 'survivor' && m.result === 'survivor_win') ||
                  (currentPerspective === 'hunter'   && m.result === 'hunter_win');
    const isDraw = m.result === 'draw';

    if (currentPerspective === 'survivor') {
      const h = m.opponentHunter;
      if (h && statsMap[h]) addMatchToStat(statsMap[h], m, iWin, isDraw);
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

// ===== 要対策カード =====
function renderPriorityCards(statsMap) {
  const top3 = Object.values(statsMap)
    .filter(s => s.appeared > 0)
    .sort((a, b) => b.dangerScore - a.dangerScore)
    .slice(0, 4);

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
function renderTierTable(tiered, fm) {
  let html = '<p class="tier-desc-text">※ あなた自身の対戦データをもとに算出した流行度Tier表です</p><div class="tier-rows">';
  TIER_ORDER.forEach(t => {
    const chars = tiered[t] || [];
    const c = TIER_COLORS[t];
    html += `<div class="tier-row">
      <div class="tier-label" style="background:${c.bg};color:${c.text};">${t}</div>
      <div class="tier-chars">
        ${chars.map(s => {
          const trend = computeTrend(s.char, fm);
          const ARROW_COLORS = { '↑': '#22c55e', '→': '#9ca3af', '↓': '#ef4444' };
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

function renderArrowHTML(trend) {
  const color = { '↑': '#22c55e', '→': '#9ca3af', '↓': '#ef4444' }[trend.arrow];
  return `<span class="trend-arrow" style="color:${color}">${trend.arrow}</span>`;
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
function computeTrend(charName, fm) {
  const { thisWeek, lastWeek } = getLastTwoCompletedWeeks();
  const thisMatches = filterByDateRange(fm, thisWeek.start, thisWeek.end);
  const lastMatches = filterByDateRange(fm, lastWeek.start, lastWeek.end);
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
  if (currentPerspective === 'hunter') {
    document.getElementById('detail-copick').classList.remove('hidden');
    renderDetailCopick(s);
  } else {
    document.getElementById('detail-copick').classList.add('hidden');
    document.getElementById('detail-copick').innerHTML = '';
  }
  renderDetailHistory(charName, fm);
}

// ① サマリー
function renderDetailSummary(s) {
  const wr  = s.winRate !== null ? s.winRate.toFixed(1) + '%' : '-';
  const pr  = s.pickRate.toFixed(1) + '%';
  const ds  = s.appeared > 0 ? Math.round(s.dangerScore).toLocaleString() : '-';
  const wrRaw = s.winRate !== null ? s.winRate.toFixed(1) + '%' : '-';
  document.getElementById('detail-summary').innerHTML = `
    <div class="detail-section-title">サマリー</div>
    <div class="summary-grid">
      <div class="summary-item"><div class="summary-value">${s.appeared}</div><div class="summary-label">対戦数</div></div>
      <div class="summary-item"><div class="summary-value">${wr}</div><div class="summary-label">自分の勝率</div></div>
      <div class="summary-item"><div class="summary-value">${pr}</div><div class="summary-label">ピック率</div></div>
      <div class="summary-item"><div class="summary-value">${ds}</div><div class="summary-label">要対策スコア※</div></div>
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
  const color    = { '↑': '#22c55e', '→': '#9ca3af', '↓': '#ef4444' }[trend.arrow];
  const diffText = trend.diff >= 0 ? `+${trend.diff.toFixed(1)}%` : `${trend.diff.toFixed(1)}%`;
  container.innerHTML = `
    <div class="detail-section-title">前週比トレンド</div>
    <div class="trend-display">
      <div>
        <div class="trend-week-label">今週のピック率</div>
        <div class="trend-week-value">${trend.thisPR.toFixed(1)}%</div>
      </div>
      <div class="trend-arrow-big" style="color:${color}">${trend.arrow}</div>
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

  const mapData = [...rawData].sort((a, b) => {
    if (mapSortOrder === 'count') return b[1].appeared - a[1].appeared;
    const wrA = (a[1].wins + a[1].losses) > 0 ? a[1].wins / (a[1].wins + a[1].losses) : 0.5;
    const wrB = (b[1].wins + b[1].losses) > 0 ? b[1].wins / (b[1].wins + b[1].losses) : 0.5;
    return wrB - wrA;
  });

  const colors = mapData.map(([map], i) => mapColor(map, i));

  container.innerHTML = `
    <div class="detail-section-title">マップ分布</div>
    <div class="map-sort-row">
      <button type="button" class="map-sort-btn${mapSortOrder === 'count' ? ' active' : ''}" onclick="switchMapSort('count')">試合数順</button>
      <button type="button" class="map-sort-btn${mapSortOrder === 'winrate' ? ' active' : ''}" onclick="switchMapSort('winrate')">勝率順</button>
    </div>
    <div class="map-pie-layout">
      <div class="map-pie-canvas-wrap"><canvas id="detail-map-chart"></canvas></div>
      <div class="map-table">
        <div class="map-table-header"><span style="width:10px"></span><span class="map-name">マップ</span><span class="map-count">試合</span><span class="map-wr">勝率</span></div>
        ${mapData.map(([map, d], i) => {
          const wr = (d.wins + d.losses) > 0 ? (d.wins / (d.wins + d.losses) * 100).toFixed(1) + '%' : '-';
          return `<div class="map-table-row">
            <span class="map-color-dot" style="background:${colors[i]}"></span>
            <span class="map-name">${escapeHTML(map)}</span>
            <span class="map-count">${d.appeared}</span>
            <span class="map-wr">${wr}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;

  if (mapChart) { mapChart.destroy(); mapChart = null; }
  const isDark = document.body.classList.contains('dark-mode');
  const ctx = document.getElementById('detail-map-chart').getContext('2d');
  mapChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: mapData.map(([m]) => m),
      datasets: [{ data: mapData.map(([, d]) => d.appeared), backgroundColor: colors, borderWidth: 2, borderColor: isDark ? '#222238' : '#fff' }]
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
          c.shadowColor  = 'rgba(0,0,0,0.4)';
          c.shadowBlur   = 2;
          c.fillText(data.labels[i].charAt(0), x, y);
          c.restore();
        });
      }
    }]
  });
}

function switchMapSort(order) {
  mapSortOrder = order;
  const fm = getFilteredMatches();
  const statsMap = computeCharStats(fm);
  const s = statsMap[currentDetailChar];
  if (s) renderDetailMap(s);
}

// ④ 自キャラ別
function renderDetailMyChar(s) {
  const data = Object.entries(s.myChars)
    .filter(([, d]) => d.appeared > 0)
    .sort((a, b) => b[1].appeared - a[1].appeared);

  const container = document.getElementById('detail-mychar');
  if (data.length === 0) {
    container.innerHTML = `<div class="detail-section-title">自キャラ別勝率</div><p class="no-data-text">データがありません</p>`;
    return;
  }

  container.innerHTML = `
    <div class="detail-section-title">自キャラ別勝率</div>
    <div class="mychar-table-header"><span class="mychar-name">キャラ</span><span class="mychar-count">試合数</span><span class="mychar-wr">勝率</span></div>
    ${data.map(([char, d]) => {
      const wr = (d.wins + d.losses) > 0 ? (d.wins / (d.wins + d.losses) * 100).toFixed(1) + '%' : '-';
      return `<div class="mychar-row"><span class="mychar-name">${escapeHTML(char)}</span><span class="mychar-count">${d.appeared}試合</span><span class="mychar-wr">${wr}</span></div>`;
    }).join('')}
  `;
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
        tooltip: { callbacks: { label: ctx => `${ctx.raw}試合` } }
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 } },
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

  // 日付降順
  charMatches = [...charMatches].sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));

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
      const vsRowHTML = (() => {
        const iconImg = (src, alt) => `<img class="history-co-icon" src="${src}" alt="${escapeHTML(alt)}" title="${escapeHTML(alt)}" onerror="this.style.display='none'">`;
        if (currentPerspective === 'hunter') {
          const survs = [...(m.opponentSurvivors || [])].sort((a, b) => a === charName ? -1 : b === charName ? 1 : 0);
          const mySide  = m.myCharacter ? iconImg(getMyCharIconPath(m.myCharacter), m.myCharacter) : '';
          const oppSide = survs.map(s => iconImg(buildIconPath(s, 'survivor'), s)).join('');
          return `<div class="history-vs-row"><div class="history-vs-side">${mySide}</div><span class="history-vs-text">vs</span><div class="history-vs-side">${oppSide}</div></div>`;
        } else {
          const allies  = [m.myCharacter, ...(m.teammates || [])].filter(Boolean);
          const mySide  = allies.map(s => iconImg(buildIconPath(s, 'survivor'), s)).join('');
          const oppSide = m.opponentHunter ? iconImg(buildIconPath(m.opponentHunter, 'hunter'), m.opponentHunter) : '';
          return `<div class="history-vs-row"><div class="history-vs-side">${mySide}</div><span class="history-vs-text">vs</span><div class="history-vs-side">${oppSide}</div></div>`;
        }
      })();
      html += `<div class="history-item">
        <span class="history-result ${rl}">${label}</span>
        <span class="history-info">${escapeHTML(date)}　${escapeHTML(m.map || '')}　${m.rank ? `<img class="history-rank-icon" src="icons/ranks/${m.perspective}s/${encodeURIComponent(m.rank)}.PNG" alt="${escapeHTML(m.rank)}" title="${escapeHTML(m.rank)}" onerror="this.outerHTML='${escapeHTML(m.rank)}'">` : ''}</span>
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

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', () => {
  init();
  window.addEventListener('hashchange', handleHashChange);
});
