// ===== 状態 =====
let matches = [];
let lastUpdated = null;
let _selectionGuard = false; // SearchableSelect選択直後のクリック誤発火防止

// SearchableSelectインスタンス
const searchableSelects = {};

// ===== 接続モジュール =====
const _conn = createConnectModule({
  onConnected(m, lu) { matches = m; lastUpdated = lu; showMainPage(); },
  onNoData()         { showConnectPage(); },
  cacheKey: 'predict_local_data'
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
  document.getElementById('main-page').classList.add('hidden');
  window.scrollTo(0, 0);
}

function showMainPage() {
  document.getElementById('connect-page').classList.add('hidden');
  document.getElementById('main-page').classList.remove('hidden');
  window.scrollTo(0, 0);
  initSelects();
  renderMainPage();
}

// ===== 日付フォーマット =====
function formatDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (d.toDate) d = d.toDate();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

// ===== セレクト初期化 =====
function initSelects() {
  // マップ
  const mapSel = document.getElementById('predict-map');
  if (mapSel.options.length <= 1) {
    MAPS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      mapSel.appendChild(opt);
    });
  }

  // BANキャラ（サバイバーのみ、BAN頻度順）
  const sortedBanSurvivors = getSurvivorsSortedByBanFrequency();
  ['predict-ban-1', 'predict-ban-2', 'predict-ban-3'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel.options.length <= 1) {
      sortedBanSurvivors.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        sel.appendChild(opt);
      });
    }
  });

  // ハンターBANキャラ
  HBAN_IDS.forEach(id => {
    const sel = document.getElementById(id);
    if (sel.options.length <= 1) {
      HUNTERS.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h; opt.textContent = h;
        sel.appendChild(opt);
      });
    }
  });

  // SearchableSelect化
  initSearchableSelect('predict-map');
  ['predict-ban-1', 'predict-ban-2', 'predict-ban-3'].forEach(id => {
    initSearchableSelect(id);
  });
  HBAN_IDS.forEach(id => initSearchableSelect(id));

  // BAN同士の重複排除
  setupBanExclude();

  // 保持されたハンターBANを復元
  loadHunterBanPersist();
}

function initSearchableSelect(selectId) {
  const selectEl = document.getElementById(selectId);
  if (!selectEl || searchableSelects[selectId]) return;
  const ss = new SearchableSelect(selectEl);
  const isHban = selectId.startsWith('predict-hban');
  ss.onSelected = () => {
    _selectionGuard = true;
    setTimeout(() => { _selectionGuard = false; }, 400);
    if (isHban) saveHunterBanPersist();
    // フォーカスを完全に解除（次フィールドへの自動遷移を防止）
    setTimeout(() => {
      if (document.activeElement && document.activeElement.tagName !== 'BODY') {
        document.activeElement.blur();
      }
    }, 0);
  };
  searchableSelects[selectId] = ss;
}

function setupBanExclude() {
  // サバイバーBAN同士の重複排除
  const banIds = ['predict-ban-1', 'predict-ban-2', 'predict-ban-3'];
  banIds.forEach(id => {
    const ss = searchableSelects[id];
    if (!ss) return;
    ss.getExcluded = () => {
      const excluded = [];
      banIds.forEach(otherId => {
        if (otherId !== id) {
          const otherSs = searchableSelects[otherId];
          if (otherSs && otherSs.value) excluded.push(otherSs.value);
        }
      });
      return excluded;
    };
  });

  // ハンターBANクリア時にも保存
  ['predict-hban-1', 'predict-hban-2', 'predict-hban-3'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.addEventListener('change', () => saveHunterBanPersist());
  });

  // ハンターBAN同士の重複排除
  const hbanIds = ['predict-hban-1', 'predict-hban-2', 'predict-hban-3'];
  hbanIds.forEach(id => {
    const ss = searchableSelects[id];
    if (!ss) return;
    ss.getExcluded = () => {
      const excluded = [];
      hbanIds.forEach(otherId => {
        if (otherId !== id) {
          const otherSs = searchableSelects[otherId];
          if (otherSs && otherSs.value) excluded.push(otherSs.value);
        }
      });
      return excluded;
    };
  });
}

// ===== ハンターBAN保持 =====
const HBAN_PERSIST_KEY = 'predict_hunter_ban_persist';
const HBAN_IDS = ['predict-hban-1', 'predict-hban-2', 'predict-hban-3'];

function loadHunterBanPersist() {
  const saved = localStorage.getItem(HBAN_PERSIST_KEY);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    HBAN_IDS.forEach((id, i) => {
      if (data[i]) {
        const ss = searchableSelects[id];
        if (ss) ss.setValue(data[i]);
      }
    });
  } catch (_) {}
}

function saveHunterBanPersist() {
  const vals = HBAN_IDS.map(id => {
    const ss = searchableSelects[id];
    return ss ? ss.value : '';
  });
  localStorage.setItem(HBAN_PERSIST_KEY, JSON.stringify(vals));
}

// ===== ハンターBAN値取得 =====
function getHunterBans() {
  return HBAN_IDS.map(id => {
    const ss = searchableSelects[id];
    return ss ? ss.value : (document.getElementById(id)?.value || '');
  }).filter(v => v);
}

