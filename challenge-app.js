// ===== ダークモード =====
(function () {
  if (localStorage.getItem('identity5_dark_mode') === 'on') {
    document.body.classList.add('dark-mode');
  }
})();

// ===== ヘルプツールチップ =====
(function () {
  const tooltip = document.createElement('div');
  tooltip.id = 'help-tooltip';
  document.body.appendChild(tooltip);

  let activeHelp = null;

  function showTooltip(el, text) {
    tooltip.textContent = text;
    tooltip.classList.add('visible');
    el.classList.add('active');
    activeHelp = el;

    const rect = el.getBoundingClientRect();
    const tw = 220;
    let left = rect.left + rect.width / 2 - tw / 2;
    let top  = rect.bottom + 6;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    if (top + 60 > window.innerHeight) top = rect.top - 60;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';
    tooltip.style.width = tw + 'px';
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
    if (activeHelp) { activeHelp.classList.remove('active'); activeHelp = null; }
  }

  document.addEventListener('click', function (e) {
    const el = e.target.closest('.ch-help');
    if (el) {
      e.stopPropagation();
      if (activeHelp === el) { hideTooltip(); return; }
      showTooltip(el, el.title);
      return;
    }
    hideTooltip();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideTooltip();
  });
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
  initCogCharSelect();
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

  // 保存済みゴールがあれば追跡ビューを復元
  const savedRankGoal = loadRankGoal();
  if (savedRankGoal) {
    showRankTrack(savedRankGoal);
  }
  // 認知ゴール: localStorageをスキャンして最初に見つかったゴールを復元
  const prefix = 'identity5_cog_goal_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const charName = key.slice(prefix.length);
      if (charName) {
        const savedCogGoal = loadCogGoal(charName);
        if (savedCogGoal) {
          showCogTrack(savedCogGoal);
          break;
        }
      }
    }
  }
}

// ===== タブ切替 =====
function switchTab(tab) {
  closeCogCharDropdown();
  document.getElementById('tab-rank').classList.toggle('active', tab === 'rank');
  document.getElementById('tab-cog').classList.toggle('active', tab === 'cog');
  const rankSec = document.getElementById('rank-section');
  const cogSec  = document.getElementById('cog-section');
  const showEl  = tab === 'rank' ? rankSec : cogSec;
  const hideEl  = tab === 'rank' ? cogSec  : rankSec;
  hideEl.classList.add('hidden');
  showEl.classList.remove('hidden');
  showEl.classList.add('section-fade-in');
  setTimeout(() => showEl.classList.remove('section-fade-in'), 200);
}

// ===== SearchableSelect（認知pt キャラ選択） =====
let ssOpen          = false;
let ssSelectedValue = '';

function getCogCharValue() { return ssSelectedValue; }

function setCogCharValue(val) {
  ssSelectedValue = val;
  const display = document.getElementById('cog-char-display');
  const trigger = document.getElementById('cog-char-trigger');
  if (!display) return;
  if (val) {
    display.textContent = val;
    trigger && trigger.classList.add('has-value');
  } else {
    display.textContent = '選択してください';
    trigger && trigger.classList.remove('has-value');
  }
}

function initCogCharSelect() {
  const container = document.getElementById('cog-char-ss');
  if (!container) return;
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) closeCogCharDropdown();
  });
}

function toggleCogCharDropdown() {
  ssOpen ? closeCogCharDropdown() : openCogCharDropdown();
}

function openCogCharDropdown() {
  ssOpen = true;
  const trigger = document.getElementById('cog-char-trigger');
  const dd      = document.getElementById('cog-char-dd');
  const input   = document.getElementById('cog-char-search');
  if (trigger) trigger.classList.add('open');
  if (dd)      dd.classList.remove('hidden');
  filterCogChar('');
  if (input)   { input.value = ''; input.focus(); }
}

