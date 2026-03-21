    // ===== アイコンパス（app.js固有） =====
    const MAP_ICON_OVERRIDES = {
      '軍需工場': 'maps/gunju_kojou.PNG',
    };
    function getMapIconPath(mapName) {
      return MAP_ICON_OVERRIDES[mapName] || `maps/${mapName}.PNG`;
    }
    function getRankIconPath(rank, perspective) {
      const folder = perspective === 'survivor' ? 'survivors' : 'hunters';
      return `ranks/${folder}/${rank}.PNG`;
    }
    function charIconImg(charName, type) {
      return `<img class="match-char-icon" src="${buildIconPath(charName, type)}" alt="${escapeHTML(charName)}" title="${escapeHTML(charName)}" onerror="this.style.display='none'">`;
    }

    // ===== 棒グラフ用アイコンヘルパー =====
    function getPairIconsHTML(pairKey) {
      const parts = pairKey.split(' ＆ ');
      if (parts.length !== 2) return '';
      const icons = parts.map(name =>
        `<img class="bar-icon" src="${buildIconPath(name, 'survivor')}" alt="" onerror="this.style.display='none'">`
      ).join('');
      return `<div class="bar-icon-pair">${icons}</div>`;
    }
    function getBarIconHTML(key, type) {
      if (!type) return '';
      if (type === 'pair-survivor') return getPairIconsHTML(key);
      let src;
      if (type === 'map') {
        src = getMapIconPath(key);
      } else if (type === 'char') {
        src = buildIconPath(key, currentPerspective === 'survivor' ? 'survivor' : 'hunter');
      } else if (type === 'opponent-hunter') {
        src = buildIconPath(key, 'hunter');
      } else if (type === 'survivor') {
        src = buildIconPath(key, 'survivor');
      } else {
        return '';
      }
      return `<img class="bar-icon" src="${src}" alt="" onerror="this.style.display='none'">`;
    }

    // SearchableSelectインスタンスを管理
    const searchableSelects = {};
    
    // selectをSearchableSelectに変換
    function initSearchableSelect(selectId) {
      const selectEl = document.getElementById(selectId);
      if (!selectEl || searchableSelects[selectId]) return;
      searchableSelects[selectId] = new SearchableSelect(selectEl);
    }
    
    // 全キャラ選択selectをSearchableSelectに変換
    function initAllSearchableSelects() {
      SS_ALL_CHAR_IDS.forEach(id => initSearchableSelect(id));
    }
    
    // SearchableSelectの値同期用ヘルパー
    function syncSearchableSelect(selectId) {
      if (searchableSelects[selectId]) {
        searchableSelects[selectId].syncFromSelect();
      }
    }
    
    function setSearchableSelectValue(selectId, value) {
      const ss = searchableSelects[selectId];
      if (ss) {
        ss.setValue(value);
      } else {
        const el = document.getElementById(selectId);
        if (el) el.value = value;
      }
    }
    
    // ===== フォームフィールド定数 =====
    const SURVIVOR_FIELDS = [
      { id: 'survivor-date',     persistKey: 'persist-survivor-date',     isDate: true },
      { id: 'survivor-rank',     persistKey: 'persist-survivor-rank' },
      { id: 'my-survivor',       persistKey: 'persist-my-survivor' },
      { id: 'teammate-1',        persistKey: 'persist-teammate-1' },
      { id: 'teammate-2',        persistKey: 'persist-teammate-2' },
      { id: 'teammate-3',        persistKey: 'persist-teammate-3' },
      { id: 'opponent-hunter',   persistKey: 'persist-opponent-hunter' },
      { id: 'survivor-map',      persistKey: 'persist-survivor-map' }
    ];
    const HUNTER_FIELDS = [
      { id: 'hunter-date',           persistKey: 'persist-hunter-date',           isDate: true },
      { id: 'hunter-rank',           persistKey: 'persist-hunter-rank' },
      { id: 'my-hunter',             persistKey: 'persist-my-hunter' },
      { id: 'hunter-trait',          persistKey: 'persist-hunter-trait', isTrait: true },
      { id: 'opponent-survivor-1',   persistKey: 'persist-opponent-survivor-1' },
      { id: 'opponent-survivor-2',   persistKey: 'persist-opponent-survivor-2' },
      { id: 'opponent-survivor-3',   persistKey: 'persist-opponent-survivor-3' },
      { id: 'opponent-survivor-4',   persistKey: 'persist-opponent-survivor-4' },
      { id: 'hunter-map',            persistKey: 'persist-hunter-map' }
    ];
    // SearchableSelect同期対象ID
    const BAN_CHAR_IDS = ['ban-char-1', 'ban-char-2', 'ban-char-3'];
    const SS_SURVIVOR_IDS = ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3', 'opponent-hunter', 'survivor-map', ...BAN_CHAR_IDS];
    const SS_HUNTER_IDS  = ['my-hunter', 'opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4', 'hunter-map'];
    const SS_ALL_CHAR_IDS = [
      'my-survivor', 'teammate-1', 'teammate-2', 'teammate-3',
      'opponent-hunter', 'my-hunter',
      'opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4',
      'survivor-map', 'hunter-map',
      ...BAN_CHAR_IDS
    ];

    const SEASONS = [
      { id: 'S41', label: 'S41', start: '2026-02-05', end: '2026-04-22' }
      // 新しいシーズンはここに追加
      // { id: 'S42', label: 'S42', start: '2026-04-23', end: '2026-07-15' }
    ];
    
    // 期間フィルターにシーズンを追加
    function populatePeriodFilters() {
      const sortedSeasons = [...SEASONS].reverse();

      // 総合勝率タブの期間フィルター（全期間、今日、直近7日、直近30日はHTML側に静的定義済み。シーズンを動的追加）
      const overallFilter = document.getElementById('overall-period-filter');
      if (overallFilter) {
        sortedSeasons.forEach(season => {
          const option = document.createElement('option');
          option.value = season.id;
          option.textContent = season.label;
          overallFilter.appendChild(option);
        });
      }

      // 他のタブの期間フィルター（全期間、今日、直近7日、直近30日、シーズン）
      const filterIds = ['character-period-filter', 'map-period-filter', 'opponent-period-filter', 'history-period-filter'];
      filterIds.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (!filter) return;
        sortedSeasons.forEach(season => {
          const option = document.createElement('option');
          option.value = season.id;
          option.textContent = season.label;
          filter.appendChild(option);
        });
      });
    }
    
    // 日付を YYYY-MM-DD 形式に変換
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // プレースホルダースタイルを更新
    function updatePlaceholderStyle(select) {
      if (!select) return;
      if (select.value === '' || select.value === null) {
        select.classList.add('placeholder');
      } else {
        select.classList.remove('placeholder');
      }
    }
    
    // 全てのselectにプレースホルダースタイルを初期化
    function initializePlaceholderStyles() {
      const allSelects = document.querySelectorAll('select');
      allSelects.forEach(select => {
        // 初期状態を設定
        updatePlaceholderStyle(select);
        
        // changeイベントを追加
        select.addEventListener('change', function() {
          updatePlaceholderStyle(this);
        });
      });
    }
    
    // タブのスクロール監視を初期化
    function initializeTabScrollIndicator() {
      const tabs = document.querySelector('.main-tabs');
      if (!tabs) return;
      
      function updateScrollIndicator() {
        const isScrollable = tabs.scrollWidth > tabs.clientWidth;
        const isAtEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 5;
        
        if (isScrollable && !isAtEnd) {
          tabs.classList.add('has-scroll');
        } else {
          tabs.classList.remove('has-scroll');
        }
      }
      
      // 初期状態を設定
      updateScrollIndicator();
      
      // スクロールイベントを監視
      tabs.addEventListener('scroll', updateScrollIndicator);
      
      // リサイズイベントを監視
      window.addEventListener('resize', updateScrollIndicator);
    }
    
    // 今日の日付を取得
    function getToday() {
      return formatDate(new Date());
    }
    
    // 日付入力フィールドの初期値を設定
    function initializeDateFields() {
      const today = getToday();
      
      // サバイバー
      const survivorDate = document.getElementById('survivor-date');
      if (survivorDate && !survivorDate.value) {
        survivorDate.value = today;
      }
      
      // ハンター
      const hunterDate = document.getElementById('hunter-date');
      if (hunterDate && !hunterDate.value) {
        hunterDate.value = today;
      }
    }
    
    // 期間フィルターで試合をフィルタリング
    function filterByPeriod(matches, periodValue) {
      if (periodValue === 'all') {
        return matches;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (periodValue === 'today') {
        const todayStr = formatDate(today);
        return matches.filter(m => m.date === todayStr);
      }
      
      if (periodValue === 'last7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 今日を含む7日間
        return matches.filter(m => {
          if (!m.date) return false;
          const matchDate = new Date(m.date);
          matchDate.setHours(0, 0, 0, 0);
          return matchDate >= sevenDaysAgo && matchDate <= today;
        });
      }
      
      if (periodValue === 'last30days') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 今日を含む30日間
        return matches.filter(m => {
          if (!m.date) return false;
          const matchDate = new Date(m.date);
          matchDate.setHours(0, 0, 0, 0);
          return matchDate >= thirtyDaysAgo && matchDate <= today;
        });
      }
      
      // シーズンでフィルター
      const season = SEASONS.find(s => s.id === periodValue);
      if (season) {
        return matches.filter(m => {
          if (!m.date) return false;
          return m.date >= season.start && m.date <= season.end;
        });
      }
      
      return matches;
    }
    
    let currentPerspective = 'survivor';
    let selectedEscapeCount = { survivor: null, hunter: null };
    let selectedTrait = null;
    let matches = [];
    let editingMatchId = null;
    
    // キャラクター使用回数を記録（サバイバー/ハンター別）
    let characterUsageCount = {
      survivorUsed: {},   // サバイバーとして使った回数（サバイバー視点）
      survivorFaced: {},  // サバイバーとして対戦した回数（ハンター視点）
      hunterUsed: {},     // ハンターとして使った回数（ハンター視点）
      hunterFaced: {},    // ハンターとして対戦した回数（サバイバー視点）
      survivorBanned: {}  // BANされた回数（サバイバー視点）
    };
    
    // キャラクター使用回数を増やす
    function incrementCharacterUsage(countType, characters) {
      if (!Array.isArray(characters)) {
        characters = [characters];
      }
      
      characters.forEach(char => {
        if (!char) return;
        
        if (!characterUsageCount[countType][char]) {
          characterUsageCount[countType][char] = 0;
        }
        characterUsageCount[countType][char]++;
      });
      
      saveCharacterUsageCount();
    }
    
    // キャラクター使用回数を減らす
    function decrementCharacterUsage(countType, characters) {
      if (!Array.isArray(characters)) {
        characters = [characters];
      }
      
      characters.forEach(char => {
        if (!char) return;
        
        if (characterUsageCount[countType][char]) {
          characterUsageCount[countType][char]--;
          
          // 0になったら削除
          if (characterUsageCount[countType][char] <= 0) {
            delete characterUsageCount[countType][char];
          }
        }
      });
      
      saveCharacterUsageCount();
    }
    
    // キャラクター使用回数をソート（使用回数順 → 配列定義順）
    function sortCharactersByUsage(characters, countType) {
      const usageData = characterUsageCount[countType] || {};
      
      return characters.slice().sort((a, b) => {
        const usageA = usageData[a] || 0;
        const usageB = usageData[b] || 0;
        
        // 使用回数が異なる場合は多い順
        if (usageA !== usageB) {
          return usageB - usageA;
        }
        
        // 使用回数が同じ場合は配列定義順を維持
        return characters.indexOf(a) - characters.indexOf(b);
      });
    }
    
    // キャラクター使用回数を保存
    function saveCharacterUsageCount() {
      localStorage.setItem('identity5_character_usage', JSON.stringify(characterUsageCount));
    }
    
    // キャラクター使用回数を読み込み
    function loadCharacterUsageCount() {
      const saved = localStorage.getItem('identity5_character_usage');
      if (saved) {
        try {
          const loadedData = JSON.parse(saved);
          
          // 新しいデータ構造かチェック
          if (loadedData.survivorUsed !== undefined) {
            // 新しい構造
            characterUsageCount = loadedData;
            if (!characterUsageCount.survivorBanned) characterUsageCount.survivorBanned = {};
          } else {
            // 古い構造の場合、全試合データから再計算
            characterUsageCount = {
              survivorUsed: {},
              survivorFaced: {},
              hunterUsed: {},
              hunterFaced: {},
              survivorBanned: {}
            };
            
            // 全試合データから使用回数を再計算（保存は最後に1回だけ）
            matches.forEach(match => {
              if (match.perspective === 'survivor') {
                // サバイバー使用回数
                const survivors = [match.myCharacter, ...match.teammates];
                survivors.forEach(char => {
                  if (!char) return;
                  if (!characterUsageCount.survivorUsed[char]) {
                    characterUsageCount.survivorUsed[char] = 0;
                  }
                  characterUsageCount.survivorUsed[char]++;
                });
                
                // ハンター対戦回数
                const hunter = match.opponentHunter;
                if (hunter) {
                  if (!characterUsageCount.hunterFaced[hunter]) {
                    characterUsageCount.hunterFaced[hunter] = 0;
                  }
                  characterUsageCount.hunterFaced[hunter]++;
                }
              } else {
                // ハンター使用回数
                const hunter = match.myCharacter;
                if (hunter) {
                  if (!characterUsageCount.hunterUsed[hunter]) {
                    characterUsageCount.hunterUsed[hunter] = 0;
                  }
                  characterUsageCount.hunterUsed[hunter]++;
                }
                
                // サバイバー対戦回数
                const survivors = match.opponentSurvivors || [];
                survivors.forEach(char => {
                  if (!char) return;
                  if (!characterUsageCount.survivorFaced[char]) {
                    characterUsageCount.survivorFaced[char] = 0;
                  }
                  characterUsageCount.survivorFaced[char]++;
                });
              }
            });
            
            // 再計算したデータを保存
            saveCharacterUsageCount();
          }
        } catch (e) {
          console.error('Failed to load character usage count:', e);
          characterUsageCount = {
            survivorUsed: {},
            survivorFaced: {},
            hunterUsed: {},
            hunterFaced: {},
            survivorBanned: {}
          };
        }
      }
    }
    
    // キャラクター選択を再構築（使用回数順に更新）
    function repopulateCharacterSelects() {
      // サバイバー選択（自分・味方）：サバイバー使用回数順
      const mySurvivorSelects = ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3'];
      const sortedSurvivorsUsed = sortCharactersByUsage(SURVIVORS, 'survivorUsed');
      
      mySurvivorSelects.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        // オプションをクリア（最初の空白オプション以外）
        select.innerHTML = '<option value="">選択してください</option>';
        
        // ソート済みのキャラクターを追加
        sortedSurvivorsUsed.forEach(survivor => {
          const option = document.createElement('option');
          option.value = survivor;
          option.textContent = survivor;
          select.appendChild(option);
        });
        
        // 値を復元
        select.value = currentValue;
        
        // プレースホルダースタイルを更新
        updatePlaceholderStyle(select);
      });
      
      // サバイバー選択（相手）：サバイバー対戦回数順
      const opponentSurvivorSelects = ['opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4'];
      const sortedSurvivorsFaced = sortCharactersByUsage(SURVIVORS, 'survivorFaced');
      
      opponentSurvivorSelects.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        // オプションをクリア（最初の空白オプション以外）
        select.innerHTML = '<option value="">選択してください</option>';
        
        // ソート済みのキャラクターを追加
        sortedSurvivorsFaced.forEach(survivor => {
          const option = document.createElement('option');
          option.value = survivor;
          option.textContent = survivor;
          select.appendChild(option);
        });
        
        // 値を復元
        select.value = currentValue;
        
        // プレースホルダースタイルを更新
        updatePlaceholderStyle(select);
      });
      
      // ハンター選択（自分）：ハンター使用回数順
      const myHunterSelect = document.getElementById('my-hunter');
      const myHunterCurrentValue = myHunterSelect.value;
      const sortedHuntersUsed = sortCharactersByUsage(HUNTERS, 'hunterUsed');
      
      myHunterSelect.innerHTML = '<option value="">選択してください</option>';
      sortedHuntersUsed.forEach(hunter => {
        const option = document.createElement('option');
        option.value = hunter;
        option.textContent = hunter;
        myHunterSelect.appendChild(option);
      });
      myHunterSelect.value = myHunterCurrentValue;
      updatePlaceholderStyle(myHunterSelect);
      
      // ハンター選択（相手）：ハンター対戦回数順
      const opponentHunterSelect = document.getElementById('opponent-hunter');
      const opponentHunterCurrentValue = opponentHunterSelect.value;
      const sortedHuntersFaced = sortCharactersByUsage(HUNTERS, 'hunterFaced');
      
      opponentHunterSelect.innerHTML = '<option value="">選択してください</option>';
      sortedHuntersFaced.forEach(hunter => {
        const option = document.createElement('option');
        option.value = hunter;
        option.textContent = hunter;
        opponentHunterSelect.appendChild(option);
      });
      opponentHunterSelect.value = opponentHunterCurrentValue;
      updatePlaceholderStyle(opponentHunterSelect);

      // BANキャラ選択：BAN回数順
      const sortedSurvivorsBanned = sortCharactersByUsage(SURVIVORS, 'survivorBanned');
      BAN_CHAR_IDS.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        select.innerHTML = '<option value="">なし</option>';
        sortedSurvivorsBanned.forEach(survivor => {
          const option = document.createElement('option');
          option.value = survivor;
          option.textContent = survivor;
          select.appendChild(option);
        });
        select.value = currentValue;
        updatePlaceholderStyle(select);
      });

      // SearchableSelectを同期
      SS_ALL_CHAR_IDS.forEach(syncSearchableSelect);
    }
    
    // ページネーション用の変数
    let currentPages = {
      teammateStats: 1,
      opponentStats: 1,
      pairStats: 1,
      matchHistory: 1
    };
    const itemsPerPage = 20;
    let historyItemsPerPage = 20;

    // 並び替え状態管理
    // sortKey: 'winrate' | 'matches', sortOrder: 'desc' | 'asc'
    const sortState = {
      character:      { key: 'winrate', order: 'desc' },
      map:            { key: 'winrate', order: 'desc' },
      opponentHunter: { key: 'winrate', order: 'desc' },
      teammate:       { key: 'winrate', order: 'desc' },
      opponent:       { key: 'winrate', order: 'desc' },
      opponentPair:   { key: 'winrate', order: 'desc' }
    };
    
    // 並び替えキー切替
    function setSortKey(tab, key) {
      sortState[tab].key = key;
      updateAllStats();
    }
    
    // 並び替え順序切替
    function setSortOrder(tab, order) {
      sortState[tab].order = order;
      updateAllStats();
    }
    
    // 並び替えコントロールHTML生成
    function generateSortButtons(tab) {
      const state = sortState[tab];
      const wrActive = state.key === 'winrate' ? ' active' : '';
      const mcActive = state.key === 'matches' ? ' active' : '';
      const descActive = state.order === 'desc' ? ' active' : '';
      const ascActive = state.order === 'asc' ? ' active' : '';
      const minCount = minMatchCounts[tab] || 1;
      const resetBtn = minCount > 1
        ? `<button class="min-match-reset-btn" onclick="resetMinMatchCount('${tab}')">全データ</button>`
        : '';

      return `<div class="sort-bar">
        <div class="sort-control">
          <button class="sort-key-btn${wrActive}" onclick="setSortKey('${tab}', 'winrate')">勝率</button>
          <button class="sort-key-btn${mcActive}" onclick="setSortKey('${tab}', 'matches')">試合数</button>
          <div class="sort-divider"></div>
          <button class="sort-arrow-btn${descActive}" onclick="setSortOrder('${tab}', 'desc')">↓</button>
          <button class="sort-arrow-btn${ascActive}" onclick="setSortOrder('${tab}', 'asc')">↑</button>
        </div>
        <div class="min-match-control">
          <label>最低試合数</label>
          <input class="min-match-input" type="number" min="1" value="${minCount}"
            onchange="setMinMatchCount('${tab}', this.value)">
          ${resetBtn}
        </div>
      </div>`;
    }
    
    // 勝率バーHTML生成
    function renderBarHTML(winrateStr) {
      const winrateNum = parseFloat(winrateStr) || 0;
      return `
        <div class="bar-visual" style="width: ${winrateNum}%;"></div>
        <span class="bar-center-label">${winrateStr}%</span>
      `;
    }
    
    // 汎用ソート関数
    function sortByState(keys, statsMap, perspective, state) {
      // Schwartzian transform: 事前に統計計算してキャッシュ
      const cache = new Map();
      keys.forEach(k => cache.set(k, calculateWinrate(statsMap[k], perspective)));

      return keys.sort((a, b) => {
        const statsA = cache.get(a);
        const statsB = cache.get(b);

        let primary, secondary;
        if (state.key === 'winrate') {
          primary = parseFloat(statsB.winrate) - parseFloat(statsA.winrate);
          secondary = statsB.totalWithDraws - statsA.totalWithDraws;
        } else {
          primary = statsB.totalWithDraws - statsA.totalWithDraws;
          secondary = parseFloat(statsB.winrate) - parseFloat(statsA.winrate);
        }

        if (state.order === 'asc') {
          primary = -primary;
          secondary = -secondary;
        }

        return primary !== 0 ? primary : secondary;
      });
    }
    
    // TOPカード共通: best/worstを抽出
    function findBestWorst(items, statsMap, perspective, minCount) {
      const qualified = items.filter(k => statsMap[k].length >= minCount);
      if (qualified.length === 0) return { best: null, worst: null };
      const wrCache = new Map(qualified.map(k => [k, parseFloat(calculateWinrate(statsMap[k], perspective).winrate)]));
      qualified.sort((a, b) => wrCache.get(b) - wrCache.get(a));
      const best = qualified[0];
      const worstRaw = qualified.length > 1 ? qualified[qualified.length - 1] : null;
      const worst = worstRaw && wrCache.get(worstRaw) < 100 ? worstRaw : null;
      return { best, worst };
    }

    // TOPカード共通: best/worstからHTML生成
    function buildTopCardsHtml(best, worst, buildCardFn) {
      if (!best) return '';
      const hasWorst = worst && best !== worst;
      return `<div class="top-cards-row${hasWorst ? '' : ' top-cards-single'}">
        ${buildCardFn(best, 'best')}
        ${hasWorst ? buildCardFn(worst, 'worst') : ''}
      </div>`;
    }

    // 初期化
    function init() {
      // Firebase初期化
      initFirebaseLocal();

      // ダークモード復元
      loadDarkMode();
      
      // ガイドバナー・インストールバナーチェック
      checkGuideBanner();
      checkInstallBanner();
      
      // データを先に読み込む
      loadData(); // データを読み込む
      loadCharacterUsageCount(); // 使用回数を読み込む（マイグレーション含む）
      
      // 使用回数データを元にキャラクター選択肢を構築
      populateSelects();
      populatePeriodFilters(); // 期間フィルターにシーズンを追加

      // キャラ選択を検索付きドロップダウンに変換
      initAllSearchableSelects();
      initAutoFocus();
      initGroupExclude();
      initTraitPicker();

      // プレースホルダースタイルを初期化（選択肢更新の前に実行）
      initializePlaceholderStyles();
      
      updateSurvivorSelectOptions(); // サバイバー選択肢の初期化
      updateHunterOpponentSelectOptions(); // 相手サバイバー選択肢の初期化
      
      // 保持された値を復元（DOM要素が完全に準備された後）
      loadPersistedValues('survivor');
      loadPersistedValues('hunter');
      
      // 日付フィールドの初期値を設定
      initializeDateFields();
      
      // 初期状態はサバイバー視点なので、対戦相手フィルターを表示
      const opponentFilterGroup = document.getElementById('opponent-filter-group');
      if (opponentFilterGroup) {
        opponentFilterGroup.style.display = 'block';
      }
      
      refreshAfterDataChange();

      // タブのスクロール監視を初期化
      initializeTabScrollIndicator();

      // 同期UI初期化
      updateSyncUI();
      initScrollBehavior();

      // URLパラメータ処理
      const urlParams = new URLSearchParams(location.search);
      if (urlParams.has('detail') && urlParams.has('name')) {
        openDetailPage(urlParams.get('detail'), decodeURIComponent(urlParams.get('name')), true);
      }

      // ハンター予測からの遷移: フォームにプリフィル
      if (urlParams.get('from') === 'predict') {
        // サバイバー視点に切替
        switchPerspective('survivor', document.querySelector('.perspective-tab'));
        switchTab('input', document.querySelector('.main-tab[data-tab="input"]'));

        if (urlParams.has('map')) {
          setSearchableSelectValue('survivor-map', urlParams.get('map'));
        }
        if (urlParams.has('hunter')) {
          setSearchableSelectValue('opponent-hunter', urlParams.get('hunter'));
        }
        ['ban1', 'ban2', 'ban3'].forEach((key, i) => {
          if (urlParams.has(key)) {
            setSearchableSelectValue(`ban-char-${i + 1}`, urlParams.get(key));
          }
        });

        // URLパラメータをクリア（リロード時の再適用防止）
        history.replaceState(null, '', location.pathname);
      }

      // ハンター予測リンク: サバイバー100試合以上で表示
      updatePredictBackLink();

    }

    function updatePredictBackLink() {
      const link = document.getElementById('predict-back-link');
      if (!link) return;
      const banCount = matches.filter(m => m.perspective === 'survivor' && (m.bannedCharacters || []).some(b => b)).length;
      link.classList.toggle('hidden', banCount < 50);
    }

    // セレクトボックスにオプションを追加
    function populateSelects() {
      // サバイバー選択（自分・味方）：サバイバー使用回数順にソート
      const mySurvivorSelects = ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3'];
      const sortedSurvivorsUsed = sortCharactersByUsage(SURVIVORS, 'survivorUsed');
      
      mySurvivorSelects.forEach(id => {
        const select = document.getElementById(id);
        sortedSurvivorsUsed.forEach(survivor => {
          const option = document.createElement('option');
          option.value = survivor;
          option.textContent = survivor;
          select.appendChild(option);
        });
      });
      
      // サバイバー選択（相手）：サバイバー対戦回数順にソート
      const opponentSurvivorSelects = ['opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4'];
      const sortedSurvivorsFaced = sortCharactersByUsage(SURVIVORS, 'survivorFaced');
      
      opponentSurvivorSelects.forEach(id => {
        const select = document.getElementById(id);
        sortedSurvivorsFaced.forEach(survivor => {
          const option = document.createElement('option');
          option.value = survivor;
          option.textContent = survivor;
          select.appendChild(option);
        });
      });
      
      // ハンター選択（自分）：ハンター使用回数順にソート
      const myHunterSelect = document.getElementById('my-hunter');
      const sortedHuntersUsed = sortCharactersByUsage(HUNTERS, 'hunterUsed');
      
      sortedHuntersUsed.forEach(hunter => {
        const option = document.createElement('option');
        option.value = hunter;
        option.textContent = hunter;
        myHunterSelect.appendChild(option);
      });
      
      // BANキャラ選択：BAN回数順にソート
      const sortedSurvivorsBanned = sortCharactersByUsage(SURVIVORS, 'survivorBanned');
      BAN_CHAR_IDS.forEach(id => {
        const select = document.getElementById(id);
        sortedSurvivorsBanned.forEach(survivor => {
          const option = document.createElement('option');
          option.value = survivor;
          option.textContent = survivor;
          select.appendChild(option);
        });
      });

      // ハンター選択（相手）：ハンター対戦回数順にソート
      const opponentHunterSelect = document.getElementById('opponent-hunter');
      const sortedHuntersFaced = sortCharactersByUsage(HUNTERS, 'hunterFaced');
      
      sortedHuntersFaced.forEach(hunter => {
        const option = document.createElement('option');
        option.value = hunter;
        option.textContent = hunter;
        opponentHunterSelect.appendChild(option);
      });
      
      const mapSelects = ['survivor-map', 'hunter-map'];
      mapSelects.forEach(id => {
        const select = document.getElementById(id);
        MAPS.forEach(map => {
          const option = document.createElement('option');
          option.value = map;
          option.textContent = map;
          select.appendChild(option);
        });
      });
      
      const rankSelects = ['survivor-rank', 'hunter-rank'];
      rankSelects.forEach(id => {
        const select = document.getElementById(id);
        RANKS.forEach(rank => {
          const option = document.createElement('option');
          option.value = rank;
          option.textContent = rank;
          select.appendChild(option);
        });
      });
      
      // サバイバー選択時の重複チェックを追加（BAN含む相互除外）
      ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3', ...BAN_CHAR_IDS].forEach(id => {
        document.getElementById(id).addEventListener('change', () => updateSurvivorSelectOptions());
      });
      
      // ハンター視点のサバイバー選択時の重複チェックを追加
      ['opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => updateHunterOpponentSelectOptions());
      });
    }
    
    // 対戦相手ハンターフィルターを更新（実際に対戦したハンターのみ表示）
    function updateOpponentHunterFilter() {
      const opponentHunterFilter = document.getElementById('opponent-hunter-filter');
      if (!opponentHunterFilter) return;
      
      // 現在の選択値を保存
      const currentValue = opponentHunterFilter.value;
      
      // サバイバー視点の試合から対戦したハンターを抽出
      const survivorMatches = matches.filter(m => m.perspective === 'survivor');
      const encounteredHunters = new Set();
      
      survivorMatches.forEach(match => {
        if (match.opponentHunter) {
          encounteredHunters.add(match.opponentHunter);
        }
      });
      
      // 選択肢をクリア（「全て」以外）
      opponentHunterFilter.innerHTML = '<option value="all">全て</option>';
      
      // 実際に対戦したハンターのみ追加（配列定義順）
      const sortedHunters = HUNTERS.filter(hunter => encounteredHunters.has(hunter));
      sortedHunters.forEach(hunter => {
        const option = document.createElement('option');
        option.value = hunter;
        option.textContent = hunter;
        opponentHunterFilter.appendChild(option);
      });
      
      // 以前の選択値を復元（存在する場合）
      if (currentValue && (currentValue === 'all' || encounteredHunters.has(currentValue))) {
        opponentHunterFilter.value = currentValue;
      } else {
        opponentHunterFilter.value = 'all';
      }
    }
    
    // 自キャラ別勝率のマップフィルターを更新（実際に記録したマップのみ表示）
    function updateCharacterMapFilter() {
      const characterMapFilter = document.getElementById('character-map-filter');
      if (!characterMapFilter) return;
      
      // 現在の選択値を保存
      const currentValue = characterMapFilter.value;
      
      // 現在の視点の試合から記録されたマップを抽出
      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      const recordedMaps = new Set();
      
      perspectiveMatches.forEach(match => {
        if (match.map) {
          recordedMaps.add(match.map);
        }
      });
      
      // 選択肢をクリア（「全マップ」以外）
      characterMapFilter.innerHTML = '<option value="all">全マップ</option>';
      
      // 実際に記録したマップのみ追加（配列定義順）
      const sortedMaps = MAPS.filter(map => recordedMaps.has(map));
      sortedMaps.forEach(map => {
        const option = document.createElement('option');
        option.value = map;
        option.textContent = map;
        characterMapFilter.appendChild(option);
      });
      
      // 以前の選択値を復元（存在する場合）
      if (currentValue && (currentValue === 'all' || recordedMaps.has(currentValue))) {
        characterMapFilter.value = currentValue;
      } else {
        characterMapFilter.value = 'all';
      }
    }
    
    // 試合履歴の全フィルター選択肢を更新（相手キャラ・自キャラ・マップ・特質）
    function updateAllHistoryFilters() {
      updateHistoryOpponentFilter();
      updateHistoryCharFilter();
      const charVal = document.getElementById('history-char-filter')?.value || 'all';
      updateHistoryMapFilter(charVal);
      updateHistoryTraitFilter();
    }

    function updateHistoryTraitFilter() {
      const filter = document.getElementById('history-trait-filter');
      if (!filter) return;
      const currentValue = filter.value;
      const usedTraits = new Set(
        matches.filter(m => m.perspective === 'hunter' && m.trait).map(m => m.trait)
      );
      const options = ['<option value="all">すべて</option>'];
      TRAITS.forEach(t => {
        if (usedTraits.has(t)) options.push(`<option value="${t}">${t}</option>`);
      });
      filter.innerHTML = options.join('');
      filter.value = usedTraits.has(currentValue) ? currentValue : 'all';
    }

    // 試合履歴の相手キャラフィルターを更新
    function updateHistoryOpponentFilter() {
      const filter = document.getElementById('history-opponent-filter');
      if (!filter) return;
      
      const currentValue = filter.value;
      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      const opponents = new Set();
      
      perspectiveMatches.forEach(match => {
        if (currentPerspective === 'survivor') {
          if (match.opponentHunter) opponents.add(match.opponentHunter);
        } else {
          if (match.opponentSurvivors) {
            match.opponentSurvivors.forEach(s => { if (s) opponents.add(s); });
          }
        }
      });
      
      filter.innerHTML = '<option value="all">全キャラ</option>';
      
      const charArray = currentPerspective === 'survivor' ? HUNTERS : SURVIVORS;
      const sorted = charArray.filter(c => opponents.has(c));
      sorted.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        filter.appendChild(option);
      });
      
      if (currentValue && (currentValue === 'all' || opponents.has(currentValue))) {
        filter.value = currentValue;
      } else {
        filter.value = 'all';
      }
    }
    
    // 試合履歴の自キャラフィルターを更新（記録済みキャラのみ）
    function updateHistoryCharFilter() {
      const filter = document.getElementById('history-char-filter');
      if (!filter) return;

      const currentValue = filter.value;
      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      const usedCharsSet = new Set(perspectiveMatches.map(m => m.myCharacter));

      const charArray = currentPerspective === 'survivor' ? SURVIVORS : HUNTERS;
      const usedChars = charArray.filter(c => usedCharsSet.has(c));

      filter.innerHTML = '<option value="all">全キャラ</option>';
      usedChars.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        filter.appendChild(option);
      });

      filter.value = (currentValue === 'all' || usedCharsSet.has(currentValue)) ? currentValue : 'all';
    }

    // 試合履歴のマップフィルターを更新（自キャラ連動・記録済みのみ）
    function updateHistoryMapFilter(selectedChar = 'all') {
      const filter = document.getElementById('history-map-filter');
      if (!filter) return;

      const currentValue = filter.value;
      let perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      if (selectedChar !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.myCharacter === selectedChar);
      }

      const usedMapsSet = new Set(perspectiveMatches.map(m => m.map));
      const usedMaps = MAPS.filter(map => usedMapsSet.has(map));

      filter.innerHTML = '<option value="all">全マップ</option>';
      usedMaps.forEach(map => {
        const option = document.createElement('option');
        option.value = map;
        option.textContent = map;
        filter.appendChild(option);
      });

      filter.value = (currentValue === 'all' || usedMapsSet.has(currentValue)) ? currentValue : 'all';
    }

    // 折りたたみ状態管理
    let pairStatsExpanded = false;
    let teammateStatsExpanded = false;
    let pairFilterChar1 = '';
    let pairFilterChar2 = '';

    // 最低試合数フィルター（セクション別）
    const minMatchCounts = {
      character: 1, map: 1,
      opponentHunter: 1, teammate: 1,
      opponent: 1, opponentPair: 1
    };

    function setMinMatchCount(tab, value) {
      const n = parseInt(value);
      minMatchCounts[tab] = (isNaN(n) || n < 1) ? 1 : n;
      resetPagination();
      updateAllStats();
    }

    function resetMinMatchCount(tab) {
      minMatchCounts[tab] = 1;
      resetPagination();
      updateAllStats();
    }

    function togglePairStats() {
      pairStatsExpanded = !pairStatsExpanded;
      updateOpponentStats();
    }

    function toggleTeammateStats() {
      teammateStatsExpanded = !teammateStatsExpanded;
      updateOpponentStats();
    }

    function onPairChar1Change() {
      pairFilterChar1 = document.getElementById('pair-filter-char-1')?.value || '';
      if (pairFilterChar2 === pairFilterChar1) pairFilterChar2 = '';
      currentPages.pairStats = 1;
      updateOpponentStats();
    }

    function onPairChar2Change() {
      pairFilterChar2 = document.getElementById('pair-filter-char-2')?.value || '';
      if (pairFilterChar1 === pairFilterChar2) pairFilterChar1 = '';
      currentPages.pairStats = 1;
      updateOpponentStats();
    }

    // 試合履歴の自キャラフィルター変更時（マップ連動）
    function onHistoryCharFilterChange() {
      const selectedChar = document.getElementById('history-char-filter').value;
      updateHistoryMapFilter(selectedChar);
      updateAllStats();
    }

    // サバイバー視点：選択済みキャラを他の選択肢から除外（BAN↔編成 相互除外）
    function updateSurvivorSelectOptions() {
      const mySurvivor = document.getElementById('my-survivor').value;
      const teammate1 = document.getElementById('teammate-1').value;
      const teammate2 = document.getElementById('teammate-2').value;
      const teammate3 = document.getElementById('teammate-3').value;
      const ban1 = document.getElementById('ban-char-1').value;
      const ban2 = document.getElementById('ban-char-2').value;
      const ban3 = document.getElementById('ban-char-3').value;

      const partySelected = [mySurvivor, teammate1, teammate2, teammate3].filter(v => v);
      const banSelected   = [ban1, ban2, ban3].filter(v => v);

      // 編成セレクト: 他の編成メンバー＋BAN済みを除外
      const sortedSurvivorsUsed = sortCharactersByUsage(SURVIVORS, 'survivorUsed');
      ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3'].forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        const excluded = new Set([...partySelected, ...banSelected]);
        excluded.delete(currentValue);

        select.innerHTML = '<option value="">選択してください</option>';
        sortedSurvivorsUsed.forEach(survivor => {
          if (!excluded.has(survivor)) {
            const option = document.createElement('option');
            option.value = survivor;
            option.textContent = survivor;
            select.appendChild(option);
          }
        });
        select.value = currentValue;
        updatePlaceholderStyle(select);
        syncSearchableSelect(id);
      });

      // BANセレクト: 他のBAN＋編成メンバーを除外
      const sortedSurvivorsBanned = sortCharactersByUsage(SURVIVORS, 'survivorBanned');
      BAN_CHAR_IDS.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        const excluded = new Set([...partySelected, ...banSelected]);
        excluded.delete(currentValue);

        select.innerHTML = '<option value="">なし</option>';
        sortedSurvivorsBanned.forEach(survivor => {
          if (!excluded.has(survivor)) {
            const option = document.createElement('option');
            option.value = survivor;
            option.textContent = survivor;
            select.appendChild(option);
          }
        });
        select.value = currentValue;
        updatePlaceholderStyle(select);
        syncSearchableSelect(id);
      });
    }
    
    // ハンター視点：選択済みキャラを他の選択肢から除外
    function updateHunterOpponentSelectOptions() {
      const opponent1 = document.getElementById('opponent-survivor-1').value;
      const opponent2 = document.getElementById('opponent-survivor-2').value;
      const opponent3 = document.getElementById('opponent-survivor-3').value;
      const opponent4 = document.getElementById('opponent-survivor-4').value;
      
      const selected = [opponent1, opponent2, opponent3, opponent4].filter(v => v);
      
      // サバイバー対戦回数順にソート
      const sortedSurvivors = sortCharactersByUsage(SURVIVORS, 'survivorFaced');
      
      ['opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4'].forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        // 選択肢を再構築
        select.innerHTML = '<option value="">選択してください</option>';
        sortedSurvivors.forEach(survivor => {
          // 自分以外で選択されているキャラは除外
          if (!selected.includes(survivor) || survivor === currentValue) {
            const option = document.createElement('option');
            option.value = survivor;
            option.textContent = survivor;
            select.appendChild(option);
          }
        });
        
        // 現在の値を復元
        select.value = currentValue;
        
        // プレースホルダースタイルを更新
        updatePlaceholderStyle(select);
        
        // SearchableSelect同期
        syncSearchableSelect(id);
      });
    }
    
    // 段位フィルターを設定（使用済み段位のみ）
    function populateRankFilters() {
      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      const usedRanks = [...new Set(perspectiveMatches.map(m => m.rank).filter(r => r))];
      
      // RANKS配列の順序を保持してソート
      const sortedRanks = RANKS.filter(rank => usedRanks.includes(rank));
      
      const filterIds = ['overall-rank-filter', 'character-rank-filter', 'map-rank-filter', 'opponent-rank-filter', 'history-rank-filter'];
      filterIds.forEach(id => {
        const wrapper = document.getElementById(id);
        if (!wrapper) return;
        
        // 既存の選択状態を保持
        const prevSelected = wrapper.dataset.selected ? JSON.parse(wrapper.dataset.selected) : null;
        
        // 全段位がデフォルト
        wrapper.dataset.selected = JSON.stringify(prevSelected || ['all']);
        
        buildMultiRankUI(wrapper, sortedRanks, id);
      });
      
      // マップフィルター（対戦相手別勝率用、自キャラフィルターに連動）
      const myCharFilterValue = document.getElementById('my-char-filter')?.value || 'all';
      updateMapFilter(myCharFilterValue);
      
      // 自キャラフィルター
      updateMyCharFilter();
    }
    
    // マップフィルターを更新（自キャラフィルターに連動）
    function updateMapFilter(selectedChar = 'all') {
      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      
      // 自キャラでフィルター
      let filteredMatches = perspectiveMatches;
      if (selectedChar !== 'all') {
        filteredMatches = perspectiveMatches.filter(m => m.myCharacter === selectedChar);
      }
      
      // 配列定義順にソート
      const usedMapsSet = new Set(filteredMatches.map(m => m.map));
      const usedMaps = MAPS.filter(map => usedMapsSet.has(map));
      
      const mapSelect = document.getElementById('opponent-map-filter');
      const currentValue = mapSelect.value;
      mapSelect.innerHTML = '<option value="all">全マップ</option>';
      usedMaps.forEach(map => {
        const option = document.createElement('option');
        option.value = map;
        option.textContent = map;
        mapSelect.appendChild(option);
      });
      
      // 前回選択していた値を復元（存在する場合のみ）
      if (currentValue && (currentValue === 'all' || usedMaps.includes(currentValue))) {
        mapSelect.value = currentValue;
      }
    }
    
    // 自キャラフィルターを更新（使用済みキャラのみ）
    function updateMyCharFilter() {
      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      const usedCharsSet = new Set(perspectiveMatches.map(m => m.myCharacter));

      // 配列定義順にソート（視点に応じて配列を選択）
      const characterArray = currentPerspective === 'survivor' ? SURVIVORS : HUNTERS;
      const usedChars = characterArray.filter(char => usedCharsSet.has(char));

      // 対戦相手別勝率のフィルター
      const opponentSelect = document.getElementById('my-char-filter');
      const prevOpponent = opponentSelect.value;
      opponentSelect.innerHTML = '<option value="all">全キャラ</option>';
      usedChars.forEach(char => {
        const option = document.createElement('option');
        option.value = char;
        option.textContent = char;
        opponentSelect.appendChild(option);
      });
      if (prevOpponent && (prevOpponent === 'all' || usedCharsSet.has(prevOpponent))) {
        opponentSelect.value = prevOpponent;
      }

      // マップ別勝率のフィルター
      const mapSelect = document.getElementById('map-char-filter');
      const prevMap = mapSelect.value;
      mapSelect.innerHTML = '<option value="all">全キャラ</option>';
      usedChars.forEach(char => {
        const option = document.createElement('option');
        option.value = char;
        option.textContent = char;
        mapSelect.appendChild(option);
      });
      if (prevMap && (prevMap === 'all' || usedCharsSet.has(prevMap))) {
        mapSelect.value = prevMap;
      }
    }
    
    // 視点を切り替え
    function switchPerspective(perspective, el) {
      currentPerspective = perspective;

      document.querySelectorAll('.perspective-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      if (el) el.classList.add('active');
      
      // 折りたたみ状態をリセット
      pairStatsExpanded = false;
      teammateStatsExpanded = false;
      pairFilterChar1 = '';
      pairFilterChar2 = '';
      currentPages.pairStats = 1;

      if (perspective === 'survivor') {
        document.getElementById('survivor-input').classList.remove('hidden');
        document.getElementById('hunter-input').classList.add('hidden');

        const opponentFilterGroup = document.getElementById('opponent-filter-group');
        if (opponentFilterGroup) opponentFilterGroup.classList.remove('hidden');
      } else {
        document.getElementById('survivor-input').classList.add('hidden');
        document.getElementById('hunter-input').classList.remove('hidden');

        const opponentFilterGroup = document.getElementById('opponent-filter-group');
        if (opponentFilterGroup) opponentFilterGroup.classList.add('hidden');
      }
      
      refreshAfterDataChange({ skipOpponentHunterFilter: true });
    }

    // タブを切り替え
    function switchTab(tabName, el) {
      // 詳細ページが開いていれば閉じる
      const detailPageEl = document.getElementById('detail-page');
      if (detailPageEl && !detailPageEl.classList.contains('hidden')) {
        detailPageEl.classList.add('hidden');
        history.pushState(null, '', location.pathname);
      }
      document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      if (el) el.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabName + '-tab').classList.add('active');
      
      // 設定タブに切り替えた時はデータ情報を更新
      if (tabName === 'settings') {
        updateDataInfo();
        updateSyncUI();
      }
      // 追加機能タブ（PC）
      if (tabName === 'extra') {
        updateDataInfo();
      }
      
      updateAllStats();
      // モバイルボトムナビの同期（5タブ）
      if (['input', 'overall', 'character', 'map', 'opponent'].includes(tabName)) {
        document.querySelectorAll('.bottom-nav-item').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.nav === tabName);
        });
        const navOrder = ['input', 'overall', 'character', 'map', 'opponent'];
        const idx = navOrder.indexOf(tabName);
        const pill = document.getElementById('bottom-nav-pill');
        if (pill && idx >= 0) pill.style.transform = `translateX(${idx * 100}%)`;
      }
    }
    
    // 脱出人数を選択
    function toggleDetailInput() {
      const area  = document.getElementById('detail-input-area');
      const arrow = document.getElementById('detail-toggle-arrow');
      area.classList.toggle('hidden');
      arrow.classList.toggle('open');
    }

    function toggleHunterDetailInput() {
      const area  = document.getElementById('hunter-detail-input-area');
      const arrow = document.getElementById('hunter-detail-toggle-arrow');
      area.classList.toggle('hidden');
      arrow.classList.toggle('open');
    }

    function selectEscapeCount(perspective, count, el) {
      selectedEscapeCount[perspective] = count;

      const container = perspective === 'survivor' ? document.getElementById('survivor-input') : document.getElementById('hunter-input');
      container.querySelectorAll('.result-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      if (el) el.classList.add('selected');
    }
    
    // 脱出人数から勝敗を判定
    function getResultFromEscapeCount(escapeCount, perspective) {
      if (perspective === 'survivor') {
        if (escapeCount >= 3) return 'survivor_win';
        if (escapeCount === 2) return 'draw';
        return 'hunter_win';
      } else {
        if (escapeCount <= 1) return 'hunter_win';
        if (escapeCount === 2) return 'draw';
        return 'survivor_win';
      }
    }
    
    // 試合を記録
    function submitMatch(perspective) {
      const _existingMatch = editingMatchId ? matches.find(m => m.id === editingMatchId) : null;
      let match = {
        id: _existingMatch ? _existingMatch.id : Date.now(),
        perspective: perspective,
        timestamp: _existingMatch ? _existingMatch.timestamp : new Date().toISOString()
      };
      
      if (perspective === 'survivor') {
        const date = document.getElementById('survivor-date').value;
        const rank = document.getElementById('survivor-rank').value;
        const mySurvivor = document.getElementById('my-survivor').value;
        const teammate1 = document.getElementById('teammate-1').value;
        const teammate2 = document.getElementById('teammate-2').value;
        const teammate3 = document.getElementById('teammate-3').value;
        const opponentHunter = document.getElementById('opponent-hunter').value;
        const map = document.getElementById('survivor-map').value;
        const escapeCount = selectedEscapeCount.survivor;

        const missing = [];
        if (!date) missing.push('survivor-date');
        if (!rank) missing.push('survivor-rank');
        if (!mySurvivor) missing.push('my-survivor');
        if (!teammate1) missing.push('teammate-1');
        if (!teammate2) missing.push('teammate-2');
        if (!teammate3) missing.push('teammate-3');
        if (!opponentHunter) missing.push('opponent-hunter');
        if (!map) missing.push('survivor-map');
        if (escapeCount === null) missing.push('survivor-escape');
        if (missing.length > 0) {
          showToast('入力されていない項目があります', 'error');
          highlightMissingFields(missing);
          return;
        }

        match.date = date;
        match.rank = rank;
        match.myCharacter = mySurvivor;
        match.teammates = [teammate1, teammate2, teammate3];
        match.opponentHunter = opponentHunter;
        match.map = map;
        match.escapeCount = escapeCount;
        match.result = getResultFromEscapeCount(escapeCount, perspective);
        match.comment = document.getElementById('survivor-comment').value.trim();
        const banned = BAN_CHAR_IDS.map(id => document.getElementById(id).value).filter(v => v);
        if (banned.length > 0) match.bannedCharacters = banned;
      } else {
        const date = document.getElementById('hunter-date').value;
        const rank = document.getElementById('hunter-rank').value;
        const myHunter = document.getElementById('my-hunter').value;
        const opponentSurvivor1 = document.getElementById('opponent-survivor-1').value;
        const opponentSurvivor2 = document.getElementById('opponent-survivor-2').value;
        const opponentSurvivor3 = document.getElementById('opponent-survivor-3').value;
        const opponentSurvivor4 = document.getElementById('opponent-survivor-4').value;
        const map = document.getElementById('hunter-map').value;
        const escapeCount = selectedEscapeCount.hunter;

        const missing = [];
        if (!date) missing.push('hunter-date');
        if (!rank) missing.push('hunter-rank');
        if (!myHunter) missing.push('my-hunter');
        if (!selectedTrait) missing.push('hunter-trait');
        if (!opponentSurvivor1) missing.push('opponent-survivor-1');
        if (!opponentSurvivor2) missing.push('opponent-survivor-2');
        if (!opponentSurvivor3) missing.push('opponent-survivor-3');
        if (!opponentSurvivor4) missing.push('opponent-survivor-4');
        if (!map) missing.push('hunter-map');
        if (escapeCount === null) missing.push('hunter-escape');
        if (missing.length > 0) {
          showToast('入力されていない項目があります', 'error');
          highlightMissingFields(missing);
          return;
        }

        match.date = date;
        match.rank = rank;
        match.myCharacter = myHunter;
        match.trait = selectedTrait;
        match.opponentSurvivors = [opponentSurvivor1, opponentSurvivor2, opponentSurvivor3, opponentSurvivor4];
        match.map = map;
        match.escapeCount = escapeCount;
        match.result = getResultFromEscapeCount(escapeCount, perspective);
        match.comment = document.getElementById('hunter-comment').value.trim();
      }
      
      if (editingMatchId) {
        // 編集モードの場合、古いデータの使用回数を減らす
        const oldMatch = matches.find(m => m.id === editingMatchId);
        if (oldMatch) {
          if (oldMatch.perspective === 'survivor') {
            // サバイバー視点：自分、味方3人の使用回数を減らす
            decrementCharacterUsage('survivorUsed', [oldMatch.myCharacter, ...oldMatch.teammates]);
            // 対戦相手ハンターの対戦回数を減らす
            decrementCharacterUsage('hunterFaced', oldMatch.opponentHunter);
            if (oldMatch.bannedCharacters) decrementCharacterUsage('survivorBanned', oldMatch.bannedCharacters);
          } else {
            // ハンター視点：自分の使用回数を減らす
            decrementCharacterUsage('hunterUsed', oldMatch.myCharacter);
            // 対戦相手サバイバー4人の対戦回数を減らす
            decrementCharacterUsage('survivorFaced', oldMatch.opponentSurvivors || []);
          }
        }
        
        matches = matches.filter(m => m.id !== editingMatchId);
        editingMatchId = null;
      }
      
      // 新しいデータの使用回数を増やす
      if (perspective === 'survivor') {
        // サバイバー視点：自分、味方3人の使用回数を増やす
        incrementCharacterUsage('survivorUsed', [match.myCharacter, ...match.teammates]);
        // 対戦相手ハンターの対戦回数を増やす
        incrementCharacterUsage('hunterFaced', match.opponentHunter);
        // BANキャラの使用回数を増やす
        if (match.bannedCharacters) incrementCharacterUsage('survivorBanned', match.bannedCharacters);
      } else {
        // ハンター視点：自分の使用回数を増やす
        incrementCharacterUsage('hunterUsed', match.myCharacter);
        // 対戦相手サバイバー4人の対戦回数を増やす
        incrementCharacterUsage('survivorFaced', match.opponentSurvivors);
      }
      
      matches.push(match);
      saveData();
      
      // 保持設定を保存
      savePersistedValues(perspective);
      
      resetForm(perspective);
      
      showToast('試合を記録しました！');
      refreshAfterDataChange({ rebuildSelects: true });
    }
    
    // フォームをリセット（保持設定に応じて）
    function resetForm(perspective) {
      const fields = perspective === 'survivor' ? SURVIVOR_FIELDS : HUNTER_FIELDS;
      fields.forEach(field => {
        const persistCheckbox = document.getElementById(field.persistKey);
        const element = document.getElementById(field.id);
        // 保持チェックボックスがオフの場合のみクリア
        if (!persistCheckbox || !persistCheckbox.checked) {
          if (element) {
            element.value = field.isDate ? getToday() : '';
          }
        }
      });

      if (perspective === 'survivor') {
        selectedEscapeCount.survivor = null;
        document.getElementById('survivor-comment').value = '';
        BAN_CHAR_IDS.forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('detail-input-area').classList.add('hidden');
        document.getElementById('detail-toggle-arrow').classList.remove('open');
        document.querySelectorAll('#survivor-input .result-button').forEach(btn => btn.classList.remove('selected'));
        updateSurvivorSelectOptions();
        SS_SURVIVOR_IDS.forEach(syncSearchableSelect);
      } else {
        selectedEscapeCount.hunter = null;
        if (!document.getElementById('persist-hunter-trait').checked) {
          resetTraitPicker();
        }
        document.getElementById('hunter-comment').value = '';
        document.getElementById('hunter-detail-input-area').classList.add('hidden');
        document.getElementById('hunter-detail-toggle-arrow').classList.remove('open');
        document.querySelectorAll('#hunter-input .result-button').forEach(btn => btn.classList.remove('selected'));
        updateHunterOpponentSelectOptions();
        SS_HUNTER_IDS.forEach(syncSearchableSelect);
      }
    }
    
    // データを保存
    function saveData() {
      localStorage.setItem('identity5_matches', JSON.stringify(matches));
      localStorage.setItem('identity5_data_modified', new Date().toISOString());
      _autoSyncFailCount = 0; // データ変更時にリセットして再試行可能にする
      autoSync();
    }
    
    // データを読み込み
    function loadData() {
      const saved = localStorage.getItem('identity5_matches');
      if (saved) {
        try {
          matches = JSON.parse(saved);
        } catch (_) {
          console.error('試合データの読み込みに失敗しました。データをリセットします。');
          matches = [];
          localStorage.removeItem('identity5_matches');
          return;
        }

        // 既存データに日付がない場合、timestampから生成（マイグレーション）
        let migrated = false;
        matches = matches.map(match => {
          if (!match.date && match.timestamp) {
            const dateObj = new Date(match.timestamp);
            match.date = formatDate(dateObj);
            migrated = true;
          } else if (!match.date && match.id) {
            // timestampもない場合はidから生成
            const dateObj = new Date(match.id);
            match.date = formatDate(dateObj);
            migrated = true;
          }
          return match;
        });
        
        // マイグレーションした場合は保存
        if (migrated) {
          saveData();
        }
      }
    }
    
    // 保持された値を復元
    function loadPersistedValues(perspective) {
      try {
        const fields = perspective === 'survivor' ? SURVIVOR_FIELDS : HUNTER_FIELDS;
        fields.forEach(field => {
          const persistCheckbox = document.getElementById(field.persistKey);
          const element = document.getElementById(field.id);
          const savedValue = localStorage.getItem(`persist_value_${field.id}`);
          const isChecked = localStorage.getItem(`persist_checkbox_${field.persistKey}`) === 'true';

          if (isChecked && persistCheckbox) {
            persistCheckbox.checked = true;
          }
          if (field.isTrait) {
            if (isChecked && savedValue && TRAITS.includes(savedValue)) selectTrait(savedValue);
          } else if (savedValue && element) {
            element.value = savedValue;
          } else if (field.isDate && element && !element.value) {
            // 日付フィールドで保持していない場合は今日の日付
            element.value = getToday();
          }
        });
      } catch (error) {
        console.error('Error loading persisted values:', error);
      }

      // SearchableSelect同期
      (perspective === 'survivor' ? SS_SURVIVOR_IDS : SS_HUNTER_IDS).forEach(syncSearchableSelect);
    }
    
    // 保持設定を保存
    function savePersistedValues(perspective) {
      try {
        const fields = perspective === 'survivor' ? SURVIVOR_FIELDS : HUNTER_FIELDS;
        fields.forEach(field => {
          const persistCheckbox = document.getElementById(field.persistKey);
          const element = document.getElementById(field.id);
          if (persistCheckbox && persistCheckbox.checked) {
            localStorage.setItem(`persist_checkbox_${field.persistKey}`, 'true');
            if (field.isTrait) {
              if (selectedTrait) localStorage.setItem(`persist_value_${field.id}`, selectedTrait);
            } else if (element) {
              localStorage.setItem(`persist_value_${field.id}`, element.value);
            }
          } else {
            localStorage.removeItem(`persist_checkbox_${field.persistKey}`);
            localStorage.removeItem(`persist_value_${field.id}`);
          }
        });
      } catch (error) {
        console.error('Error saving persisted values:', error);
      }
    }
    
    // 全ての保持設定をクリア（確認なし）
    function clearAllPersistence(perspective) {
      try {
        const fields = perspective === 'survivor' ? SURVIVOR_FIELDS : HUNTER_FIELDS;
        fields.forEach(field => {
          const persistCheckbox = document.getElementById(field.persistKey);
          const element = document.getElementById(field.id);
          if (persistCheckbox) persistCheckbox.checked = false;
          if (element) {
            if (field.isDate) {
              element.value = getToday();
            } else {
              element.value = '';
              if (element.tagName === 'SELECT') updatePlaceholderStyle(element);
            }
          }
          localStorage.removeItem(`persist_checkbox_${field.persistKey}`);
          localStorage.removeItem(`persist_value_${field.id}`);
        });

        if (perspective === 'survivor') {
          updateSurvivorSelectOptions();
          SS_SURVIVOR_IDS.forEach(syncSearchableSelect);
        } else {
          resetTraitPicker();
          updateHunterOpponentSelectOptions();
          SS_HUNTER_IDS.forEach(syncSearchableSelect);
        }
      } catch (error) {
        console.error('Error clearing persistence:', error);
      }
    }
    
    // 入力値を保存
    // フィルタリングされたデータを取得
    function getFilteredMatches(rankFilter) {
      let filtered = matches.filter(m => m.perspective === currentPerspective);
      if (rankFilter && rankFilter !== 'all') {
        const selectedRanks = rankFilter.split(',');
        filtered = filtered.filter(m => selectedRanks.includes(m.rank));
      }
      return filtered;
    }
    
    // ランクフィルターの値を取得するヘルパー
    function updateSelectStyle(el) {
      if (!el) return;
      el.classList.toggle('filter-active', el.value !== 'all' && el.value !== '');
    }
    function buildEmptyState(hasData = false) {
      if (hasData) {
        return '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">条件に合う試合がありません</div><div class="empty-state-sub">フィルターを変更してみてください</div></div>';
      }
      return '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">まだ試合データがありません</div><div class="empty-state-sub">試合を入力すると、ここに統計が表示されます</div><button class="empty-state-cta" onclick="switchBottomNav(\'input\',document.querySelector(\'.bottom-nav-item[data-nav=input]\'));switchTab(\'input\')">試合を入力する</button></div>';
    }

    function updateAllSelectStyles() {
      document.querySelectorAll('select[onchange]').forEach(el => updateSelectStyle(el));
    }

    function getRankFilterValue(id) {
      const wrapper = document.getElementById(id);
      if (!wrapper) return 'all';
      const selected = wrapper.dataset.selected ? JSON.parse(wrapper.dataset.selected) : ['all'];
      if (selected.includes('all') || selected.length === 0) return 'all';
      return selected.join(',');
    }
    
    // マルチセレクト段位UIを構築
    function buildMultiRankUI(wrapper, ranks, filterId) {
      const selected = wrapper.dataset.selected ? JSON.parse(wrapper.dataset.selected) : ['all'];
      const isAll = selected.includes('all') || selected.length === 0;
      
      // 表示テキスト
      let displayText = '全段位';
      if (!isAll) {
        if (selected.length <= 3) {
          displayText = selected.join(', ');
        } else {
          displayText = selected.length + '個の段位';
        }
      }
      
      // トリガーボタン
      let triggerEl = wrapper.querySelector('.multi-rank-trigger');
      if (!triggerEl) {
        wrapper.innerHTML = '';
        triggerEl = document.createElement('div');
        triggerEl.className = 'multi-rank-trigger';
        wrapper.appendChild(triggerEl);
        
        const dropdown = document.createElement('div');
        dropdown.className = 'multi-rank-dropdown';
        wrapper.appendChild(dropdown);
        
        triggerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          // 他のドロップダウンを閉じる
          document.querySelectorAll('.multi-rank-dropdown.open').forEach(d => {
            if (d !== dropdown) { d.classList.remove('open'); d.previousElementSibling.classList.remove('open'); }
          });
          dropdown.classList.toggle('open');
          triggerEl.classList.toggle('open');
        });
      }
      triggerEl.textContent = displayText;
      triggerEl.classList.toggle('active', !isAll);

      const dropdown = wrapper.querySelector('.multi-rank-dropdown');
      dropdown.innerHTML = '';
      
      // 「全段位」項目
      const allItem = document.createElement('label');
      allItem.className = 'multi-rank-item all-item';
      const allCb = document.createElement('input');
      allCb.type = 'checkbox';
      allCb.checked = isAll;
      allCb.addEventListener('change', () => {
        if (allCb.checked) {
          wrapper.dataset.selected = JSON.stringify(['all']);
        } else {
          // 全解除時は全段位に戻す
          allCb.checked = true;
          return;
        }
        buildMultiRankUI(wrapper, ranks, filterId);
        updateAllStats();
      });
      allItem.appendChild(allCb);
      allItem.appendChild(document.createTextNode(' 全段位'));
      dropdown.appendChild(allItem);
      
      // 各段位
      ranks.forEach(rank => {
        const item = document.createElement('label');
        item.className = 'multi-rank-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = isAll || selected.includes(rank);
        cb.addEventListener('change', () => {
          let cur = wrapper.dataset.selected ? JSON.parse(wrapper.dataset.selected) : ['all'];
          
          if (cb.checked) {
            // 「全段位」が選択中なら個別に切り替え
            if (cur.includes('all')) {
              cur = [rank];
            } else {
              cur.push(rank);
            }
            // 全部選択されたら「全段位」に戻す
            if (cur.length >= ranks.length) {
              cur = ['all'];
            }
          } else {
            if (cur.includes('all')) {
              // 全段位から1つ外す
              cur = ranks.filter(r => r !== rank);
            } else {
              cur = cur.filter(r => r !== rank);
            }
            // 何も選択されてなければ全段位に戻す
            if (cur.length === 0) {
              cur = ['all'];
            }
          }
          
          wrapper.dataset.selected = JSON.stringify(cur);
          buildMultiRankUI(wrapper, ranks, filterId);
          updateAllStats();
        });
        item.appendChild(cb);
        item.appendChild(document.createTextNode(' ' + rank));
        dropdown.appendChild(item);
      });
    }
    
    // 段位ドロップダウンを外側クリックで閉じる
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.multi-rank-wrapper')) {
        document.querySelectorAll('.multi-rank-dropdown.open').forEach(d => {
          d.classList.remove('open');
          d.previousElementSibling.classList.remove('open');
        });
      }
    });
    
    // 自キャラフィルター変更時の処理
    function onMyCharFilterChange() {
      const selectedChar = document.getElementById('my-char-filter').value;
      updateMapFilter(selectedChar);
      updateAllStats();
    }
    
    // 全ての統計を更新（アクティブタブのみDOM構築、他はdirtyマーク）
    let _updateAllStatsRAF = 0;
    const _tabDirty = { overall: true, character: true, map: true, opponent: true, history: true };
    const _tabUpdaters = {
      overall:   () => updateOverallStatsTab(),
      character: () => updateCharacterStats(),
      map:       () => updateMapStats(),
      opponent:  () => updateOpponentStats(),
      history:   () => updateMatchHistory()
    };

    function _getActiveTabId() {
      const el = document.querySelector('.tab-content.active');
      return el ? el.id.replace('-tab', '') : 'input';
    }

    function updateAllStats() {
      if (_updateAllStatsRAF) return;
      _updateAllStatsRAF = requestAnimationFrame(() => {
        _updateAllStatsRAF = 0;
        updateAllSelectStyles();
        const activeTab = _getActiveTabId();
        for (const tab in _tabUpdaters) {
          if (tab === activeTab) {
            _tabUpdaters[tab]();
            _tabDirty[tab] = false;
          } else {
            _tabDirty[tab] = true;
          }
        }
        updateHeaderStats();
        ['overall', 'character', 'map', 'opponent', 'history'].forEach(id => renderFilterChips(id));
      });
    }

    // フィルター変更時にページをリセット
    function resetPagination() {
      currentPages.teammateStats = 1;
      currentPages.opponentStats = 1;
      currentPages.pairStats = 1;
      currentPages.matchHistory = 1;
    }
    
    // フィルターを含む全てを更新
    function updateAllWithFilters() {
      resetPagination();
      populateRankFilters();
      updateAllStats();
    }
    
    // データ変更後の共通リフレッシュ（フィルター再構築 → 全統計更新）
    function refreshAfterDataChange({ rebuildSelects = false, skipOpponentHunterFilter = false } = {}) {
      if (!skipOpponentHunterFilter) updateOpponentHunterFilter();
      updateCharacterOpponentFilter();
      updateAllHistoryFilters();
      updateCharacterMapFilter();
      if (rebuildSelects) repopulateCharacterSelects();
      updateAllWithFilters();
      updatePredictBackLink();
    }

    // 勝率を計算
    function calculateWinrate(matches, perspective) {
      const totalWithDraws = matches.length; // 引き分けを含む総試合数
      const filtered = matches.filter(m => m.result !== 'draw');
      if (filtered.length === 0) return { wins: 0, losses: 0, draws: totalWithDraws, winrate: '0.0', total: 0, totalWithDraws: totalWithDraws };
      
      const wins = filtered.filter(m => {
        if (perspective === 'survivor') {
          return m.result === 'survivor_win';
        } else {
          return m.result === 'hunter_win';
        }
      }).length;
      
      const losses = filtered.length - wins;
      const draws = matches.filter(m => m.result === 'draw').length;
      const winrate = (wins / filtered.length * 100).toFixed(1);
      
      return { wins, losses, draws, winrate, total: filtered.length, totalWithDraws: totalWithDraws };
    }
    
    // 連勝数を計算
    function calculateWinStreak(matches, perspective) {
      if (matches.length === 0) return 0;
      
      // 最新の試合から遡る（dateで降順、同日はidで降順）
      const sorted = [...matches].sort((a, b) => {
        if (a.date !== b.date) return (b.date || '') > (a.date || '') ? 1 : -1;
        return (b.id || 0) - (a.id || 0);
      });
      let streak = 0;
      
      for (const match of sorted) {
        if (match.result === 'draw') continue; // 引き分けは無視
        
        const isWin = (perspective === 'survivor' && match.result === 'survivor_win') || 
                      (perspective === 'hunter' && match.result === 'hunter_win');
        
        if (isWin) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    }
    
    // 平均脱出/脱落人数を計算
    function calculateAverageEscapeCount(matches, perspective) {
      if (matches.length === 0) return 0;
      
      const total = matches.reduce((sum, m) => sum + (m.escapeCount || 0), 0);
      return (total / matches.length).toFixed(1);
    }
    
    // 総合勝率タブの更新
    let winrateChart = null;    // 勝率推移グラフ
    let mapPieChart = null;     // マップ別試合数グラフ
    let charPieChart = null;    // 自キャラ使用数グラフ
    let resultPieChart = null;  // 勝敗割合グラフ
    let overallMode = 'total';  // 'total' or 'recent100'

    // ドーナツチャート用スライスラベルプラグインのファクトリ
    const _charLabelFn = label => label.startsWith('「') ? label.charAt(1) : label.charAt(0);
    function createSliceLabelPlugin(id, { fontSize = 13, labelFn } = {}) {
      const getChar = labelFn || (label => label.charAt(0));
      return {
        id,
        afterDraw(chart) {
          const ctx = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 3;
          ctx.font = `bold ${fontSize}px sans-serif`;
          meta.data.forEach((arc, index) => {
            const value = chart.data.datasets[0].data[index];
            if (value / total < 0.05) return;
            const midAngle = (arc.startAngle + arc.endAngle) / 2;
            const midRadius = (arc.outerRadius + arc.innerRadius) / 2;
            const x = arc.x + midRadius * Math.cos(midAngle);
            const y = arc.y + midRadius * Math.sin(midAngle);
            ctx.fillText(getChar(chart.data.labels[index]), x, y);
          });
          ctx.restore();
        }
      };
    }

    function setOverallMode(mode) {
      overallMode = mode;
      document.querySelectorAll('.overall-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });
      const periodFilter = document.getElementById('overall-period-filter');
      if (periodFilter) periodFilter.disabled = (mode === 'recent100');
      updateOverallStatsTab();
    }
    
    function updateOverallStatsTab() {
      updateSelectStyle(document.getElementById('overall-period-filter'));
      const container = document.getElementById('overall-stats-display');
      const rankFilter = getRankFilterValue('overall-rank-filter');
      let perspectiveMatches = getFilteredMatches(rankFilter);

      if (perspectiveMatches.length === 0) {
        container.innerHTML = buildEmptyState();
        if (winrateChart) { winrateChart.destroy(); winrateChart = null; }
        if (resultPieChart) { resultPieChart.destroy(); resultPieChart = null; }
        const rpc = document.getElementById('result-pie-content');
        if (rpc) rpc.innerHTML = '';
        const rbc = document.getElementById('recent-blocks-content');
        if (rbc) rbc.innerHTML = '';
        const hsc = document.getElementById('highlight-summary-content');
        if (hsc) hsc.innerHTML = '';
        return;
      }

      // 期間フィルターを取得
      const periodFilter = document.getElementById('overall-period-filter');
      const periodValue = periodFilter ? periodFilter.value : 'all';

      // モードに応じてフィルタリング
      let displayMatches;
      if (overallMode === 'recent100') {
        displayMatches = perspectiveMatches.slice(-100);
      } else if (periodValue !== 'all') {
        displayMatches = filterByPeriod(perspectiveMatches, periodValue);
      } else {
        displayMatches = perspectiveMatches;
      }

      const stats = calculateWinrate(displayMatches, currentPerspective);
      const streak = calculateWinStreak(perspectiveMatches, currentPerspective); // 連勝は全期間で計算

      // 小数点第二位まで計算
      const filtered = displayMatches.filter(m => m.result !== 'draw');
      const winrateDecimal = filtered.length > 0 ?
        (stats.wins / filtered.length * 100).toFixed(2) : '0.00';

      // タイトルを決定
      let statsTitle = '総合勝率';
      if (overallMode === 'recent100') {
        statsTitle = '百戦勝率';
      } else if (periodValue !== 'all') {
        const season = SEASONS.find(s => s.id === periodValue);
        if (season) statsTitle = `総合勝率（${season.label}）`;
      }

      // 百戦勝率モードでは試合数を表示しない
      const matchCountText = overallMode === 'recent100' ? '' : ` (${stats.totalWithDraws}試合)`;
      
      let html = `<div class="stats-card">
        <div class="stats-card-header">
          <div class="stats-card-title">${statsTitle}</div>
        </div>
        <div class="overall-stats-display">
          <div class="winrate-big">${winrateDecimal}%</div>
          <div class="record-text">${stats.wins}勝 ${stats.losses}敗 ${stats.draws}分${matchCountText}</div>`;
      
      if (streak >= 2) {
        html += `<div class="streak-badge"><span class="streak-icon">🔥</span>${streak}連勝中！</div>`;
      }
      
      html += `</div></div>`;
      container.innerHTML = html;
      
      // グラフを更新
      updateWinrateChart(displayMatches);
      updateResultPieChart(displayMatches);
      updateRecentBlocks(displayMatches);
      updateHighlightSummary(displayMatches);
    }

    // マップ割合の円グラフを描画
    function updateMapPieChart(displayMatches, minCount = 1) {
      const container = document.getElementById('map-pie-content');
      if (!container) return;

      // マップ別集計（MAPSの定数順、最低試合数未満を除外）
      const MAP_COLORS = [
        '#3b82f6', '#ef4444', '#f59e0b', '#10b981',
        '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16'
      ];
      const mapStats = [];
      MAPS.forEach((map, i) => {
        const mapMatches = displayMatches.filter(m => m.map === map);
        if (mapMatches.length < minCount) return;
        const wins = mapMatches.filter(m =>
          (currentPerspective === 'survivor' && m.result === 'survivor_win') ||
          (currentPerspective === 'hunter' && m.result === 'hunter_win')
        ).length;
        const losses = mapMatches.filter(m =>
          (currentPerspective === 'survivor' && m.result === 'hunter_win') ||
          (currentPerspective === 'hunter' && m.result === 'survivor_win')
        ).length;
        const draws = mapMatches.filter(m => m.result === 'draw').length;
        mapStats.push({ map, total: mapMatches.length, wins, losses, draws, color: MAP_COLORS[i] });
      });

      // 試合数の多い順にソート
      mapStats.sort((a, b) => b.total - a.total);

      // ソート後に合計を計算してパーセントを付与
      const totalMatches = mapStats.reduce((sum, s) => sum + s.total, 0);
      mapStats.forEach(s => { s.mapPct = (s.total / totalMatches * 100).toFixed(1); });

      // データなし
      if (mapStats.length === 0) {
        if (mapPieChart) { mapPieChart.destroy(); mapPieChart = null; }
        container.innerHTML = buildEmptyState();
        return;
      }

      // HTML構築
      const isDark = document.body.classList.contains('dark-mode');
      const legendHTML = mapStats.map(s => `
        <div class="map-pie-legend-item">
          <div class="map-pie-color-dot" style="background:${s.color};"></div>
          <span class="map-pie-label">${escapeHTML(s.map)}</span>
          <div class="map-pie-detail">
            <span class="map-pie-count">${s.total}試合（${s.mapPct}%）</span>
            <div class="map-pie-wld"><span>${s.wins}勝</span><span>${s.losses}敗</span><span>${s.draws}分</span></div>
          </div>
        </div>`).join('');

      container.innerHTML = `
        <p class="detail-pie-desc">マップの試合数割合（試合数順）</p>
        <div class="map-pie-wrapper">
          <div class="map-pie-canvas-wrap">
            <canvas id="map-pie-chart"></canvas>
          </div>
          <div class="map-pie-legend">${legendHTML}</div>
        </div>`;

      // 既存グラフを破棄
      if (mapPieChart) { mapPieChart.destroy(); mapPieChart = null; }

      const canvas = document.getElementById('map-pie-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      const sliceLabelPlugin = createSliceLabelPlugin('sliceLabel');

      mapPieChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        plugins: [sliceLabelPlugin],
        data: {
          labels: mapStats.map(s => s.map),
          datasets: [{
            data: mapStats.map(s => s.total),
            backgroundColor: mapStats.map(s => s.color),
            borderColor: isDark ? '#222238' : '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              padding: 10,
              callbacks: {
                title: function(items) {
                  return mapStats[items[0].dataIndex].map;
                },
                label: function(context) {
                  return ` ${mapStats[context.dataIndex].mapPct}%`;
                }
              }
            }
          }
        }
      });
    }

    // 自キャラ使用数割合グラフを描画
    function updateCharPieChart(perspectiveMatches, characterStats, minCharCount) {
      const container = document.getElementById('char-pie-content');
      if (!container) return;

      const filteredChars = Object.keys(characterStats).filter(c => characterStats[c].length >= minCharCount);

      if (filteredChars.length === 0) {
        if (charPieChart) { charPieChart.destroy(); charPieChart = null; }
        container.innerHTML = '';
        return;
      }

      const totalMatches = filteredChars.reduce((sum, c) => sum + characterStats[c].length, 0);
      const sorted = [...filteredChars].sort((a, b) => characterStats[b].length - characterStats[a].length);

      const CHAR_PIE_COLORS = [
        '#3b82f6', '#ef4444', '#f59e0b', '#10b981',
        '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16'
      ];
      const OTHER_COLOR = '#9ca3af';

      let displayChars;
      let otherMatches = [];
      if (sorted.length > 9) {
        displayChars = sorted.slice(0, 9);
        otherMatches = sorted.slice(9).flatMap(c => characterStats[c]);
      } else {
        displayChars = sorted;
      }

      const chartData = displayChars.map((char, i) => {
        const matchArr = characterStats[char];
        const stats = calculateWinrate(matchArr, currentPerspective);
        const pct = (matchArr.length / totalMatches * 100).toFixed(1);
        return { char, total: matchArr.length, wins: stats.wins, losses: stats.losses, draws: stats.draws, pct, color: CHAR_PIE_COLORS[i] };
      });
      if (otherMatches.length > 0) {
        const stats = calculateWinrate(otherMatches, currentPerspective);
        const pct = (otherMatches.length / totalMatches * 100).toFixed(1);
        chartData.push({ char: 'その他', total: otherMatches.length, wins: stats.wins, losses: stats.losses, draws: stats.draws, pct, color: OTHER_COLOR });
      }

      const isDark = document.body.classList.contains('dark-mode');
      const legendHTML = chartData.map(d => `
        <div class="map-pie-legend-item">
          <div class="map-pie-color-dot" style="background:${d.color};"></div>
          <span class="map-pie-label">${escapeHTML(d.char)}</span>
          <div class="map-pie-detail">
            <span class="map-pie-count">${d.total}試合（${d.pct}%）</span>
            <div class="map-pie-wld"><span>${d.wins}勝</span><span>${d.losses}敗</span><span>${d.draws}分</span></div>
          </div>
        </div>`).join('');

      container.innerHTML = `
        <div class="map-pie-wrapper">
          <div class="map-pie-canvas-wrap">
            <canvas id="char-pie-chart"></canvas>
          </div>
          <div class="map-pie-legend">${legendHTML}</div>
        </div>`;

      if (charPieChart) { charPieChart.destroy(); charPieChart = null; }
      const canvas = document.getElementById('char-pie-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      const sliceLabelPlugin = createSliceLabelPlugin('charSliceLabel', { labelFn: _charLabelFn });

      charPieChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        plugins: [sliceLabelPlugin],
        data: {
          labels: chartData.map(d => d.char),
          datasets: [{
            data: chartData.map(d => d.total),
            backgroundColor: chartData.map(d => d.color),
            borderColor: isDark ? '#222238' : '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              padding: 10,
              callbacks: {
                title: (items) => chartData[items[0].dataIndex].char,
                label: (context) => ` ${chartData[context.dataIndex].pct}%`
              }
            }
          }
        }
      });
    }

    // 勝敗割合ドーナツグラフを描画
    function updateResultPieChart(displayMatches) {
      const container = document.getElementById('result-pie-content');
      if (!container) return;

      const wins = displayMatches.filter(m =>
        (currentPerspective === 'survivor' && m.result === 'survivor_win') ||
        (currentPerspective === 'hunter' && m.result === 'hunter_win')
      ).length;
      const losses = displayMatches.filter(m =>
        (currentPerspective === 'survivor' && m.result === 'hunter_win') ||
        (currentPerspective === 'hunter' && m.result === 'survivor_win')
      ).length;
      const draws = displayMatches.filter(m => m.result === 'draw').length;
      const total = displayMatches.length;

      if (total === 0) {
        if (resultPieChart) { resultPieChart.destroy(); resultPieChart = null; }
        container.innerHTML = '';
        return;
      }

      const RESULT_COLORS = { win: '#fbbf24', lose: '#ef4444', draw: '#9ca3af' };
      const entries = [
        { label: '勝利', count: wins, color: RESULT_COLORS.win },
        { label: '敗北', count: losses, color: RESULT_COLORS.lose },
        { label: '引き分け', count: draws, color: RESULT_COLORS.draw }
      ].filter(e => e.count > 0);

      const isDark = document.body.classList.contains('dark-mode');
      const legendHTML = entries.map(e => {
        const pct = (e.count / total * 100).toFixed(1);
        return `
          <div class="map-pie-legend-item">
            <div class="map-pie-color-dot" style="background:${e.color};"></div>
            <span class="map-pie-label">${e.label}</span>
            <div class="map-pie-detail">
              <span class="map-pie-count">${pct}%</span>
            </div>
          </div>`;
      }).join('');

      container.innerHTML = `
        <div class="map-pie-wrapper">
          <div class="map-pie-canvas-wrap">
            <canvas id="result-pie-chart"></canvas>
          </div>
          <div class="map-pie-legend">${legendHTML}</div>
        </div>`;

      if (resultPieChart) { resultPieChart.destroy(); resultPieChart = null; }
      const canvas = document.getElementById('result-pie-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      const sliceLabelPlugin = createSliceLabelPlugin('resultSliceLabel');

      resultPieChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        plugins: [sliceLabelPlugin],
        data: {
          labels: entries.map(e => e.label),
          datasets: [{
            data: entries.map(e => e.count),
            backgroundColor: entries.map(e => e.color),
            borderColor: isDark ? '#222238' : '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              padding: 10,
              callbacks: {
                title: (items) => entries[items[0].dataIndex].label,
                label: (context) => ` ${(entries[context.dataIndex].count / total * 100).toFixed(1)}% (${entries[context.dataIndex].count}試合)`
              }
            }
          }
        }
      });
    }

    // 直近試合カラーブロックを描画
    function updateRecentBlocks(displayMatches) {
      const container = document.getElementById('recent-blocks-content');
      if (!container) return;

      if (displayMatches.length === 0) {
        container.innerHTML = '';
        return;
      }

      const sorted = [...displayMatches].sort((a, b) => {
        if (a.date !== b.date) return (b.date || '') > (a.date || '') ? 1 : -1;
        return (b.id || 0) - (a.id || 0);
      });
      const maxBlocks = window.innerWidth >= 768 ? 20 : 10;
      // 古い順（左）→新しい順（右）に並べる
      const recent = sorted.slice(0, maxBlocks).reverse();

      const BLOCK_COLORS = { win: '#fbbf24', lose: '#ef4444', draw: '#9ca3af' };

      const blocksHTML = recent.map(match => {
        const isWin = (currentPerspective === 'survivor' && match.result === 'survivor_win') ||
                      (currentPerspective === 'hunter' && match.result === 'hunter_win');
        const isDraw = match.result === 'draw';
        const key = isWin ? 'win' : isDraw ? 'draw' : 'lose';
        return `<div class="recent-block" style="background:${BLOCK_COLORS[key]};" title="${escapeHTML(match.date || '')}"></div>`;
      }).join('');

      container.innerHTML = `
        <div class="recent-blocks-wrapper">${blocksHTML}</div>
        <div class="recent-blocks-label">
          <span>← 古い</span>
          <span>新しい →</span>
        </div>`;
    }

    // ハイライトサマリーを描画
    function updateHighlightSummary(displayMatches) {
      const container = document.getElementById('highlight-summary-content');
      if (!container) return;

      if (displayMatches.length === 0) {
        container.innerHTML = '';
        return;
      }

      // 相手キャラ別集計
      const opponentStats = {};
      displayMatches.forEach(match => {
        if (currentPerspective === 'survivor') {
          const h = match.opponentHunter;
          if (!h) return;
          if (!opponentStats[h]) opponentStats[h] = [];
          opponentStats[h].push(match);
        } else {
          if (!match.opponentSurvivors) return;
          match.opponentSurvivors.forEach(s => {
            if (!s) return;
            if (!opponentStats[s]) opponentStats[s] = [];
            opponentStats[s].push(match);
          });
        }
      });

      // マップ別集計
      const mapStats = {};
      displayMatches.forEach(match => {
        if (!match.map) return;
        if (!mapStats[match.map]) mapStats[match.map] = [];
        mapStats[match.map].push(match);
      });

      const MIN_GAMES = 5;
      const validOpponents = Object.keys(opponentStats).filter(k => opponentStats[k].length >= MIN_GAMES);
      const validMaps = Object.keys(mapStats).filter(k => mapStats[k].length >= MIN_GAMES);

      // 各カテゴリで3つ以上ないと表示しない
      if (validOpponents.length < 3 || validMaps.length < 3) {
        container.innerHTML = '';
        return;
      }

      const calcWR = (arr) => parseFloat(calculateWinrate(arr, currentPerspective).winrate);

      const opponentData = validOpponents.map(k => ({
        name: k, winrate: calcWR(opponentStats[k]), total: opponentStats[k].length
      })).sort((a, b) => b.winrate - a.winrate);

      const mapData = validMaps.map(k => ({
        name: k, winrate: calcWR(mapStats[k]), total: mapStats[k].length
      })).sort((a, b) => b.winrate - a.winrate);

      const bestOpponent  = opponentData[0];
      const _worstOppRaw  = opponentData[opponentData.length - 1];
      const worstOpponent = _worstOppRaw && _worstOppRaw.winrate < 100 ? _worstOppRaw : null;
      const bestMap  = mapData[0];
      const _worstMapRawHL = mapData[mapData.length - 1];
      const worstMap = _worstMapRawHL && _worstMapRawHL.winrate < 100 ? _worstMapRawHL : null;

      const opponentLabel = currentPerspective === 'survivor' ? '相手ハンター' : '相手サバイバー';
      const oppType = currentPerspective === 'survivor' ? 'hunter' : 'survivor';
      const oppIconBest  = `<img class="highlight-char-icon" src="${buildIconPath(bestOpponent.name, oppType)}" alt="" onerror="this.style.display='none'">`;
      const oppIconWorst = worstOpponent ? `<img class="highlight-char-icon" src="${buildIconPath(worstOpponent.name, oppType)}" alt="" onerror="this.style.display='none'">` : '';
      const mapIconBest  = `<img class="highlight-char-icon" src="${getMapIconPath(bestMap.name)}" alt="" onerror="this.style.display='none'">`;
      const mapIconWorst = worstMap ? `<img class="highlight-char-icon" src="${getMapIconPath(worstMap.name)}" alt="" onerror="this.style.display='none'">` : '';

      const worstOppHTML = worstOpponent
        ? `<div class="highlight-item highlight-worst" onclick="openDetailPage('opponent', '${escapeHTML(worstOpponent.name)}')" style="cursor:pointer">
              <div class="highlight-category">苦手${opponentLabel}</div>
              ${oppIconWorst}
              <div class="highlight-name">${escapeHTML(worstOpponent.name)}</div>
              <div class="highlight-rate">${worstOpponent.winrate.toFixed(1)}%（${worstOpponent.total}試合）</div>
            </div>`
        : `<div class="highlight-item highlight-none">
              <div class="highlight-category">苦手${opponentLabel}</div>
              <div class="highlight-none-icon">✓</div>
              <div class="highlight-name">苦手なし</div>
              <div class="highlight-rate">全${opponentLabel}に勝ち越し</div>
            </div>`;

      const worstMapHTML = worstMap
        ? `<div class="highlight-item highlight-worst" onclick="openDetailPage('map', '${escapeHTML(worstMap.name)}')" style="cursor:pointer">
              <div class="highlight-category">苦手マップ</div>
              ${mapIconWorst}
              <div class="highlight-name">${escapeHTML(worstMap.name)}</div>
              <div class="highlight-rate">${worstMap.winrate.toFixed(1)}%（${worstMap.total}試合）</div>
            </div>`
        : `<div class="highlight-item highlight-none">
              <div class="highlight-category">苦手マップ</div>
              <div class="highlight-none-icon">✓</div>
              <div class="highlight-name">苦手なし</div>
              <div class="highlight-rate">全マップに勝ち越し</div>
            </div>`;

      container.innerHTML = `
        <div class="stats-card highlight-summary-card">
          <div class="highlight-summary-title">ハイライト</div>
          <div class="highlight-summary-grid">
            <div class="highlight-item highlight-best" onclick="openDetailPage('opponent', '${escapeHTML(bestOpponent.name)}')" style="cursor:pointer">
              <div class="highlight-category">得意${opponentLabel}</div>
              ${oppIconBest}
              <div class="highlight-name">${escapeHTML(bestOpponent.name)}</div>
              <div class="highlight-rate">${bestOpponent.winrate.toFixed(1)}%（${bestOpponent.total}試合）</div>
            </div>
            ${worstOppHTML}
            <div class="highlight-item highlight-best" onclick="openDetailPage('map', '${escapeHTML(bestMap.name)}')" style="cursor:pointer">
              <div class="highlight-category">得意マップ</div>
              ${mapIconBest}
              <div class="highlight-name">${escapeHTML(bestMap.name)}</div>
              <div class="highlight-rate">${bestMap.winrate.toFixed(1)}%（${bestMap.total}試合）</div>
            </div>
            ${worstMapHTML}
          </div>
        </div>`;
    }

    // 勝率推移グラフを描画
    function updateWinrateChart(perspectiveMatches) {
      try {
        // Chart.jsが読み込まれているか確認
        if (typeof Chart === 'undefined') {
          console.error('Chart.js is not loaded');
          return;
        }

        const canvas = document.getElementById('winrate-chart');
        if (!canvas) {
          console.error('Canvas element not found');
          return;
        }

        // 総試合数に応じてグループサイズと参照数を決定
        const matchesPerPoint = Math.max(1, Math.ceil(perspectiveMatches.length / 100));
        const referenceCount = matchesPerPoint * 10;

        // 直近referenceCount試合を取得
        const recentMatches = perspectiveMatches.slice(-referenceCount);

        if (recentMatches.length === 0) {
          // データがない場合
          if (winrateChart) {
            winrateChart.destroy();
            winrateChart = null;
          }
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        // 10グループに分割して累積勝率を計算
        const labels = [];
        const data = [];
        const offset = perspectiveMatches.length - recentMatches.length;

        for (let i = 0; i < 10; i++) {
          const groupStart = i * matchesPerPoint;
          const groupEnd = Math.min((i + 1) * matchesPerPoint, recentMatches.length) - 1;
          if (groupStart >= recentMatches.length) break;

          // グループ末尾時点での累積勝率を計算
          const cumulativeEnd = offset + groupEnd + 1;
          const matchesExcludingDraws = perspectiveMatches.slice(0, cumulativeEnd).filter(m => m.result !== 'draw');
          const winsCount = matchesExcludingDraws.filter(m =>
            (currentPerspective === 'survivor' && m.result === 'survivor_win') ||
            (currentPerspective === 'hunter' && m.result === 'hunter_win')
          ).length;

          const winrate = matchesExcludingDraws.length > 0 ?
            (winsCount / matchesExcludingDraws.length * 100) : 0;

          const labelNum = (i + 1) * matchesPerPoint;
          labels.push(matchesPerPoint === 1 ? `${i + 1}試合目` : `${labelNum}試合目`);
          data.push(winrate.toFixed(2));
        }

        // Y軸範囲をデータに合わせて自動調整（±3%余白、0〜100にクランプ）
        const dataNumbers = data.map(Number);
        const padding = 3;
        const yMin = Math.max(0, Math.floor(Math.min(...dataNumbers) - padding));
        const yMax = Math.min(100, Math.ceil(Math.max(...dataNumbers) + padding));

        // 既存のグラフを破棄
        if (winrateChart) {
          winrateChart.destroy();
          winrateChart = null;
        }
        
        // 新しいグラフを作成
        const ctx = canvas.getContext('2d');
        const isDark = document.body.classList.contains('dark-mode');
        const tickColor = isDark ? '#9ca3af' : '#666';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
        const pointBorder = isDark ? '#222238' : '#fff';
        
        winrateChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: '勝率 (%)',
              data: data,
              borderColor: '#3b82f6',
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: pointBorder,
              pointBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return '勝率: ' + context.parsed.y + '%';
                  }
                }
              }
            },
            scales: {
              y: {
                min: yMin,
                max: yMax,
                ticks: {
                  color: tickColor,
                  callback: function(value) {
                    return value + '%';
                  }
                },
                grid: {
                  color: gridColor
                }
              },
              x: {
                ticks: {
                  color: tickColor
                },
                grid: {
                  display: false
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error creating chart:', error);
        // エラーが発生してもアプリは動作し続ける
      }
    }
    
    // ページネーションのHTMLを生成（Tier表スタイルに統一）
    function generatePagination(currentPage, totalPages, onPageChange) {
      if (totalPages <= 1) return '';
      // onPageChange が 'fn(arg,' 形式の場合はそのまま繋げる
      const call = (p) => onPageChange.endsWith(',') ? `${onPageChange}${p})` : `${onPageChange}(${p})`;

      const maxButtons = 7;
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);
      if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

      let html = '<div class="pagination">';
      html += currentPage > 1
        ? `<button class="page-btn" onclick="${call(currentPage - 1)}">‹</button>`
        : `<button class="page-btn" disabled>‹</button>`;
      if (startPage > 1) {
        html += `<button class="page-btn" onclick="${call(1)}">1</button>`;
        if (startPage > 2) html += `<span class="page-ellipsis">…</span>`;
      }
      for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) html += `<button class="page-btn current">${i}</button>`;
        else html += `<button class="page-btn" onclick="${call(i)}">${i}</button>`;
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
        html += `<button class="page-btn" onclick="${call(totalPages)}">${totalPages}</button>`;
      }
      html += currentPage < totalPages
        ? `<button class="page-btn" onclick="${call(currentPage + 1)}">›</button>`
        : `<button class="page-btn" disabled>›</button>`;
      html += '</div>';
      return html;
    }
    
    // ページ変更関数
    function changeTeammatePage(page) {
      currentPages.teammateStats = page;
      updateOpponentStats();
    }
    
    function changeOpponentPage(page) {
      currentPages.opponentStats = page;
      updateOpponentStats();
    }
    
    function changePairPage(page) {
      currentPages.pairStats = page;
      updateOpponentStats();
    }

    function changeHistoryPage(page) {
      currentPages.matchHistory = page;
      updateMatchHistory();
    }

    function changeHistoryPerPage(n) {
      historyItemsPerPage = n;
      currentPages.matchHistory = 1;
      updateMatchHistory();
    }
    
    // 苦手要素を検出
    function detectWeaknesses(stats, minGames = 1) {
      const threshold = currentPerspective === 'hunter' ? 50 : 38;
      
      // ステップ1：有効なデータを抽出（5試合以上）
      const validData = [];
      Object.keys(stats).forEach(key => {
        const matches = stats[key];
        if (matches.length >= minGames) {
          const result = calculateWinrate(matches, currentPerspective);
          const winrate = parseFloat(result.winrate);
          
          validData.push({
            name: key,
            winrate: winrate,
            wins: result.wins,
            losses: result.losses,
            draws: result.draws,
            total: result.totalWithDraws,
            stats: result
          });
        }
      });
      
      // ステップ2：有効データが3つ未満なら空配列を返す（表示しない）
      if (validData.length < 3) {
        return [];
      }
      
      // ステップ3：閾値以下のデータを抽出
      const belowThreshold = validData.filter(d => d.winrate <= threshold);
      
      // ステップ4：閾値以下のデータがある場合
      if (belowThreshold.length > 0) {
        // 勝率が低い順にソートして最大5つ返す
        return belowThreshold.sort((a, b) => a.winrate - b.winrate).slice(0, 5);
      }
      
      // ステップ5：閾値以下がない場合、最も低いもの1つだけ返す（ただし100%は除外）
      const sortedData = validData.sort((a, b) => a.winrate - b.winrate);
      
      // 最も低いものが100%の場合は表示しない
      if (sortedData.length > 0 && sortedData[0].winrate === 100) {
        return [];
      }
      
      return sortedData.slice(0, 1);
    }
    
    // 苦手要素表示HTMLを生成（控えめなデザイン）
    function generateWeaknessHTML(weaknesses, title, icon) {
      if (weaknesses.length === 0) return '';

      const threshold = currentPerspective === 'hunter' ? 50 : 38;
      const displayTitle = `苦手${title}`;

      let html = `
        <div class="weakness-card">
          <div class="weakness-title">${displayTitle}</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
      `;

      weaknesses.forEach((item, index) => {
        const isWeak = item.winrate <= threshold;
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
            <div>
              <span class="weakness-name">${index + 1}. ${item.name}</span>
              <span class="weakness-count">(${item.total}試合)</span>
            </div>
            <div class="weakness-rate${isWeak ? ' weak' : ''}">${item.winrate.toFixed(1)}%</div>
          </div>
        `;
      });

      html += `</div></div>`;
      return html;
    }
    
    // 自キャラ別勝率タブの対戦相手フィルター選択肢を更新
    function updateCharacterOpponentFilter() {
      const select = document.getElementById('character-opponent-filter');
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = '<option value="all">全て</option>';
      const usedChars = new Set();
      if (currentPerspective === 'hunter') {
        matches.filter(m => m.perspective === 'hunter').forEach(m => m.opponentSurvivors && m.opponentSurvivors.forEach(s => usedChars.add(s)));
        SURVIVORS.filter(s => usedChars.has(s)).forEach(char => {
          const opt = document.createElement('option');
          opt.value = char; opt.textContent = char;
          select.appendChild(opt);
        });
      } else {
        matches.filter(m => m.perspective === 'survivor').forEach(m => { if (m.opponentHunter) usedChars.add(m.opponentHunter); });
        HUNTERS.filter(h => usedChars.has(h)).forEach(char => {
          const opt = document.createElement('option');
          opt.value = char; opt.textContent = char;
          select.appendChild(opt);
        });
      }
      if ([...select.options].some(o => o.value === currentValue)) select.value = currentValue;
    }

    function updateCharacterStats() {
      const container = document.getElementById('character-stats');
      const periodFilter = document.getElementById('character-period-filter').value;
      const rankFilter = getRankFilterValue('character-rank-filter');
      const mapFilter = document.getElementById('character-map-filter').value;
      const opponentFilter = document.getElementById('character-opponent-filter').value;
      let perspectiveMatches = getFilteredMatches(rankFilter);

      // 期間でフィルター
      perspectiveMatches = filterByPeriod(perspectiveMatches, periodFilter);

      // 対戦相手でフィルター
      if (opponentFilter !== 'all') {
        if (currentPerspective === 'hunter') {
          perspectiveMatches = perspectiveMatches.filter(m => m.opponentSurvivors && m.opponentSurvivors.includes(opponentFilter));
        } else {
          perspectiveMatches = perspectiveMatches.filter(m => m.opponentHunter === opponentFilter);
        }
      }

      // マップでフィルター
      if (mapFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.map === mapFilter);
      }
      
      if (perspectiveMatches.length === 0) {
        container.innerHTML = buildEmptyState();
        if (charPieChart) { charPieChart.destroy(); charPieChart = null; }
        const cpc = document.getElementById('char-pie-content');
        if (cpc) cpc.innerHTML = '';
        return;
      }

      const characterStats = {};
      
      perspectiveMatches.forEach(match => {
        const char = match.myCharacter;
        if (!characterStats[char]) {
          characterStats[char] = [];
        }
        characterStats[char].push(match);
      });
      
      const sortedChars = sortByState(Object.keys(characterStats), characterStats, currentPerspective, sortState.character);
      const minCharCount = minMatchCounts.character || 1;
      const filteredChars = sortedChars.filter(c => characterStats[c].length >= minCharCount);

      // TOPカード（得意/苦手キャラ）— sortStateに関係なく勝率で独立ソート・最低5試合
      const { best: bestChar, worst: worstChar } = findBestWorst(filteredChars, characterStats, currentPerspective, Math.max(5, minCharCount));
      const sideLabel = currentPerspective === 'survivor' ? 'サバイバー' : 'ハンター';
      const charIconType = currentPerspective === 'survivor' ? 'survivor' : 'hunter';
      const topCardsHtml = buildTopCardsHtml(bestChar, worstChar, (name, type) => buildTopCard({
        name, matches: characterStats[name] || [], totalMatches: perspectiveMatches.length,
        iconSrc: buildIconPath(name, charIconType), iconClass: 'top-card-char-icon',
        headLabel: type === 'best' ? `✨ TOP${sideLabel}` : `⚠️ 苦手${sideLabel}`,
        detailPage: 'char', type, groupKeyFn: m => m.map,
        detailRows: { bestLabel: '得意マップ', worstLabel: '苦手マップ' }
      }));

      let html = topCardsHtml;

      html += generateSortButtons('character');

      html += `<div class="stats-card">
        <div class="stats-title">キャラクター別勝率（${currentPerspective === 'survivor' ? 'サバイバー' : 'ハンター'}）</div>
        <div class="bar-chart-horizontal">`;

      if (filteredChars.length === 0) {
        html += buildEmptyState(true);
      } else {
        filteredChars.forEach(char => {
          const stats = calculateWinrate(characterStats[char], currentPerspective);
          const avgEscape = calculateAverageEscapeCount(characterStats[char], currentPerspective);
          const avgText = currentPerspective === 'survivor'
            ? `平均脱出${avgEscape}人`
            : `平均脱落${(4 - parseFloat(avgEscape)).toFixed(1)}人`;
          html += `
            <div class="bar-row clickable" onclick="openDetailPage('char','${escapeHTML(char)}')">
              <div class="bar-label-wrapper">
                ${getBarIconHTML(char, 'char')}
                <div class="bar-label-text">
                  <div class="bar-label">${escapeHTML(char)}</div>
                  <div class="bar-sublabel">${avgText}<br>${stats.wins}勝${stats.losses}敗${stats.draws}分 (${stats.totalWithDraws}試合)</div>
                </div>
              </div>
              <div class="bar-wrapper">${renderBarHTML(stats.winrate)}</div>
            </div>`;
        });
      }

      html += '</div></div>';
      container.innerHTML = html;
      updateCharPieChart(perspectiveMatches, characterStats, minCharCount);
    }

    // マップ別勝率を更新
    function updateMapStats() {
      const container = document.getElementById('map-stats');
      const periodFilter = document.getElementById('map-period-filter').value;
      const rankFilter = getRankFilterValue('map-rank-filter');
      const charFilter = document.getElementById('map-char-filter').value;
      let perspectiveMatches = getFilteredMatches(rankFilter);
      
      // 期間でフィルター
      perspectiveMatches = filterByPeriod(perspectiveMatches, periodFilter);
      
      // 自キャラでフィルター
      if (charFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.myCharacter === charFilter);
      }
      
      if (perspectiveMatches.length === 0) {
        container.innerHTML = buildEmptyState();
        if (mapPieChart) { mapPieChart.destroy(); mapPieChart = null; }
        const mpc = document.getElementById('map-pie-content');
        if (mpc) mpc.innerHTML = '';
        return;
      }

      const mapStats = {};
      
      perspectiveMatches.forEach(match => {
        const map = match.map;
        if (!mapStats[map]) {
          mapStats[map] = [];
        }
        mapStats[map].push(match);
      });
      
      const sortedMaps = sortByState(Object.keys(mapStats), mapStats, currentPerspective, sortState.map);
      const minMapCount = minMatchCounts.map || 1;
      const filteredMaps = sortedMaps.filter(m => mapStats[m].length >= minMapCount);

      // TOPカード（得意/苦手マップ）— sortStateに関係なく勝率で独立ソート・最低5試合
      const { best: bestMap, worst: worstMap } = findBestWorst(filteredMaps, mapStats, currentPerspective, Math.max(5, minMapCount));
      let html = buildTopCardsHtml(bestMap, worstMap, (name, type) => buildTopCard({
        name, matches: mapStats[name] || [], totalMatches: null,
        iconSrc: getMapIconPath(name), iconClass: 'top-card-map-icon',
        headLabel: type === 'best' ? '✨ 得意マップ' : '⚠️ 苦手マップ',
        detailPage: 'map', type, groupKeyFn: m => m.myCharacter,
        detailRows: { bestLabel: '得意キャラ', worstLabel: '苦手キャラ' }
      }));

      html += generateSortButtons('map');

      html += `<div class="stats-card">
        <div class="stats-title">マップ別勝率</div>
        <div class="bar-chart-horizontal">`;

      if (filteredMaps.length === 0) {
        html += buildEmptyState(true);
      } else {
        filteredMaps.forEach(map => {
          const stats = calculateWinrate(mapStats[map], currentPerspective);
          html += `
            <div class="bar-row clickable" onclick="openDetailPage('map','${escapeHTML(map)}')">
              <div class="bar-label-wrapper">
                ${getBarIconHTML(map, 'map')}
                <div class="bar-label-text">
                  <div class="bar-label">${escapeHTML(map)}</div>
                  <div class="bar-sublabel">${stats.wins}勝${stats.losses}敗${stats.draws}分<br>${stats.totalWithDraws}試合</div>
                </div>
              </div>
              <div class="bar-wrapper">${renderBarHTML(stats.winrate)}</div>
            </div>`;
        });
      }

      html += '</div></div>';
      container.innerHTML = html;
      updateMapPieChart(perspectiveMatches, minMapCount);
    }

    // 対戦相手別勝率を更新
    function updateOpponentStats() {
      const container = document.getElementById('opponent-stats');
      const periodFilter = document.getElementById('opponent-period-filter').value;
      const rankFilter = getRankFilterValue('opponent-rank-filter');
      const myCharFilter = document.getElementById('my-char-filter').value;
      const opponentHunterFilter = document.getElementById('opponent-hunter-filter') ? document.getElementById('opponent-hunter-filter').value : 'all';
      const mapFilter = document.getElementById('opponent-map-filter').value;
      let perspectiveMatches = getFilteredMatches(rankFilter);
      
      // 期間でフィルター
      perspectiveMatches = filterByPeriod(perspectiveMatches, periodFilter);

      // 自キャラでフィルター
      if (myCharFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.myCharacter === myCharFilter);
      }

      // 対戦相手ハンターでフィルター（サバイバー視点のみ）
      if (currentPerspective === 'survivor' && opponentHunterFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.opponentHunter === opponentHunterFilter);
      }

      // マップでフィルター
      if (mapFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.map === mapFilter);
      }

      if (perspectiveMatches.length === 0) {
        container.innerHTML = buildEmptyState();
        return;
      }

      if (currentPerspective === 'survivor') {
        container.innerHTML = buildSurvivorOpponentHtml(perspectiveMatches);
      } else {
        container.innerHTML = buildHunterOpponentHtml(perspectiveMatches);
      }
    }

    // 対戦相手別勝率: サバイバー視点（ハンター別 + 味方別）
    function buildSurvivorOpponentHtml(perspectiveMatches) {
      const hunterStats = {};
      const teammateStats = {};

      perspectiveMatches.forEach(match => {
        const hunter = match.opponentHunter;
        if (!hunterStats[hunter]) hunterStats[hunter] = [];
        hunterStats[hunter].push(match);

        match.teammates.forEach(teammate => {
          if (!teammateStats[teammate]) teammateStats[teammate] = [];
          teammateStats[teammate].push(match);
        });
      });

      // TOPカード（得意/苦手ハンター）— 最低5試合
      const { best: bestHunter, worst: worstHunter } = findBestWorst(Object.keys(hunterStats), hunterStats, currentPerspective, Math.max(5, minMatchCounts.opponentHunter || 1));
      let html = buildTopCardsHtml(bestHunter, worstHunter, (name, type) => buildTopCard({
        name, matches: hunterStats[name] || [], totalMatches: perspectiveMatches.length,
        iconSrc: buildIconPath(name, 'hunter'), iconClass: 'top-card-char-icon',
        headLabel: type === 'best' ? '✨ 得意ハンター' : '⚠️ 苦手ハンター',
        detailPage: 'opponent', type, groupKeyFn: m => m.map,
        detailRows: { bestLabel: '得意マップ', worstLabel: '苦手マップ' }
      }));

      // ===== 対戦相手ハンター別勝率 =====
      html += generateSortButtons('opponentHunter');

      const sortedHunters = sortByState(Object.keys(hunterStats), hunterStats, currentPerspective, sortState.opponentHunter);
      const minHunterCount = minMatchCounts.opponentHunter || 1;
      const filteredHunters = sortedHunters.filter(h => hunterStats[h].length >= minHunterCount);
      const totalHunterPages = Math.ceil(filteredHunters.length / itemsPerPage);
      const hunterStartIndex = (currentPages.opponentStats - 1) * itemsPerPage;
      const hunterEndIndex = Math.min(hunterStartIndex + itemsPerPage, filteredHunters.length);

      html += `<div class="stats-card">
        <div class="stats-title">対戦相手ハンター別勝率<span class="stats-count-badge">全${filteredHunters.length}件（${itemsPerPage}件/ページ）</span></div>
        <div class="bar-chart-horizontal">`;

      if (filteredHunters.length === 0) {
        html += buildEmptyState(true);
      } else {
        filteredHunters.slice(hunterStartIndex, hunterEndIndex).forEach(hunter => {
          const stats = calculateWinrate(hunterStats[hunter], currentPerspective);
          html += `
            <div class="bar-row clickable" onclick="openDetailPage('opponent','${escapeHTML(hunter)}')">
              <div class="bar-label-wrapper">
                ${getBarIconHTML(hunter, 'opponent-hunter')}
                <div class="bar-label-text">
                  <div class="bar-label">${escapeHTML(hunter)}</div>
                  <div class="bar-sublabel">${stats.wins}勝${stats.losses}敗${stats.draws}分<br>${stats.totalWithDraws}試合</div>
                </div>
              </div>
              <div class="bar-wrapper">${renderBarHTML(stats.winrate)}</div>
            </div>`;
        });
      }

      html += '</div>';
      html += generatePagination(currentPages.opponentStats, totalHunterPages, 'changeOpponentPage');
      html += '</div>';

      // ===== 味方別勝率（折りたたみ） =====
      const teammateToggleIcon = teammateStatsExpanded ? '▲' : '▼';
      const teammateToggleLabel = teammateStatsExpanded ? '味方別勝率を閉じる' : '味方別勝率を見る';
      html += `<button class="pair-toggle-btn" onclick="toggleTeammateStats()">
        <span class="pair-toggle-icon">${teammateToggleIcon}</span>${teammateToggleLabel}
      </button>`;

      if (teammateStatsExpanded) {
        html += generateSortButtons('teammate');
        html += `<div class="stats-card">
          <div class="stats-title">味方別勝率</div>
          <div class="bar-chart-horizontal">`;

        const sortedTeammates = sortByState(Object.keys(teammateStats), teammateStats, currentPerspective, sortState.teammate);
        const minTeammateCount = minMatchCounts.teammate || 1;
        const filteredTeammates = sortedTeammates.filter(t => teammateStats[t].length >= minTeammateCount);
        const totalTeammatePages = Math.ceil(filteredTeammates.length / itemsPerPage);
        const teammateStartIndex = (currentPages.teammateStats - 1) * itemsPerPage;
        const teammateEndIndex = Math.min(teammateStartIndex + itemsPerPage, filteredTeammates.length);

        if (filteredTeammates.length === 0) {
          html += buildEmptyState(true);
        } else {
          filteredTeammates.slice(teammateStartIndex, teammateEndIndex).forEach(teammate => {
            const stats = calculateWinrate(teammateStats[teammate], currentPerspective);
            html += `
              <div class="bar-row">
                <div class="bar-label-wrapper">
                  ${getBarIconHTML(teammate, 'survivor')}
                  <div class="bar-label-text">
                    <div class="bar-label">${escapeHTML(teammate)}</div>
                    <div class="bar-sublabel">${stats.wins}勝${stats.losses}敗${stats.draws}分<br>${stats.totalWithDraws}試合</div>
                  </div>
                </div>
                <div class="bar-wrapper">${renderBarHTML(stats.winrate)}</div>
              </div>`;
          });
        }

        html += '</div>';
        html += generatePagination(currentPages.teammateStats, totalTeammatePages, 'changeTeammatePage');
        html += '</div>';
      }

      return html;
    }

    // 対戦相手別勝率: ハンター視点（サバイバー別 + ペア別）
    function buildHunterOpponentHtml(perspectiveMatches) {
      const survivorStats = {};
      const pairStats = {};

      perspectiveMatches.forEach(match => {
        const survivors = match.opponentSurvivors || [];

        // 1キャラ集計
        survivors.forEach(survivor => {
          if (!survivor) return;
          if (!survivorStats[survivor]) survivorStats[survivor] = [];
          survivorStats[survivor].push(match);
        });

        // 2キャラ組み合わせ集計（C(4,2) = 6通り）
        for (let i = 0; i < survivors.length; i++) {
          for (let j = i + 1; j < survivors.length; j++) {
            if (!survivors[i] || !survivors[j]) continue;
            const pair = [survivors[i], survivors[j]]
              .sort((a, b) => SURVIVORS.indexOf(a) - SURVIVORS.indexOf(b))
              .join(' ＆ ');
            if (!pairStats[pair]) pairStats[pair] = [];
            pairStats[pair].push(match);
          }
        }
      });

      // TOPカード（得意/苦手サバイバー）— 最低5試合
      const { best: bestSurvivor, worst: worstSurvivor } = findBestWorst(Object.keys(survivorStats), survivorStats, currentPerspective, Math.max(5, minMatchCounts.opponent || 1));
      let html = buildTopCardsHtml(bestSurvivor, worstSurvivor, (name, type) => buildTopCard({
        name, matches: survivorStats[name] || [], totalMatches: perspectiveMatches.length,
        iconSrc: buildIconPath(name, 'survivor'), iconClass: 'top-card-char-icon',
        headLabel: type === 'best' ? '✨ 得意サバイバー' : '⚠️ 苦手サバイバー',
        detailPage: 'opponent', type, groupKeyFn: m => m.map,
        detailRows: { bestLabel: '得意マップ', worstLabel: '苦手マップ' }
      }));

      // 並び替えボタン（1キャラ）
      html += generateSortButtons('opponent');

      const sortedSurvivors = sortByState(Object.keys(survivorStats), survivorStats, currentPerspective, sortState.opponent);
      const minSurvivorCount = minMatchCounts.opponent || 1;
      const filteredSurvivors = sortedSurvivors.filter(s => survivorStats[s].length >= minSurvivorCount);
      const totalSurvivorPages = Math.ceil(filteredSurvivors.length / itemsPerPage);
      const survivorStartIndex = (currentPages.opponentStats - 1) * itemsPerPage;
      const survivorEndIndex = Math.min(survivorStartIndex + itemsPerPage, filteredSurvivors.length);

      html += `<div class="stats-card">
        <div class="stats-title">対戦相手サバイバー別勝率<span class="stats-count-badge">全${filteredSurvivors.length}件（${itemsPerPage}件/ページ）</span></div>
        <div class="bar-chart-horizontal">`;

      if (filteredSurvivors.length === 0) {
        html += buildEmptyState(true);
      } else {
        filteredSurvivors.slice(survivorStartIndex, survivorEndIndex).forEach(survivor => {
          const stats = calculateWinrate(survivorStats[survivor], currentPerspective);
          html += `
            <div class="bar-row clickable" onclick="openDetailPage('opponent','${escapeHTML(survivor)}')">
              <div class="bar-label-wrapper">
                ${getBarIconHTML(survivor, 'survivor')}
                <div class="bar-label-text">
                  <div class="bar-label">${escapeHTML(survivor)}</div>
                  <div class="bar-sublabel">${stats.wins}勝${stats.losses}敗${stats.draws}分<br>${stats.totalWithDraws}試合</div>
                </div>
              </div>
              <div class="bar-wrapper">${renderBarHTML(stats.winrate)}</div>
            </div>`;
        });
      }

      html += '</div>';
      html += generatePagination(currentPages.opponentStats, totalSurvivorPages, 'changeOpponentPage');
      html += '</div>';

      // ===== ペア別勝率（折りたたみ） =====

      // ペアフィルターのselectオプションを生成
      const usedSurvivorsSet = new Set();
      perspectiveMatches.forEach(m => (m.opponentSurvivors || []).forEach(s => { if (s) usedSurvivorsSet.add(s); }));
      const pairSelectSurvivors = SURVIVORS.filter(s => usedSurvivorsSet.has(s));

      const char1Options = pairSelectSurvivors
        .filter(s => s !== pairFilterChar2)
        .map(s => `<option value="${escapeHTML(s)}"${pairFilterChar1 === s ? ' selected' : ''}>${escapeHTML(s)}</option>`)
        .join('');
      const char2Options = pairSelectSurvivors
        .filter(s => s !== pairFilterChar1)
        .map(s => `<option value="${escapeHTML(s)}"${pairFilterChar2 === s ? ' selected' : ''}>${escapeHTML(s)}</option>`)
        .join('');

      const toggleIcon = pairStatsExpanded ? '▲' : '▼';
      const toggleLabel = pairStatsExpanded ? 'ペア別勝率を閉じる' : 'ペア別勝率を見る';

      html += `<button class="pair-toggle-btn" onclick="togglePairStats()">
        <span class="pair-toggle-icon">${toggleIcon}</span>${toggleLabel}
      </button>`;

      if (pairStatsExpanded) {
        // ペアフィルター
        html += `<div class="filter-section" style="margin-top:10px;">
          <div class="filter-group">
            <label class="filter-label">ペア絞り込み キャラ1</label>
            <select id="pair-filter-char-1" onchange="onPairChar1Change()">
              <option value="">指定なし</option>${char1Options}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">ペア絞り込み キャラ2</label>
            <select id="pair-filter-char-2" onchange="onPairChar2Change()">
              <option value="">指定なし</option>${char2Options}
            </select>
          </div>
        </div>`;

        // ペアフィルターを適用
        let filteredPairStats = pairStats;
        if (pairFilterChar1 && pairFilterChar2) {
          const key = [pairFilterChar1, pairFilterChar2]
            .sort((a, b) => SURVIVORS.indexOf(a) - SURVIVORS.indexOf(b))
            .join(' ＆ ');
          filteredPairStats = pairStats[key] ? { [key]: pairStats[key] } : {};
        } else if (pairFilterChar1 || pairFilterChar2) {
          const target = pairFilterChar1 || pairFilterChar2;
          filteredPairStats = Object.fromEntries(
            Object.entries(pairStats).filter(([k]) => {
              const [a, b] = k.split(' ＆ ');
              return a === target || b === target;
            })
          );
        }

        // 並び替えボタン
        html += generateSortButtons('opponentPair');

        html += `<div class="stats-card">
          <div class="stats-title">ペア別勝率</div>
          <div class="bar-chart-horizontal">`;

        const sortedPairs = sortByState(Object.keys(filteredPairStats), filteredPairStats, currentPerspective, sortState.opponentPair);
        const minPairCount = minMatchCounts.opponentPair || 1;
        const finalPairs = sortedPairs.filter(p => filteredPairStats[p].length >= minPairCount);
        const totalPairPages = Math.ceil(finalPairs.length / itemsPerPage);
        const pairStartIndex = (currentPages.pairStats - 1) * itemsPerPage;
        const pairEndIndex = Math.min(pairStartIndex + itemsPerPage, finalPairs.length);

        if (finalPairs.length === 0) {
          html += buildEmptyState(true);
        } else {
          finalPairs.slice(pairStartIndex, pairEndIndex).forEach(pair => {
            const stats = calculateWinrate(filteredPairStats[pair], currentPerspective);
            html += `
              <div class="bar-row">
                <div class="bar-label-wrapper">
                  ${getBarIconHTML(pair, 'pair-survivor')}
                  <div class="bar-label-text">
                    <div class="bar-label">${escapeHTML(pair)}</div>
                    <div class="bar-sublabel">${stats.wins}勝${stats.losses}敗${stats.draws}分<br>${stats.totalWithDraws}試合</div>
                  </div>
                </div>
                <div class="bar-wrapper">${renderBarHTML(stats.winrate)}</div>
              </div>`;
          });
        }

        html += '</div>';
        html += generatePagination(currentPages.pairStats, Math.ceil(finalPairs.length / itemsPerPage), 'changePairPage');
        html += '</div>';
      }

      return html;
    }
    
    // 試合履歴を更新
    function updateMatchHistory() {
      const container = document.getElementById('match-history');
      const periodFilter = document.getElementById('history-period-filter').value;
      const rankFilter = getRankFilterValue('history-rank-filter');
      const opponentFilter = document.getElementById('history-opponent-filter').value;
      const charFilter = document.getElementById('history-char-filter').value;
      const mapFilter = document.getElementById('history-map-filter').value;
      let perspectiveMatches = getFilteredMatches(rankFilter);

      // 期間でフィルター
      perspectiveMatches = filterByPeriod(perspectiveMatches, periodFilter);

      // 相手キャラでフィルター
      if (opponentFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => {
          if (m.perspective === 'survivor') {
            return m.opponentHunter === opponentFilter;
          } else {
            return m.opponentSurvivors && m.opponentSurvivors.includes(opponentFilter);
          }
        });
      }

      // 自キャラでフィルター
      if (charFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.myCharacter === charFilter);
      }

      // マップでフィルター
      if (mapFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.map === mapFilter);
      }

      // 特質でフィルター
      const traitFilter = document.getElementById('history-trait-filter')?.value || 'all';
      if (traitFilter !== 'all') {
        perspectiveMatches = perspectiveMatches.filter(m => m.trait === traitFilter);
      }

      perspectiveMatches = [...perspectiveMatches].sort((a, b) => {
        if (a.date !== b.date) return (b.date || '') > (a.date || '') ? 1 : -1;
        return (b.id || 0) - (a.id || 0);
      });
      
      if (perspectiveMatches.length === 0) {
        container.innerHTML = buildEmptyState();
        return;
      }
      
      const totalMatches = perspectiveMatches.length;
      const totalPages = Math.ceil(totalMatches / historyItemsPerPage);
      const startIndex = (currentPages.matchHistory - 1) * historyItemsPerPage;
      const endIndex = Math.min(startIndex + historyItemsPerPage, totalMatches);
      
      let html = '<div class="match-history">';
      
      perspectiveMatches.slice(startIndex, endIndex).forEach(match => {
        const isWin = (currentPerspective === 'survivor' && match.result === 'survivor_win') ||
                      (currentPerspective === 'hunter' && match.result === 'hunter_win');
        const isDraw = match.result === 'draw';
        const resultText = isWin ? '勝利' : isDraw ? '引き分け' : '敗北';
        const displayResultClass = isWin ? 'win' : isDraw ? 'draw' : 'lose';
        const escapeInfo = match.escapeCount !== undefined ? `　脱出${match.escapeCount}人` : '';

        const rankIconHTML = match.rank
          ? `<img class="match-rank-icon" src="${getRankIconPath(match.rank, match.perspective)}" alt="${escapeHTML(match.rank)}" title="${escapeHTML(match.rank)}" onerror="this.textContent=this.alt">` : '';
        let vsHTML = '';
        if (match.perspective === 'survivor') {
          const mySide  = [match.myCharacter, ...(match.teammates || [])].filter(Boolean).map(s => charIconImg(s, 'survivor')).join('');
          const oppSide = match.opponentHunter ? charIconImg(match.opponentHunter, 'hunter') : '';
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
        } else {
          const mySide  = match.myCharacter ? charIconImg(match.myCharacter, 'hunter') : '';
          const traitIcon = match.trait ? `<img class="match-trait-icon" src="${buildTraitIconPath(match.trait)}" alt="${escapeHTML(match.trait)}" title="${escapeHTML(match.trait)}" onerror="this.style.display='none'">` : '';
          const oppSide = (match.opponentSurvivors || []).map(s => charIconImg(s, 'survivor')).join('');
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}${traitIcon}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
        }

        const commentHTML = match.comment ? `<div class="match-comment">${escapeHTML(match.comment)}</div>` : '';

        html += `
          <div class="match-item">
            <div class="match-info">
              <span class="match-result ${displayResultClass}">${resultText}</span>
              <span class="match-meta">${escapeHTML(match.date || '')}　${escapeHTML(match.map || '')}${escapeHTML(escapeInfo)}</span>
              ${vsHTML}
              ${commentHTML}
            </div>
            <div class="match-actions">
              <button type="button" class="edit-button" onclick="event.stopPropagation(); editMatch(${match.id}); return false;">編集</button>
              <button type="button" class="delete-button" onclick="event.stopPropagation(); deleteMatch(${match.id}); return false;">削除</button>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      const perPageSel = [10, 20, 50].map(n =>
        `<button class="page-per-btn${historyItemsPerPage === n ? ' active' : ''}" onclick="changeHistoryPerPage(${n})">${n}</button>`
      ).join('');
      html += `<div class="page-per-row"><span class="page-per-label">表示件数：</span>${perPageSel}</div>`;
      html += generatePagination(currentPages.matchHistory, totalPages, 'changeHistoryPage');
      container.innerHTML = html;
    }
    
    // 試合を編集
    function editMatch(id) {
      const match = matches.find(m => m.id === id);
      if (!match) return;
      editingMatchId = id;
      
      if (match.perspective === 'survivor') {
        currentPerspective = 'survivor';
        document.getElementById('survivor-date').value = match.date || getToday();
        document.getElementById('survivor-rank').value = match.rank || '';
        document.getElementById('my-survivor').value = match.myCharacter;
        document.getElementById('teammate-1').value = match.teammates[0];
        document.getElementById('teammate-2').value = match.teammates[1];
        document.getElementById('teammate-3').value = match.teammates[2];
        document.getElementById('opponent-hunter').value = match.opponentHunter;
        document.getElementById('survivor-map').value = match.map;
        document.getElementById('survivor-comment').value = match.comment || '';
        // BANキャラ復元
        const bans = match.bannedCharacters || [];
        BAN_CHAR_IDS.forEach((id, i) => { document.getElementById(id).value = bans[i] || ''; });
        // コメントまたはBANがあれば詳細エリアを開く
        if (match.comment || bans.length > 0) {
          document.getElementById('detail-input-area').classList.remove('hidden');
          document.getElementById('detail-toggle-arrow').classList.add('open');
        }
        selectedEscapeCount.survivor = match.escapeCount !== undefined ? match.escapeCount : null;

        document.querySelectorAll('.perspective-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.perspective-tab')[0].classList.add('active');
        document.getElementById('survivor-input').classList.remove('hidden');
        document.getElementById('hunter-input').classList.add('hidden');
        
        document.querySelectorAll('#survivor-input .result-button').forEach((btn, index) => {
          btn.classList.remove('selected');
          if (match.escapeCount !== undefined && index === match.escapeCount) {
            btn.classList.add('selected');
          }
        });

        // 選択肢を更新してSearchableSelect同期
        updateSurvivorSelectOptions();
        SS_SURVIVOR_IDS.forEach(syncSearchableSelect);
      } else {
        currentPerspective = 'hunter';
        document.getElementById('hunter-date').value = match.date || getToday();
        document.getElementById('hunter-rank').value = match.rank || '';
        document.getElementById('my-hunter').value = match.myCharacter;
        if (match.trait && TRAITS.includes(match.trait)) {
          selectTrait(match.trait);
        } else {
          resetTraitPicker();
        }
        const oppSurvivors = match.opponentSurvivors || [];
        document.getElementById('opponent-survivor-1').value = oppSurvivors[0] || '';
        document.getElementById('opponent-survivor-2').value = oppSurvivors[1] || '';
        document.getElementById('opponent-survivor-3').value = oppSurvivors[2] || '';
        document.getElementById('opponent-survivor-4').value = oppSurvivors[3] || '';
        document.getElementById('hunter-map').value = match.map;
        document.getElementById('hunter-comment').value = match.comment || '';
        if (match.comment) {
          document.getElementById('hunter-detail-input-area').classList.remove('hidden');
          document.getElementById('hunter-detail-toggle-arrow').classList.add('open');
        }
        selectedEscapeCount.hunter = match.escapeCount !== undefined ? match.escapeCount : null;

        document.querySelectorAll('.perspective-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.perspective-tab')[1].classList.add('active');
        document.getElementById('survivor-input').classList.add('hidden');
        document.getElementById('hunter-input').classList.remove('hidden');
        
        updateHunterOpponentSelectOptions(); // 選択肢を更新
        
        document.querySelectorAll('#hunter-input .result-button').forEach((btn, index) => {
          btn.classList.remove('selected');
          if (match.escapeCount !== undefined && index === match.escapeCount) {
            btn.classList.add('selected');
          }
        });
        // SearchableSelect同期
        SS_HUNTER_IDS.forEach(syncSearchableSelect);
      }

      document.querySelectorAll('.main-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.main-tab')[0].classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById('input-tab').classList.add('active');
      
      window.scrollTo(0, 0);
    }
    
    // 試合を削除
    function deleteMatch(id) {
      if (!confirm('この試合データを削除しますか？')) return;
      // 削除前に使用回数を減らす
      const match = matches.find(m => m.id === id);
      if (match) {
        if (match.perspective === 'survivor') {
          // サバイバー視点：自分、味方3人の使用回数を減らす
          decrementCharacterUsage('survivorUsed', [match.myCharacter, ...match.teammates]);
          // 対戦相手ハンターの対戦回数を減らす
          decrementCharacterUsage('hunterFaced', match.opponentHunter);
          if (match.bannedCharacters) decrementCharacterUsage('survivorBanned', match.bannedCharacters);
        } else {
          // ハンター視点：自分の使用回数を減らす
          decrementCharacterUsage('hunterUsed', match.myCharacter);
          // 対戦相手サバイバー4人の対戦回数を減らす
          decrementCharacterUsage('survivorFaced', match.opponentSurvivors || []);
        }
      }

      matches = matches.filter(m => m.id !== id);
      saveData();
      refreshAfterDataChange({ rebuildSelects: true });
    }

    // 全データをリセット（確認ダイアログあり）
    function resetAllData() {
      // 第一確認
      if (!confirm('本当に全てのデータをリセットしますか？\nこの操作は取り消せません。')) return;
      // 第二確認（念押し）
      if (!confirm('最終確認：全データを削除します。\n本当によろしいですか？')) return;
      
      matches = [];
      saveData();
      
      // キャラクター使用回数もリセット
      characterUsageCount = { survivorUsed: {}, survivorFaced: {}, hunterUsed: {}, hunterFaced: {}, survivorBanned: {} };
      saveCharacterUsageCount();
      
      refreshAfterDataChange({ rebuildSelects: true });
    }

    // データのエクスポート/インポート機能
    
    // 現在のデータ情報を更新
    function updateDataInfo() {
      const dataInfo = document.getElementById('data-info');
      if (!dataInfo) return;
      
      const survivorMatches = matches.filter(m => m.perspective === 'survivor').length;
      const hunterMatches = matches.filter(m => m.perspective === 'hunter').length;
      const totalMatches = matches.length;
      
      const survivorCharsCount = Object.keys(characterUsageCount.survivorUsed || {}).length;
      const hunterCharsCount = Object.keys(characterUsageCount.hunterUsed || {}).length;
      
      dataInfo.innerHTML = `
        <div><strong>総試合数:</strong> ${totalMatches}試合</div>
        <div style="margin-left: 20px;">└ サバイバー視点: ${survivorMatches}試合</div>
        <div style="margin-left: 20px;">└ ハンター視点: ${hunterMatches}試合</div>
        <div style="margin-top: 10px;"><strong>使用キャラクター数:</strong></div>
        <div style="margin-left: 20px;">└ サバイバー: ${survivorCharsCount}種類</div>
        <div style="margin-left: 20px;">└ ハンター: ${hunterCharsCount}種類</div>
      `;
    }
    
    // バックアップデータを作成
    function createBackupData() {
      return {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        matches: matches,
        characterUsageCount: characterUsageCount
      };
    }
    
    // クリップボードにエクスポート
    async function exportToClipboard() {
      try {
        const data = createBackupData();
        const jsonString = JSON.stringify(data, null, 2);
        
        await navigator.clipboard.writeText(jsonString);
        showToast('データをコピーしました');
      } catch (error) {
        console.error('Export to clipboard failed:', error);
        showToast('コピーに失敗しました。ファイルダウンロードをお試しください', 'error', 5000);
      }
    }
    
    // ファイルとしてエクスポート
    function exportToFile() {
      try {
        const data = createBackupData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `identity5_backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('ダウンロードしました');
      } catch (error) {
        console.error('Export to file failed:', error);
        showToast('ダウンロードに失敗しました', 'error');
      }
    }
    
    // データを検証
    function validateBackupData(data) {
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'データ形式が正しくありません' };
      }
      
      if (!data.matches || !Array.isArray(data.matches)) {
        return { valid: false, error: '試合データが見つかりません' };
      }
      
      // characterUsageCount は省略可能（古いバックアップ対応）。importData側でフォールバックする

      return { valid: true };
    }
    
    // データをインポート
    function importData(data) {
      const validation = validateBackupData(data);
      if (!validation.valid) {
        showToast(`データの復元に失敗しました: ${validation.error}`, 'error');
        return false;
      }
      
      const currentMatchCount = matches.length;
      const newMatchCount = data.matches.length;
      
      const confirmed = confirm(
        `データを復元しますか？\n\n` +
        `現在のデータ: ${currentMatchCount}試合\n` +
        `復元するデータ: ${newMatchCount}試合\n\n` +
        `現在のデータは完全に上書きされます。\n` +
        `本当によろしいですか？`
      );
      
      if (!confirmed) {
        return false;
      }
      
      try {
        // データを復元
        matches = data.matches;
        characterUsageCount = data.characterUsageCount || { survivorUsed: {}, survivorFaced: {}, hunterUsed: {}, hunterFaced: {}, survivorBanned: {} };
        
        // localStorageに保存
        saveData();
        saveCharacterUsageCount();
        
        // UIを更新
        updateDataInfo();
        refreshAfterDataChange({ rebuildSelects: true });

        showToast(`データを復元しました！ ${newMatchCount}試合のデータを読み込みました。`);
        return true;
      } catch (error) {
        console.error('Import failed:', error);
        showToast(`データの復元中にエラーが発生しました: ${error.message}`, 'error');
        return false;
      }
    }
    
    // テキストからインポート
    function importFromText() {
      const textarea = document.getElementById('import-textarea');
      const text = textarea.value.trim();
      
      if (!text) {
        showToast('バックアップデータを貼り付けてください', 'error');
        return;
      }
      
      try {
        const data = JSON.parse(text);
        if (importData(data)) {
          textarea.value = '';
        }
      } catch (error) {
        console.error('JSON parse error:', error);
        showToast('データ形式が正しくありません', 'error');
      }
    }
    
    // ファイルからインポート
    function importFromFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          importData(data);
        } catch (error) {
          console.error('JSON parse error:', error);
          showToast('ファイルの読み込みに失敗しました', 'error');
        }
        
        // ファイル選択をリセット
        event.target.value = '';
      };
      
      reader.onerror = function() {
        showToast('ファイルの読み込みに失敗しました', 'error');
        event.target.value = '';
      };
      
      reader.readAsText(file);
    }
    
    // ===== ガイドバナー =====
    function checkGuideBanner() {
      const banner = document.getElementById('guide-banner');
      if (!banner) return;
      const visited = localStorage.getItem('identity5_guide_visited') === 'true';
      const dismissed = localStorage.getItem('identity5_guide_banner_dismissed') === 'true';
      if (!visited && !dismissed) {
        banner.classList.remove('hidden');
      }
    }

    function dismissGuideBanner() {
      const banner = document.getElementById('guide-banner');
      if (banner) banner.classList.add('hidden');
      localStorage.setItem('identity5_guide_banner_dismissed', 'true');
      checkInstallBanner();
    }

    function markGuideVisited() {
      localStorage.setItem('identity5_guide_visited', 'true');
      const banner = document.getElementById('guide-banner');
      if (banner) banner.classList.add('hidden');
      checkInstallBanner();
    }

    // ===== インストールバナー =====
    function dismissInstallBanner() {
      document.getElementById('install-banner').classList.add('hidden');
      localStorage.setItem('identity5_install_banner_dismissed', 'true');
    }

    function checkInstallBanner() {
      const banner = document.getElementById('install-banner');
      if (!banner) return;
      // 既にPWAとして動作中、または閉じた場合は非表示
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      const dismissed = localStorage.getItem('identity5_install_banner_dismissed') === 'true';
      // PCでは非表示（タッチ非対応 かつ 画面幅が広い）
      const isPC = !('ontouchstart' in window) && window.innerWidth >= 1024;
      // ガイドバナーが表示中は非表示
      const guideEl = document.getElementById('guide-banner');
      const guideVisible = guideEl && !guideEl.classList.contains('hidden');
      if (isStandalone || dismissed || guideVisible || isPC) {
        banner.classList.add('hidden');
      }
    }
    
    // ===== ダークモード =====
    function applyChartDefaults() {
      const isDark = document.body.classList.contains('dark-mode');
      if (typeof Chart !== 'undefined') {
        Chart.defaults.color = isDark ? '#9ca3af' : '#666';
      }
    }

    function toggleDarkMode() {
      const isOn = document.getElementById('dark-mode-switch').checked;
      document.body.classList.toggle('dark-mode', isOn);
      localStorage.setItem('identity5_dark_mode', isOn ? 'on' : 'off');
      applyChartDefaults();
      // 全グラフの色を更新
      updateOverallStatsTab();
      updateAllStats();
    }

    function loadDarkMode() {
      const saved = localStorage.getItem('identity5_dark_mode');
      if (saved === 'on') {
        document.body.classList.add('dark-mode');
        const sw = document.getElementById('dark-mode-switch');
        if (sw) sw.checked = true;
      }
      applyChartDefaults();
    }

    // ===== 自動フォーカス =====
    const SURVIVOR_FOCUS_ORDER = [
      'survivor-date', 'survivor-rank', 'my-survivor',
      'teammate-1', 'teammate-2', 'teammate-3',
      'opponent-hunter', 'survivor-map'
    ];
    const HUNTER_FOCUS_ORDER = [
      'hunter-date', 'hunter-rank', 'my-hunter',
      'opponent-survivor-1', 'opponent-survivor-2',
      'opponent-survivor-3', 'opponent-survivor-4',
      'hunter-map'
    ];

    const _isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    function focusNextField(perspective, currentId) {
      const order = perspective === 'survivor' ? SURVIVOR_FOCUS_ORDER : HUNTER_FOCUS_ORDER;
      const idx = order.indexOf(currentId);
      if (idx === -1 || idx >= order.length - 1) return;

      // 次のフィールドが既に値を持っていたらスキップ
      let nextIdx = idx + 1;
      while (nextIdx < order.length) {
        const nId = order[nextIdx];
        const nSs = searchableSelects[nId];
        const nVal = nSs ? nSs.value : (document.getElementById(nId)?.value || '');
        if (!nVal) break;
        nextIdx++;
      }
      if (nextIdx >= order.length) return;

      const nextId = order[nextIdx];
      const ss = searchableSelects[nextId];
      if (ss) {
        ss.input.value = '';
        // setTimeout で document の click ハンドラ（閉じる処理）より後に focus を呼ぶ
        setTimeout(() => ss.input.focus(), 0);
      } else {
        const el = document.getElementById(nextId);
        if (el) el.focus();
      }
    }

    // ===== バリデーションハイライト =====
    function highlightMissingFields(fieldIds) {
      // 前回のハイライトをクリア
      document.querySelectorAll('.validation-error').forEach(el => el.classList.remove('validation-error'));

      let firstEl = null;
      fieldIds.forEach(id => {
        if (id === 'hunter-trait') {
          const btn = document.getElementById('trait-selected-btn');
          if (btn) {
            btn.classList.add('validation-error');
            btn.addEventListener('click', () => btn.classList.remove('validation-error'), { once: true });
            if (!firstEl) firstEl = btn;
          }
        } else if (id === 'survivor-escape' || id === 'hunter-escape') {
          const container = id === 'survivor-escape' ? document.getElementById('survivor-input') : document.getElementById('hunter-input');
          const buttons = container?.querySelector('.result-buttons');
          if (buttons) {
            buttons.classList.add('validation-error');
            buttons.addEventListener('click', () => buttons.classList.remove('validation-error'), { once: true });
            if (!firstEl) firstEl = buttons;
          }
        } else {
          const ss = searchableSelects[id];
          if (ss) {
            ss.input.classList.add('validation-error');
            ss.input.addEventListener('focus', () => ss.input.classList.remove('validation-error'), { once: true });
            if (!firstEl) firstEl = ss.input;
          } else {
            const el = document.getElementById(id);
            if (el) {
              el.classList.add('validation-error');
              el.addEventListener('focus', () => el.classList.remove('validation-error'), { once: true });
              if (!firstEl) firstEl = el;
            }
          }
        }
      });
      if (firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ===== 特質ピッカー =====
    function initTraitPicker() {
      const grid = document.getElementById('trait-grid');
      if (!grid) return;
      grid.innerHTML = TRAITS.map(t =>
        `<button type="button" class="trait-icon-btn" data-trait="${t}" onclick="selectTrait('${t}')">
           <img src="${buildTraitIconPath(t)}" alt="${t}" title="${t}" onerror="this.style.display='none'">
         </button>`
      ).join('');
      // 外クリックで閉じる
      document.addEventListener('click', (e) => {
        const picker = document.getElementById('trait-picker');
        if (picker && !picker.contains(e.target)) {
          document.getElementById('trait-grid').classList.add('hidden');
        }
      });
    }

    function toggleTraitPicker() {
      document.getElementById('trait-grid').classList.toggle('hidden');
    }

    function selectTrait(traitName) {
      selectedTrait = traitName;
      const btn = document.getElementById('trait-selected-btn');
      btn.innerHTML = `<img class="trait-selected-icon" src="${buildTraitIconPath(traitName)}" alt="${escapeHTML(traitName)}"><span>${escapeHTML(traitName)}</span>`;
      document.getElementById('trait-grid').classList.add('hidden');
      document.querySelectorAll('.trait-icon-btn').forEach(b => b.classList.remove('selected'));
      document.querySelector(`.trait-icon-btn[data-trait="${traitName}"]`)?.classList.add('selected');
    }

    function resetTraitPicker() {
      selectedTrait = null;
      const btn = document.getElementById('trait-selected-btn');
      if (btn) btn.innerHTML = '<span class="trait-placeholder">選択してください</span>';
      document.querySelectorAll('.trait-icon-btn').forEach(b => b.classList.remove('selected'));
    }

    function initAutoFocus() {
      ['survivor-date', 'hunter-date'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const perspective = id.startsWith('survivor') ? 'survivor' : 'hunter';
        el.addEventListener('change', () => focusNextField(perspective, id));
      });
      [
        ['survivor-rank', 'survivor'],
        ['hunter-rank', 'hunter']
      ].forEach(([id, perspective]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => focusNextField(perspective, id));
      });
      // SSキャラ・マップフィールドはonSelectedで直接呼ぶ
      // （dispatchEvent経由を避けiOSでのキーボード転送を保証するため）
      [
        ['my-survivor', 'survivor'], ['teammate-1', 'survivor'],
        ['teammate-2', 'survivor'],  ['teammate-3', 'survivor'],
        ['opponent-hunter', 'survivor'],
        ['my-hunter', 'hunter'],
        ['opponent-survivor-1', 'hunter'], ['opponent-survivor-2', 'hunter'],
        ['opponent-survivor-3', 'hunter'], ['opponent-survivor-4', 'hunter']
      ].forEach(([id, perspective]) => {
        const ss = searchableSelects[id];
        if (!ss) return;
        if (id === 'my-hunter') {
          ss.onSelected = () => {
            if (!selectedTrait) {
              const grid = document.getElementById('trait-grid');
              if (grid && grid.classList.contains('hidden')) {
                grid.classList.remove('hidden');
              }
            } else {
              focusNextField(perspective, id);
            }
          };
        } else {
          ss.onSelected = () => focusNextField(perspective, id);
        }
      });

      // マップは最終フィールドのため選択後にフォーカスを解除
      ['survivor-map', 'hunter-map'].forEach(id => {
        const ss = searchableSelects[id];
        if (!ss) return;
        ss.onSelected = () => {
          setTimeout(() => {
            if (document.activeElement && document.activeElement.tagName !== 'BODY') {
              document.activeElement.blur();
            }
          }, 0);
        };
      });
    }

    // ===== 同グループ内の選択済みキャラを除外 =====
    function initGroupExclude() {
      const CHAR_GROUPS = [
        ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3', ...BAN_CHAR_IDS],
        ['opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4']
      ];
      CHAR_GROUPS.forEach(group => {
        group.forEach(id => {
          const ss = searchableSelects[id];
          if (!ss) return;
          ss.getExcluded = () => {
            const excluded = new Set();
            group.forEach(sibId => {
              if (sibId !== id) {
                const val = searchableSelects[sibId]?.value;
                if (val) excluded.add(val);
              }
            });
            return excluded;
          };
        });
      });

    }

    // ===== ☁️ クラウド同期 =====

    let db = null;

    function initFirebaseLocal() {
      db = initFirebase();
    }

    function generateUUID() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    function getSyncCode() {
      return localStorage.getItem('identity5_sync_code');
    }

    // 同期UIを描画
    function updateSyncUI() {
      const container = document.getElementById('sync-ui');
      if (!container) return;

      const syncCode = getSyncCode();
      const lastSynced = localStorage.getItem('identity5_last_synced');
      const lastSyncedText = lastSynced
        ? new Date(lastSynced).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '未同期';

      if (!syncCode) {
        container.innerHTML = `
          <button type="button" onclick="startNewSync()" class="sync-btn-primary">
            新しく同期を始める
          </button>
          <a href="sync-guide.html" class="sync-guide-link">
            同期の設定方法を見る ›
          </a>
          <div class="sync-divider">
            <p class="sync-section-heading">他のデバイスの同期コードで接続する</p>
            <input type="text" id="sync-code-input" class="sync-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
            <button type="button" onclick="linkWithInputCode()" class="sync-btn-connect">
              接続する
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="sync-section">
            <p class="sync-sublabel">同期コード</p>
            <div class="sync-code-row">
              <input type="text" value="${syncCode}" readonly class="sync-code-input">
              <button type="button" onclick="copySyncCode()" class="sync-btn-secondary sync-btn-copy">
                コピー
              </button>
            </div>
            <p class="sync-sublabel sync-sublabel-note">最終同期: ${lastSyncedText}</p>
          </div>
          <button type="button" onclick="syncData()" id="sync-now-btn" class="sync-btn-primary">
            今すぐ同期
          </button>
          <div class="sync-btn-row">
            <button type="button" onclick="unlinkSync()" class="sync-btn-secondary sync-btn-flex">
              同期を解除
            </button>
            <button type="button" onclick="deleteCloudData()" class="sync-btn-danger sync-btn-flex">
              クラウドを削除
            </button>
          </div>
        `;
      }
    }

    // 新しく同期を開始（新規コード生成）
    async function startNewSync() {
      if (!db) { showToast('同期機能を利用できません', 'error'); return; }
      const syncCode = generateUUID();
      localStorage.setItem('identity5_sync_code', syncCode);
      if (!localStorage.getItem('identity5_data_modified')) {
        localStorage.setItem('identity5_data_modified', new Date().toISOString());
      }
      updateSyncUI();
      try {
        await uploadToCloud();
        updateSyncUI();
        showToast('同期を開始しました');
      } catch (e) {
        console.warn('Initial upload failed:', e);
        showToast('同期の開始に失敗しました。通信環境を確認してください', 'error', 5000);
      }
    }

    // 既存コードで別デバイスと接続
    async function linkWithInputCode() {
      if (!db) { showToast('同期機能を利用できません', 'error'); return; }
      const input = document.getElementById('sync-code-input');
      if (!input) return;
      const code = input.value.trim().toLowerCase();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      if (!uuidRegex.test(code)) {
        showToast('同期コードの形式が正しくありません', 'error');
        return;
      }
      try {
        const docSnap = await db.collection('idv_tracker').doc(code).get();
        if (!docSnap.exists) {
          showToast('このコードのデータが見つかりません', 'error');
          return;
        }
        const cloudData = docSnap.data();
        const confirmed = confirm(
          `クラウドのデータが見つかりました。\n\nクラウド: ${cloudData.matches ? cloudData.matches.length : 0}試合\nこのデバイス: ${matches.length}試合\n\nクラウドのデータで上書きして接続しますか？`
        );
        if (!confirmed) return;
        localStorage.setItem('identity5_sync_code', code);
        await downloadFromCloud(cloudData);
        updateSyncUI();
        showToast('接続しました！');
      } catch (e) {
        showToast('接続に失敗しました。通信環境を確認してください。', 'error');
        console.error('Link error:', e);
      }
    }

    // クラウドにアップロード
    async function uploadToCloud() {
      if (!db) return;
      const syncCode = getSyncCode();
      if (!syncCode) return;
      const now = new Date().toISOString();
      await db.collection('idv_tracker').doc(syncCode).set({
        matches: matches,
        characterUsageCount: characterUsageCount,
        lastModified: now,
        appVersion: '1.0.0'
      });
      localStorage.setItem('identity5_last_synced', now);
    }

    // クラウドからダウンロードしてローカルに反映
    async function downloadFromCloud(cloudData) {
      matches = cloudData.matches || [];
      characterUsageCount = cloudData.characterUsageCount || { survivorUsed: {}, survivorFaced: {}, hunterUsed: {}, hunterFaced: {}, survivorBanned: {} };
      localStorage.setItem('identity5_matches', JSON.stringify(matches));
      localStorage.setItem('identity5_data_modified', cloudData.lastModified || new Date().toISOString());
      saveCharacterUsageCount();
      refreshAfterDataChange({ rebuildSelects: true });
      localStorage.setItem('identity5_last_synced', new Date().toISOString());
    }

    // 手動同期（タイムスタンプ比較して適切な方向に同期）
    async function syncData() {
      if (!db) { showToast('同期機能を利用できません', 'error'); return; }
      const syncCode = getSyncCode();
      if (!syncCode) return;
      const btn = document.getElementById('sync-now-btn');
      if (btn) { btn.textContent = '同期中...'; btn.disabled = true; }
      try {
        const docSnap = await db.collection('idv_tracker').doc(syncCode).get();
        if (!docSnap.exists) {
          await uploadToCloud();
          updateSyncUI();
          _autoSyncFailCount = 0;
          showToast('クラウドに保存しました');
          return;
        }
        const cloudData = docSnap.data();
        const cloudTime = new Date(cloudData.lastModified || 0).getTime();
        const localTime = new Date(localStorage.getItem('identity5_data_modified') || 0).getTime();
        if (cloudTime > localTime) {
          const confirmed = confirm(
            `クラウドに新しいデータがあります。\n\nクラウド: ${cloudData.matches ? cloudData.matches.length : 0}試合\nこのデバイス: ${matches.length}試合\n\nクラウドのデータで上書きしますか？`
          );
          if (confirmed) {
            await downloadFromCloud(cloudData);
            _autoSyncFailCount = 0;
            showToast('クラウドのデータを読み込みました');
          }
        } else if (localTime > cloudTime) {
          await uploadToCloud();
          _autoSyncFailCount = 0;
          showToast('クラウドに同期しました');
        } else {
          showToast('既に最新の状態です');
        }
      } catch (e) {
        showToast('同期に失敗しました。通信環境を確認してください', 'error', 5000);
        console.error('Sync error:', e);
      } finally {
        updateSyncUI();
      }
    }

    // 自動同期（saveData呼び出し時、サイレント実行）
    let _autoSyncFailCount = 0;
    function autoSync() {
      if (!db || !getSyncCode()) return;
      if (_autoSyncFailCount >= 3) return; // 連続3回失敗で停止
      uploadToCloud()
        .then(() => { _autoSyncFailCount = 0; updateSyncUI(); })
        .catch(() => {
          _autoSyncFailCount++;
          if (_autoSyncFailCount === 1) {
            showToast('同期に失敗しました', 'error');
          } else if (_autoSyncFailCount >= 3) {
            showToast('同期を一時停止しました。設定から手動同期してください', 'error', 5000);
          }
        });
    }

    // 同期コードをクリップボードにコピー
    function copySyncCode() {
      const syncCode = getSyncCode();
      if (!syncCode) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(syncCode)
          .then(() => showToast('コピーしました'))
          .catch(() => _fallbackCopy(syncCode));
      } else {
        _fallbackCopy(syncCode);
      }
    }

    function _fallbackCopy(syncCode) {
      const input = document.querySelector('#sync-ui input[readonly]');
      if (input) {
        input.select();
        try { document.execCommand('copy'); showToast('コピーしました'); }
        catch (e) { showToast('コピーできませんでした', 'error'); }
      }
    }

    // 同期を解除（ローカルのコードのみ削除。クラウドは残る）
    function unlinkSync() {
      if (!confirm('このデバイスの同期を解除しますか？\n\nクラウドのデータは削除されません。\n同じコードを再入力すれば再接続できます。')) return;
      localStorage.removeItem('identity5_sync_code');
      localStorage.removeItem('identity5_last_synced');
      updateSyncUI();
    }

    // クラウドのデータを完全削除
    async function deleteCloudData() {
      if (!confirm('クラウドのデータを削除しますか？\n\nこの操作は取り消せません。\nこのデバイスのデータは削除されません。')) return;
      if (!confirm('最終確認：クラウドのデータを完全に削除します。\n本当によろしいですか？')) return;
      const syncCode = getSyncCode();
      if (!syncCode || !db) return;
      try {
        await db.collection('idv_tracker').doc(syncCode).delete();
        localStorage.removeItem('identity5_sync_code');
        localStorage.removeItem('identity5_last_synced');
        updateSyncUI();
        showToast('クラウドのデータを削除しました');
      } catch (e) {
        showToast('削除に失敗しました', 'error');
        console.error('Delete error:', e);
      }
    }

    // ===== モバイルナビゲーション =====
    // navItem: 'input' | 'overall' | 'character' | 'map' | 'opponent'
    function switchBottomNav(navItem, el) {
      document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));
      if (el) el.classList.add('active');

      // ピルインジケーターを移動
      const navOrder = ['input', 'overall', 'character', 'map', 'opponent'];
      const idx = navOrder.indexOf(navItem);
      const pill = document.getElementById('bottom-nav-pill');
      if (pill && idx >= 0) pill.style.transform = `translateX(${idx * 100}%)`;

      const tabMap = { 'input':'input', 'overall':'overall', 'character':'character', 'map':'map', 'opponent':'opponent' };
      const tabName = tabMap[navItem] || 'input';
      switchTab(tabName, getMainTabEl(tabName));
      window.scrollTo(0, 0);
    }

    function switchSubTab(tabName, el) {
      document.querySelectorAll('.sub-tab').forEach(btn => btn.classList.remove('active'));
      if (el) el.classList.add('active');
      switchTab(tabName, getMainTabEl(tabName));
      window.scrollTo(0, 0);
    }

    function getMainTabEl(tabName) {
      return document.querySelector(`.main-tab[data-tab="${tabName}"]`);
    }

    function initScrollBehavior() {
      let lastScrollY = window.scrollY;
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            const bottomNav = document.getElementById('bottom-nav');
            const subTabs = document.getElementById('sub-tabs');
            if (scrollingDown && currentScrollY > 50) {
              bottomNav?.classList.add('scroll-hidden');
              subTabs?.classList.add('scroll-hidden');
            } else {
              bottomNav?.classList.remove('scroll-hidden');
              subTabs?.classList.remove('scroll-hidden');
            }
            lastScrollY = currentScrollY;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // 詳細ページ内スクロールでもボトムナビを制御
      const detailPageEl = document.getElementById('detail-page');
      let lastDetailScrollY = 0;
      let detailTicking = false;
      detailPageEl?.addEventListener('scroll', () => {
        if (!detailTicking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = detailPageEl.scrollTop;
            const scrollingDown = currentScrollY > lastDetailScrollY;
            const bottomNav = document.getElementById('bottom-nav');
            if (scrollingDown && currentScrollY > 50) {
              bottomNav?.classList.add('scroll-hidden');
            } else {
              bottomNav?.classList.remove('scroll-hidden');
            }
            lastDetailScrollY = currentScrollY;
            detailTicking = false;
          });
          detailTicking = true;
        }
      }, { passive: true });
    }

    // ===== ヘッダー統計 =====
    function updateHeaderStats() {
      const todayStr = getToday();
      const currentSeason = SEASONS.find(s => todayStr >= s.start && todayStr <= s.end);
      const periodId = currentSeason ? currentSeason.id : 'all';
      const seasonLabel = currentSeason ? currentSeason.label : '全期間';

      const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
      const filtered = filterByPeriod(perspectiveMatches, periodId);

      const statsEl = document.getElementById('header-stats');
      if (!statsEl) return;

      if (filtered.length === 0) {
        statsEl.innerHTML = `
          <div class="hstats-item"><span class="hstats-val">—</span><span class="hstats-label">試合</span></div>
          <div class="hstats-item"><span class="hstats-val">—</span><span class="hstats-label">勝率</span></div>`;
        return;
      }

      const stats = calculateWinrate(filtered, currentPerspective);
      const streak = calculateWinStreak(perspectiveMatches, currentPerspective);
      const streakHtml = streak >= 2
        ? `<div class="hstats-item"><span class="hstats-val hstats-streak">🔥${streak}</span><span class="hstats-label">連勝中</span></div>`
        : '';

      statsEl.innerHTML = `
        <div class="hstats-item"><span class="hstats-val">${stats.totalWithDraws}</span><span class="hstats-label">試合</span></div>
        <div class="hstats-item"><span class="hstats-val">${stats.winrate}%</span><span class="hstats-label">勝率</span></div>
        ${streakHtml}`;
    }

    // ===== 設定を開く =====
    function openSettings() {
      switchTab('settings', document.querySelector('.main-tab[data-tab="settings"]'));
    }

    // ===== ツールシート（モバイル） =====
    function openToolSheet() {
      const overlay = document.getElementById('tool-sheet-overlay');
      const sheet   = document.getElementById('tool-sheet');
      if (!overlay || !sheet) return;
      overlay.classList.add('active');
      sheet.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeToolSheet() {
      const overlay = document.getElementById('tool-sheet-overlay');
      const sheet   = document.getElementById('tool-sheet');
      if (!overlay || !sheet) return;
      overlay.classList.remove('active');
      sheet.classList.remove('active');
      document.body.style.overflow = '';
    }

    // ===== フィルター折りたたみ =====
    const filterDrawerOpen = {};

    function toggleFilterDrawer(tabId) {
      filterDrawerOpen[tabId] = !filterDrawerOpen[tabId];
      const drawer = document.getElementById(`filter-drawer-${tabId}`);
      const btn = document.getElementById(`filter-toggle-btn-${tabId}`);
      if (drawer) drawer.classList.toggle('open', filterDrawerOpen[tabId]);
      if (btn) {
        btn.classList.toggle('open', filterDrawerOpen[tabId]);
        btn.setAttribute('aria-expanded', filterDrawerOpen[tabId] ? 'true' : 'false');
      }
    }

    function renderFilterChips(tabId) {
      const el = document.getElementById(`filter-chips-${tabId}`);
      if (!el) return;
      const chips = [];

      // 期間チップ
      const periodEl = document.getElementById(`${tabId === 'overall' ? 'overall' : tabId}-period-filter`);
      if (periodEl && periodEl.value !== 'all') {
        const label = periodEl.options[periodEl.selectedIndex]?.text || periodEl.value;
        chips.push(`<button class="fchip" onclick="event.stopPropagation();resetPeriodFilterChip('${tabId}')">${escapeHTML(label)} ×</button>`);
      }

      // 段位チップ（単一選択時は具体的な段位名を表示）
      const rankWrapperId = `${tabId === 'overall' ? 'overall' : tabId}-rank-filter`;
      const rankWrapper = document.getElementById(rankWrapperId);
      if (rankWrapper) {
        const sel = rankWrapper.dataset.selected ? JSON.parse(rankWrapper.dataset.selected) : ['all'];
        if (!sel.includes('all') && sel.length > 0) {
          const rankLabel = sel.length === 1 ? sel[0] : sel.length + '段位選択';
          chips.push(`<button class="fchip" onclick="event.stopPropagation();resetRankFilterChip('${rankWrapperId}')">${escapeHTML(rankLabel)} ×</button>`);
        }
      }

      // タブ固有の追加フィルターチップ
      const extraFilters = getTabExtraFilters(tabId);
      extraFilters.forEach(({ id, label }) => {
        const sel = document.getElementById(id);
        if (sel && sel.value !== 'all') {
          const selectedText = sel.options[sel.selectedIndex]?.text || sel.value;
          chips.push(`<button class="fchip" onclick="event.stopPropagation();resetSelectFilter('${id}')">${escapeHTML(selectedText)} ×</button>`);
        }
      });

      el.innerHTML = chips.join('');
    }

    function getTabExtraFilters(tabId) {
      switch (tabId) {
        case 'character':
          return [
            { id: 'character-opponent-filter', label: '対戦相手' },
            { id: 'character-map-filter', label: 'マップ' }
          ];
        case 'map':
          return [
            { id: 'map-char-filter', label: '自キャラ' }
          ];
        case 'opponent':
          return [
            { id: 'my-char-filter', label: '自キャラ' },
            { id: 'opponent-hunter-filter', label: '対戦相手' },
            { id: 'opponent-map-filter', label: 'マップ' }
          ];
        case 'history':
          return [
            { id: 'history-opponent-filter', label: '相手キャラ' },
            { id: 'history-char-filter', label: '自キャラ' },
            { id: 'history-map-filter', label: 'マップ' },
            ...(currentPerspective === 'hunter' ? [{ id: 'history-trait-filter', label: '特質' }] : [])
          ];
        default:
          return [];
      }
    }

    function resetSelectFilter(selectId) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      sel.value = 'all';
      // 特殊なonchangeハンドラがあるフィルターは手動トリガー
      if (selectId === 'my-char-filter') { onMyCharFilterChange(); return; }
      if (selectId === 'history-char-filter') { onHistoryCharFilterChange(); return; }
      updateAllStats();
    }

    function resetPeriodFilterChip(tabId) {
      const periodEl = document.getElementById(`${tabId === 'overall' ? 'overall' : tabId}-period-filter`);
      if (periodEl) { periodEl.value = 'all'; updateAllStats(); }
    }

    function resetRankFilterChip(rankWrapperId) {
      const wrapper = document.getElementById(rankWrapperId);
      if (wrapper) {
        wrapper.dataset.selected = JSON.stringify(['all']);
        const perspectiveMatches = matches.filter(m => m.perspective === currentPerspective);
        const usedRanks = [...new Set(perspectiveMatches.map(m => m.rank).filter(r => r))];
        const sortedRanks = RANKS.filter(rank => usedRanks.includes(rank));
        buildMultiRankUI(wrapper, sortedRanks, rankWrapperId);
        updateAllStats();
      }
    }

    // ===== TOPカードヘルパー =====
    function getGroupedBestWorst(matches, groupKeyFn, minGames = 3) {
      const groups = {};
      matches.forEach(m => {
        const key = groupKeyFn(m);
        if (!key) return;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });
      const valid = Object.keys(groups)
        .filter(k => groups[k].length >= minGames)
        .map(k => ({ name: k, ...calculateWinrate(groups[k], currentPerspective) }));
      if (valid.length === 0) return { best: null, worst: null };
      valid.sort((a, b) => parseFloat(b.winrate) - parseFloat(a.winrate));
      const worstCandidate = valid[valid.length - 1];
      return { best: valid[0], worst: valid.length >= 2 && parseFloat(worstCandidate.winrate) < 100 ? worstCandidate : null };
    }

    function buildTopCard({ name, matches, totalMatches, iconSrc, iconClass, headLabel, detailPage, type, detailRows, groupKeyFn }) {
      const stats = calculateWinrate(matches, currentPerspective);
      const subParts = [`${stats.wins}勝${stats.losses}敗${stats.draws}分 / ${matches.length}試合`];
      if (totalMatches != null && totalMatches > 0) {
        subParts.push(`<br>Pick ${(matches.length / totalMatches * 100).toFixed(1)}%`);
      }
      const { best, worst } = getGroupedBestWorst(matches, groupKeyFn);
      const isBest = type === 'best';
      const cardClass = isBest ? 'top-card top-card-best' : 'top-card top-card-worst';

      return `
        <div class="${cardClass}" onclick="openDetailPage('${detailPage}','${escapeHTML(name)}')">
          <div class="top-card-head">${headLabel}</div>
          <div class="top-card-body">
            <div class="top-card-icon-wrap">
              <img class="${iconClass}" src="${iconSrc}" alt="${escapeHTML(name)}" onerror="this.style.display='none'">
            </div>
            <div class="top-card-info">
              <div class="top-card-name">${escapeHTML(name)}</div>
              <div class="top-card-winrate">${stats.winrate}%</div>
              <div class="top-card-sub">${subParts.join('')}</div>
            </div>
          </div>
          <div class="top-card-detail-row">
            <div class="top-card-detail-item"><strong>${detailRows.bestLabel}</strong><span>${best ? `${escapeHTML(best.name)}<em>${best.winrate}%</em>` : '—'}</span></div>
            <div class="top-card-detail-item"><strong>${detailRows.worstLabel}</strong><span>${worst ? `${escapeHTML(worst.name)}<em>${worst.winrate}%</em>` : '—'}</span></div>
          </div>
        </div>`;
    }

    // ===== 詳細ページ =====
    let detailPagePreviousTab = 'input';
    let detailFilterState = { period: 'all', rank: 'all' };
    let _detailHideTimeout = null;
    let detailCurrentType = null;
    let detailCurrentName = null;
    const detailBarSortState    = {};  // sectionId → { key: 'winrate'|'games', dir: 'desc'|'asc' }
    const detailBarPageState    = {};  // sectionId → currentPage (1-based)
    const detailBarMinGamesState = {}; // sectionId → minGames number
    let detailHistoryPage = 1;
    const detailPieCharts = {};    // sectionId → Chart instance
    const detailPieDataCache = {}; // sectionId → { pieData, totalAll }

    function clearDetailPieCharts() {
      Object.keys(detailPieCharts).forEach(k => {
        if (detailPieCharts[k]) { detailPieCharts[k].destroy(); delete detailPieCharts[k]; }
      });
      Object.keys(detailPieDataCache).forEach(k => delete detailPieDataCache[k]);
    }

    function rebuildDetailPageBody() {
      const body = document.getElementById('detail-page-body');
      if (!body || !detailCurrentType || !detailCurrentName) return;
      // パイチャートのインスタンスだけ破棄（データキャッシュは保持）
      Object.keys(detailPieCharts).forEach(k => {
        if (detailPieCharts[k]) { detailPieCharts[k].destroy(); delete detailPieCharts[k]; }
      });
      if (detailCurrentType === 'char')     body.innerHTML = buildDetailCharContent(detailCurrentName);
      else if (detailCurrentType === 'map') body.innerHTML = buildDetailMapContent(detailCurrentName);
      else if (detailCurrentType === 'opponent') body.innerHTML = buildDetailOpponentContent(detailCurrentName);
      renderDetailPieCharts();
    }

    function changeDetailBarSort(sectionId, key) {
      if (!detailBarSortState[sectionId]) detailBarSortState[sectionId] = { key: 'winrate', dir: 'desc' };
      detailBarSortState[sectionId].key = key;
      detailBarPageState[sectionId] = 1;
      rebuildDetailPageBody();
    }
    function changeDetailBarSortDir(sectionId, dir) {
      if (!detailBarSortState[sectionId]) detailBarSortState[sectionId] = { key: 'winrate', dir: 'desc' };
      detailBarSortState[sectionId].dir = dir;
      detailBarPageState[sectionId] = 1;
      rebuildDetailPageBody();
    }
    function changeDetailBarPage(sectionId, page) {
      detailBarPageState[sectionId] = page;
      rebuildDetailPageBody();
    }
    function changeDetailBarMinGames(sectionId, n) {
      detailBarMinGamesState[sectionId] = parseInt(n, 10) || 1;
      detailBarPageState[sectionId] = 1;
      rebuildDetailPageBody();
    }
    function changeDetailHistoryPage(page) {
      detailHistoryPage = page;
      rebuildDetailPageBody();
    }

    function openDetailPage(type, name, skipPush = false) {
      // 現在のタブを記憶
      const activeTab = document.querySelector('.tab-content.active');
      detailPagePreviousTab = activeTab ? activeTab.id.replace('-tab', '') : 'input';

      // ソースタブのフィルター状態をキャプチャ
      const _periodEl = document.getElementById(detailPagePreviousTab + '-period-filter');
      const _tab = detailPagePreviousTab;
      const _getVal = id => { const el = document.getElementById(id); return el ? el.value : 'all'; };
      detailFilterState = {
        period: _periodEl ? _periodEl.value : 'all',
        rank: getRankFilterValue(_tab + '-rank-filter'),
        // キャラ別タブ追加フィルター
        charTabMap:      _tab === 'character' ? _getVal('character-map-filter')      : 'all',
        charTabOpponent: _tab === 'character' ? _getVal('character-opponent-filter') : 'all',
        // マップ別タブ追加フィルター
        mapTabChar:      _tab === 'map'       ? _getVal('map-char-filter')           : 'all',
        // 対戦相手別タブ追加フィルター
        oppTabMyChar:    _tab === 'opponent'  ? _getVal('my-char-filter')            : 'all',
        oppTabHunter:    _tab === 'opponent'  ? _getVal('opponent-hunter-filter')    : 'all',
        oppTabMap:       _tab === 'opponent'  ? _getVal('opponent-map-filter')       : 'all',
      };

      // フィルターバッジ更新
      const _badge = document.getElementById('detail-filter-badge');
      if (_badge) {
        const _extraParts = [];
        const _getSelText = (id) => { const el = document.getElementById(id); return el && el.value !== 'all' ? (el.options[el.selectedIndex]?.text || el.value) : null; };
        if (_tab === 'character') {
          const v1 = _getSelText('character-opponent-filter'); if (v1) _extraParts.push(v1);
          const v2 = _getSelText('character-map-filter'); if (v2) _extraParts.push(v2);
        } else if (_tab === 'map') {
          const v1 = _getSelText('map-char-filter'); if (v1) _extraParts.push(v1);
        } else if (_tab === 'opponent') {
          const v1 = _getSelText('my-char-filter'); if (v1) _extraParts.push(v1);
          const v2 = _getSelText('opponent-hunter-filter'); if (v2) _extraParts.push(v2);
          const v3 = _getSelText('opponent-map-filter'); if (v3) _extraParts.push(v3);
        }
        const _hasExtra = _extraParts.length > 0;
        const _hasFilter = detailFilterState.period !== 'all' || detailFilterState.rank !== 'all' || _hasExtra;
        if (_hasFilter) {
          const _parts = [];
          if (detailFilterState.period !== 'all') _parts.push(_periodEl ? _periodEl.options[_periodEl.selectedIndex].text : detailFilterState.period);
          if (detailFilterState.rank !== 'all') {
            const _rankSel = (() => { const w = document.getElementById(_tab + '-rank-filter'); return w && w.dataset.selected ? JSON.parse(w.dataset.selected) : ['all']; })();
            _parts.push(!_rankSel.includes('all') && _rankSel.length === 1 ? _rankSel[0] : '段位絞り込み中');
          }
          _parts.push(..._extraParts);
          _badge.textContent = _parts.join(' / ');
          _badge.classList.remove('hidden');
        } else {
          _badge.classList.add('hidden');
        }
      }

      // 現在の詳細ページ情報を記録・ページ状態リセット
      detailCurrentType = type;
      detailCurrentName = name;
      detailHistoryPage = 1;
      clearDetailPieCharts();
      Object.keys(detailBarPageState).forEach(k => delete detailBarPageState[k]);
      Object.keys(detailBarMinGamesState).forEach(k => delete detailBarMinGamesState[k]);

      // アイコン設定
      const iconEl = document.getElementById('detail-page-icon');
      const nameEl = document.getElementById('detail-page-name');
      if (nameEl) nameEl.textContent = name;
      if (iconEl) {
        if (type === 'char') iconEl.src = buildIconPath(name, currentPerspective === 'survivor' ? 'survivor' : 'hunter');
        else if (type === 'map') iconEl.src = getMapIconPath(name);
        else if (type === 'opponent') iconEl.src = buildIconPath(name, currentPerspective === 'survivor' ? 'hunter' : 'survivor');
        iconEl.style.display = '';
      }

      // コンテンツを構築
      const body = document.getElementById('detail-page-body');
      if (body) {
        if (type === 'char') body.innerHTML = buildDetailCharContent(name);
        else if (type === 'map') body.innerHTML = buildDetailMapContent(name);
        else if (type === 'opponent') body.innerHTML = buildDetailOpponentContent(name);
        renderDetailPieCharts();
        }

      // タブコンテンツを非表示にして詳細を表示
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      const detailPage = document.getElementById('detail-page');
      if (detailPage) {
        // 閉じるアニメーション中のタイムアウトをキャンセル
        if (_detailHideTimeout) {
          clearTimeout(_detailHideTimeout);
          _detailHideTimeout = null;
        }
        detailPage.classList.remove('hidden');
        detailPage.scrollTop = 0;
        requestAnimationFrame(() => detailPage.classList.add('visible'));
      }
      window.scrollTo(0, 0);

      if (!skipPush) {
        history.pushState({ detail: true, type, name }, '',
          '?detail=' + encodeURIComponent(type) + '&name=' + encodeURIComponent(name));
      }
    }

    function closeDetailPage(skipPush = false) {
      const detailPage = document.getElementById('detail-page');
      if (detailPage) {
        detailPage.classList.remove('visible');
        if (_detailHideTimeout) clearTimeout(_detailHideTimeout);
        _detailHideTimeout = setTimeout(() => {
          detailPage.classList.add('hidden');
          _detailHideTimeout = null;
        }, 180);
      }

      // タブコンテンツ復元
      const tabEl = document.getElementById(`${detailPagePreviousTab}-tab`);
      if (tabEl) tabEl.classList.add('active');

      // .main-tab ボタンの active 同期（デスクトップ用）
      document.querySelectorAll('.main-tab').forEach(btn => btn.classList.remove('active'));
      const mainTabBtn = document.querySelector(`.main-tab[data-tab="${detailPagePreviousTab}"]`);
      if (mainTabBtn) mainTabBtn.classList.add('active');

      // ボトムナビ同期（モバイル用）
      const navOrder = ['input', 'overall', 'character', 'map', 'opponent'];
      if (navOrder.includes(detailPagePreviousTab)) {
        document.querySelectorAll('.bottom-nav-item').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.nav === detailPagePreviousTab);
        });
        const idx = navOrder.indexOf(detailPagePreviousTab);
        const pill = document.getElementById('bottom-nav-pill');
        if (pill) pill.style.transform = `translateX(${idx * 100}%)`;
      }

      window.scrollTo(0, 0);

      if (!skipPush) {
        const url = location.pathname;
        history.pushState(null, '', url);
      }
    }

    function buildDetailCharContent(charName) {
      let _allFiltered = filterByPeriod(getFilteredMatches(detailFilterState.rank), detailFilterState.period);
      if (detailFilterState.charTabMap !== 'all') {
        _allFiltered = _allFiltered.filter(m => m.map === detailFilterState.charTabMap);
      }
      if (detailFilterState.charTabOpponent !== 'all') {
        if (currentPerspective === 'hunter') {
          _allFiltered = _allFiltered.filter(m => m.opponentSurvivors && m.opponentSurvivors.includes(detailFilterState.charTabOpponent));
        } else {
          _allFiltered = _allFiltered.filter(m => m.opponentHunter === detailFilterState.charTabOpponent);
        }
      }
      const perspectiveMatches = _allFiltered.filter(m => m.myCharacter === charName);
      if (perspectiveMatches.length === 0) return buildEmptyState();

      const stats = calculateWinrate(perspectiveMatches, currentPerspective);
      const avgEscape = calculateAverageEscapeCount(perspectiveMatches, currentPerspective);
      const avgText = currentPerspective === 'survivor' ? `平均脱出${avgEscape}人` : `平均脱落${(4 - parseFloat(avgEscape)).toFixed(1)}人`;

      const pickRateAll = _allFiltered.length;
      const pickRate = pickRateAll > 0 ? (perspectiveMatches.length / pickRateAll * 100).toFixed(1) : '0.0';

      let html = `
        <div class="detail-section">
          <div class="detail-stat-card">
            <div class="detail-stat-winrate">${stats.winrate}%</div>
            <div class="detail-stat-label">勝率</div>
            <div class="detail-stat-record">${stats.wins}勝 ${stats.losses}敗 ${stats.draws}分</div>
            <div class="detail-stat-sub">${perspectiveMatches.length}試合 / Pick率 ${pickRate}%</div>
            <div class="detail-stat-sub">${avgText}</div>
          </div>
        </div>`;

      // 特質別成績（ハンター視点のみ）
      if (currentPerspective === 'hunter') {
        const traitMatches = perspectiveMatches.filter(m => m.trait);
        if (traitMatches.length > 0) {
          html += buildTraitSection(traitMatches);
        }
      }

      // マップ別成績
      const traitExpandFn = (currentPerspective === 'hunter' && perspectiveMatches.some(m => m.trait))
        ? (groupKey, groupMatches) => {
            const traits = {};
            groupMatches.forEach(m => {
              if (!m.trait) return;
              traits[m.trait] = traits[m.trait] || [];
              traits[m.trait].push(m);
            });
            if (Object.keys(traits).length < 2) return '';
            return Object.entries(traits)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([tName, ms]) => {
                const ts = calculateWinrate(ms, 'hunter');
                return `<div class="bar-trait-expand-row">
                  <img class="bar-trait-expand-icon" src="${buildTraitIconPath(tName)}" alt="${escapeHTML(tName)}" onerror="this.style.display='none'">
                  <span class="bar-trait-expand-name">${escapeHTML(tName)}</span>
                  <span class="bar-trait-expand-count">${ms.length}試合</span>
                  <span class="bar-trait-expand-record">${ts.wins}勝${ts.losses}敗${ts.draws}分</span>
                  <span class="bar-trait-expand-wr">${ts.winrate}%</span>
                </div>`;
              }).join('');
          }
        : null;
      html += buildDetailBarSection('マップ別成績', perspectiveMatches, m => m.map, 'map', 'dbs-char-map', true, traitExpandFn);

      // 対戦相手別成績
      if (currentPerspective === 'survivor') {
        html += buildDetailBarSection('対戦相手ハンター別', perspectiveMatches, m => m.opponentHunter, 'opponent-hunter', 'dbs-char-opp-hunter');
      } else {
        // ハンター視点では相手サバイバー（各サバイバー個別）
        const survivorMatches = {};
        perspectiveMatches.forEach(m => {
          (m.opponentSurvivors || []).forEach(s => {
            if (!s) return;
            if (!survivorMatches[s]) survivorMatches[s] = [];
            survivorMatches[s].push(m);
          });
        });
        html += buildDetailBarSectionFromStats('対戦相手サバイバー別', survivorMatches, 'survivor', 'dbs-char-opp-survivor');
      }

      // 最近の試合履歴
      html += buildDetailHistory(perspectiveMatches);
      return html;
    }

    function buildDetailMapContent(mapName) {
      let _allFiltered = filterByPeriod(getFilteredMatches(detailFilterState.rank), detailFilterState.period);
      if (detailFilterState.mapTabChar !== 'all') {
        _allFiltered = _allFiltered.filter(m => m.myCharacter === detailFilterState.mapTabChar);
      }
      const perspectiveMatches = _allFiltered.filter(m => m.map === mapName);
      if (perspectiveMatches.length === 0) return buildEmptyState();

      const stats = calculateWinrate(perspectiveMatches, currentPerspective);
      const totalMatches = _allFiltered.length;
      const pickRate = totalMatches > 0 ? (perspectiveMatches.length / totalMatches * 100).toFixed(1) : '0.0';

      let html = `
        <div class="detail-section">
          <div class="detail-stat-card">
            <div class="detail-stat-winrate">${stats.winrate}%</div>
            <div class="detail-stat-label">勝率</div>
            <div class="detail-stat-record">${stats.wins}勝 ${stats.losses}敗 ${stats.draws}分</div>
            <div class="detail-stat-sub">${perspectiveMatches.length}試合 / 登場率 ${pickRate}%</div>
          </div>
        </div>`;

      html += buildDetailBarSection('自キャラ別成績', perspectiveMatches, m => m.myCharacter, 'char', 'dbs-map-char', true);

      if (currentPerspective === 'survivor') {
        html += buildDetailBarSection('対戦相手ハンター別', perspectiveMatches, m => m.opponentHunter, 'opponent-hunter', 'dbs-map-opp-hunter');
      } else {
        const survivorMatches = {};
        perspectiveMatches.forEach(m => {
          (m.opponentSurvivors || []).forEach(s => {
            if (!s) return;
            if (!survivorMatches[s]) survivorMatches[s] = [];
            survivorMatches[s].push(m);
          });
        });
        html += buildDetailBarSectionFromStats('対戦相手サバイバー別', survivorMatches, 'survivor', 'dbs-map-opp-survivor', 'no-other');
      }

      html += buildDetailHistory(perspectiveMatches);
      return html;
    }

    function buildDetailOpponentContent(oppName) {
      let _allFiltered = filterByPeriod(getFilteredMatches(detailFilterState.rank), detailFilterState.period);
      if (detailFilterState.oppTabMyChar !== 'all') {
        _allFiltered = _allFiltered.filter(m => m.myCharacter === detailFilterState.oppTabMyChar);
      }
      if (currentPerspective === 'survivor' && detailFilterState.oppTabHunter !== 'all') {
        _allFiltered = _allFiltered.filter(m => m.opponentHunter === detailFilterState.oppTabHunter);
      }
      if (detailFilterState.oppTabMap !== 'all') {
        _allFiltered = _allFiltered.filter(m => m.map === detailFilterState.oppTabMap);
      }
      let perspectiveMatches;
      if (currentPerspective === 'survivor') {
        perspectiveMatches = _allFiltered.filter(m => m.opponentHunter === oppName);
      } else {
        perspectiveMatches = _allFiltered.filter(m => m.opponentSurvivors && m.opponentSurvivors.includes(oppName));
      }
      if (perspectiveMatches.length === 0) return buildEmptyState();

      const stats = calculateWinrate(perspectiveMatches, currentPerspective);
      const totalMatches = _allFiltered.length;
      const pickRate = totalMatches > 0 ? (perspectiveMatches.length / totalMatches * 100).toFixed(1) : '0.0';

      let html = `
        <div class="detail-section">
          <div class="detail-stat-card">
            <div class="detail-stat-winrate">${stats.winrate}%</div>
            <div class="detail-stat-label">勝率</div>
            <div class="detail-stat-record">${stats.wins}勝 ${stats.losses}敗 ${stats.draws}分</div>
            <div class="detail-stat-sub">${perspectiveMatches.length}試合 / 対戦率 ${pickRate}%</div>
          </div>
        </div>`;

      html += buildDetailBarSection('マップ別成績', perspectiveMatches, m => m.map, 'map', 'dbs-opp-map', true);
      html += buildDetailBarSection('自キャラ別成績', perspectiveMatches, m => m.myCharacter, 'char', 'dbs-opp-char');
      if (currentPerspective === 'survivor') {
        html += buildBanDonutSection(perspectiveMatches);
      }
      html += buildDetailHistory(perspectiveMatches);
      return html;
    }

    // BAN棒グラフ（サバイバー視点・ハンター詳細）
    const BAN_SECTION_ID = 'dbs-opp-ban';
    let _banBarCache = null;  // { data, banTotal }

    function buildBanDonutSection(matches) {
      const banMatches = matches.filter(m => m.bannedCharacters && m.bannedCharacters.length > 0);
      const banTotal = banMatches.length;
      const banCounts = {};
      banMatches.forEach(m => {
        m.bannedCharacters.forEach(bc => {
          if (bc) banCounts[bc] = (banCounts[bc] || 0) + 1;
        });
      });

      const sorted = Object.entries(banCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) {
        return `<div class="detail-section"><div class="detail-section-title">BANが多いキャラ</div><p class="no-data-text">BANデータがありません</p></div>`;
      }

      _banBarCache = { data: sorted, banTotal };
      return renderBanBarSection();
    }

    function renderBanBarSection() {
      if (!_banBarCache) return '';
      const { data, banTotal } = _banBarCache;
      const state = detailBarSortState[BAN_SECTION_ID] || { key: 'games', dir: 'desc' };
      const PAGE_SIZE = 10;
      const currentPage = detailBarPageState[BAN_SECTION_ID] || 1;

      const sorted = state.dir === 'asc' ? [...data].reverse() : [...data];
      const totalItems = sorted.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      const page = Math.max(1, Math.min(currentPage, totalPages));
      const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      const descActive = state.dir === 'desc' ? ' active' : '';
      const ascActive = state.dir === 'asc' ? ' active' : '';
      const sid = BAN_SECTION_ID;

      const rowsHtml = pageItems.map(([char, count]) => {
        const pct = banTotal > 0 ? (count / banTotal * 100).toFixed(1) : '0';
        const iconHtml = `<img class="bar-icon" src="${buildIconPath(char, 'survivor')}" alt="" onerror="this.style.display='none'">`;
        return `<div class="bar-row">
            <div class="bar-label-wrapper">
              ${iconHtml}
              <div class="bar-label-text">
                <div class="bar-label">${escapeHTML(char)}</div>
                <div class="bar-sublabel">${count}回 / ${banTotal}試合</div>
              </div>
            </div>
            <div class="bar-wrapper">${renderBarHTML(pct)}</div>
          </div>`;
      }).join('');

      let html = `<div class="detail-section">
        <div class="detail-bar-sort-row">
          <div class="detail-bar-sort-title">BANが多いキャラ
            <span class="ban-record-note">(BAN記録 ${banTotal}試合)</span>
            <span class="stats-count-badge">全${totalItems}件</span>
          </div>
          <div class="sort-control" style="margin-bottom:0">
            <button type="button" class="sort-arrow-btn${descActive}" onclick="changeBanBarDir('desc')">↓</button>
            <button type="button" class="sort-arrow-btn${ascActive}" onclick="changeBanBarDir('asc')">↑</button>
          </div>
        </div>
        <div class="bar-chart-horizontal detail-bar-card">${rowsHtml}</div>`;
      html += generatePagination(page, totalPages, `changeDetailBarPage('${sid}',`);
      html += '</div>';
      return html;
    }

    function changeBanBarDir(dir) {
      if (!detailBarSortState[BAN_SECTION_ID]) detailBarSortState[BAN_SECTION_ID] = { key: 'games', dir: 'desc' };
      detailBarSortState[BAN_SECTION_ID].dir = dir;
      detailBarPageState[BAN_SECTION_ID] = 1;
      rebuildDetailPageBody();
    }

    let traitSortOrder = 'count';
    let traitSortDir = 'desc';
    let _cachedTraitMatches = null;

    function switchTraitSort(order) {
      traitSortOrder = order;
      if (_cachedTraitMatches) rebuildDetailPageBody();
    }
    function switchTraitSortDir(dir) {
      traitSortDir = dir;
      if (_cachedTraitMatches) rebuildDetailPageBody();
    }

    function buildTraitSection(traitMatches) {
      _cachedTraitMatches = traitMatches;
      const traitStats = {};
      traitMatches.forEach(m => {
        if (!traitStats[m.trait]) traitStats[m.trait] = { wins: 0, losses: 0, draws: 0, total: 0 };
        const s = traitStats[m.trait];
        s.total++;
        if (m.result === 'hunter_win') s.wins++;
        else if (m.result === 'draw') s.draws++;
        else s.losses++;
      });

      const entries = Object.entries(traitStats);
      if (entries.length === 0) return '';

      const TRAIT_COLORS = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f97316','#ec4899'];
      const colorMap = {};
      entries.sort((a, b) => b[1].total - a[1].total).forEach(([name], i) => {
        colorMap[name] = TRAIT_COLORS[i % TRAIT_COLORS.length];
      });
      const total = traitMatches.length;
      const sectionId = 'dbs-trait';

      // Chart.js 用データ（常に試合数降順）
      const chartEntries = [...entries].sort((a, b) => b[1].total - a[1].total);
      const pieData = chartEntries.map(([name, s]) => ({
        label: name,
        total: s.total,
        pct: (s.total / total * 100).toFixed(1),
        color: colorMap[name]
      }));
      detailPieDataCache[sectionId] = { pieData, totalAll: total, noOther: false, hiddenCount: 0 };

      // テーブル用ソート
      const tableEntries = [...entries].sort((a, b) => {
        let diff;
        if (traitSortOrder === 'count') {
          diff = b[1].total - a[1].total;
        } else {
          const wrA = (a[1].wins + a[1].losses) > 0 ? a[1].wins / (a[1].wins + a[1].losses) : -1;
          const wrB = (b[1].wins + b[1].losses) > 0 ? b[1].wins / (b[1].wins + b[1].losses) : -1;
          diff = wrB - wrA;
        }
        return traitSortDir === 'asc' ? -diff : diff;
      });

      const showSort = entries.length >= 3;
      const sortBtns = showSort ? `
        <div class="sort-control">
          <button type="button" class="sort-key-btn${traitSortOrder === 'count' ? ' active' : ''}" onclick="switchTraitSort('count')">試合数</button>
          <button type="button" class="sort-key-btn${traitSortOrder === 'winrate' ? ' active' : ''}" onclick="switchTraitSort('winrate')">勝率</button>
          <div class="sort-divider"></div>
          <button type="button" class="sort-arrow-btn${traitSortDir === 'desc' ? ' active' : ''}" onclick="switchTraitSortDir('desc')">↓</button>
          <button type="button" class="sort-arrow-btn${traitSortDir === 'asc' ? ' active' : ''}" onclick="switchTraitSortDir('asc')">↑</button>
        </div>` : '';

      const tableHTML = `
        <div class="trait-table-header"><span style="width:10px;flex-shrink:0"></span><span style="width:20px;flex-shrink:0"></span><span class="trait-table-name">特質</span><span class="trait-table-record">試合数</span><span class="trait-table-wr">勝率</span></div>
        ${tableEntries.map(([name, s]) => {
          const wr = calcWinratePct(s.wins, s.losses);
          return `<div class="trait-table-row">
            <span class="map-color-dot" style="background:${colorMap[name]}"></span>
            <img class="trait-table-icon" src="${buildTraitIconPath(name)}" alt="" onerror="this.style.display='none'">
            <span class="trait-table-name">${escapeHTML(name)}</span>
            <span class="trait-table-record">${s.total}試合（${s.wins}勝${s.losses}敗${s.draws}分）</span>
            <span class="trait-table-wr">${wr}</span>
          </div>`;
        }).join('')}`;

      return `
        <div class="detail-section">
          <div class="detail-section-title">特質別成績</div>
          <div class="trait-pie-layout">
            <div class="detail-pie-canvas-wrap"><canvas id="detail-pie-${sectionId}"></canvas></div>
            <div class="trait-table-wrap">
              ${sortBtns}
              ${tableHTML}
            </div>
          </div>
        </div>`;
    }

    function buildDetailBarSection(title, matchList, keyFn, type, sectionId, showPie = false, traitExpandFn = null) {
      const groups = {};
      matchList.forEach(m => {
        const k = keyFn(m);
        if (!k) return;
        if (!groups[k]) groups[k] = [];
        groups[k].push(m);
      });
      return buildDetailBarSectionFromStats(title, groups, type, sectionId, showPie, traitExpandFn);
    }

    function buildDetailBarSectionFromStats(title, groups, type, sectionId, showPie = false, traitExpandFn = null) {
      const keys = Object.keys(groups);
      if (keys.length === 0) return '';
      // データが1件のみの場合は非表示
      if (keys.length <= 1) return '';

      // sectionIdが未指定の場合はタイトルから生成
      if (!sectionId) sectionId = 'detail-bar-' + title.replace(/\s/g, '-');

      // ソート状態・最低試合数
      const state = detailBarSortState[sectionId] || { key: 'winrate', dir: 'desc' };
      const minGames = detailBarMinGamesState[sectionId] || 1;
      const PAGE_SIZE = 10;
      const currentPage = detailBarPageState[sectionId] || 1;

      // 全キーに統計を計算
      const allItemsUnfiltered = keys.map(k => {
        const s = calculateWinrate(groups[k], currentPerspective);
        return { key: k, s };
      });
      // データが根本的に1件以下なら非表示
      if (allItemsUnfiltered.length <= 1) return '';

      // 最低試合数フィルター適用
      const allItems = allItemsUnfiltered.filter(item => item.s.totalWithDraws >= minGames);

      allItems.sort((a, b) => {
        let diff;
        if (state.key === 'games') {
          diff = a.s.totalWithDraws - b.s.totalWithDraws;
        } else {
          diff = parseFloat(a.s.winrate) - parseFloat(b.s.winrate);
        }
        return state.dir === 'asc' ? diff : -diff;
      });

      const totalItems = allItems.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      const page = Math.max(1, Math.min(currentPage, totalPages));
      const pageItems = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      // パイチャートデータのキャッシュ
      if (showPie && allItems.length > 0) {
        const MAP_COLORS = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16'];
        const OTHER_COLOR = '#9ca3af';
        const noOther = showPie === 'no-other';
        const allSorted = [...allItems].sort((a, b) => b.s.totalWithDraws - a.s.totalWithDraws);
        const totalAll = allSorted.reduce((sum, item) => sum + item.s.totalWithDraws, 0);
        const topN = noOther ? 10 : 9;
        const displayItems = allSorted.slice(0, topN);
        const otherItems   = noOther ? [] : allSorted.slice(topN);
        const displayTotal = displayItems.reduce((sum, item) => sum + item.s.totalWithDraws, 0);
        const pieTotal     = noOther ? displayTotal : totalAll;
        const pieData = displayItems.map((item, i) => ({
          label: item.key,
          total: item.s.totalWithDraws,
          pct: (item.s.totalWithDraws / pieTotal * 100).toFixed(1),
          color: MAP_COLORS[i % MAP_COLORS.length]
        }));
        if (otherItems.length > 0) {
          const otherTotal = otherItems.reduce((sum, item) => sum + item.s.totalWithDraws, 0);
          pieData.push({ label: 'その他', total: otherTotal, pct: (otherTotal / totalAll * 100).toFixed(1), color: OTHER_COLOR });
        }
        detailPieDataCache[sectionId] = { pieData, totalAll: pieTotal, noOther, hiddenCount: noOther ? allSorted.length - displayItems.length : 0 };
      }

      // ソートバーHTML
      const sid = escapeHTML(sectionId);
      const wrActive   = state.key === 'winrate' ? ' active' : '';
      const mcActive   = state.key === 'games'   ? ' active' : '';
      const descActive = state.dir === 'desc' ? ' active' : '';
      const ascActive  = state.dir === 'asc'  ? ' active' : '';
      const resetBtn   = minGames > 1
        ? `<button type="button" class="min-match-reset-btn" onclick="changeDetailBarMinGames('${sid}',1)">リセット</button>`
        : '';
      const sortBar = `<div class="detail-bar-sort-row">
        <div class="detail-bar-sort-title">
          ${escapeHTML(title)}
          <span class="stats-count-badge">全${totalItems}件</span>
        </div>
        <div class="sort-control">
          <button type="button" class="sort-key-btn${wrActive}" onclick="changeDetailBarSort('${sid}','winrate')">勝率</button>
          <button type="button" class="sort-key-btn${mcActive}" onclick="changeDetailBarSort('${sid}','games')">試合数</button>
          <div class="sort-divider"></div>
          <button type="button" class="sort-arrow-btn${descActive}" onclick="changeDetailBarSortDir('${sid}','desc')">↓</button>
          <button type="button" class="sort-arrow-btn${ascActive}" onclick="changeDetailBarSortDir('${sid}','asc')">↑</button>
        </div>
      </div>
      <div class="min-match-control" style="margin-bottom: 8px;">
        <label>最低試合数</label>
        <input type="number" class="min-match-input" min="1" max="99" value="${minGames}"
          onchange="changeDetailBarMinGames('${sid}',this.value)">
        ${resetBtn}
      </div>`;

      // フィルター後にデータなし → UIは残してメッセージ表示
      if (allItems.length === 0) {
        return `<div class="detail-section">
          ${sortBar}
          <div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">${minGames}試合以上のデータがありません</div><div class="empty-state-sub">最低試合数を下げるか、フィルターを変更してみてください</div></div>
        </div>`;
      }

      let html = `<div class="detail-section">
        ${sortBar}
        <div class="bar-chart-horizontal detail-bar-card">`;
      const hasAnyExpand = traitExpandFn && pageItems.some(({ key }) => {
        const ex = traitExpandFn(key, groups[key]);
        return ex !== '';
      });
      pageItems.forEach(({ key, s }) => {
        const expandHTML = traitExpandFn ? traitExpandFn(key, groups[key]) : '';
        const hasExpand = expandHTML !== '';
        html += `
          <div class="bar-row${hasExpand ? ' trait-expandable' : ''}" ${hasExpand ? `onclick="this.classList.toggle('expanded');this.nextElementSibling.classList.toggle('open')"` : ''}>
            <div class="bar-label-wrapper">
              ${getBarIconHTML(key, type)}
              <div class="bar-label-text">
                <div class="bar-label">${escapeHTML(key)}</div>
                <div class="bar-sublabel">${s.wins}勝${s.losses}敗${s.draws}分 (${s.totalWithDraws}試合)</div>
              </div>
            </div>
            <div class="bar-wrapper">${renderBarHTML(s.winrate)}</div>
            ${hasAnyExpand ? `<span class="bar-trait-arrow">${hasExpand ? '▶' : ''}</span>` : ''}
          </div>
          ${hasExpand ? `<div class="bar-trait-expand">${expandHTML}</div>` : ''}`;
      });
      html += '</div>';

      html += generatePagination(page, totalPages, `changeDetailBarPage('${sid}',`);

      // パイチャートプレースホルダー
      if (showPie && allItems.length > 0) {
        const cache = detailPieDataCache[sectionId];
        if (cache) {
          const PIE_DESC_MAP = {
            'map':             'マップの試合数割合（試合数順）',
            'char':            '使用キャラの試合数割合（試合数順）',
            'survivor':        '相手サバイバーの試合数割合（試合数順）',
            'opponent-hunter': '相手ハンターの試合数割合（試合数順）',
          };
          let pieDesc = PIE_DESC_MAP[type] || '試合数割合（試合数順）';
          if (cache.noOther) {
            pieDesc = '相手サバイバーの試合数割合（上位10キャラ表示）';
          }
          const legendHTML = cache.pieData.map(d => `
            <div class="map-pie-legend-item">
              <div class="map-pie-color-dot" style="background:${d.color}"></div>
              <span class="map-pie-label">${escapeHTML(d.label)}</span>
              <div class="map-pie-detail">
                <span class="map-pie-count">${d.total}試合（${d.pct}%）</span>
              </div>
            </div>`).join('');
          html += `<div class="detail-pie-wrap">
            <div class="detail-pie-desc">${pieDesc}</div>
            <div class="detail-pie-inner">
              <div class="detail-pie-canvas-wrap"><canvas id="detail-pie-${escapeHTML(sectionId)}"></canvas></div>
              <div class="detail-pie-legend map-pie-legend">${legendHTML}</div>
            </div>
          </div>`;
        }
      }

      html += '</div>';
      return html;
    }

    function renderDetailPieCharts() {
      if (typeof Chart === 'undefined') return;
      Object.keys(detailPieDataCache).forEach(sectionId => {
        const canvas = document.getElementById(`detail-pie-${sectionId}`);
        if (!canvas) return;
        const { pieData } = detailPieDataCache[sectionId];
        const isDark = document.body.classList.contains('dark-mode');

        const sliceLabelPlugin = createSliceLabelPlugin(`detailSliceLabel_${sectionId}`, { fontSize: 12, labelFn: _charLabelFn });

        const instance = new Chart(canvas.getContext('2d'), {
          type: 'doughnut',
          plugins: [sliceLabelPlugin],
          data: {
            labels: pieData.map(d => d.label),
            datasets: [{
              data: pieData.map(d => d.total),
              backgroundColor: pieData.map(d => d.color),
              borderColor: isDark ? '#222238' : '#fff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                padding: 10,
                callbacks: {
                  title: (items) => pieData[items[0].dataIndex].label,
                  label: (context) => ` ${pieData[context.dataIndex].pct}%`
                }
              }
            }
          }
        });
        detailPieCharts[sectionId] = instance;
      });
    }

    function buildDetailHistory(matchList) {
      const sorted = [...matchList]
        .sort((a, b) => {
          if (b.date !== a.date) return (b.date || '') > (a.date || '') ? 1 : -1;
          return (b.id || 0) - (a.id || 0);
        });
      if (sorted.length === 0) return '';

      const PAGE_SIZE = 10;
      const totalItems = sorted.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      const page = Math.max(1, Math.min(detailHistoryPage, totalPages));
      const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      let html = `<div class="detail-section">
        <div class="detail-history-title">
          最近の試合
          <span class="stats-count-badge">全${totalItems}件</span>
        </div>
        <div class="match-history detail-history-card">`;
      pageItems.forEach(match => {
        const isWin = (currentPerspective === 'survivor' && match.result === 'survivor_win') ||
                      (currentPerspective === 'hunter' && match.result === 'hunter_win');
        const isDraw = match.result === 'draw';
        const resultText = isWin ? '勝利' : isDraw ? '引き分け' : '敗北';
        const displayResultClass = isWin ? 'win' : isDraw ? 'draw' : 'lose';
        const escapeInfo = match.escapeCount !== undefined ? `　脱出${match.escapeCount}人` : '';

        const rankIconHTML = match.rank
          ? `<img class="match-rank-icon" src="${getRankIconPath(match.rank, match.perspective)}" alt="${escapeHTML(match.rank)}" title="${escapeHTML(match.rank)}" onerror="this.textContent=this.alt">` : '';
        let vsHTML = '';
        if (match.perspective === 'survivor') {
          const mySide  = [match.myCharacter, ...(match.teammates || [])].filter(Boolean).map(s => charIconImg(s, 'survivor')).join('');
          const oppSide = match.opponentHunter ? charIconImg(match.opponentHunter, 'hunter') : '';
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
        } else {
          const mySide  = match.myCharacter ? charIconImg(match.myCharacter, 'hunter') : '';
          const traitIcon = match.trait ? `<img class="match-trait-icon" src="${buildTraitIconPath(match.trait)}" alt="${escapeHTML(match.trait)}" title="${escapeHTML(match.trait)}" onerror="this.style.display='none'">` : '';
          const oppSide = (match.opponentSurvivors || []).map(s => charIconImg(s, 'survivor')).join('');
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}${traitIcon}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
        }

        const commentHTML = match.comment ? `<div class="match-comment">${escapeHTML(match.comment)}</div>` : '';

        html += `
          <div class="match-item">
            <div class="match-info">
              <span class="match-result ${displayResultClass}">${resultText}</span>
              <span class="match-meta">${escapeHTML(match.date || '')}　${escapeHTML(match.map || '')}${escapeHTML(escapeInfo)}</span>
              ${vsHTML}
              ${commentHTML}
            </div>
          </div>`;
      });
      html += '</div>';

      html += generatePagination(page, totalPages, 'changeDetailHistoryPage');

      html += '</div>';
      return html;
    }

    window.addEventListener('popstate', function(e) {
      if (e.state && e.state.detail) {
        openDetailPage(e.state.type, e.state.name, true);
      } else {
        const detailPage = document.getElementById('detail-page');
        if (detailPage && !detailPage.classList.contains('hidden')) {
          closeDetailPage(true);
        }
      }
    });

    window.addEventListener('DOMContentLoaded', init);

    // Service Worker登録（PWA）
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  