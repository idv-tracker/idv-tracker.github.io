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

// ===== 状態 =====
let matches    = [];
let lastUpdated = null;

// 段位選択状態
const rankSel = {
  cur:   { rank: '', subRank: '', stars: 0, fracPt: 0 },
  tgt:   { rank: '', subRank: '', stars: 0 },
  calib: { rank: '', subRank: '', stars: 0, fracPt: 0 },
};

// 認知ptカード
let cogCards          = [];
let activeCogCardIdx  = -1; // -1 = 新規

// 段位アイコン陣営
let rankIconSide = localStorage.getItem('identity5_challenge_rank_side') || 'hunters';

// ===== 接続モジュール =====
const _conn = createConnectModule({
  onConnected(m, lu) { matches = m; lastUpdated = lu; showMainPage(); },
  onNoData()         { showConnectPage(); },
  onGoalsLoaded(goals) { importGoalsFromCloud(goals); },
});

function init() {
  initCogCharSelect();
  renderRankIcons('cur');
  renderRankIcons('tgt');
  loadCogCards();
  loadSavedInputs();
  _conn.startup();
}

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
  // 認知ゴール: 最後にアクティブだったキャラのゴールを復元
  const activeCogChar = localStorage.getItem('identity5_cog_goal_active');
  if (activeCogChar) {
    const savedCogGoal = loadCogGoal(activeCogChar);
    if (savedCogGoal) {
      showCogTrack(savedCogGoal);
    }
  }
}

// ===== タブ切替 =====
function switchTab(tab) {
  if (cogCharSS && cogCharSS.isOpen) cogCharSS._close();
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

// ===== キャラ選択 SearchableSelect =====
let cogCharSS = null;

function getCogCharValue() {
  return cogCharSS ? cogCharSS.value : '';
}

function setCogCharValue(val) {
  if (cogCharSS) cogCharSS.setValue(val);
}

function initCogCharSelect() {
  const selectEl = document.getElementById('cog-char-select');
  if (!selectEl) return;
  // optionを生成
  [...SURVIVORS.map(c => ({ c, g: 'サバイバー' })), ...HUNTERS.map(c => ({ c, g: 'ハンター' }))].forEach(({ c }) => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = c;
    selectEl.appendChild(opt);
  });
  cogCharSS = new SearchableSelect(selectEl, () => { onCogInput(); });
}

// ===== 段位アイコン描画 =====
function setRankIconSide(side) {
  rankIconSide = side;
  localStorage.setItem('identity5_challenge_rank_side', side);
  document.getElementById('rank-side-survivors').classList.toggle('active', side === 'survivors');
  document.getElementById('rank-side-hunters').classList.toggle('active', side === 'hunters');
  renderRankIcons('cur');
  renderRankIcons('tgt');
  // 陣営切替時にゴール追跡ビューを切り替え
  refreshRankGoalView();
}

