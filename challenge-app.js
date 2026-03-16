// ===== ダークモード =====
(function () {
  if (localStorage.getItem('identity5_dark_mode') === 'on') {
    document.body.classList.add('dark-mode');
  }
})();

// ===== 定数 =====
const SURVIVORS = ['幸運児', '医師', '弁護士', '泥棒', '庭師', 'マジシャン', '冒険家', '傭兵', '祭司', '空軍', '機械技師', 'オフェンス', '心眼', '調香師', 'カウボーイ', '踊り子', '占い師', '納棺師', '探鉱者', '呪術師', '野人', '曲芸師', '一等航海士', 'バーメイド', 'ポストマン', '墓守', '「囚人」', '昆虫学者', '画家', 'バッツマン', '玩具職人', '患者', '「心理学者」', '小説家', '「少女」', '泣きピエロ', '教授', '骨董商', '作曲家', '記者', '航空エンジニア', '応援団', '人形師', '火災調査員', '「レディ・ファウロ」', '「騎士」', '気象学者', '弓使い', '「脱出マスター」', '幻灯師', '闘牛士'];
const HUNTERS  = ['復讐者', '道化師', '断罪狩人', 'リッパー', '結魂者', '芸者', '白黒無常', '写真家', '狂眼', '黄衣の王', '夢の魔女', '泣き虫', '魔トカゲ', '血の女王', 'ガードNo.26', '「使徒」', 'ヴァイオリニスト', '彫刻師', 'アンデッド', '破輪', '漁師', '蝋人形師', '「悪夢」', '書記官', '隠者', '夜の番人', 'オペラ歌手', '「フールズ・ゴールド」', '時空の影', '「足萎えの羊」', '「フラバルー」', '雑貨商', '「ビリヤードプレイヤー」', '「女王蜂」'];

const RANK_NAMES = ['1段', '2段', '3段', '4段', '5段', '6段', '7段', '最高峰'];

// 段位設定
const RANK_CONFIG = {
  '1段': { subRanks: ['III', 'II', 'I'],              starsPerSubRank: 5, ptPerStar: 20 },
  '2段': { subRanks: ['IV', 'III', 'II', 'I'],        starsPerSubRank: 5, ptPerStar: 20 },
  '3段': { subRanks: ['V', 'IV', 'III', 'II', 'I'],   starsPerSubRank: 5, ptPerStar: 20 },
  '4段': { subRanks: ['V', 'IV', 'III', 'II', 'I'],   starsPerSubRank: 5, ptPerStar: 20 },
  '5段': { subRanks: ['V', 'IV', 'III', 'II', 'I'],   starsPerSubRank: 5, ptPerStar: 30 },
  '6段': { subRanks: ['V', 'IV', 'III', 'II', 'I'],   starsPerSubRank: 5, ptPerStar: 30 },
  '7段':   { subRanks: null, starsTotal: 25, ptPerStar: 30 },
  '最高峰': { subRanks: null, starsMin: 25, ptPerStar: 30 },
};

// 各段位の累積開始pt
const RANK_START_PT = (function () {
  const rankOrder = ['1段', '2段', '3段', '4段', '5段', '6段', '7段'];
  const result = {};
  let cumPt = 0;
  rankOrder.forEach(rank => {
    result[rank] = cumPt;
    const cfg = RANK_CONFIG[rank];
    const rankSpan = cfg.subRanks
      ? cfg.subRanks.length * cfg.starsPerSubRank * cfg.ptPerStar
      : cfg.starsTotal * cfg.ptPerStar;
    cumPt += rankSpan;
  });
  result['最高峰'] = cumPt;
  return result;
})();

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD11HYRuGLn0N4_eFhXfTK5R-3QyJ4RsSo",
  authDomain: "idvtracker.firebaseapp.com",
  projectId: "idvtracker",
  storageBucket: "idvtracker.firebasestorage.app",
  messagingSenderId: "1027492627968",
  appId: "1:1027492627968:web:ad567e2e79b3a1574bbae5"
};

// ===== 状態 =====
let matches    = [];
let db         = null;
let lastUpdated = null;

// 段位選択状態
const rankSel = {
  cur: { rank: '', subRank: '', stars: 0, fracPt: 0 },
  tgt: { rank: '', subRank: '', stars: 0 },
};

// 認知ptカード
let cogCards          = [];
let activeCogCardIdx  = -1; // -1 = 新規