function closeCogCharDropdown() {
  ssOpen = false;
  const trigger = document.getElementById('cog-char-trigger');
  const dd      = document.getElementById('cog-char-dd');
  if (trigger) trigger.classList.remove('open');
  if (dd)      dd.classList.add('hidden');
}

function ssNormalize(s) {
  // カタカナ → ひらがな変換してから小文字化
  return s.replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).toLowerCase();
}

function filterCogChar(query) {
  const list = document.getElementById('cog-char-list');
  if (!list) return;
  const q = ssNormalize(query.trim());
  const allChars = [
    ...SURVIVORS.map(c => ({ name: c, group: 'サバイバー' })),
    ...HUNTERS.map(c  => ({ name: c, group: 'ハンター'   })),
  ];
  const filtered = q
    ? allChars.filter(c => ssNormalize(c.name).includes(q))
    : allChars;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="ss-no-result">該当なし</div>';
    return;
  }

  let html = '';
  let lastGroup = null;
  filtered.forEach(item => {
    if (!q && item.group !== lastGroup) {
      html += `<div class="ss-group-label">${item.group}</div>`;
      lastGroup = item.group;
    }
    const active = item.name === ssSelectedValue ? ' active' : '';
    html += `<button type="button" class="ss-option${active}" onclick="selectCogChar('${item.name.replace(/'/g, "\\'")}')">${item.name}</button>`;
  });
  list.innerHTML = html;
}