function refreshRankGoalView() {
  const trackEl = document.getElementById('rank-track');
  const formEl = document.getElementById('rank-section').querySelector('.ch-card');
  if (trackCharts['rank-track-chart']) {
    trackCharts['rank-track-chart'].destroy();
    delete trackCharts['rank-track-chart'];
  }
  const goal = loadRankGoal();
  if (goal) {
    showRankTrack(goal);
  } else {
    trackEl.classList.add('hidden');
    formEl.classList.remove('hidden');
    onRankInput();
  }
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
  if (type === 'calib') rankSel[type].fracPt = 0;
  renderRankIcons(type);
  renderSubRankBtns(type);
  renderStars(type);
  if (type !== 'calib') onRankInput();
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
  if (type !== 'calib') onRankInput();
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

  const showFrac = type === 'cur' || type === 'calib';

  // 最高峰: 数値入力（25〜）
  if (rank === '最高峰') {
    area.classList.remove('hidden');
    const val = (stars >= 25) ? stars : 25;
    area.innerHTML =
      `<span class="stars-label">星数</span>` +
      `<input type="number" class="stars-num-input" id="rank-${type}-stars-inf"` +
      ` min="25" value="${val}" oninput="onStarsInfChange('${type}')">` +
      (showFrac ? buildFracPtHtml(cfg.ptPerStar, type) : '');
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
      (showFrac ? buildFracPtHtml(cfg.ptPerStar, type) : '');
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
  if (showFrac) html += buildFracPtHtml(cfg.ptPerStar, type);
  area.innerHTML = html;
}

function buildFracPtHtml(ptPerStar, type) {
  type = type || 'cur';
  const max    = ptPerStar - 1;
  const curVal = rankSel[type].fracPt || 0;
  return `<span class="frac-pt-sep">＋</span>` +
    `<input type="number" class="frac-pt-input" id="rank-${type}-frac-pt"` +
    ` min="0" max="${max}" value="${curVal}"` +
    ` placeholder="0" title="端数pt（星の途中で獲得済みのpt）" oninput="onFracPtChange('${type}')">` +
    `<span class="frac-pt-label">端数pt <span class="ch-help" title="現在の星と次の星の間に途中で積んでいるpt（0〜${max}）。ゲーム内で残りptを確認して入力すると精度が上がります">?</span></span>`;
}

function onStarClick(type, n) {
  rankSel[type].stars = rankSel[type].stars === n ? n - 1 : n;
  renderStars(type);
  if (type !== 'calib') onRankInput();
}

function onStarsInfChange(type) {
  const el = document.getElementById(`rank-${type}-stars-inf`);
  if (!el) return;
  const min = rankSel[type].rank === '最高峰' ? 25 : 0;
  rankSel[type].stars = Math.max(min, parseInt(el.value) || min);
  if (type !== 'calib') onRankInput();
}

function onFracPtChange(type) {
  type = type || 'cur';
  const el = document.getElementById(`rank-${type}-frac-pt`);
  if (!el) return;
  const cfg    = RANK_CONFIG[rankSel[type].rank];
  const maxVal = cfg ? cfg.ptPerStar - 1 : 99;
  rankSel[type].fracPt = Math.min(maxVal, Math.max(0, parseInt(el.value) || 0));
  if (type !== 'calib') onRankInput();
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

// 指定 perspective の直近n件
function getRecentMatches(n = 50, perspective) {
  const pool = perspective
    ? matches.filter(m => m.perspective === perspective)
    : matches;
  return sortedByRecent(pool).slice(0, n);
}

// キャリブレーション値のフォールバック取得
function calibVal(lastCalib, key, fallback) {
  return (lastCalib && lastCalib[key] != null) ? lastCalib[key] : fallback;
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

// 認知用: キャラ個別の試合のみで勝率を計算（他キャラで補充しない）
function getCharOnlyWinrate(charName, n = 50) {
  const perspective = SURVIVORS.includes(charName) ? 'survivor' : 'hunter';
  const charMatches = sortedByRecent(matches.filter(m => m.perspective === perspective && m.myCharacter === charName)).slice(0, n);
  return calcWinStats(charMatches);
}

// 段位用: 現在選択中の陣営に絞った勝率
function getOverallWinrate() {
  const perspective = rankIconSide === 'survivors' ? 'survivor' : 'hunter';
  return calcWinStats(getRecentMatches(50, perspective));
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
    const imgSrc  = buildIconPath(card.charName, SURVIVORS.includes(card.charName) ? 'survivor' : 'hunter');
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
    html += `<div class="cog-empty-hint">キャラクターを選択するとカードが自動保存されます</div>`;
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
  if (!charName) { showToast('キャラクターを選択してください', 'error'); return; }

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

// キャラ名が入力済みなら自動的にカードを保存（手動保存ボタン不要）
function autoSaveCogCard() {
  const charName = getCogCharValue();
  if (!charName) return;

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
    // 既存カードと同じキャラがあればそちらを更新
    const existingIdx = cogCards.findIndex(c => c.charName === charName);
    if (existingIdx >= 0) {
      cogCards[existingIdx] = card;
      activeCogCardIdx = existingIdx;
    } else {
      cogCards.push(card);
      activeCogCardIdx = cogCards.length - 1;
    }
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
  autoSaveCogCard();

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

  const wr = getCharOnlyWinrate(charName);
  if (!wr) {
    resultEl.innerHTML = `<div class="result-error">⚠️ このキャラクターの対戦データがありません<br><span style="font-size:12px;color:#6b7280;">トラッカーに${escapeHTML(charName)}での試合を記録してください</span></div>`;
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

  const cogSideLabel = SURVIVORS.includes(charName) ? 'サバイバー' : 'ハンター';
  html += `<div class="result-data-info">
    <strong>${escapeHTML(charName)}</strong>（${cogSideLabel}） — 直近${wr.total}試合 / 勝ち率 <strong>${(wr.winRate * 100).toFixed(1)}%</strong>
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

  const sideLabel = rankIconSide === 'survivors' ? 'サバイバー' : 'ハンター';
  html += `<div class="result-data-info">
    ${sideLabel}直近${wr.total}試合 / 勝ち率 <strong>${(wr.winRate * 100).toFixed(1)}%</strong>
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


// ===== 目標追跡 =====

// Chart.jsインスタンス
const trackCharts = {};

// キャリブレーションモーダルの対象
let calibTarget = null; // { type: 'rank'|'cog', char: string|null }

// --- ゴール保存・読み込み ---
function rankGoalKey() {
  return 'identity5_rank_goal_' + rankIconSide;
}
function loadRankGoal() {
  // 新キー優先、旧キーからのマイグレーション
  const key = rankGoalKey();
  let data = localStorage.getItem(key);
  if (!data) {
    data = localStorage.getItem('identity5_rank_goal');
    if (data) {
      localStorage.setItem(key, data);
      localStorage.removeItem('identity5_rank_goal');
    }
  }
  try { return JSON.parse(data || 'null'); } catch (_) { return null; }
}
function saveRankGoal(goal) {
  localStorage.setItem(rankGoalKey(), JSON.stringify(goal));
  syncGoalsToCloud();
}
function deleteRankGoal() {
  localStorage.removeItem(rankGoalKey());
  syncGoalsToCloud();
}
function loadCogGoal(charName) {
  try { return JSON.parse(localStorage.getItem('identity5_cog_goal_' + charName) || 'null'); } catch (_) { return null; }
}
function saveCogGoal(charName, goal) {
  localStorage.setItem('identity5_cog_goal_' + charName, JSON.stringify(goal));
  syncGoalsToCloud();
}
function deleteCogGoal(charName) {
  localStorage.removeItem('identity5_cog_goal_' + charName);
  syncGoalsToCloud();
}

// --- クラウド同期: ゴールデータ ---
function collectGoalsForSync() {
  const goals = { rankGoals: {}, cogGoals: {} };
  // 段位ゴール (survivors / hunters)
  for (const side of ['survivors', 'hunters']) {
    const data = localStorage.getItem('identity5_rank_goal_' + side);
    if (data) try { goals.rankGoals[side] = JSON.parse(data); } catch (_) {}
  }
  // 認知ゴール
  const prefix = 'identity5_cog_goal_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const charName = key.slice(prefix.length);
      if (charName) try { goals.cogGoals[charName] = JSON.parse(localStorage.getItem(key)); } catch (_) {}
    }
  }
  return goals;
}

function syncGoalsToCloud() {
  const ref = _conn.getDocRef();
  if (!ref) return; // 未接続 or Firebase不可
  const goals = collectGoalsForSync();
  ref.set({ goals }, { merge: true }).catch(e => console.warn('Goal sync failed:', e));
}

function importGoalsFromCloud(goals) {
  if (!goals) return;
  // 段位ゴール（クラウドで常に上書き）
  if (goals.rankGoals) {
    for (const [side, goal] of Object.entries(goals.rankGoals)) {
      if (goal) {
        localStorage.setItem('identity5_rank_goal_' + side, JSON.stringify(goal));
      }
    }
  }
  // 認知ゴール（クラウドで常に上書き）
  if (goals.cogGoals) {
    for (const [charName, goal] of Object.entries(goals.cogGoals)) {
      if (goal) {
        localStorage.setItem('identity5_cog_goal_' + charName, JSON.stringify(goal));
      }
    }
  }
}

// --- 試合数カウント ---
function countPerspectiveMatches() {
  const perspective = rankIconSide === 'survivors' ? 'survivor' : 'hunter';
  return matches.filter(m => m.perspective === perspective).length;
}
function countCharMatches(charName) {
  const perspective = SURVIVORS.includes(charName) ? 'survivor' : 'hunter';
  return matches.filter(m => m.perspective === perspective && m.myCharacter === charName).length;
}

// --- ゴール後の試合数を取得（日付ベース） ---
function getMatchesSinceGoalStart(goal, type, charName) {
  const perspective = type === 'rank'
    ? (rankIconSide === 'survivors' ? 'survivor' : 'hunter')
    : (SURVIVORS.includes(charName) ? 'survivor' : 'hunter');
  const since = goal.createdDate || '1970-01-01';
  return matches.filter(m =>
    m.perspective === perspective &&
    m.date >= since &&
    (type === 'rank' || m.myCharacter === charName)
  ).length;
}

// --- 区間ごとの予測pt計算 ---
function calcCurrentPredictedPt(goal, totalSinceGoal, wr) {
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const basePt       = lastCalib ? lastCalib.actualPt : goal.startPt;
  const baseMatchIdx = lastCalib ? lastCalib.matchIndex : 0;
  const winAvg  = calibVal(lastCalib, 'winAvg',  goal.winAvg);
  const drawAvg = calibVal(lastCalib, 'drawAvg', goal.drawAvg || 0);
  const lossAvg = calibVal(lastCalib, 'lossAvg', goal.lossAvg);

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

  // 将来予測ライン（期待値・上振れ・下振れ）
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

  // 上振れ・下振れ将来予測帯（各ラインが独自の終点を持つ）
  const futureUpper = [{ x: totalSinceGoal, y: currentPredicted }];
  const futureLower = [{ x: totalSinceGoal, y: currentPredicted }];
  if (wr && currentPredicted < goal.targetPt) {
    const upperWr = Math.min(1, wr.winRate + 0.05);
    const lowerWr = Math.max(0, wr.winRate - 0.05);
    const upperLossRate = Math.max(0, 1 - upperWr - wr.drawRate);
    const lowerLossRate = Math.max(0, 1 - lowerWr - wr.drawRate);
    const upperExp = upperWr * lastSeg.winAvg + wr.drawRate * (lastSeg.drawAvg || 0) + upperLossRate * lastSeg.lossAvg;
    const lowerExp = lowerWr * lastSeg.winAvg + wr.drawRate * (lastSeg.drawAvg || 0) + lowerLossRate * lastSeg.lossAvg;
    const remainPt = goal.targetPt - currentPredicted;
    // 上振れ: 早く目標到達
    if (upperExp > 0) {
      const upperMatches = Math.max(1, Math.ceil(remainPt / upperExp));
      futureUpper.push({ x: totalSinceGoal + upperMatches, y: goal.targetPt });
    }
    // 下振れ: 遅く目標到達
    if (lowerExp > 0) {
      const lowerMatches = Math.max(1, Math.ceil(remainPt / lowerExp));
      futureLower.push({ x: totalSinceGoal + lowerMatches, y: goal.targetPt });
    }
  }

  // x軸は下振れライン（最も遅い到達）に合わせる
  const expectedMaxX = futureLine.length > 1 ? futureLine[1].x : totalSinceGoal + 1;
  const lowerMaxX = futureLower.length > 1 ? futureLower[1].x : expectedMaxX;
  const maxX = Math.max(expectedMaxX, lowerMaxX);
  const minY = Math.min(goal.startPt, goal.targetPt * 0.95) * 0.98;
  const maxY = goal.targetPt * 1.05;

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
          label: '上振れ',
          data: futureUpper,
          borderColor: 'rgba(16,185,129,0.3)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 5,
        },
        {
          label: '下振れ',
          data: futureLower,
          borderColor: 'rgba(239,68,68,0.3)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: '-1',
          backgroundColor: 'rgba(59,130,246,0.06)',
          tension: 0,
          order: 6,
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
function buildTrackSummaryHtml(goal, totalSinceGoal, predictedPt, wr, lastExp, winAvg, drawAvg, lossAvg, perspectiveLabel) {
  const achieved     = predictedPt >= goal.targetPt;
  const remaining    = Math.max(0, goal.targetPt - predictedPt);
  const range        = goal.targetPt - goal.startPt;
  const progress     = range > 0 ? Math.min(100, Math.max(0, (predictedPt - goal.startPt) / range * 100)) : 0;
  const estMatches   = (!achieved && lastExp > 0) ? Math.ceil(remaining / lastExp) : null;
  const lastCalib    = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const calibCount   = goal.calibrations.length;

  // 上振れ・下振れ試合数
  let estUpper = null;
  let estLower = null;
  if (!achieved && wr && remaining > 0) {
    const upperWr = Math.min(1, wr.winRate + 0.05);
    const lowerWr = Math.max(0, wr.winRate - 0.05);
    const lossRate = r => Math.max(0, 1 - r - wr.drawRate);
    const upperExp = upperWr * winAvg + wr.drawRate * drawAvg + lossRate(upperWr) * lossAvg;
    const lowerExp = lowerWr * winAvg + wr.drawRate * drawAvg + lossRate(lowerWr) * lossAvg;
    if (upperExp > 0) estUpper = Math.ceil(remaining / upperExp);
    if (lowerExp > 0) estLower = Math.ceil(remaining / lowerExp);
  }

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
        : `残り <strong>${Math.round(remaining).toLocaleString()}pt</strong>`
      }
    </div>`;

  // 上振れ・期待値・下振れ 3カラム表示
  if (!achieved && wr && (estUpper !== null || estLower !== null)) {
    const fmtPct = r => (r * 100).toFixed(1) + '%';
    const upperWrPct = fmtPct(Math.min(1, wr.winRate + 0.05));
    const lowerWrPct = fmtPct(Math.max(0, wr.winRate - 0.05));
    const expWrPct   = fmtPct(wr.winRate);
    function tCol(val, type, wrPctStr) {
      const label = type === 'upper' ? '上振れ' : type === 'expected' ? '期待値' : '下振れ';
      const valHtml = val !== null
        ? `${val}<span>試合</span>`
        : `<span style="font-size:11px">—</span>`;
      return `<div class="pred-col ${type}">
        <div class="pred-label">${label}</div>
        <div class="pred-value">${valHtml}</div>
        <div class="pred-winrate">${wrPctStr}</div>
      </div>`;
    }
    html += `<div class="pred-table track-pred-table">
      ${tCol(estUpper, 'upper', '勝ち率 ' + upperWrPct)}
      ${tCol(estMatches, 'expected', '勝ち率 ' + expWrPct)}
      ${tCol(estLower, 'lower', '勝ち率 ' + lowerWrPct)}
    </div>`;
  }

  // 3カラム非表示時のフォールバック: estMatchesだけでも表示
  if (!achieved && estMatches !== null && !(wr && (estUpper !== null || estLower !== null))) {
    html += `<div class="track-est-fallback">推定あと <strong>${estMatches}試合</strong></div>`;
  }

  html += `
    <div class="track-matches-row">${goal.createdDate} スタート · ${perspectiveLabel || ''}${totalSinceGoal}試合経過　${wr ? `（勝ち率 ${(wr.winRate * 100).toFixed(1)}%）` : ''}</div>
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
    createdDate: editingRankGoal ? editingRankGoal.createdDate : today,
    startPt: currentPt,
    startMatchIndex: editingRankGoal ? editingRankGoal.startMatchIndex : countPerspectiveMatches(),
    targetPt,
    winAvg:  winS.avg,
    drawAvg: drawS ? drawS.avg : 0,
    lossAvg: lossS.avg,
    calibrations: editingRankGoal ? (editingRankGoal.calibrations || []) : [],
  };
  editingRankGoal = null;
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

  // 編集時にキャラが変わった場合、旧キャラのゴールを削除
  if (editingCogGoal && editingCogGoal.char !== charName) {
    deleteCogGoal(editingCogGoal.char);
  }

  const today = new Date().toISOString().slice(0, 10);
  const goal = {
    char: charName,
    createdDate: editingCogGoal ? editingCogGoal.createdDate : today,
    startPt: currentPt,
    startMatchIndex: editingCogGoal ? editingCogGoal.startMatchIndex : countCharMatches(charName),
    targetPt,
    winAvg:  winS.avg,
    drawAvg: drawS ? drawS.avg : 0,
    lossAvg: lossS.avg,
    calibrations: editingCogGoal ? (editingCogGoal.calibrations || []) : [],
  };
  editingCogGoal = null;
  saveCogGoal(charName, goal);
  onSaveCogCard(); // 追跡開始と同時に自動保存
  showCogTrack(goal);
}

// --- 段位追跡ビュー表示 ---
function showRankTrack(goal) {
  if (!goal) return;
  document.getElementById('rank-section').querySelector('.ch-card').classList.add('hidden');
  document.getElementById('rank-track').classList.remove('hidden');
  showRankTrackBtn(false);
  // 陣営名を表示
  const sideLabel = rankIconSide === 'survivors' ? 'サバイバー' : 'ハンター';
  const titleEl = document.querySelector('#rank-track .track-card-title');
  if (titleEl) titleEl.textContent = `段位pt 追跡中（${sideLabel}）`;

  const totalSinceGoal = getMatchesSinceGoalStart(goal, 'rank', null);
  const wr = getOverallWinrate();
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const winAvg  = calibVal(lastCalib, 'winAvg',  goal.winAvg);
  const drawAvg = calibVal(lastCalib, 'drawAvg', goal.drawAvg || 0);
  const lossAvg = calibVal(lastCalib, 'lossAvg', goal.lossAvg);
  const lastExp = wr ? wr.winRate * winAvg + wr.drawRate * drawAvg + wr.lossRate * lossAvg : 0;
  const predictedPt = calcCurrentPredictedPt(goal, totalSinceGoal, wr);

  const pLabel = (rankIconSide === 'survivors' ? 'サバイバー' : 'ハンター') + ' ';
  document.getElementById('rank-track-summary').innerHTML =
    buildTrackSummaryHtml(goal, totalSinceGoal, predictedPt, wr, lastExp, winAvg, drawAvg, lossAvg, pLabel);

  setTimeout(() => renderTrackChart('rank-track-chart', goal, totalSinceGoal, wr), 0);
}

// --- 認知追跡ビュー表示 ---
function showCogTrack(goal) {
  if (!goal) return;
  const cogTrackEl = document.getElementById('cog-track');
  document.getElementById('cog-section').querySelector('.ch-card').classList.add('hidden');
  cogTrackEl.classList.remove('hidden');
  cogTrackEl.dataset.char = goal.char;
  localStorage.setItem('identity5_cog_goal_active', goal.char);
  document.getElementById('cog-track-title').textContent = `認知pt 追跡中（${goal.char}）`;
  showCogTrackBtn(false);

  const totalSinceGoal = getMatchesSinceGoalStart(goal, 'cog', goal.char);
  const wr = getCharOnlyWinrate(goal.char);
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const winAvg  = calibVal(lastCalib, 'winAvg',  goal.winAvg);
  const drawAvg = calibVal(lastCalib, 'drawAvg', goal.drawAvg || 0);
  const lossAvg = calibVal(lastCalib, 'lossAvg', goal.lossAvg);
  const lastExp = wr ? wr.winRate * winAvg + wr.drawRate * drawAvg + wr.lossRate * lossAvg : 0;
  const predictedPt = calcCurrentPredictedPt(goal, totalSinceGoal, wr);

  const cogPLabel = goal.char + ' ';
  document.getElementById('cog-track-summary').innerHTML =
    buildTrackSummaryHtml(goal, totalSinceGoal, predictedPt, wr, lastExp, winAvg, drawAvg, lossAvg, cogPLabel);

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
  localStorage.removeItem('identity5_cog_goal_active');
  cogTrackEl.classList.add('hidden');
  delete cogTrackEl.dataset.char;
  document.getElementById('cog-section').querySelector('.ch-card').classList.remove('hidden');
  if (trackCharts['cog-track-chart']) {
    trackCharts['cog-track-chart'].destroy();
    delete trackCharts['cog-track-chart'];
  }
  onCogInput();
}

// --- ゴール編集 ---
let editingRankGoal = null;
let editingCogGoal = null;

function editRankGoal() {
  const goal = loadRankGoal();
  if (!goal) return;
  editingRankGoal = goal;
  // 追跡ビューを隠して入力フォームに戻す
  document.getElementById('rank-track').classList.add('hidden');
  document.getElementById('rank-section').querySelector('.ch-card').classList.remove('hidden');
  if (trackCharts['rank-track-chart']) {
    trackCharts['rank-track-chart'].destroy();
    delete trackCharts['rank-track-chart'];
  }
  // 現在のゴール値でフォームをプリセット
  const curPos = ptToPosition(goal.startPt);
  const tgtPos = ptToPosition(goal.targetPt);
  if (curPos) {
    onRankIconClick('cur', curPos.rank);
    if (curPos.subRank) onSubRankBtnClick('cur', curPos.subRank);
    if (curPos.stars) onStarClick('cur', curPos.stars);
  }
  if (tgtPos) {
    onRankIconClick('tgt', tgtPos.rank);
    if (tgtPos.subRank) onSubRankBtnClick('tgt', tgtPos.subRank);
    if (tgtPos.stars) onStarClick('tgt', tgtPos.stars);
  }
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  document.getElementById('rank-win-samples').value = String(calibVal(lastCalib, 'winAvg', goal.winAvg));
  document.getElementById('rank-draw-samples').value = String(calibVal(lastCalib, 'drawAvg', goal.drawAvg || 0));
  document.getElementById('rank-loss-samples').value = String(calibVal(lastCalib, 'lossAvg', goal.lossAvg));
  onRankInput();
}

function editCogGoal() {
  const cogTrackEl = document.getElementById('cog-track');
  const char = cogTrackEl ? cogTrackEl.dataset.char : null;
  if (!char) return;
  const goal = loadCogGoal(char);
  if (!goal) return;
  editingCogGoal = goal;
  // 追跡ビューを隠して入力フォームに戻す
  cogTrackEl.classList.add('hidden');
  delete cogTrackEl.dataset.char;
  document.getElementById('cog-section').querySelector('.ch-card').classList.remove('hidden');
  if (trackCharts['cog-track-chart']) {
    trackCharts['cog-track-chart'].destroy();
    delete trackCharts['cog-track-chart'];
  }
  // フォームをプリセット
  setCogCharValue(goal.char);
  document.getElementById('cog-current').value = goal.startPt;
  document.getElementById('cog-target').value = goal.targetPt;
  const lastCalib = goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  document.getElementById('cog-win-samples').value = String(calibVal(lastCalib, 'winAvg', goal.winAvg));
  document.getElementById('cog-draw-samples').value = String(calibVal(lastCalib, 'drawAvg', goal.drawAvg || 0));
  document.getElementById('cog-loss-samples').value = String(calibVal(lastCalib, 'lossAvg', goal.lossAvg));
  onCogInput();
}


// --- キャリブレーションモーダル ---
function openCalibModal(type, char) {
  calibTarget = { type, char };
  // 現在のサンプルをプリセット
  const goal = type === 'rank' ? loadRankGoal() : loadCogGoal(char);
  const lastCalib = goal && goal.calibrations.length > 0 ? goal.calibrations[goal.calibrations.length - 1] : null;
  const winAvg  = calibVal(lastCalib, 'winAvg',  goal?.winAvg);
  const drawAvg = calibVal(lastCalib, 'drawAvg', goal?.drawAvg);
  const lossAvg = calibVal(lastCalib, 'lossAvg', goal?.lossAvg);

  // 段位/認知で入力UIを切り替え
  const rankArea = document.getElementById('calib-rank-area');
  const ptArea   = document.getElementById('calib-pt-area');
  if (type === 'rank') {
    rankArea.classList.remove('hidden');
    ptArea.classList.add('hidden');
    // キャリブレーション用ランク選択を初期化（現在の予測値から逆算）
    rankSel.calib = { rank: '', subRank: '', stars: 0, fracPt: 0 };
    if (goal) {
      const totalSince = getMatchesSinceGoalStart(goal, 'rank', null);
      const wr = getOverallWinrate();
      const predicted = calcCurrentPredictedPt(goal, totalSince, wr);
      const pos = ptToPosition(predicted);
      if (pos) {
        rankSel.calib.rank    = pos.rank;
        rankSel.calib.subRank = pos.subRank;
        rankSel.calib.stars   = pos.stars;
      }
    }
    renderRankIcons('calib');
    renderSubRankBtns('calib');
    renderStars('calib');
  } else {
    rankArea.classList.add('hidden');
    ptArea.classList.remove('hidden');
    document.getElementById('calib-actual-pt').value = '';
  }

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

  let actualPt;
  if (calibTarget.type === 'rank') {
    const { rank, subRank, stars, fracPt } = rankSel.calib;
    if (!rank) { showToast('現在の段位を選択してください', 'error'); return; }
    const cfg = RANK_CONFIG[rank];
    if (cfg && cfg.subRanks && !subRank) { showToast('サブ段位を選択してください', 'error'); return; }
    actualPt = positionToPt(rank, subRank, stars) + (fracPt || 0);
    if (actualPt === null) { showToast('段位の設定が正しくありません', 'error'); return; }
  } else {
    actualPt = parseFloat(document.getElementById('calib-actual-pt').value);
    if (isNaN(actualPt)) { showToast('実際のptを入力してください', 'error'); return; }
  }

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