// 段位アイコン陣営
let rankIconSide = localStorage.getItem('identity5_challenge_rank_side') || 'hunters';

// ===== 初期化 =====
function init() {
  initFirebase();
  initScrollBehavior();
  populateCharSelects();
  renderRankIcons('cur');
  renderRankIcons('tgt');
  loadCogCards();
  loadSavedInputs();

  const syncCode = localStorage.getItem('identity5_sync_code');
  if (syncCode) {
    loadFromFirebase(syncCode);
    return;
  }

  const cached = localStorage.getItem('tier_local_data');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      matches      = parsed.matches || [];
      lastUpdated  = parsed.lastUpdated || null;
      showMainPage();
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
  if (!db) { fallbackToCache(); return; }
  try {
    const snap = await db.collection('idv_tracker').doc(syncCode).get();
    if (snap.exists) {
      const data  = snap.data();
      matches      = data.matches || [];
      lastUpdated  = data.lastModified || null;
      localStorage.setItem('tier_local_data', JSON.stringify({ matches, lastUpdated }));
      showMainPage();
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
      matches      = parsed.matches || [];
      lastUpdated  = parsed.lastUpdated || null;
      showMainPage();
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
    matches      = data.matches;
    lastUpdated  = new Date().toISOString();
    localStorage.setItem('tier_local_data', JSON.stringify({ matches, lastUpdated }));
    showMainPage();
  } catch (_) {
    alert('JSONの解析に失敗しました');
  }
}

function showDisconnectMenu() {
  if (!confirm('接続を解除しますか？\n（データは削除されません）')) return;
  localStorage.removeItem('identity5_sync_code');
  localStorage.removeItem('tier_local_data');
  matches      = [];
  lastUpdated  = null;
  showConnectPage();
}

// ===== 画面切替 =====
function showConnectPage() {
  document.getElementById('connect-page').classList.remove('hidden');
  document.getElementById('main-page').classList.add('hidden');
  window.scrollTo(0, 0);
}

function showMainPage() {
  document.getElementById('connect-page').classList.add('hidden');
  document.getElementById('main-page').classList.remove('hidden');
  window.scrollTo(0, 0);
  renderMainPage();
}

function renderMainPage() {
  const total    = matches.length;
  const surCount = matches.filter(m => m.perspective === 'survivor').length;
  const hunCount = matches.filter(m => m.perspective === 'hunter').length;
  const lock     = document.getElementById('lock-screen');
  const content  = document.getElementById('main-content');

  document.getElementById('stats-header').innerHTML =
    `<span>総試合数 <strong>${total}</strong></span>` +
    `<span>サバ <strong>${surCount}</strong></span>` +
    `<span>ハン <strong>${hunCount}</strong></span>` +
    (lastUpdated ? `<span class="last-updated">最終更新: ${formatDate(lastUpdated)}</span>` : '');

  if (total < 50) {
    lock.classList.remove('hidden');
    content.classList.add('hidden');
    const pct = Math.min(total / 50 * 100, 100);
    document.getElementById('lock-progress-bar').style.width = pct + '%';
    document.getElementById('lock-progress-text').textContent = `${total} / 50試合`;
    document.getElementById('lock-message').textContent = `あと${50 - total}試合記録すると解放されます`;
    return;
  }

  lock.classList.add('hidden');
  content.classList.remove('hidden');
  document.getElementById('cog-save-btn').classList.remove('hidden');
  // トグル初期状態を反映
  document.getElementById('rank-side-survivors').classList.toggle('active', rankIconSide === 'survivors');
  document.getElementById('rank-side-hunters').classList.toggle('active', rankIconSide === 'hunters');
  renderRankIcons('cur');
  renderRankIcons('tgt');
  renderCogCardsRow();
  onCogInput();
  onRankInput();
}

// ===== タブ切替 =====
function switchTab(tab) {
  document.getElementById('tab-rank').classList.toggle('active', tab === 'rank');
  document.getElementById('tab-cog').classList.toggle('active', tab === 'cog');
  document.getElementById('rank-section').classList.toggle('hidden', tab !== 'rank');
  document.getElementById('cog-section').classList.toggle('hidden', tab !== 'cog');
}

// ===== セレクト初期化 =====
function populateCharSelects() {
  const sel      = document.getElementById('cog-char');
  const surGroup = sel.querySelector('optgroup[label="サバイバー"]');
  const hunGroup = sel.querySelector('optgroup[label="ハンター"]');
  SURVIVORS.forEach(c => { surGroup.appendChild(new Option(c, c)); });
  HUNTERS.forEach(c => { hunGroup.appendChild(new Option(c, c)); });
}

// ===== 段位アイコン描画 =====
function setRankIconSide(side) {
  rankIconSide = side;
  localStorage.setItem('identity5_challenge_rank_side', side);
  document.getElementById('rank-side-survivors').classList.toggle('active', side === 'survivors');
  document.getElementById('rank-side-hunters').classList.toggle('active', side === 'hunters');
  renderRankIcons('cur');
  renderRankIcons('tgt');
}

function rankIconPath(rank) {
  return `ranks/${rankIconSide}/${rank}.PNG`;
}

function renderRankIcons(type) {
  const container = document.getElementById(`rank-${type}-icons`);
  const sel       = rankSel[type];
  container.innerHTML = RANK_NAMES.map(rank => {
    const active = sel.rank === rank ? ' active' : '';
    return `<button type="button" class="rank-icon-btn${active}" onclick="onRankIconClick('${type}', '${rank}')">
      <img src="${rankIconPath(rank)}" alt="${rank}" onerror="this.style.visibility='hidden'">
      <div class="rank-icon-label">${rank}</div>
    </button>`;
  }).join('');
}

function onRankIconClick(type, rank) {
  rankSel[type].rank    = rank;
  rankSel[type].subRank = '';
  rankSel[type].stars   = 0;
  renderRankIcons(type);
  renderSubRankBtns(type);
  renderStars(type);
  onRankInput();
}

// ===== サブ段位ボタン =====
function renderSubRankBtns(type) {
  const row     = document.getElementById(`rank-${type}-sub-row`);
  const { rank, subRank } = rankSel[type];
  const cfg     = RANK_CONFIG[rank];

  if (!rank || !cfg || !cfg.subRanks) {
    row.classList.add('hidden');
    return;
  }

  row.classList.remove('hidden');
  row.innerHTML = cfg.subRanks.map(sr => {
    const active = subRank === sr ? ' active' : '';
    return `<button type="button" class="sub-rank-btn${active}" onclick="onSubRankBtnClick('${type}', '${sr}')">${sr}</button>`;
  }).join('');
}

function onSubRankBtnClick(type, subRank) {
  rankSel[type].subRank = subRank;
  rankSel[type].stars   = 0;
  renderSubRankBtns(type);
  renderStars(type);
  onRankInput();
}

// ===== 星ボタン / 星数入力 =====
function renderStars(type) {
  const area              = document.getElementById(`rank-${type}-stars-area`);
  const { rank, subRank, stars } = rankSel[type];
  const cfg               = RANK_CONFIG[rank];

  if (!rank || !cfg) {
    area.classList.add('hidden');
    return;
  }

  // 最高峰: 数値入力（25〜）
  if (rank === '最高峰') {
    area.classList.remove('hidden');
    const val = (stars >= 25) ? stars : 25;
    area.innerHTML =
      `<span class="stars-label">星数</span>` +
      `<input type="number" class="stars-num-input" id="rank-${type}-stars-inf"` +
      ` min="25" value="${val}" oninput="onStarsInfChange('${type}')">` +
      (type === 'cur' ? buildFracPtHtml(cfg.ptPerStar) : '');
    return;
  }

  // 7段: 数値入力（0〜24）
  if (!cfg.subRanks) {
    area.classList.remove('hidden');
    const max = cfg.starsTotal - 1;
    const val = Math.min(max, stars || 0);
    area.innerHTML =
      `<span class="stars-label">星</span>` +
      `<input type="number" class="stars-num-input" id="rank-${type}-stars-inf"` +
      ` min="0" max="${max}" value="${val}" oninput="onStarsInfChange('${type}')">` +
      (type === 'cur' ? buildFracPtHtml(cfg.ptPerStar) : '');
    return;
  }

  // 1〜6段: サブ段位未選択なら非表示
  if (!subRank) {
    area.classList.add('hidden');
    return;
  }

  area.classList.remove('hidden');
  const maxBtn   = cfg.starsPerSubRank; // 5ボタン表示（0〜5星を表現）
  const curStars = stars || 0;
  let html = '<span class="stars-label">星</span>';
  for (let i = 1; i <= maxBtn; i++) {
    const filled = curStars >= i ? ' active' : '';
    html += `<button type="button" class="star-btn${filled}" onclick="onStarClick('${type}', ${i})">★</button>`;
  }
  if (type === 'cur') html += buildFracPtHtml(cfg.ptPerStar);
  area.innerHTML = html;
}

function buildFracPtHtml(ptPerStar) {
  const max    = ptPerStar - 1;
  const curVal = rankSel.cur.fracPt || 0;
  return `<span class="frac-pt-sep">＋</span>` +
    `<input type="number" class="frac-pt-input" id="rank-cur-frac-pt"` +
    ` min="0" max="${max}" value="${curVal}"` +
    ` placeholder="0" title="端数pt（星の途中で獲得済みのpt）" oninput="onFracPtChange()">` +
    `<span class="frac-pt-label">端数pt</span>`;
}

function onStarClick(type, n) {
  rankSel[type].stars = rankSel[type].stars === n ? n - 1 : n;
  renderStars(type);
  onRankInput();
}

function onStarsInfChange(type) {
  const el = document.getElementById(`rank-${type}-stars-inf`);
  if (!el) return;
  const min = rankSel[type].rank === '最高峰' ? 25 : 0;
  rankSel[type].stars = Math.max(min, parseInt(el.value) || min);
  onRankInput();
}

function onFracPtChange() {
  const el = document.getElementById('rank-cur-frac-pt');
  if (!el) return;
  const cfg    = RANK_CONFIG[rankSel.cur.rank];
  const maxVal = cfg ? cfg.ptPerStar - 1 : 99;
  rankSel.cur.fracPt = Math.min(maxVal, Math.max(0, parseInt(el.value) || 0));
  onRankInput();
}

// ===== ptサンプル解析 =====
function parsePtSamples(str) {
  if (!str || !str.trim()) return null;
  const nums = str.split(/[,、\s]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n));
  if (nums.length === 0) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return { values: nums, avg };
}