function selectCogChar(name) {
  setCogCharValue(name);
  closeCogCharDropdown();
  onCogInput();
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
    `<span class="frac-pt-label">端数pt <span class="ch-help" title="現在の星と次の星の間に途中で積んでいるpt（0〜${max}）。ゲーム内で残りptを確認して入力すると精度が上がります">?</span></span>`;
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

// ===== 勝ち率取得 =====
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

// ===== 累積pt → 段位ポジション =====
function ptToPosition(pt) {
  const rankOrder = ['1段', '2段', '3段', '4段', '5段', '6段', '7段', '最高峰'];
  let rank = rankOrder[0];
  for (let i = rankOrder.length - 1; i >= 0; i--) {
    if (pt >= RANK_START_PT[rankOrder[i]]) { rank = rankOrder[i]; break; }
  }
  const cfg     = RANK_CONFIG[rank];
  const rankPt  = pt - RANK_START_PT[rank];
  if (rank === '最高峰') {
    return { rank, subRank: '', stars: cfg.starsMin + Math.floor(rankPt / cfg.ptPerStar) };
  }
  if (!cfg.subRanks) {
    return { rank, subRank: '', stars: Math.min(cfg.starsTotal - 1, Math.floor(rankPt / cfg.ptPerStar)) };
  }
  const ptPerSubRank = cfg.starsPerSubRank * cfg.ptPerStar;
  const subIdx = Math.min(cfg.subRanks.length - 1, Math.floor(rankPt / ptPerSubRank));
  const stars  = Math.min(cfg.starsPerSubRank - 1, Math.floor((rankPt - subIdx * ptPerSubRank) / cfg.ptPerStar));
  return { rank, subRank: cfg.subRanks[subIdx], stars };
}

function fmtPositionLabel(pos) {
  if (!pos) return '';
  if (pos.rank === '最高峰') return `最高峰 ${pos.stars}★`;
  if (!RANK_CONFIG[pos.rank]?.subRanks) return `${pos.rank} ${pos.stars}★`;
  return `${pos.rank}${pos.subRank} ${pos.stars}★`;
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
    ${col(upper,    'upper',    '勝ち率 ' + fmtPct(upperWr))}
    ${col(expected, 'expected', '勝ち率 ' + fmtPct(wr.winRate))}
    ${col(lower,    'lower',    '勝ち率 ' + fmtPct(lowerWr))}
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

  // 空状態ヒント
  if (cogCards.length === 0) {
    html += `<div class="cog-empty-hint">保存するとここにカードが表示されます</div>`;
  }

  row.innerHTML = html;
}

function onCogCardClick(idx) {
  activeCogCardIdx = idx;

  if (idx >= 0 && cogCards[idx]) {
    const card = cogCards[idx];
    setCogCharValue(card.charName || '');
    document.getElementById('cog-current').value       = card.currentPt   || '';
    document.getElementById('cog-target').value        = card.targetPt    || '';
    document.getElementById('cog-win-samples').value   = card.winSamples  || '';
    document.getElementById('cog-draw-samples').value  = card.drawSamples || '';
    document.getElementById('cog-loss-samples').value  = card.lossSamples || '';
  } else {
    setCogCharValue('');
    document.getElementById('cog-current').value       = '';
    document.getElementById('cog-target').value        = '';
    document.getElementById('cog-win-samples').value   = '';
    document.getElementById('cog-draw-samples').value  = '';
    document.getElementById('cog-loss-samples').value  = '';
  }

  renderCogCardsRow();
  onCogInput();

  // このキャラのゴールがあれば追跡ビューを復元、なければ追跡ビューを閉じる
  const char = idx >= 0 && cogCards[idx] ? cogCards[idx].charName : null;
  const cogGoal = char ? loadCogGoal(char) : null;
  if (cogGoal) {
    showCogTrack(cogGoal);
  } else {
    document.getElementById('cog-track').classList.add('hidden');
    document.getElementById('cog-section').querySelector('.ch-card').classList.remove('hidden');
  }
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
  const charName = getCogCharValue();
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
  showCogTrackBtn(false);
  updateAvgDisplay('cog-win-samples',  'cog-win-avg');
  updateAvgDisplay('cog-draw-samples', 'cog-draw-avg');
  updateAvgDisplay('cog-loss-samples', 'cog-loss-avg');
  saveCogInputs();

  const resultEl  = document.getElementById('cog-result');
  const charName  = getCogCharValue();
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
    <strong>${charName}</strong> — 直近${wr.total}試合 / 勝ち率 <strong>${(wr.winRate * 100).toFixed(1)}%</strong>
    　勝: ${wr.wins} / 分: ${wr.draws} / 負: ${wr.losses}`;
  if (wr.total < 10) {
    html += `<div class="result-data-warn">⚠️ データが${wr.total}試合と少ないため精度が低い場合があります</div>`;
  }
  html += `</div>`;

  html += `<div class="result-remaining">残り <strong>${formatNum(remaining)} pt</strong> 　期待pt/試合: ${(wr.winRate * avgWin + wr.drawRate * avgDraw + wr.lossRate * avgLoss).toFixed(1)}pt</div>`;

  html += buildPredTable(upper, expected, lower, wr);

  if (showNote) {
    html += `<div class="guard-note">目標との差が大きい場合、ポイント増減値が変動することがあります。実態と予測がずれてきたら、サンプル値をこまめに更新してください。</div>`;
  }

  resultEl.innerHTML = html;
  showCogTrackBtn(true);
}

// ===== 段位pt セクション =====
function onRankInput() {
  showRankTrackBtn(false);
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
    直近${wr.total}試合 / 勝ち率 <strong>${(wr.winRate * 100).toFixed(1)}%</strong>
    　勝: ${wr.wins} / 分: ${wr.draws} / 負: ${wr.losses}
  </div>`;

  const expectedPtPerMatch = wr.winRate * avgWin + wr.drawRate * avgDraw + wr.lossRate * avgLoss;
  html += `<div class="result-remaining">
    <span style="font-size:13px;color:#6b7280;">${curLabel} → ${tgtLabel}</span><br>
    残り <strong>${formatNum(remaining)} pt</strong> 　期待pt/試合: ${expectedPtPerMatch.toFixed(1)}pt
  </div>`;

  html += buildPredTable(upper, expected, lower, wr);

  resultEl.innerHTML = html;
  showRankTrackBtn(true);
}

// ===== ローカルストレージ 保存・復元 =====
function saveCogInputs() {
  const data = {
    char:        getCogCharValue(),
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
    setCogCharValue(cog.char || '');
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

// ===== 目標追跡 =====

// Chart.jsインスタンス
const trackCharts = {};

// キャリブレーションモーダルの対象
let calibTarget = null; // { type: 'rank'|'cog', char: string|null }

// --- ゴール保存・読み込み ---
function loadRankGoal() {
  try { return JSON.parse(localStorage.getItem('identity5_rank_goal') || 'null'); } catch (_) { return null; }
}
function saveRankGoal(goal) {
  localStorage.setItem('identity5_rank_goal', JSON.stringify(goal));
}
function deleteRankGoal() {
  localStorage.removeItem('identity5_rank_goal');
}
function loadCogGoal(charName) {
  try { return JSON.parse(localStorage.getItem('identity5_cog_goal_' + charName) || 'null'); } catch (_) { return null; }
}
function saveCogGoal(charName, goal) {
  localStorage.setItem('identity5_cog_goal_' + charName, JSON.stringify(goal));
}
function deleteCogGoal(charName) {
  localStorage.removeItem('identity5_cog_goal_' + charName);
}

// --- 試合数カウント ---
function countPerspectiveMatches() {
  // 段位ptは全試合を対象（perspective不問）
  return matches.length;
}
function countCharMatches(charName) {
  return matches.filter(m => m.myCharacter === charName).length;
}

// --- ゴール後の試合数を取得 ---
function getMatchesSinceGoalStart(goal, type, charName) {
  let total;
  if (type === 'rank') {
    total = countPerspectiveMatches();
  } else {
    total = countCharMatches(charName);
  }
  return Math.max(0, total - goal.startMatchIndex);
}

// --- 区間ごとの予測pt計算 ---
function calcCurrentPredictedPt(goal, totalSinceGoal, wr) {
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const basePt       = lastCalib ? lastCalib.actualPt : goal.startPt;
  const baseMatchIdx = lastCalib ? lastCalib.matchIndex : 0;
  const winAvg  = (lastCalib && lastCalib.winAvg  != null) ? lastCalib.winAvg  : goal.winAvg;
  const drawAvg = (lastCalib && lastCalib.drawAvg != null) ? lastCalib.drawAvg : (goal.drawAvg || 0);
  const lossAvg = (lastCalib && lastCalib.lossAvg != null) ? lastCalib.lossAvg : goal.lossAvg;

  const matchesSinceBase = totalSinceGoal - baseMatchIdx;
  if (matchesSinceBase <= 0 || !wr) return basePt;

  const expectedPerMatch = wr.winRate * winAvg + wr.drawRate * drawAvg + wr.lossRate * lossAvg;
  return basePt + matchesSinceBase * expectedPerMatch;
}

// --- グラフ描画 ---
function renderTrackChart(canvasId, goal, totalSinceGoal, wr) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  if (trackCharts[canvasId]) {
    trackCharts[canvasId].destroy();
    delete trackCharts[canvasId];
  }

  // セグメント構築
  const segments = [];
  let prev = {
    matchIdx: 0, pt: goal.startPt,
    winAvg: goal.winAvg, drawAvg: goal.drawAvg || 0, lossAvg: goal.lossAvg,
  };
  goal.calibrations.forEach(c => {
    segments.push({ ...prev, endMatchIdx: c.matchIndex, endActualPt: c.actualPt });
    prev = {
      matchIdx: c.matchIndex, pt: c.actualPt,
      winAvg:  c.winAvg  != null ? c.winAvg  : goal.winAvg,
      drawAvg: c.drawAvg != null ? c.drawAvg : (goal.drawAvg || 0),
      lossAvg: c.lossAvg != null ? c.lossAvg : goal.lossAvg,
    };
  });
  segments.push({ ...prev, endMatchIdx: totalSinceGoal, endActualPt: null });

  // 予測ライン（過去～現在）
  const predictedLine = [{ x: 0, y: goal.startPt }];
  const calibDots = [];

  segments.forEach(seg => {
    const exp = wr
      ? wr.winRate * seg.winAvg + wr.drawRate * (seg.drawAvg || 0) + wr.lossRate * seg.lossAvg
      : seg.winAvg * 0.5 + seg.lossAvg * 0.5;
    const matchesInSeg = seg.endMatchIdx - seg.matchIdx;
    const predictedAtEnd = seg.pt + matchesInSeg * exp;
    predictedLine.push({ x: seg.endMatchIdx, y: predictedAtEnd });
    if (seg.endActualPt != null) {
      calibDots.push({ x: seg.endMatchIdx, y: seg.endActualPt });
      // 次セグメントは実測値から開始（予測ラインを補正）
      predictedLine[predictedLine.length - 1] = { x: seg.endMatchIdx, y: seg.endActualPt };
    }
  });

  // 将来予測ライン
  const currentPredicted = predictedLine[predictedLine.length - 1].y;
  const lastSeg = segments[segments.length - 1];
  const lastExp = wr
    ? wr.winRate * lastSeg.winAvg + wr.drawRate * (lastSeg.drawAvg || 0) + wr.lossRate * lastSeg.lossAvg
    : 1;
  const futureLine = [{ x: totalSinceGoal, y: currentPredicted }];
  if (lastExp > 0) {
    const remainingPt = goal.targetPt - currentPredicted;
    const remainingMatches = Math.max(1, Math.ceil(remainingPt / lastExp));
    futureLine.push({ x: totalSinceGoal + remainingMatches, y: goal.targetPt });
  }

  const maxX = futureLine[futureLine.length - 1].x;
  const minY = Math.min(goal.startPt, goal.targetPt * 0.95) * 0.98;
  const maxY = goal.targetPt * 1.02;

  const isDark = document.body.classList.contains('dark-mode');
  const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  trackCharts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          label: '目標',
          data: [{ x: 0, y: goal.targetPt }, { x: maxX, y: goal.targetPt }],
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 0,
        },
        {
          label: '予測推移',
          data: predictedLine,
          borderColor: '#3b82f6',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 1,
        },
        {
          label: '将来予測',
          data: futureLine,
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 2,
        },
        {
          label: '実測値',
          data: calibDots,
          borderColor: '#ffffff',
          backgroundColor: '#10b981',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false,
          order: 3,
        },
        {
          label: '現在',
          data: [{ x: totalSinceGoal, y: currentPredicted }],
          borderColor: '#ffffff',
          backgroundColor: '#3b82f6',
          borderWidth: 2,
          pointRadius: 6,
          showLine: false,
          order: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y).toLocaleString()}pt`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: maxX,
          title: { display: true, text: '試合数', color: labelColor, font: { size: 11 } },
          ticks: { color: labelColor, font: { size: 10 }, maxTicksLimit: 6 },
          grid: { color: gridColor },
        },
        y: {
          min: minY,
          max: maxY,
          title: { display: true, text: 'pt', color: labelColor, font: { size: 11 } },
          ticks: {
            color: labelColor, font: { size: 10 }, maxTicksLimit: 5,
            callback: v => Math.round(v).toLocaleString(),
          },
          grid: { color: gridColor },
        },
      },
    },
  });
}

// --- サマリーHTML生成 ---
function buildTrackSummaryHtml(goal, totalSinceGoal, predictedPt, wr, lastExp) {
  const achieved     = predictedPt >= goal.targetPt;
  const remaining    = Math.max(0, goal.targetPt - predictedPt);
  const range        = goal.targetPt - goal.startPt;
  const progress     = range > 0 ? Math.min(100, Math.max(0, (predictedPt - goal.startPt) / range * 100)) : 0;
  const estMatches   = (!achieved && lastExp > 0) ? Math.ceil(remaining / lastExp) : null;
  const lastCalib    = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const calibCount   = goal.calibrations.length;

  let html = '';

  if (achieved) {
    html += `<div class="track-achieved">目標達成！おめでとうございます</div>`;
  }

  const isRankGoal = !goal.char;
  if (isRankGoal) {
    const curPos = ptToPosition(predictedPt);
    const tgtPos = ptToPosition(goal.targetPt);
    html += `
    <div class="track-rank-main-row">
      <span class="track-rank-cur">${fmtPositionLabel(curPos)}</span>
      <span class="track-rank-arrow">→</span>
      <span class="track-rank-tgt">目標 ${fmtPositionLabel(tgtPos)}</span>
    </div>`;
  }

  html += `
    <div class="track-pt-row${isRankGoal ? ' track-pt-row--sub' : ''}">
      <span class="track-pt-current">${Math.round(predictedPt).toLocaleString()}</span>
      <span class="track-pt-sep">pt</span>
      <span class="track-pt-sep">/</span>
      <span class="track-pt-target">目標 ${Math.round(goal.targetPt).toLocaleString()}pt</span>
    </div>
    <div class="track-pt-remaining">
      ${achieved
        ? `<strong style="color:#059669">目標を達成しました！</strong>`
        : `残り <strong>${Math.round(remaining).toLocaleString()}pt</strong>${estMatches !== null ? `　推定あと <strong>${estMatches}試合</strong>` : ''}`
      }
    </div>
    <div class="track-matches-row">${goal.createdDate} スタート · ${totalSinceGoal}試合経過　${wr ? `（勝ち率 ${(wr.winRate * 100).toFixed(1)}%）` : ''}</div>
    <div class="track-progress-wrap">
      <div class="track-progress-bar" style="width:${progress.toFixed(1)}%"></div>
    </div>
    <div class="track-progress-pct">${progress.toFixed(1)}%</div>`;

  if (calibCount === 0) {
    html += `<div class="track-calib-note">数試合後にキャリブレーションで実際のptを入力すると精度が上がります</div>`;
  } else {
    const lastDate = lastCalib ? lastCalib.date : '';
    html += `<div class="track-calib-note">最終キャリブレーション: ${lastDate}（${calibCount}回）</div>`;
  }

  return html;
}

// --- 段位ゴール開始 ---
function startRankGoal() {
  const { cur, tgt } = rankSel;
  const winS  = parsePtSamples(document.getElementById('rank-win-samples').value);
  const drawS = parsePtSamples(document.getElementById('rank-draw-samples').value);
  const lossS = parsePtSamples(document.getElementById('rank-loss-samples').value);

  if (!winS || !lossS) return;
  const currentPt = positionToPt(cur.rank, cur.subRank, cur.stars) + (cur.fracPt || 0);
  const targetPt  = positionToPt(tgt.rank, tgt.subRank, tgt.stars);
  if (currentPt === null || targetPt === null || targetPt <= currentPt) return;

  const today = new Date().toISOString().slice(0, 10);
  const goal = {
    createdDate: today,
    startPt: currentPt,
    startMatchIndex: countPerspectiveMatches(),
    targetPt,
    winAvg:  winS.avg,
    drawAvg: drawS ? drawS.avg : 0,
    lossAvg: lossS.avg,
    calibrations: [],
  };
  saveRankGoal(goal);
  showRankTrack(goal);
}

// --- 認知ゴール開始 ---
function startCogGoal() {
  const charName  = getCogCharValue();
  const currentPt = parseFloat(document.getElementById('cog-current').value);
  const targetPt  = parseFloat(document.getElementById('cog-target').value);
  const winS  = parsePtSamples(document.getElementById('cog-win-samples').value);
  const drawS = parsePtSamples(document.getElementById('cog-draw-samples').value);
  const lossS = parsePtSamples(document.getElementById('cog-loss-samples').value);

  if (!charName || isNaN(currentPt) || isNaN(targetPt) || targetPt <= currentPt) return;
  if (!winS || !lossS) return;

  const today = new Date().toISOString().slice(0, 10);
  const goal = {
    char: charName,
    createdDate: today,
    startPt: currentPt,
    startMatchIndex: countCharMatches(charName),
    targetPt,
    winAvg:  winS.avg,
    drawAvg: drawS ? drawS.avg : 0,
    lossAvg: lossS.avg,
    calibrations: [],
  };
  saveCogGoal(charName, goal);
  showCogTrack(goal);
}

// --- 段位追跡ビュー表示 ---
function showRankTrack(goal) {
  if (!goal) return;
  document.getElementById('rank-section').querySelector('.ch-card').classList.add('hidden');
  document.getElementById('rank-track').classList.remove('hidden');
  showRankTrackBtn(false);

  const totalSinceGoal = getMatchesSinceGoalStart(goal, 'rank', null);
  const wr = getOverallWinrate();
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const winAvg  = (lastCalib && lastCalib.winAvg  != null) ? lastCalib.winAvg  : goal.winAvg;
  const drawAvg = (lastCalib && lastCalib.drawAvg != null) ? lastCalib.drawAvg : (goal.drawAvg || 0);
  const lossAvg = (lastCalib && lastCalib.lossAvg != null) ? lastCalib.lossAvg : goal.lossAvg;
  const lastExp = wr ? wr.winRate * winAvg + wr.drawRate * drawAvg + wr.lossRate * lossAvg : 0;
  const predictedPt = calcCurrentPredictedPt(goal, totalSinceGoal, wr);

  document.getElementById('rank-track-summary').innerHTML =
    buildTrackSummaryHtml(goal, totalSinceGoal, predictedPt, wr, lastExp);

  setTimeout(() => renderTrackChart('rank-track-chart', goal, totalSinceGoal, wr), 0);
}

// --- 認知追跡ビュー表示 ---
function showCogTrack(goal) {
  if (!goal) return;
  const cogTrackEl = document.getElementById('cog-track');
  document.getElementById('cog-section').querySelector('.ch-card').classList.add('hidden');
  cogTrackEl.classList.remove('hidden');
  cogTrackEl.dataset.char = goal.char;
  document.getElementById('cog-track-title').textContent = `認知pt 追跡中（${goal.char}）`;
  showCogTrackBtn(false);

  const totalSinceGoal = getMatchesSinceGoalStart(goal, 'cog', goal.char);
  const wr = getCharWinrate(goal.char);
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const winAvg  = (lastCalib && lastCalib.winAvg  != null) ? lastCalib.winAvg  : goal.winAvg;
  const drawAvg = (lastCalib && lastCalib.drawAvg != null) ? lastCalib.drawAvg : (goal.drawAvg || 0);
  const lossAvg = (lastCalib && lastCalib.lossAvg != null) ? lastCalib.lossAvg : goal.lossAvg;
  const lastExp = wr ? wr.winRate * winAvg + wr.drawRate * drawAvg + wr.lossRate * lossAvg : 0;
  const predictedPt = calcCurrentPredictedPt(goal, totalSinceGoal, wr);

  document.getElementById('cog-track-summary').innerHTML =
    buildTrackSummaryHtml(goal, totalSinceGoal, predictedPt, wr, lastExp);

  // calibTarget を現在の認知ゴールのキャラに合わせる
  document.querySelector('#cog-track .calib-btn').onclick = () => openCalibModal('cog', goal.char);

  setTimeout(() => renderTrackChart('cog-track-chart', goal, totalSinceGoal, wr), 0);
}

// --- ゴールリセット ---
function resetRankGoal() {
  if (!confirm('段位ptのゴールをリセットしますか？')) return;
  deleteRankGoal();
  document.getElementById('rank-track').classList.add('hidden');
  document.getElementById('rank-section').querySelector('.ch-card').classList.remove('hidden');
  if (trackCharts['rank-track-chart']) {
    trackCharts['rank-track-chart'].destroy();
    delete trackCharts['rank-track-chart'];
  }
  onRankInput();
}

function resetCogGoal() {
  const cogTrackEl = document.getElementById('cog-track');
  const char = cogTrackEl ? cogTrackEl.dataset.char : null;
  if (!char) return;
  if (!confirm(`${char}の認知ptゴールをリセットしますか？`)) return;
  deleteCogGoal(char);
  cogTrackEl.classList.add('hidden');
  delete cogTrackEl.dataset.char;
  document.getElementById('cog-section').querySelector('.ch-card').classList.remove('hidden');
  if (trackCharts['cog-track-chart']) {
    trackCharts['cog-track-chart'].destroy();
    delete trackCharts['cog-track-chart'];
  }
  onCogInput();
}

// --- キャリブレーションモーダル ---
function openCalibModal(type, char) {
  calibTarget = { type, char };
  // 現在のサンプルをプリセット
  const goal = type === 'rank' ? loadRankGoal() : loadCogGoal(char);
  const lastCalib = goal && goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const winAvg  = (lastCalib && lastCalib.winAvg  != null) ? lastCalib.winAvg  : goal?.winAvg;
  const drawAvg = (lastCalib && lastCalib.drawAvg != null) ? lastCalib.drawAvg : goal?.drawAvg;
  const lossAvg = (lastCalib && lastCalib.lossAvg != null) ? lastCalib.lossAvg : goal?.lossAvg;

  document.getElementById('calib-actual-pt').value    = '';
  document.getElementById('calib-win-samples').value  = winAvg  != null ? String(winAvg)  : '';
  document.getElementById('calib-draw-samples').value = drawAvg != null ? String(drawAvg) : '';
  document.getElementById('calib-loss-samples').value = lossAvg != null ? String(lossAvg) : '';
  document.getElementById('calib-samples-area').classList.add('hidden');
  document.getElementById('calib-samples-arrow').textContent = '▶';
  document.getElementById('calib-modal').classList.remove('hidden');
}

function closeCalibModal() {
  document.getElementById('calib-modal').classList.add('hidden');
  calibTarget = null;
}

function toggleCalibSamples() {
  const area  = document.getElementById('calib-samples-area');
  const arrow = document.getElementById('calib-samples-arrow');
  const hidden = area.classList.toggle('hidden');
  arrow.textContent = hidden ? '▶' : '▼';
}

function saveCalibration() {
  if (!calibTarget) return;
  const actualPt = parseFloat(document.getElementById('calib-actual-pt').value);
  if (isNaN(actualPt)) { alert('実際のptを入力してください'); return; }

  const winS  = parsePtSamples(document.getElementById('calib-win-samples').value);
  const drawS = parsePtSamples(document.getElementById('calib-draw-samples').value);
  const lossS = parsePtSamples(document.getElementById('calib-loss-samples').value);
  const today = new Date().toISOString().slice(0, 10);

  const { type, char } = calibTarget;
  const goal = type === 'rank' ? loadRankGoal() : loadCogGoal(char);
  if (!goal) { closeCalibModal(); return; }

  const totalSince = getMatchesSinceGoalStart(goal, type, char);
  const calibEntry = {
    matchIndex: totalSince,
    actualPt,
    date: today,
    winAvg:  winS  ? winS.avg  : null,
    drawAvg: drawS ? drawS.avg : null,
    lossAvg: lossS ? lossS.avg : null,
  };
  goal.calibrations.push(calibEntry);

  if (type === 'rank') {
    saveRankGoal(goal);
    closeCalibModal();
    showRankTrack(goal);
  } else {
    saveCogGoal(char, goal);
    closeCalibModal();
    showCogTrack(goal);
  }
}

// --- 追跡ボタンの表示制御 ---
function showRankTrackBtn(show) {
  const btn = document.getElementById('rank-track-btn');
  if (btn) btn.classList.toggle('hidden', !show);
}
function showCogTrackBtn(show) {
  const btn = document.getElementById('cog-track-btn');
  if (btn) btn.classList.toggle('hidden', !show);
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', init);