// ===== メインページ描画 =====
function renderMainPage() {
  const surMatches = matches.filter(m => m.perspective === 'survivor');
  const total = surMatches.length;

  document.getElementById('stats-header').innerHTML =
    `<span>サバイバー視点 <strong>${total}</strong> 試合</span>` +
    (lastUpdated ? `<span class="last-updated">最終更新: ${formatDate(lastUpdated)}</span>` : '');

  const lock = document.getElementById('lock-screen');
  const content = document.getElementById('main-content');

  if (total < 100) {
    lock.classList.remove('hidden');
    content.classList.add('hidden');
    const pct = Math.min(total / 100 * 100, 100);
    document.getElementById('lock-progress-bar').style.width = pct + '%';
    document.getElementById('lock-progress-text').textContent = `${total} / 100試合`;
    document.getElementById('lock-message').textContent = `あと${100 - total}試合記録すると解放されます`;
    return;
  }

  lock.classList.add('hidden');
  content.classList.remove('hidden');
}

// ===== 予測ロジック =====
function runPrediction() {
  if (_selectionGuard) return;
  const mapVal = document.getElementById('predict-map').value;
  const bans = [
    document.getElementById('predict-ban-1').value,
    document.getElementById('predict-ban-2').value,
    document.getElementById('predict-ban-3').value
  ].filter(v => v);

  const hunterBans = getHunterBans();

  if (!mapVal) { alert('マップを選択してください'); return; }
  if (bans.length === 0) { alert('BANキャラを1体以上選択してください'); return; }

  // ハンターBAN保持を保存
  saveHunterBanPersist();

  const surMatches = matches.filter(m => m.perspective === 'survivor');
  const hunterBanSet = new Set(hunterBans);

  // === ベイズ逆引き方式 ===
  // 各ハンターHについて: P(H|BAN構成,マップ) ∝ Π P(ban_i|H) × P(マップ|H) × P(H)

  // ハンター別の試合データを集計
  const hunterStats = {}; // hunter -> { total, banCounts: {char: n}, mapCount }
  surMatches.forEach(m => {
    if (!m.opponentHunter) return;
    const h = m.opponentHunter;
    if (!hunterStats[h]) hunterStats[h] = { total: 0, banCounts: {}, mapCount: 0 };
    hunterStats[h].total++;
    if (m.map === mapVal) hunterStats[h].mapCount++;
    const mBans = (m.bannedCharacters || []).filter(b => b);
    mBans.forEach(b => {
      hunterStats[h].banCounts[b] = (hunterStats[h].banCounts[b] || 0) + 1;
    });
  });

  const totalSurMatches = surMatches.length;
  const scores = [];

  // ゼロ回避用の擬似スムージング。最終段階で合計100%に正規化するため
  // 正式なラプラス平滑化（分母に α×K を加算）は省略している
  const SMOOTH = 0.01;

  Object.entries(hunterStats).forEach(([hunter, stat]) => {
    // ハンターBANされたハンターは除外
    if (hunterBanSet.has(hunter)) return;

    // 事前確率 P(H)
    const prior = stat.total / totalSurMatches;

    // P(ban_i | H): 各BANキャラがこのハンター戦でBANされていた確率
    let banProduct = 1;
    bans.forEach(banChar => {
      const banCount = stat.banCounts[banChar] || 0;
      const pBanGivenH = (banCount + SMOOTH) / (stat.total + SMOOTH);
      banProduct *= pBanGivenH;
    });

    // P(マップ | H)
    const pMapGivenH = (stat.mapCount + SMOOTH) / (stat.total + SMOOTH);

    const score = banProduct * pMapGivenH * prior;
    if (score > 0) {
      scores.push({ hunter, score });
    }
  });

  // スコアで降順ソート
  scores.sort((a, b) => b.score - a.score);

  // 正規化（合計100%）
  const totalScore = scores.reduce((s, e) => s + e.score, 0);
  scores.forEach(e => { e.pct = totalScore > 0 ? e.score / totalScore * 100 : 0; });

  // TOP5
  const top5 = scores.slice(0, 5);

  if (top5.length === 0) {
    renderEmptyResult();
    return;
  }

  // カウンターキャラ算出（BANキャラは除外）
  const banSet = new Set(bans);
  top5.forEach(entry => {
    entry.counters = getCounterChars(entry.hunter, surMatches, banSet);
  });

  renderResult(top5, scores);
}

// ===== カウンターキャラ =====
function getCounterChars(hunter, surMatches, excludeChars) {
  const hunterMatches = surMatches.filter(m => m.opponentHunter === hunter);
  if (hunterMatches.length < 5) return [];

  // 自キャラ別勝率（BANキャラは除外）
  const charStats = {};
  hunterMatches.forEach(m => {
    if (!m.myCharacter) return;
    if (excludeChars && excludeChars.has(m.myCharacter)) return;
    if (!charStats[m.myCharacter]) charStats[m.myCharacter] = { wins: 0, total: 0 };
    charStats[m.myCharacter].total++;
    if (m.result === 'survivor_win') charStats[m.myCharacter].wins++;
  });

  const counters = [];
  Object.entries(charStats).forEach(([char, stat]) => {
    if (stat.total >= 5) {
      counters.push({ char, winRate: stat.wins / stat.total, total: stat.total });
    }
  });

  counters.sort((a, b) => b.winRate - a.winRate);
  return counters.slice(0, 3);
}