function updateAvgDisplay(inputId, displayId) {
  const str     = document.getElementById(inputId).value;
  const display = document.getElementById(displayId);
  const parsed  = parsePtSamples(str);
  if (!parsed) { display.textContent = ''; return; }
  const avgText = Number.isInteger(parsed.avg)
    ? parsed.avg.toString()
    : parsed.avg.toFixed(1);
  display.textContent = `平均 ${avgText}pt（${parsed.values.length}件）`;
}

// ===== 勝率取得 =====
function isWin(match) {
  return (match.perspective === 'survivor' && match.result === 'survivor_win') ||
         (match.perspective === 'hunter'   && match.result === 'hunter_win');
}

function sortedByRecent(ms) {
  return [...ms].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });
}

// 全試合の直近n件
function getRecentMatches(n = 50) {
  return sortedByRecent(matches).slice(0, n);
}

// キャラの直近n件 → 不足分を全体直近から補充
function getCharCombinedMatches(charName, n = 50) {
  const sorted     = sortedByRecent(matches);
  const charRecent = sorted.filter(m => m.myCharacter === charName).slice(0, n);
  if (charRecent.length >= n) return charRecent;
  const charIds = new Set(charRecent.map(m => m.id));
  const fill    = sorted.filter(m => !charIds.has(m.id)).slice(0, n - charRecent.length);
  return [...charRecent, ...fill];
}

function calcWinStats(ms) {
  const total = ms.length;
  if (total === 0) return null;
  const wins  = ms.filter(m => isWin(m)).length;
  const draws = ms.filter(m => m.result === 'draw').length;
  return {
    total,
    wins,
    draws,
    losses:   total - wins - draws,
    winRate:  wins  / total,
    drawRate: draws / total,
    lossRate: (total - wins - draws) / total,
  };
}

function getCharWinrate(charName) {
  return calcWinStats(getCharCombinedMatches(charName));
}

function getOverallWinrate() {
  return calcWinStats(getRecentMatches(50));
}

// ===== 段位ポジション → 累積pt =====
function positionToPt(rank, subRank, stars) {
  if (rank === '最高峰') {
    const cfg = RANK_CONFIG['最高峰'];
    const s   = parseInt(stars || cfg.starsMin);
    return RANK_START_PT['最高峰'] + (s - cfg.starsMin) * cfg.ptPerStar;
  }
  if (!rank || !RANK_CONFIG[rank]) return null;
  const cfg       = RANK_CONFIG[rank];
  const rankStart = RANK_START_PT[rank];
  if (!cfg.subRanks) {
    return rankStart + parseInt(stars || 0) * cfg.ptPerStar;
  }
  const subIdx = cfg.subRanks.indexOf(subRank);
  if (subIdx === -1) return null;
  return rankStart + subIdx * cfg.starsPerSubRank * cfg.ptPerStar + parseInt(stars || 0) * cfg.ptPerStar;
}