// ===== 結果なし表示 =====
function renderEmptyResult() {
  const resultSection = document.getElementById('predict-result');
  const resultList = document.getElementById('predict-result-list');
  const selectSection = resultSection.querySelector('.pr-select-section');

  resultSection.classList.remove('hidden');
  selectSection.style.display = 'none';
  resultList.innerHTML =
    '<div class="pr-empty-message">この条件に該当する試合データがありません。<br>BANキャラやマップを変えてお試しください。</div>';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== 結果描画 =====
function renderResult(top5, allScores) {
  const resultSection = document.getElementById('predict-result');
  const resultList = document.getElementById('predict-result-list');
  const hunterBtns = document.getElementById('predict-hunter-buttons');

  resultSection.classList.remove('hidden');

  // 前回の空状態表示をリセット
  const selectSection = resultSection.querySelector('.pr-select-section');
  selectSection.style.display = '';

  // TOP5リスト
  const maxPct = top5[0]?.pct || 100;
  resultList.innerHTML = top5.map((entry, i) => {
    const rankClass = i < 3 ? ` rank-${i + 1}` : '';
    const iconSrc = buildIconPath(entry.hunter, 'hunter');
    const counterHTML = entry.counters.length > 0
      ? `<div class="pr-counter-row">
          <span class="pr-counter-label">得意キャラ:</span>
          <div class="pr-counter-chars">
            ${entry.counters.map(c =>
              `<span class="pr-counter-char">
                <img class="pr-counter-char-icon" src="${buildIconPath(c.char, 'survivor')}" alt="${escapeHTML(c.char)}" onerror="this.style.display='none'">
                <span class="pr-counter-char-rate">${Math.round(c.winRate * 100)}%</span>
              </span>`
            ).join('')}
          </div>
        </div>`
      : '';

    return `<div class="pr-result-item">
      <div class="pr-result-item-main">
        <div class="pr-result-rank${rankClass}">${i + 1}</div>
        <img class="pr-result-icon" src="${iconSrc}" alt="${escapeHTML(entry.hunter)}" onerror="this.style.display='none'">
        <div class="pr-result-info">
          <div class="pr-result-name">${escapeHTML(entry.hunter)}</div>
        </div>
        <div class="pr-result-pct">${entry.pct.toFixed(1)}%</div>
      </div>
      <div class="pr-result-bar-track">
        <div class="pr-result-bar" style="width: ${entry.pct / maxPct * 100}%"></div>
      </div>
      ${counterHTML}
    </div>`;
  }).join('');

  // ハンター選択ボタン（TOP5 + その他）
  hunterBtns.innerHTML = top5.map(entry => {
    const iconSrc = buildIconPath(entry.hunter, 'hunter');
    return `<button type="button" class="pr-hunter-btn" onclick="goToInput('${escapeHTML(entry.hunter)}')">
      <img class="pr-hunter-btn-icon" src="${iconSrc}" alt="" onerror="this.style.display='none'">
      <span class="pr-hunter-btn-name">${escapeHTML(entry.hunter)}</span>
      <span class="pr-hunter-btn-pct">${entry.pct.toFixed(1)}%</span>
    </button>`;
  }).join('') +
  `<button type="button" class="pr-hunter-btn other-btn" onclick="goToInput('')">
    <span class="pr-hunter-btn-name">その他</span>
  </button>`;

  // スクロールして結果を表示
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== トラッカーへ遷移 =====
function goToInput(hunter) {
  const mapVal = document.getElementById('predict-map').value;
  const bans = [
    document.getElementById('predict-ban-1').value,
    document.getElementById('predict-ban-2').value,
    document.getElementById('predict-ban-3').value
  ].filter(v => v);

  const params = new URLSearchParams();
  params.set('from', 'predict');
  if (mapVal) params.set('map', mapVal);
  if (hunter) params.set('hunter', hunter);
  bans.forEach((b, i) => params.set(`ban${i + 1}`, b));

  window.location.href = `index.html?${params.toString()}`;
}

// ===== BAN頻度ソート =====
function getSurvivorsSortedByBanFrequency() {
  let banCounts = {};
  try {
    const raw = localStorage.getItem('identity5_character_usage');
    if (raw) {
      const parsed = JSON.parse(raw);
      banCounts = parsed.survivorBanned || {};
    }
  } catch (_) {}

  return SURVIVORS.slice().sort((a, b) => {
    const countA = banCounts[a] || 0;
    const countB = banCounts[b] || 0;
    if (countA !== countB) return countB - countA;
    return SURVIVORS.indexOf(a) - SURVIVORS.indexOf(b);
  });
}

// ===== 初期化 =====
window.addEventListener('DOMContentLoaded', init);