// ===== 予測試合数計算 =====
function calcMatches(remainingPt, avgWin, avgDraw, avgLoss, winRate, drawRate) {
  const lossRate   = Math.max(0, 1 - winRate - drawRate);
  const expectedPt = winRate * avgWin + drawRate * avgDraw + lossRate * avgLoss;
  if (expectedPt <= 0) return null;
  return Math.ceil(remainingPt / expectedPt);
}

// ===== 予測テーブルHTML =====
function buildPredTable(upper, expected, lower, wr) {
  const upperWr = Math.min(1, wr.winRate + 0.05);
  const lowerWr = Math.max(0, wr.winRate - 0.05);
  const fmtPct  = r => (r * 100).toFixed(1) + '%';

  function col(val, type, wrPct) {
    const label  = type === 'upper' ? '上振れ' : type === 'expected' ? '期待値' : '下振れ';
    const valHtml = val !== null
      ? `${formatNum(val)}<span>試合</span>`
      : `<span style="font-size:14px">計算不可</span>`;
    return `<div class="pred-col ${type}">
      <div class="pred-label">${label}</div>
      <div class="pred-value">${valHtml}</div>
      <div class="pred-winrate">${wrPct}</div>
    </div>`;
  }

  return `<div class="pred-table">
    ${col(upper,    'upper',    '勝率 ' + fmtPct(upperWr))}
    ${col(expected, 'expected', '勝率 ' + fmtPct(wr.winRate))}
    ${col(lower,    'lower',    '勝率 ' + fmtPct(lowerWr))}
  </div>`;
}

// ===== 認知ptカード管理 =====
function loadCogCards() {
  try {
    cogCards = JSON.parse(localStorage.getItem('identity5_challenge_cog_cards') || '[]');
  } catch (_) { cogCards = []; }
}

function saveCogCards() {
  localStorage.setItem('identity5_challenge_cog_cards', JSON.stringify(cogCards));
}

function renderCogCardsRow() {
  const row = document.getElementById('cog-cards-row');

  let html = cogCards.map((card, idx) => {
    const active  = activeCogCardIdx === idx ? ' active' : '';
    const imgSrc  = SURVIVORS.includes(card.charName)
      ? `survivors/survivor_${card.charName}.PNG`
      : `hunters/hunter_${card.charName}.PNG`;
    return `<div class="cog-card${active}" onclick="onCogCardClick(${idx})">
      <button type="button" class="card-delete-btn" onclick="deleteCogCard(${idx}, event)">×</button>
      <img class="cog-card-icon" src="${imgSrc}" alt="${card.charName}" onerror="this.style.display='none'">
      <div class="cog-card-name">${card.charName}</div>
    </div>`;
  }).join('');

  // 新規カード
  const newActive = activeCogCardIdx === -1 ? ' active' : '';
  html += `<div class="cog-card new-card${newActive}" onclick="onCogCardClick(-1)">
    <div class="new-card-plus">+</div>
    <div class="cog-card-name">新規</div>
  </div>`;

  row.innerHTML = html;
}

function onCogCardClick(idx) {
  activeCogCardIdx = idx;

  if (idx >= 0 && cogCards[idx]) {
    const card = cogCards[idx];
    document.getElementById('cog-char').value          = card.charName    || '';
    document.getElementById('cog-current').value       = card.currentPt   || '';
    document.getElementById('cog-target').value        = card.targetPt    || '';
    document.getElementById('cog-win-samples').value   = card.winSamples  || '';
    document.getElementById('cog-draw-samples').value  = card.drawSamples || '';
    document.getElementById('cog-loss-samples').value  = card.lossSamples || '';
  } else {
    document.getElementById('cog-char').value          = '';
    document.getElementById('cog-current').value       = '';
    document.getElementById('cog-target').value        = '';
    document.getElementById('cog-win-samples').value   = '';
    document.getElementById('cog-draw-samples').value  = '';
    document.getElementById('cog-loss-samples').value  = '';
  }

  renderCogCardsRow();
  onCogInput();
}

function deleteCogCard(idx, event) {
  event.stopPropagation();
  cogCards.splice(idx, 1);
  saveCogCards();
  if (activeCogCardIdx === idx) {
    activeCogCardIdx = -1;
  } else if (activeCogCardIdx > idx) {
    activeCogCardIdx--;
  }
  renderCogCardsRow();
  onCogInput();
}

function onSaveCogCard() {
  const charName = document.getElementById('cog-char').value;
  if (!charName) { alert('キャラクターを選択してください'); return; }

  const card = {
    charName,
    currentPt:   document.getElementById('cog-current').value,
    targetPt:    document.getElementById('cog-target').value,
    winSamples:  document.getElementById('cog-win-samples').value,
    drawSamples: document.getElementById('cog-draw-samples').value,
    lossSamples: document.getElementById('cog-loss-samples').value,
  };

  if (activeCogCardIdx >= 0) {
    cogCards[activeCogCardIdx] = card;
  } else {
    cogCards.push(card);
    activeCogCardIdx = cogCards.length - 1;
  }

  saveCogCards();
  renderCogCardsRow();
}

// ===== 認知pt セクション =====
function onCogInput() {
  updateAvgDisplay('cog-win-samples',  'cog-win-avg');
  updateAvgDisplay('cog-draw-samples', 'cog-draw-avg');
  updateAvgDisplay('cog-loss-samples', 'cog-loss-avg');
  saveCogInputs();

  const resultEl  = document.getElementById('cog-result');
  const charName  = document.getElementById('cog-char').value;
  const currentPt = parseFloat(document.getElementById('cog-current').value);
  const targetPt  = parseFloat(document.getElementById('cog-target').value);
  const winS      = parsePtSamples(document.getElementById('cog-win-samples').value);
  const drawS     = parsePtSamples(document.getElementById('cog-draw-samples').value);
  const lossS     = parsePtSamples(document.getElementById('cog-loss-samples').value);

  if (!charName) {
    resultEl.innerHTML = `<div class="result-placeholder">キャラクターを選択してください</div>`;
    return;
  }
  if (isNaN(currentPt) || isNaN(targetPt)) {
    resultEl.innerHTML = `<div class="result-placeholder">現在の認知ptと目標の認知ptを入力してください</div>`;
    return;
  }
  if (!winS || !lossS) {
    resultEl.innerHTML = `<div class="result-placeholder">勝利時・敗北時のptサンプルを入力してください</div>`;
    return;
  }
  if (targetPt <= currentPt) {
    resultEl.innerHTML = `<div class="result-error">⚠️ 目標ポイントは現在のポイントより大きく設定してください</div>`;
    return;
  }

  const wr = getCharWinrate(charName);
  if (!wr) {
    resultEl.innerHTML = `<div class="result-error">⚠️ このキャラクターの対戦データがありません<br><span style="font-size:12px;color:#6b7280;">トラッカーに${charName}での試合を記録してください</span></div>`;
    return;
  }

  const avgWin    = winS.avg;
  const avgDraw   = drawS ? drawS.avg : 0;
  const avgLoss   = lossS.avg;
  const remaining = targetPt - currentPt;

  const expected = calcMatches(remaining, avgWin, avgDraw, avgLoss, wr.winRate,  wr.drawRate);
  const upperWr  = Math.min(1, wr.winRate + 0.05);
  const lowerWr  = Math.max(0, wr.winRate - 0.05);
  const upper    = calcMatches(remaining, avgWin, avgDraw, avgLoss, upperWr, wr.drawRate);
  const lower    = calcMatches(remaining, avgWin, avgDraw, avgLoss, lowerWr, wr.drawRate);

  if (expected === null) {
    resultEl.innerHTML = `<div class="result-error">⚠️ この設定では期待ptがマイナスのため進捗できません<br><span style="font-size:12px;">ptサンプルや設定を見直してください</span></div>`;
    return;
  }

  const gap      = targetPt - currentPt;
  const showNote = currentPt >= 7000 || gap >= 2000;

  let html = '';

  html += `<div class="result-data-info">
    <strong>${charName}</strong> — 直近${wr.total}試合 / 勝率 <strong>${(wr.winRate * 100).toFixed(1)}%</strong>
    　勝: ${wr.wins} / 分: ${wr.draws} / 負: ${wr.losses}`;
  if (wr.total < 10) {
    html += `<div class="result-data-warn">⚠️ データが${wr.total}試合と少ないため精度が低い場合があります</div>`;
  }
  html += `</div>`;

  html += `<div class="result-remaining">残り <strong>${formatNum(remaining)} pt</strong> 　期待pt/試合: ${(wr.winRate * avgWin + wr.drawRate * avgDraw + wr.lossRate * avgLoss).toFixed(1)}pt</div>`;

  html += buildPredTable(upper, expected, lower, wr);

  if (showNote) {
    html += `<div class="guard-note">💡 目標との差が大きい場合、ポイント増減値が変動することがあります。実態と予測がずれてきたら、サンプル値をこまめに更新してください。</div>`;
  }

  resultEl.innerHTML = html;
}

// ===== 段位pt セクション =====
function onRankInput() {
  updateAvgDisplay('rank-win-samples',  'rank-win-avg');
  updateAvgDisplay('rank-draw-samples', 'rank-draw-avg');
  updateAvgDisplay('rank-loss-samples', 'rank-loss-avg');
  saveRankInputs();

  const resultEl = document.getElementById('rank-result');
  const { cur, tgt } = rankSel;

  const winS  = parsePtSamples(document.getElementById('rank-win-samples').value);
  const drawS = parsePtSamples(document.getElementById('rank-draw-samples').value);
  const lossS = parsePtSamples(document.getElementById('rank-loss-samples').value);

  if (!cur.rank) {
    resultEl.innerHTML = `<div class="result-placeholder">現在の段位を選択してください</div>`;
    return;
  }
  const curCfg = RANK_CONFIG[cur.rank];
  if (curCfg && curCfg.subRanks && !cur.subRank) {
    resultEl.innerHTML = `<div class="result-placeholder">現在のサブ段位を選択してください</div>`;
    return;
  }
  if (!tgt.rank) {
    resultEl.innerHTML = `<div class="result-placeholder">目標の段位を選択してください</div>`;
    return;
  }
  const tgtCfg = RANK_CONFIG[tgt.rank];
  if (tgtCfg && tgtCfg.subRanks && !tgt.subRank) {
    resultEl.innerHTML = `<div class="result-placeholder">目標のサブ段位を選択してください</div>`;
    return;
  }
  if (!winS || !lossS) {
    resultEl.innerHTML = `<div class="result-placeholder">勝利時・敗北時のptサンプルを入力してください</div>`;
    return;
  }

  const currentPt = positionToPt(cur.rank, cur.subRank, cur.stars) + (cur.fracPt || 0);
  const targetPt  = positionToPt(tgt.rank, tgt.subRank, tgt.stars);

  if (currentPt === null || targetPt === null) {
    resultEl.innerHTML = `<div class="result-error">⚠️ 段位の設定が正しくありません</div>`;
    return;
  }
  if (targetPt <= currentPt) {
    resultEl.innerHTML = `<div class="result-error">⚠️ 目標段位は現在の段位より上に設定してください</div>`;
    return;
  }

  const wr = getOverallWinrate();
  if (!wr) {
    resultEl.innerHTML = `<div class="result-error">⚠️ 対戦データがありません</div>`;
    return;
  }

  const avgWin    = winS.avg;
  const avgDraw   = drawS ? drawS.avg : 0;
  const avgLoss   = lossS.avg;
  const remaining = targetPt - currentPt;

  const expected = calcMatches(remaining, avgWin, avgDraw, avgLoss, wr.winRate,  wr.drawRate);
  const upperWr  = Math.min(1, wr.winRate + 0.05);
  const lowerWr  = Math.max(0, wr.winRate - 0.05);
  const upper    = calcMatches(remaining, avgWin, avgDraw, avgLoss, upperWr, wr.drawRate);
  const lower    = calcMatches(remaining, avgWin, avgDraw, avgLoss, lowerWr, wr.drawRate);

  if (expected === null) {
    resultEl.innerHTML = `<div class="result-error">⚠️ この設定では期待ptがマイナスのため進捗できません<br><span style="font-size:12px;">ptサンプルや設定を見直してください</span></div>`;
    return;
  }

  function fmtRankLabel(rank, sub, stars) {
    if (rank === '最高峰') return `最高峰 ${stars}星`;
    if (!RANK_CONFIG[rank]?.subRanks) return `${rank} ${stars}星`;
    return `${rank}${sub} ${stars}星`;
  }
  const curLabel = fmtRankLabel(cur.rank, cur.subRank, cur.stars);
  const tgtLabel = fmtRankLabel(tgt.rank, tgt.subRank, tgt.stars);

  let html = '';

  html += `<div class="result-data-info">
    直近${wr.total}試合 / 勝率 <strong>${(wr.winRate * 100).toFixed(1)}%</strong>
    　勝: ${wr.wins} / 分: ${wr.draws} / 負: ${wr.losses}
  </div>`;

  const expectedPtPerMatch = wr.winRate * avgWin + wr.drawRate * avgDraw + wr.lossRate * avgLoss;
  html += `<div class="result-remaining">
    <span style="font-size:13px;color:#6b7280;">${curLabel} → ${tgtLabel}</span><br>
    残り <strong>${formatNum(remaining)} pt</strong> 　期待pt/試合: ${expectedPtPerMatch.toFixed(1)}pt
  </div>`;

  html += buildPredTable(upper, expected, lower, wr);

  resultEl.innerHTML = html;
}

// ===== ローカルストレージ 保存・復元 =====
function saveCogInputs() {
  const data = {
    char:        document.getElementById('cog-char').value,
    current:     document.getElementById('cog-current').value,
    target:      document.getElementById('cog-target').value,
    winSamples:  document.getElementById('cog-win-samples').value,
    drawSamples: document.getElementById('cog-draw-samples').value,
    lossSamples: document.getElementById('cog-loss-samples').value,
  };
  localStorage.setItem('identity5_challenge_cognition', JSON.stringify(data));
}

function saveRankInputs() {
  const data = {
    cur: { rank: rankSel.cur.rank, subRank: rankSel.cur.subRank, stars: rankSel.cur.stars, fracPt: rankSel.cur.fracPt || 0 },
    tgt: { ...rankSel.tgt },
    winSamples:  document.getElementById('rank-win-samples').value,
    drawSamples: document.getElementById('rank-draw-samples').value,
    lossSamples: document.getElementById('rank-loss-samples').value,
  };
  localStorage.setItem('identity5_challenge_rank', JSON.stringify(data));
}

function loadSavedInputs() {
  // 認知pt
  const cog = JSON.parse(localStorage.getItem('identity5_challenge_cognition') || 'null');
  if (cog) {
    document.getElementById('cog-char').value          = cog.char        || '';
    document.getElementById('cog-current').value       = cog.current     || '';
    document.getElementById('cog-target').value        = cog.target      || '';
    document.getElementById('cog-win-samples').value   = cog.winSamples  || '';
    document.getElementById('cog-draw-samples').value  = cog.drawSamples || '';
    document.getElementById('cog-loss-samples').value  = cog.lossSamples || '';
  }

  // 段位pt
  const saved = JSON.parse(localStorage.getItem('identity5_challenge_rank') || 'null');
  if (saved) {
    if (saved.cur && saved.cur.rank) {
      rankSel.cur = {
        rank:    saved.cur.rank    || '',
        subRank: saved.cur.subRank || '',
        stars:   saved.cur.stars   || 0,
        fracPt:  saved.cur.fracPt  || 0,
      };
      renderRankIcons('cur');
      renderSubRankBtns('cur');
      renderStars('cur');
    }
    if (saved.tgt && saved.tgt.rank) {
      rankSel.tgt = {
        rank:    saved.tgt.rank    || '',
        subRank: saved.tgt.subRank || '',
        stars:   saved.tgt.stars   || 0,
      };
      renderRankIcons('tgt');
      renderSubRankBtns('tgt');
      renderStars('tgt');
    }
    document.getElementById('rank-win-samples').value  = saved.winSamples  || '';
    document.getElementById('rank-draw-samples').value = saved.drawSamples || '';
    document.getElementById('rank-loss-samples').value = saved.lossSamples || '';
  }
}

// ===== ユーティリティ =====
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatNum(n) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString();
}

// ===== スクロールでヘッダー非表示（モバイルのみ） =====
function initScrollBehavior() {
  const header = document.querySelector('.ch-header');
  if (!header) return;
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) {
      header.classList.remove('header-hidden');
      return;
    }
    const currentY = window.scrollY;
    if (currentY > lastY && currentY > 60) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }
    lastY = currentY;
  }, { passive: true });
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', init);
