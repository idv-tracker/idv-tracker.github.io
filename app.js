
    // HTMLエスケープ（XSS対策）
    function escapeHTML(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    const SURVIVORS = ['幸運児', '医師', '弁護士', '泥棒', '庭師', 'マジシャン', '冒険家', '傭兵', '祭司', '空軍', '機械技師', 'オフェンス', '心眼', '調香師', 'カウボーイ', '踊り子', '占い師', '納棺師', '探鉱者', '呪術師', '野人', '曲芸師', '一等航海士', 'バーメイド', 'ポストマン', '墓守', '「囚人」', '昆虫学者', '画家', 'バッツマン', '玩具職人', '患者', '「心理学者」', '小説家', '「少女」', '泣きピエロ', '教授', '骨董商', '作曲家', '記者', '航空エンジニア', '応援団', '人形師', '火災調査員', '「レディ・ファウロ」', '「騎士」', '気象学者', '弓使い', '「脱出マスター」', '幻灯師', '闘牛士'];
    
    const HUNTERS = ['復讐者', '道化師', '断罪狩人', 'リッパー', '結魂者', '芸者', '白黒無常', '写真家', '狂眼', '黄衣の王', '夢の魔女', '泣き虫', '魔トカゲ', '血の女王', 'ガードNo.26', '「使徒」', 'ヴァイオリニスト', '彫刻師', 'アンデッド', '破輪', '漁師', '蝋人形師', '「悪夢」', '書記官', '隠者', '夜の番人', 'オペラ歌手', '「フールズ・ゴールド」', '時空の影', '「足萎えの羊」', '「フラバルー」', '雑貨商', '「ビリヤードプレイヤー」', '「女王蜂」'];
    
    const MAPS = ['軍需工場', '赤の教会', '聖心病院', '湖景村', '月の河公園', 'レオの思い出', '永眠町', '中華街', '罪の森'];
    
    const RANKS = ['1段', '2段', '3段', '4段', '5段', '6段', '7段', '最高峰'];

    // ===== アイコンパス =====
    const ICON_NAME_MAP = {
      'フールズ・ゴールド': 'フールズゴールド',
      'ガードNo.26': 'ガードNO.26',
      '闘牛士': '闘牛師',
    };
    function buildIconPath(charName, type) {
      const folder = type === 'hunter' ? 'hunters' : 'survivors';
      const prefix = type === 'hunter' ? 'hunter' : 'survivor';
      let name = charName.replace(/[「」]/g, '');
      name = ICON_NAME_MAP[name] || name;
      return `${folder}/${prefix}_${name}.PNG`;
    }
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

    // ===== ひらがな読みデータ =====
    const SURVIVOR_READINGS = {
      '幸運児': 'こううんじ',
      '医師': 'いし',
      '弁護士': 'べんごし',
      '泥棒': 'どろぼう',
      '庭師': 'にわし',
      'マジシャン': 'まじしゃん',
      '冒険家': 'ぼうけんか',
      '傭兵': 'ようへい',
      '祭司': 'さいし',
      '空軍': 'くうぐん',
      '機械技師': 'きかいぎし',
      'オフェンス': 'おふぇんす',
      '心眼': 'しんがん',
      '調香師': 'ちょうこうし',
      'カウボーイ': 'かうぼーい',
      '踊り子': 'おどりこ',
      '占い師': 'うらないし',
      '納棺師': 'のうかんし',
      '探鉱者': 'たんこうしゃ',
      '呪術師': 'じゅじゅつし',
      '野人': 'やじん',
      '曲芸師': 'きょくげいし',
      '一等航海士': 'いっとうこうかいし',
      'バーメイド': 'ばーめいど',
      'ポストマン': 'ぽすとまん',
      '墓守': 'はかもり',
      '「囚人」': 'しゅうじん',
      '昆虫学者': 'こんちゅうがくしゃ',
      '画家': 'がか',
      'バッツマン': 'ばっつまん',
      '玩具職人': 'おもちゃしょくにん',
      '患者': 'かんじゃ',
      '「心理学者」': 'しんりがくしゃ',
      '小説家': 'しょうせつか',
      '「少女」': 'しょうじょ',
      '泣きピエロ': 'なきぴえろ',
      '教授': 'きょうじゅ',
      '骨董商': 'こっとうしょう',
      '作曲家': 'さっきょくか',
      '記者': 'きしゃ',
      '航空エンジニア': 'こうくうえんじにあ',
      '応援団': 'おうえんだん',
      '人形師': 'にんぎょうし',
      '火災調査員': 'かさいちょうさいん',
      '「レディ・ファウロ」': 'れでぃふぁうろ',
      '「騎士」': 'きし',
      '気象学者': 'きしょうがくしゃ',
      '弓使い': 'ゆみつかい',
      '「脱出マスター」': 'だっしゅつますたー だつます',
      '幻灯師': 'げんとうし',
      '闘牛士': 'とうぎゅうし'
    };
    
    const HUNTER_READINGS = {
      '復讐者': 'ふくしゅうしゃ れお',
      '道化師': 'どうけし ぴえろ',
      '断罪狩人': 'だんざいかりゅうど しか',
      'リッパー': 'りっぱー',
      '結魂者': 'けっこんしゃ くも',
      '芸者': 'げいしゃ みちこ',
      '白黒無常': 'しろくろむじょう',
      '写真家': 'しゃしんか じょぜふ',
      '狂眼': 'きょうがん ばるく',
      '黄衣の王': 'おういのおう たこ はすたー',
      '夢の魔女': 'ゆめのまじょ',
      '泣き虫': 'なきむし',
      '魔トカゲ': 'まとかげ るきの',
      '血の女王': 'ちのじょおう まりー',
      'ガードNo.26': 'がーどにじゅうろく ぼんぼん',
      '「使徒」': 'しと あん',
      'ヴァイオリニスト': 'ゔぁいおりにすと あんとにお',
      '彫刻師': 'ちょうこくし がらてあ',
      'アンデッド': 'あんでっど',
      '破輪': 'はりん うぃる',
      '漁師': 'りょうし ぐれいす',
      '蝋人形師': 'ろうにんぎょうし',
      '「悪夢」': 'あくむ',
      '書記官': 'しょきかん きーがん',
      '隠者': 'いんじゃ',
      '夜の番人': 'よるのばんにん いたか',
      'オペラ歌手': 'おぺらかしゅ さんぐりあ',
      '「フールズ・ゴールド」': 'ふーるずごーるど ふるご',
      '時空の影': 'じくうのかげ あいゔぃ',
      '「足萎えの羊」': 'あしなえのひつじ',
      '「フラバルー」': 'ふらばるー',
      '雑貨商': 'ざっかしょう',
      '「ビリヤードプレイヤー」': 'びりやーどぷれいやー',
      '「女王蜂」': 'じょおうばち'
    };
    
    // カタカナ→ひらがな変換
    function katakanaToHiragana(str) {
      return str.replace(/[\u30A1-\u30F6]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) - 0x60)
      );
    }
    
    // ===== 検索付きドロップダウン =====
    class SearchableSelect {
      constructor(selectEl) {
        this.select = selectEl;
        this.value = selectEl.value;
        this.highlightIndex = -1;
        this.isOpen = false;
        this.options = []; // {value, label, reading}
        this.getExcluded = null; // () => Set<value> — 除外する選択済み値
        this.onSelected = null;  // () => void — 選択確定時にtouchend直下で呼ばれる
        this._touchHandled = false;
        this._userTyped = false;

        this._build();
        this._bindEvents();
      }
      
      _build() {
        // ラッパー
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'searchable-select-wrapper';
        this.select.parentNode.insertBefore(this.wrapper, this.select);
        this.wrapper.appendChild(this.select);
        
        // テキスト入力
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'ss-input';
        this.input.placeholder = '検索して選択...';
        this.input.autocomplete = 'off';
        this.wrapper.insertBefore(this.input, this.select);
        
        // クリアボタン
        this.clearBtn = document.createElement('button');
        this.clearBtn.type = 'button';
        this.clearBtn.className = 'ss-clear';
        this.clearBtn.innerHTML = '×';
        this.clearBtn.tabIndex = -1;
        this.wrapper.insertBefore(this.clearBtn, this.select);
        
        // ドロップダウン
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'ss-dropdown';
        this.wrapper.appendChild(this.dropdown);
        
        // 初期値を反映
        if (this.select.value) {
          this.input.value = this.select.value;
          this.input.classList.add('has-value');
          this.clearBtn.classList.add('visible');
        }
      }
      
      _bindEvents() {
        // フォーカス時にドロップダウンを開く
        this.input.addEventListener('focus', () => {
          this._userTyped = false;
          this._refreshOptions();
          this._filterAndRender('');
          this._open();
        });

        // 入力時にフィルター
        this.input.addEventListener('input', () => {
          this._userTyped = true;
          this._filterAndRender(this.input.value);
          if (!this.isOpen) this._open();
        });
        
        // キーボード操作
        this.input.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._moveHighlight(1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._moveHighlight(-1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            this._selectHighlighted();
          } else if (e.key === 'Escape') {
            this._close();
            this.input.blur();
          }
        });
        
        // クリアボタン
        this.clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.setValue('');
          this.input.focus();
        });
        
        // 外側クリックで閉じる
        document.addEventListener('click', (e) => {
          if (!this.wrapper.contains(e.target)) {
            this._close();
            // 未確定なら元に戻す
            if (this.value) {
              this.input.value = this.value;
            } else {
              this.input.value = '';
            }
          }
        });
      }
      
      _refreshOptions() {
        this.options = [];
        const opts = this.select.querySelectorAll('option');
        opts.forEach(opt => {
          if (opt.value === '') return; // placeholder skip
          const label = opt.textContent;
          const isSurvivor = SURVIVORS.includes(label);
          const reading = isSurvivor ? (SURVIVOR_READINGS[label] || '') : (HUNTER_READINGS[label] || '');
          this.options.push({ value: opt.value, label, reading });
        });
      }
      
      _filterAndRender(query) {
        const q = katakanaToHiragana(query.toLowerCase().trim());
        this.dropdown.innerHTML = '';
        this.highlightIndex = -1;
        
        const excluded = new Set(this.getExcluded ? this.getExcluded() : []);
        if (this.value) excluded.add(this.value); // 自己除外

        // 長音符（ー）を除去するヘルパー
        const removeChoon = s => s.replace(/ー/g, '');
        // スキップマッチ: patternの各文字がtextに順番に含まれるか
        const skipMatch = (text, pattern) => {
          let pi = 0;
          for (let i = 0; i < text.length && pi < pattern.length; i++) {
            if (text[i] === pattern[pi]) pi++;
          }
          return pi === pattern.length;
        };

        let filtered;
        if (!q) {
          filtered = this.options.filter(opt => !excluded.has(opt.value));
        } else {
          const qNoChoon = removeChoon(q);
          const scored = this.options
            .filter(opt => {
              if (excluded.has(opt.value)) return false;
              const label = opt.label.toLowerCase();
              const reading = opt.reading;
              return label.includes(q) || reading.includes(q) ||
                     removeChoon(label).includes(qNoChoon) || removeChoon(reading).includes(qNoChoon) ||
                     skipMatch(label, q) || skipMatch(reading, q);
            })
            .map(opt => {
              const label = opt.label.toLowerCase();
              const reading = opt.reading;
              // スコア: 0=連続一致 / 1=長音符無視一致 / 2=スキップマッチ
              let score;
              if (label.includes(q) || reading.includes(q)) {
                score = 0;
              } else if (removeChoon(label).includes(qNoChoon) || removeChoon(reading).includes(qNoChoon)) {
                score = 1;
              } else {
                score = 2;
              }
              return { opt, score };
            });

          // スコア優先、同スコート内では先頭一致を上位に
          scored.sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            const aPrefix = a.opt.label.toLowerCase().startsWith(q) || a.opt.reading.startsWith(q);
            const bPrefix = b.opt.label.toLowerCase().startsWith(q) || b.opt.reading.startsWith(q);
            if (aPrefix && !bPrefix) return -1;
            if (!aPrefix && bPrefix) return 1;
            return 0;
          });

          filtered = scored.map(({ opt }) => opt);

          // 該当なし & 3文字以上 → あいまい検索フォールバック（50%以上一致）
          if (filtered.length === 0 && q.length >= 3) {
            const fuzzyScore = (text, pattern) => {
              let pi = 0;
              for (let i = 0; i < text.length && pi < pattern.length; i++) {
                if (text[i] === pattern[pi]) pi++;
              }
              return pi / pattern.length;
            };
            const bestScore = opt => Math.max(
              fuzzyScore(opt.label.toLowerCase(), q),
              fuzzyScore(opt.reading, q),
              fuzzyScore(removeChoon(opt.label.toLowerCase()), qNoChoon),
              fuzzyScore(removeChoon(opt.reading), qNoChoon)
            );
            filtered = this.options
              .filter(opt => !excluded.has(opt.value) && bestScore(opt) >= 0.5)
              .sort((a, b) => bestScore(b) - bestScore(a));
          }
        }

        if (filtered.length === 0) {
          const noResult = document.createElement('div');
          noResult.className = 'ss-no-result';
          noResult.textContent = '該当なし';
          this.dropdown.appendChild(noResult);
          this._filteredOptions = [];
          return;
        }
        
        this._filteredOptions = filtered;
        
        filtered.forEach((opt, idx) => {
          const div = document.createElement('div');
          div.className = 'ss-option';
          div.dataset.index = idx;
          
          let html = opt.label;
          div.innerHTML = html;
          
          div.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent blur (desktop)
          });
          div.addEventListener('click', (e) => {
            e.stopPropagation();
            // touchendで処理済みの場合はスキップ（二重選択防止）
            if (this._touchHandled) { this._touchHandled = false; return; }
            this._selectOption(opt);
          });
          div.addEventListener('touchstart', (e) => {
            this._touchStartX = e.touches[0].clientX;
            this._touchStartY = e.touches[0].clientY;
          }, { passive: true });
          div.addEventListener('touchend', (e) => {
            // touchstart.preventDefault()を使わない
            // → iOSがtouchstart時点でIMEを自然に確定させる
            // → SS2にfocus()したとき IMEが初期状態でカーソルが正常表示される
            const dx = e.changedTouches[0].clientX - (this._touchStartX || 0);
            const dy = e.changedTouches[0].clientY - (this._touchStartY || 0);
            if (Math.sqrt(dx * dx + dy * dy) > 10) return; // スクロール中は選択しない
            this._touchHandled = true;
            this._selectOption(opt);
            setTimeout(() => { this._touchHandled = false; }, 50);
          }, { passive: true });
          
          this.dropdown.appendChild(div);
        });
      }
      
      _open() {
        this.isOpen = true;
        this.dropdown.classList.add('open');
        this.input.style.borderRadius = '6px 6px 0 0';
      }
      
      _close() {
        this.isOpen = false;
        this.dropdown.classList.remove('open');
        this.input.style.borderRadius = '6px';
        this.highlightIndex = -1;
      }
      
      _moveHighlight(dir) {
        if (!this._filteredOptions || this._filteredOptions.length === 0) return;
        const items = this.dropdown.querySelectorAll('.ss-option');
        if (items.length === 0) return;
        
        // 前のハイライトを除去
        if (this.highlightIndex >= 0 && this.highlightIndex < items.length) {
          items[this.highlightIndex].classList.remove('highlighted');
        }
        
        this.highlightIndex += dir;
        if (this.highlightIndex < 0) this.highlightIndex = items.length - 1;
        if (this.highlightIndex >= items.length) this.highlightIndex = 0;
        
        items[this.highlightIndex].classList.add('highlighted');
        items[this.highlightIndex].scrollIntoView({ block: 'nearest' });
      }
      
      _selectHighlighted() {
        if (this.highlightIndex >= 0 && this._filteredOptions && this.highlightIndex < this._filteredOptions.length) {
          this._selectOption(this._filteredOptions[this.highlightIndex]);
        }
      }
      
      _selectOption(opt) {
        this.setValue(opt.value);
        this._close();

        this.input.blur();
        if (this.onSelected) this.onSelected();

        this.select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // 外部から値を設定
      setValue(val) {
        this.value = val;
        this.select.value = val;
        
        if (val) {
          this.input.value = val;
          this.input.classList.add('has-value');
          this.clearBtn.classList.add('visible');
        } else {
          this.input.value = '';
          this.input.classList.remove('has-value');
          this.clearBtn.classList.remove('visible');
        }
        updatePlaceholderStyle(this.select);
      }
      
      // selectの値と同期（外部でselectが変更された場合）
      syncFromSelect() {
        const val = this.select.value;
        this.value = val;
        if (val) {
          this.input.value = val;
          this.input.classList.add('has-value');
          this.clearBtn.classList.add('visible');
        } else {
          this.input.value = '';
          this.input.classList.remove('has-value');
          this.clearBtn.classList.remove('visible');
        }
      }
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
      { id: 'opponent-survivor-1',   persistKey: 'persist-opponent-survivor-1' },
      { id: 'opponent-survivor-2',   persistKey: 'persist-opponent-survivor-2' },
      { id: 'opponent-survivor-3',   persistKey: 'persist-opponent-survivor-3' },
      { id: 'opponent-survivor-4',   persistKey: 'persist-opponent-survivor-4' },
      { id: 'hunter-map',            persistKey: 'persist-hunter-map' }
    ];
    // SearchableSelect同期対象ID
    const SS_SURVIVOR_IDS = ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3', 'opponent-hunter', 'survivor-map'];
    const SS_HUNTER_IDS  = ['my-hunter', 'opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4', 'hunter-map'];
    const SS_ALL_CHAR_IDS = [
      'my-survivor', 'teammate-1', 'teammate-2', 'teammate-3',
      'opponent-hunter', 'my-hunter',
      'opponent-survivor-1', 'opponent-survivor-2', 'opponent-survivor-3', 'opponent-survivor-4',
      'survivor-map', 'hunter-map'
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
    let matches = [];
    let editingMatchId = null;
    
    // キャラクター使用回数を記録（サバイバー/ハンター別）
    let characterUsageCount = {
      survivorUsed: {},   // サバイバーとして使った回数（サバイバー視点）
      survivorFaced: {},  // サバイバーとして対戦した回数（ハンター視点）
      hunterUsed: {},     // ハンターとして使った回数（ハンター視点）
      hunterFaced: {}     // ハンターとして対戦した回数（サバイバー視点）
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
          } else {
            // 古い構造の場合、全試合データから再計算
            characterUsageCount = {
              survivorUsed: {},
              survivorFaced: {},
              hunterUsed: {},
              hunterFaced: {}
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
                const survivors = match.opponentSurvivors;
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
            hunterFaced: {}
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
      return keys.sort((a, b) => {
        const statsA = calculateWinrate(statsMap[a], perspective);
        const statsB = calculateWinrate(statsMap[b], perspective);
        
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
    
    // 初期化
    function init() {
      // Firebase初期化
      initFirebase();

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
      
      // 対戦相手ハンターフィルターを更新
      updateOpponentHunterFilter();
      updateCharacterOpponentFilter();
      updateAllHistoryFilters();
      
      // 自キャラ別勝率のマップフィルターを更新
      updateCharacterMapFilter();
      
      // タブのスクロール監視を初期化
      initializeTabScrollIndicator();
      
      updateAllWithFilters(); // フィルターと統計を更新

      // 同期UI初期化
      updateSyncUI();
      initScrollBehavior();
      updateHeaderStats();

      // URLパラメータから詳細ページを自動オープン
      const urlParams = new URLSearchParams(location.search);
      if (urlParams.has('detail') && urlParams.has('name')) {
        openDetailPage(urlParams.get('detail'), decodeURIComponent(urlParams.get('name')), true);
      }

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
      
      // サバイバー選択時の重複チェックを追加
      ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3'].forEach(id => {
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
    
    // 試合履歴の全フィルター選択肢を更新（相手キャラ・自キャラ・マップ）
    function updateAllHistoryFilters() {
      updateHistoryOpponentFilter();
      updateHistoryCharFilter();
      const charVal = document.getElementById('history-char-filter')?.value || 'all';
      updateHistoryMapFilter(charVal);
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

    // サバイバー視点：選択済みキャラを他の選択肢から除外
    function updateSurvivorSelectOptions() {
      const mySurvivor = document.getElementById('my-survivor').value;
      const teammate1 = document.getElementById('teammate-1').value;
      const teammate2 = document.getElementById('teammate-2').value;
      const teammate3 = document.getElementById('teammate-3').value;
      
      const selected = [mySurvivor, teammate1, teammate2, teammate3].filter(v => v);
      
      // サバイバー使用回数順にソート
      const sortedSurvivors = sortCharactersByUsage(SURVIVORS, 'survivorUsed');
      
      ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3'].forEach(id => {
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
      
      // 自キャラ別勝率のマップ・対戦相手フィルターを更新（視点が変わったので）
      updateCharacterMapFilter();
      updateCharacterOpponentFilter();
      
      // 試合履歴フィルター選択肢を更新（視点が変わったので）
      updateAllHistoryFilters();
      
      // 総合勝率タブが表示されている場合は更新
      const overallTab = document.getElementById('overall-tab');
      if (overallTab && overallTab.classList.contains('active')) {
        updateOverallStatsTab();
      }
      
      updateAllWithFilters();
      updateHeaderStats();
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
      
      // 総合勝率タブに切り替えた時は総合勝率とグラフを更新
      if (tabName === 'overall') {
        updateOverallStatsTab();
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
      let match = {
        id: editingMatchId || Date.now(),
        perspective: perspective,
        timestamp: new Date().toISOString()
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
        
        if (!date || !rank || !mySurvivor || !teammate1 || !teammate2 || !teammate3 || !opponentHunter || !map || escapeCount === null) {
          alert('全ての項目を入力してください');
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
        
        if (!date || !rank || !myHunter || !opponentSurvivor1 || !opponentSurvivor2 || !opponentSurvivor3 || !opponentSurvivor4 || !map || escapeCount === null) {
          alert('全ての項目を入力してください');
          return;
        }
        
        match.date = date;
        match.rank = rank;
        match.myCharacter = myHunter;
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
          } else {
            // ハンター視点：自分の使用回数を減らす
            decrementCharacterUsage('hunterUsed', oldMatch.myCharacter);
            // 対戦相手サバイバー4人の対戦回数を減らす
            decrementCharacterUsage('survivorFaced', oldMatch.opponentSurvivors);
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
      
      // 対戦相手ハンターフィルターを更新
      updateOpponentHunterFilter();
      updateCharacterOpponentFilter();
      updateAllHistoryFilters();
      
      // 自キャラ別勝率のマップフィルターを更新
      updateCharacterMapFilter();
      
      // セレクトボックスを再構築（使用回数順に更新）
      repopulateCharacterSelects();
      
      alert('試合を記録しました！');
      updateAllWithFilters();
      
      // 総合勝率タブが表示されている場合は更新
      const overallTab = document.getElementById('overall-tab');
      if (overallTab && overallTab.classList.contains('active')) {
        updateOverallStatsTab();
      }
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
        document.querySelectorAll('#survivor-input .result-button').forEach(btn => btn.classList.remove('selected'));
        updateSurvivorSelectOptions();
        SS_SURVIVOR_IDS.forEach(syncSearchableSelect);
      } else {
        selectedEscapeCount.hunter = null;
        document.getElementById('hunter-comment').value = '';
        document.querySelectorAll('#hunter-input .result-button').forEach(btn => btn.classList.remove('selected'));
        updateHunterOpponentSelectOptions();
        SS_HUNTER_IDS.forEach(syncSearchableSelect);
      }
    }
    
    // データを保存
    function saveData() {
      localStorage.setItem('identity5_matches', JSON.stringify(matches));
      localStorage.setItem('identity5_data_modified', new Date().toISOString());
      autoSync();
    }
    
    // データを読み込み
    function loadData() {
      const saved = localStorage.getItem('identity5_matches');
      if (saved) {
        matches = JSON.parse(saved);
        
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
          if (savedValue && element) {
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
            if (element) localStorage.setItem(`persist_value_${field.id}`, element.value);
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
    
    // 全ての統計を更新
    function updateAllStats() {
      updateAllSelectStyles();
      updateOverallStatsTab();
      updateCharacterStats();
      updateMapStats();
      updateOpponentStats();
      updateMatchHistory();
      updateHeaderStats();
      ['overall', 'character', 'map', 'opponent', 'history'].forEach(id => renderFilterChips(id));
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
        container.innerHTML = '<div class="empty-state"><p>まだ試合データがありません</p></div>';
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 14px; font-weight: 600; color: #666;">${statsTitle}</div>
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
        container.innerHTML = '<div class="empty-state"><p>データがありません</p></div>';
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

      // スライス内に頭文字を描画するカスタムプラグイン
      const sliceLabelPlugin = {
        id: 'sliceLabel',
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
          ctx.font = 'bold 13px sans-serif';
          meta.data.forEach((arc, index) => {
            const value = chart.data.datasets[0].data[index];
            if (value / total < 0.05) return; // 5%未満は非表示
            const midAngle = (arc.startAngle + arc.endAngle) / 2;
            const midRadius = (arc.outerRadius + arc.innerRadius) / 2;
            const x = arc.x + midRadius * Math.cos(midAngle);
            const y = arc.y + midRadius * Math.sin(midAngle);
            ctx.fillText(chart.data.labels[index].charAt(0), x, y);
          });
          ctx.restore();
        }
      };

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

      const sliceLabelPlugin = {
        id: 'charSliceLabel',
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
          ctx.font = 'bold 13px sans-serif';
          meta.data.forEach((arc, index) => {
            const value = chart.data.datasets[0].data[index];
            if (value / total < 0.05) return;
            const midAngle = (arc.startAngle + arc.endAngle) / 2;
            const midRadius = (arc.outerRadius + arc.innerRadius) / 2;
            const x = arc.x + midRadius * Math.cos(midAngle);
            const y = arc.y + midRadius * Math.sin(midAngle);
            const label = chart.data.labels[index];
            const displayChar = label.startsWith('「') ? label.charAt(1) : label.charAt(0);
            ctx.fillText(displayChar, x, y);
          });
          ctx.restore();
        }
      };

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

      const sliceLabelPlugin = {
        id: 'resultSliceLabel',
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
          ctx.font = 'bold 13px sans-serif';
          meta.data.forEach((arc, index) => {
            const value = chart.data.datasets[0].data[index];
            if (value / total < 0.05) return;
            const midAngle = (arc.startAngle + arc.endAngle) / 2;
            const midRadius = (arc.outerRadius + arc.innerRadius) / 2;
            const x = arc.x + midRadius * Math.cos(midAngle);
            const y = arc.y + midRadius * Math.sin(midAngle);
            ctx.fillText(chart.data.labels[index].charAt(0), x, y);
          });
          ctx.restore();
        }
      };

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
        return `<div class="recent-block" style="background:${BLOCK_COLORS[key]};" title="${match.date || ''}"></div>`;
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
      const worstOpponent = opponentData[opponentData.length - 1];
      const bestMap  = mapData[0];
      const worstMap = mapData[mapData.length - 1];

      const opponentLabel = currentPerspective === 'survivor' ? '相手ハンター' : '相手サバイバー';
      const oppType = currentPerspective === 'survivor' ? 'hunter' : 'survivor';
      const oppIconBest  = `<img class="highlight-char-icon" src="${buildIconPath(bestOpponent.name, oppType)}" alt="" onerror="this.style.display='none'">`;
      const oppIconWorst = `<img class="highlight-char-icon" src="${buildIconPath(worstOpponent.name, oppType)}" alt="" onerror="this.style.display='none'">`;
      const mapIconBest  = `<img class="highlight-char-icon" src="${getMapIconPath(bestMap.name)}" alt="" onerror="this.style.display='none'">`;
      const mapIconWorst = `<img class="highlight-char-icon" src="${getMapIconPath(worstMap.name)}" alt="" onerror="this.style.display='none'">`;

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
            <div class="highlight-item highlight-worst" onclick="openDetailPage('opponent', '${escapeHTML(worstOpponent.name)}')" style="cursor:pointer">
              <div class="highlight-category">苦手${opponentLabel}</div>
              ${oppIconWorst}
              <div class="highlight-name">${escapeHTML(worstOpponent.name)}</div>
              <div class="highlight-rate">${worstOpponent.winrate.toFixed(1)}%（${worstOpponent.total}試合）</div>
            </div>
            <div class="highlight-item highlight-best" onclick="openDetailPage('map', '${escapeHTML(bestMap.name)}')" style="cursor:pointer">
              <div class="highlight-category">得意マップ</div>
              ${mapIconBest}
              <div class="highlight-name">${escapeHTML(bestMap.name)}</div>
              <div class="highlight-rate">${bestMap.winrate.toFixed(1)}%（${bestMap.total}試合）</div>
            </div>
            <div class="highlight-item highlight-worst" onclick="openDetailPage('map', '${escapeHTML(worstMap.name)}')" style="cursor:pointer">
              <div class="highlight-category">苦手マップ</div>
              ${mapIconWorst}
              <div class="highlight-name">${escapeHTML(worstMap.name)}</div>
              <div class="highlight-rate">${worstMap.winrate.toFixed(1)}%（${worstMap.total}試合）</div>
            </div>
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
        container.innerHTML = '<div class="empty-state"><p>まだ試合データがありません</p></div>';
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
      let topCardsHtml = '';
      const topCardMinChar = Math.max(5, minCharCount);
      const charsForTop = [...filteredChars]
        .filter(c => characterStats[c].length >= topCardMinChar)
        .sort((a, b) =>
          parseFloat(calculateWinrate(characterStats[b], currentPerspective).winrate) -
          parseFloat(calculateWinrate(characterStats[a], currentPerspective).winrate));
      const bestChar = charsForTop.length > 0 ? charsForTop[0] : null;
      const _worstCharRaw = charsForTop.length > 1 ? charsForTop[charsForTop.length - 1] : null;
      const worstChar = _worstCharRaw && parseFloat(calculateWinrate(characterStats[_worstCharRaw], currentPerspective).winrate) < 100 ? _worstCharRaw : null;
      if (bestChar) {
        const hasWorst = worstChar && bestChar !== worstChar;
        topCardsHtml = `<div class="top-cards-row${hasWorst ? '' : ' top-cards-single'}">
          ${buildTopCharCard(bestChar, characterStats, perspectiveMatches, 'best')}
          ${hasWorst ? buildTopCharCard(worstChar, characterStats, perspectiveMatches, 'worst') : ''}
        </div>`;
      }

      let html = topCardsHtml;

      html += generateSortButtons('character');

      html += `<div class="stats-card">
        <div class="stats-title">キャラクター別勝率（${currentPerspective === 'survivor' ? 'サバイバー' : 'ハンター'}）</div>
        <div class="bar-chart-horizontal">`;

      if (filteredChars.length === 0) {
        html += '<div class="empty-state"><p>指定した試合数以上のデータがありません</p></div>';
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
        container.innerHTML = '<div class="empty-state"><p>まだ試合データがありません</p></div>';
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
      let topMapsCardsHtml = '';
      const topCardMinMap = Math.max(5, minMapCount);
      const mapsForTop = [...filteredMaps]
        .filter(m => mapStats[m].length >= topCardMinMap)
        .sort((a, b) =>
          parseFloat(calculateWinrate(mapStats[b], currentPerspective).winrate) -
          parseFloat(calculateWinrate(mapStats[a], currentPerspective).winrate));
      const bestMap = mapsForTop.length > 0 ? mapsForTop[0] : null;
      const _worstMapRaw = mapsForTop.length > 1 ? mapsForTop[mapsForTop.length - 1] : null;
      const worstMap = _worstMapRaw && parseFloat(calculateWinrate(mapStats[_worstMapRaw], currentPerspective).winrate) < 100 ? _worstMapRaw : null;
      if (bestMap) {
        const hasWorstMap = worstMap && bestMap !== worstMap;
        topMapsCardsHtml = `<div class="top-cards-row${hasWorstMap ? '' : ' top-cards-single'}">
          ${buildTopMapCard(bestMap, mapStats, 'best')}
          ${hasWorstMap ? buildTopMapCard(worstMap, mapStats, 'worst') : ''}
        </div>`;
      }
      let html = topMapsCardsHtml;

      html += generateSortButtons('map');

      html += `<div class="stats-card">
        <div class="stats-title">マップ別勝率</div>
        <div class="bar-chart-horizontal">`;

      if (filteredMaps.length === 0) {
        html += '<div class="empty-state"><p>指定した試合数以上のデータがありません</p></div>';
      } else {
        filteredMaps.forEach(map => {
          const stats = calculateWinrate(mapStats[map], currentPerspective);
          html += `
            <div class="bar-row clickable" onclick="openDetailPage('map','${escapeHTML(map)}')">
              <div class="bar-label-wrapper">
                ${getBarIconHTML(map, 'map')}
                <div class="bar-label-text">
                  <div class="bar-label">${map}</div>
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
        container.innerHTML = '<div class="empty-state"><p>まだ試合データがありません</p></div>';
        return;
      }

      if (currentPerspective === 'survivor') {
        const hunterStats = {};
        const teammateStats = {};
        
        perspectiveMatches.forEach(match => {
          const hunter = match.opponentHunter;
          if (!hunterStats[hunter]) {
            hunterStats[hunter] = [];
          }
          hunterStats[hunter].push(match);
          
          match.teammates.forEach(teammate => {
            if (!teammateStats[teammate]) {
              teammateStats[teammate] = [];
            }
            teammateStats[teammate].push(match);
          });
        });
        
        // TOPカード（得意/苦手ハンター）— 最低5試合
        const minHunterCountForTop = Math.max(5, minMatchCounts.opponentHunter || 1);
        const huntersForTop = Object.keys(hunterStats).filter(h => hunterStats[h].length >= minHunterCountForTop);
        huntersForTop.sort((a, b) => {
          const sa = calculateWinrate(hunterStats[a], currentPerspective);
          const sb = calculateWinrate(hunterStats[b], currentPerspective);
          return sb.winrate - sa.winrate;
        });
        const bestHunter = huntersForTop.length > 0 ? huntersForTop[0] : null;
        const _worstHunterRaw = huntersForTop.length > 1 ? huntersForTop[huntersForTop.length - 1] : null;
        const worstHunter = _worstHunterRaw && parseFloat(calculateWinrate(hunterStats[_worstHunterRaw], currentPerspective).winrate) < 100 ? _worstHunterRaw : null;
        let topHunterCardsHtml = '';
        if (bestHunter) {
          const hasWorstHunter = !!worstHunter;
          topHunterCardsHtml = `<div class="top-cards-row${hasWorstHunter ? '' : ' top-cards-single'}">
            ${buildTopOpponentCard(bestHunter, hunterStats, perspectiveMatches, 'best')}
            ${hasWorstHunter ? buildTopOpponentCard(worstHunter, hunterStats, perspectiveMatches, 'worst') : ''}
          </div>`;
        }

        let html = topHunterCardsHtml;

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
          html += '<div class="empty-state"><p>指定した試合数以上のデータがありません</p></div>';
        } else {
          filteredHunters.slice(hunterStartIndex, hunterEndIndex).forEach(hunter => {
            const stats = calculateWinrate(hunterStats[hunter], currentPerspective);
            html += `
              <div class="bar-row clickable" onclick="openDetailPage('opponent','${escapeHTML(hunter)}')">
                <div class="bar-label-wrapper">
                  ${getBarIconHTML(hunter, 'opponent-hunter')}
                  <div class="bar-label-text">
                    <div class="bar-label">${hunter}</div>
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

        // ===== 味方編成別勝率（折りたたみ） =====
        const teammateToggleIcon = teammateStatsExpanded ? '▲' : '▼';
        const teammateToggleLabel = teammateStatsExpanded ? '味方編成別勝率を閉じる' : '味方編成別勝率を見る';
        html += `<button class="pair-toggle-btn" onclick="toggleTeammateStats()">
          <span class="pair-toggle-icon">${teammateToggleIcon}</span>${teammateToggleLabel}
        </button>`;

        if (teammateStatsExpanded) {
          html += generateSortButtons('teammate');
          html += `<div class="stats-card">
            <div class="stats-title">味方編成別勝率</div>
            <div class="bar-chart-horizontal">`;

          const sortedTeammates = sortByState(Object.keys(teammateStats), teammateStats, currentPerspective, sortState.teammate);
          const minTeammateCount = minMatchCounts.teammate || 1;
          const filteredTeammates = sortedTeammates.filter(t => teammateStats[t].length >= minTeammateCount);
          const totalTeammatePages = Math.ceil(filteredTeammates.length / itemsPerPage);
          const teammateStartIndex = (currentPages.teammateStats - 1) * itemsPerPage;
          const teammateEndIndex = Math.min(teammateStartIndex + itemsPerPage, filteredTeammates.length);

          if (filteredTeammates.length === 0) {
            html += '<div class="empty-state"><p>指定した試合数以上のデータがありません</p></div>';
          } else {
            filteredTeammates.slice(teammateStartIndex, teammateEndIndex).forEach(teammate => {
              const stats = calculateWinrate(teammateStats[teammate], currentPerspective);
              html += `
                <div class="bar-row">
                  <div class="bar-label-wrapper">
                    ${getBarIconHTML(teammate, 'survivor')}
                    <div class="bar-label-text">
                      <div class="bar-label">${teammate}</div>
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

        container.innerHTML = html;
        
      } else {
        const survivorStats = {};
        const pairStats = {};

        perspectiveMatches.forEach(match => {
          const survivors = match.opponentSurvivors;

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
        const minSurvivorCountForTop = Math.max(5, minMatchCounts.opponent || 1);
        const survivorsForTop = Object.keys(survivorStats).filter(s => survivorStats[s].length >= minSurvivorCountForTop);
        survivorsForTop.sort((a, b) => {
          const sa = calculateWinrate(survivorStats[a], currentPerspective);
          const sb = calculateWinrate(survivorStats[b], currentPerspective);
          return sb.winrate - sa.winrate;
        });
        const bestSurvivor = survivorsForTop.length > 0 ? survivorsForTop[0] : null;
        const _worstSurvivorRaw = survivorsForTop.length > 1 ? survivorsForTop[survivorsForTop.length - 1] : null;
        const worstSurvivor = _worstSurvivorRaw && parseFloat(calculateWinrate(survivorStats[_worstSurvivorRaw], currentPerspective).winrate) < 100 ? _worstSurvivorRaw : null;
        let topSurvivorCardsHtml = '';
        if (bestSurvivor) {
          const hasWorstSurvivor = !!worstSurvivor;
          topSurvivorCardsHtml = `<div class="top-cards-row${hasWorstSurvivor ? '' : ' top-cards-single'}">
            ${buildTopOpponentCard(bestSurvivor, survivorStats, perspectiveMatches, 'best')}
            ${hasWorstSurvivor ? buildTopOpponentCard(worstSurvivor, survivorStats, perspectiveMatches, 'worst') : ''}
          </div>`;
        }

        let html = topSurvivorCardsHtml;

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
          html += '<div class="empty-state"><p>指定した試合数以上のデータがありません</p></div>';
        } else {
          filteredSurvivors.slice(survivorStartIndex, survivorEndIndex).forEach(survivor => {
            const stats = calculateWinrate(survivorStats[survivor], currentPerspective);
            html += `
              <div class="bar-row clickable" onclick="openDetailPage('opponent','${escapeHTML(survivor)}')">
                <div class="bar-label-wrapper">
                  ${getBarIconHTML(survivor, 'survivor')}
                  <div class="bar-label-text">
                    <div class="bar-label">${survivor}</div>
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
        perspectiveMatches.forEach(m => m.opponentSurvivors.forEach(s => { if (s) usedSurvivorsSet.add(s); }));
        const pairSelectSurvivors = SURVIVORS.filter(s => usedSurvivorsSet.has(s));

        const makeOptions = (excludeChar) =>
          `<option value="">指定なし</option>` +
          pairSelectSurvivors
            .filter(s => s !== excludeChar)
            .map(s => `<option value="${escapeHTML(s)}"${pairFilterChar1 === s || pairFilterChar2 === s ? ' selected' : ''}>${escapeHTML(s)}</option>`)
            .join('');

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
            html += '<div class="empty-state"><p>指定した試合数以上のデータがありません</p></div>';
          } else {
            finalPairs.slice(pairStartIndex, pairEndIndex).forEach(pair => {
              const stats = calculateWinrate(filteredPairStats[pair], currentPerspective);
              html += `
                <div class="bar-row">
                  <div class="bar-label-wrapper">
                    ${getBarIconHTML(pair, 'pair-survivor')}
                    <div class="bar-label-text">
                      <div class="bar-label">${pair}</div>
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

        container.innerHTML = html;
      }
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
      
      perspectiveMatches = perspectiveMatches.reverse();
      
      if (perspectiveMatches.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>まだ試合データがありません</p></div>';
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
          ? `<img class="match-rank-icon" src="${getRankIconPath(match.rank, match.perspective)}" alt="${escapeHTML(match.rank)}" title="${escapeHTML(match.rank)}" onerror="this.outerHTML='${escapeHTML(match.rank)}'">` : '';
        let vsHTML = '';
        if (match.perspective === 'survivor') {
          const mySide  = [match.myCharacter, ...(match.teammates || [])].filter(Boolean).map(s => charIconImg(s, 'survivor')).join('');
          const oppSide = match.opponentHunter ? charIconImg(match.opponentHunter, 'hunter') : '';
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
        } else {
          const mySide  = match.myCharacter ? charIconImg(match.myCharacter, 'hunter') : '';
          const oppSide = (match.opponentSurvivors || []).map(s => charIconImg(s, 'survivor')).join('');
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
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
        document.getElementById('opponent-survivor-1').value = match.opponentSurvivors[0];
        document.getElementById('opponent-survivor-2').value = match.opponentSurvivors[1];
        document.getElementById('opponent-survivor-3').value = match.opponentSurvivors[2];
        document.getElementById('opponent-survivor-4').value = match.opponentSurvivors[3];
        document.getElementById('hunter-map').value = match.map;
        document.getElementById('hunter-comment').value = match.comment || '';
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
        } else {
          // ハンター視点：自分の使用回数を減らす
          decrementCharacterUsage('hunterUsed', match.myCharacter);
          // 対戦相手サバイバー4人の対戦回数を減らす
          decrementCharacterUsage('survivorFaced', match.opponentSurvivors);
        }
      }
      
      matches = matches.filter(m => m.id !== id);
      saveData();
      
      // 対戦相手ハンターフィルターを更新
      updateOpponentHunterFilter();
      updateCharacterOpponentFilter();
      updateAllHistoryFilters();
      
      // 自キャラ別勝率のマップフィルターを更新
      updateCharacterMapFilter();
      
      // セレクトボックスを再構築（使用回数順に更新）
      repopulateCharacterSelects();
      updateAllWithFilters();
      const overallTab = document.getElementById('overall-tab');
      if (overallTab && overallTab.classList.contains('active')) {
        updateOverallStatsTab();
      }
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
      characterUsageCount = { survivorUsed: {}, survivorFaced: {}, hunterUsed: {}, hunterFaced: {} };
      saveCharacterUsageCount();
      
      // 対戦相手ハンターフィルターを更新
      updateOpponentHunterFilter();
      updateCharacterOpponentFilter();
      updateAllHistoryFilters();
      
      // 自キャラ別勝率のマップフィルターを更新
      updateCharacterMapFilter();
      
      // セレクトボックスを再構築（使用回数順に更新）
      repopulateCharacterSelects();
      updateAllWithFilters();
      const overallTab = document.getElementById('overall-tab');
      if (overallTab && overallTab.classList.contains('active')) {
        updateOverallStatsTab();
      }
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
        alert('データをクリップボードにコピーしました！\n\nLINEやメモ帳に貼り付けて保存してください。');
      } catch (error) {
        console.error('Export to clipboard failed:', error);
        alert('クリップボードへのコピーに失敗しました。\n\nファイルダウンロードをお試しください。');
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
        
        alert('バックアップファイルをダウンロードしました！');
      } catch (error) {
        console.error('Export to file failed:', error);
        alert('ファイルのダウンロードに失敗しました。');
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
        alert(`データの復元に失敗しました\n\n${validation.error}`);
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
        characterUsageCount = data.characterUsageCount || { survivorUsed: {}, survivorFaced: {}, hunterUsed: {}, hunterFaced: {} };
        
        // localStorageに保存
        saveData();
        saveCharacterUsageCount();
        
        // UIを更新
        updateDataInfo();
        repopulateCharacterSelects();
        updateOpponentHunterFilter();
        updateCharacterOpponentFilter();
        updateAllHistoryFilters();
        updateCharacterMapFilter();
        updateAllWithFilters();
        const overallTab = document.getElementById('overall-tab');
        if (overallTab && overallTab.classList.contains('active')) {
          updateOverallStatsTab();
        }

        alert(`データを復元しました！\n\n${newMatchCount}試合のデータを読み込みました。`);
        return true;
      } catch (error) {
        console.error('Import failed:', error);
        alert(`データの復元中にエラーが発生しました\n\n${error.message}`);
        return false;
      }
    }
    
    // テキストからインポート
    function importFromText() {
      const textarea = document.getElementById('import-textarea');
      const text = textarea.value.trim();
      
      if (!text) {
        alert('バックアップデータを貼り付けてください');
        return;
      }
      
      try {
        const data = JSON.parse(text);
        if (importData(data)) {
          textarea.value = '';
        }
      } catch (error) {
        console.error('JSON parse error:', error);
        alert('データ形式が正しくありません\n\n正しいバックアップデータを貼り付けてください。');
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
          alert('ファイルの読み込みに失敗しました\n\nファイル形式が正しくありません。');
        }
        
        // ファイル選択をリセット
        event.target.value = '';
      };
      
      reader.onerror = function() {
        alert('ファイルの読み込みに失敗しました');
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
      // ガイドバナーが表示中は非表示
      const guideEl = document.getElementById('guide-banner');
      const guideVisible = guideEl && !guideEl.classList.contains('hidden');
      if (isStandalone || dismissed || guideVisible) {
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
    
    // ダークモードはDOM準備前に即時適用（ちらつき防止）
    (function() {
      if (localStorage.getItem('identity5_dark_mode') === 'on') {
        document.body.classList.add('dark-mode');
      }
    })();
    
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
      const nextId = order[idx + 1];
      const ss = searchableSelects[nextId];
      if (ss) {
        const prevSS = searchableSelects[currentId];
        const userTyped = prevSS && prevSS._userTyped;
        ss.input.value = '';
        if (_isTouchDevice && (!prevSS || userTyped)) {
          // 前フィールドで検索した場合: キーボードを開かずドロップダウンだけ表示
          // setTimeout で document の click ハンドラが先に処理されてから開く
          setTimeout(() => {
            ss._refreshOptions();
            ss._filterAndRender('');
            ss._open();
            ss.dropdown.scrollIntoView({ block: 'nearest' });
          }, 0);
        } else {
          // setTimeout で document の click ハンドラ（閉じる処理）より後に focus を呼ぶ
          setTimeout(() => ss.input.focus(), 0);
        }
      } else {
        const el = document.getElementById(nextId);
        if (el) el.focus();
      }
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
        ss.onSelected = () => focusNextField(perspective, id);
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
        ['my-survivor', 'teammate-1', 'teammate-2', 'teammate-3'],
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

    const FIREBASE_CONFIG = {
      apiKey: "AIzaSyD11HYRuGLn0N4_eFhXfTK5R-3QyJ4RsSo",
      authDomain: "idvtracker.firebaseapp.com",
      projectId: "idvtracker",
      storageBucket: "idvtracker.firebasestorage.app",
      messagingSenderId: "1027492627968",
      appId: "1:1027492627968:web:ad567e2e79b3a1574bbae5"
    };

    let db = null;

    function initFirebase() {
      try {
        if (typeof firebase === 'undefined') return;
        firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.firestore();
      } catch (e) {
        console.warn('Firebase init failed:', e);
      }
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
          <button type="button" onclick="startNewSync()"
            style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;">
            新しく同期を始める
          </button>
          <a href="sync-guide.html"
            style="display:block;text-align:center;font-size:13px;color:#6b7280;text-decoration:none;margin-bottom:15px;">
            同期の設定方法を見る ›
          </a>
          <div class="sync-divider" style="border-top:1px solid #e5e7eb;padding-top:15px;">
            <p style="font-size:13px;color:#374151;margin-bottom:8px;font-weight:600;">他のデバイスの同期コードで接続する</p>
            <input type="text" id="sync-code-input" class="sync-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;font-family:monospace;margin-bottom:8px;box-sizing:border-box;background:white;color:#374151;">
            <button type="button" onclick="linkWithInputCode()"
              style="width:100%;padding:10px;background:#8b5cf6;color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">
              接続する
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div style="margin-bottom:15px;">
            <p class="sync-sublabel" style="font-size:12px;color:#6b7280;margin-bottom:5px;font-weight:600;">同期コード</p>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="text" value="${syncCode}" readonly class="sync-code-input"
                style="flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:11px;font-family:monospace;background:#f9fafb;color:#6b7280;">
              <button type="button" onclick="copySyncCode()" class="sync-btn-secondary"
                style="padding:8px 12px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;font-size:13px;cursor:pointer;white-space:nowrap;font-weight:600;">
                コピー
              </button>
            </div>
            <p class="sync-sublabel" style="font-size:12px;color:#9ca3af;margin-top:5px;">最終同期: ${lastSyncedText}</p>
          </div>
          <button type="button" onclick="syncData()" id="sync-now-btn"
            style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;">
            今すぐ同期
          </button>
          <div style="display:flex;gap:8px;">
            <button type="button" onclick="unlinkSync()" class="sync-btn-secondary"
              style="flex:1;padding:10px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">
              同期を解除
            </button>
            <button type="button" onclick="deleteCloudData()" class="sync-btn-danger"
              style="flex:1;padding:10px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">
              クラウドを削除
            </button>
          </div>
        `;
      }
    }

    // 新しく同期を開始（新規コード生成）
    async function startNewSync() {
      if (!db) { alert('同期機能を現在利用できません。'); return; }
      const syncCode = generateUUID();
      localStorage.setItem('identity5_sync_code', syncCode);
      if (!localStorage.getItem('identity5_data_modified')) {
        localStorage.setItem('identity5_data_modified', new Date().toISOString());
      }
      updateSyncUI();
      try {
        await uploadToCloud();
        updateSyncUI();
      } catch (e) {
        console.warn('Initial upload failed:', e);
      }
    }

    // 既存コードで別デバイスと接続
    async function linkWithInputCode() {
      if (!db) { alert('同期機能を現在利用できません。'); return; }
      const input = document.getElementById('sync-code-input');
      if (!input) return;
      const code = input.value.trim().toLowerCase();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      if (!uuidRegex.test(code)) {
        alert('同期コードの形式が正しくありません。\nコードを確認してください。');
        return;
      }
      try {
        const docSnap = await db.collection('idv_tracker').doc(code).get();
        if (!docSnap.exists) {
          alert('このコードのデータが見つかりません。\nコードを確認してください。');
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
        alert('接続しました！');
      } catch (e) {
        alert('接続に失敗しました。通信環境を確認してください。');
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
      characterUsageCount = cloudData.characterUsageCount || { survivorUsed: {}, survivorFaced: {}, hunterUsed: {}, hunterFaced: {} };
      localStorage.setItem('identity5_matches', JSON.stringify(matches));
      localStorage.setItem('identity5_data_modified', cloudData.lastModified || new Date().toISOString());
      saveCharacterUsageCount();
      repopulateCharacterSelects();
      updateOpponentHunterFilter();
      updateCharacterOpponentFilter();
      updateAllHistoryFilters();
      updateCharacterMapFilter();
      updateAllWithFilters();
      const overallTab = document.getElementById('overall-tab');
      if (overallTab && overallTab.classList.contains('active')) updateOverallStatsTab();
      localStorage.setItem('identity5_last_synced', new Date().toISOString());
    }

    // 手動同期（タイムスタンプ比較して適切な方向に同期）
    async function syncData() {
      if (!db) { alert('同期機能を現在利用できません。'); return; }
      const syncCode = getSyncCode();
      if (!syncCode) return;
      const btn = document.getElementById('sync-now-btn');
      if (btn) { btn.textContent = '同期中...'; btn.disabled = true; }
      try {
        const docSnap = await db.collection('idv_tracker').doc(syncCode).get();
        if (!docSnap.exists) {
          await uploadToCloud();
          updateSyncUI();
          alert('クラウドに保存しました');
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
            alert('クラウドのデータを読み込みました');
          }
        } else if (localTime > cloudTime) {
          await uploadToCloud();
          alert('クラウドに同期しました');
        } else {
          alert('既に最新の状態です');
        }
      } catch (e) {
        alert('同期に失敗しました。通信環境を確認してください。');
        console.error('Sync error:', e);
      } finally {
        updateSyncUI();
      }
    }

    // 自動同期（saveData呼び出し時、サイレント実行）
    function autoSync() {
      if (!db || !getSyncCode()) return;
      uploadToCloud()
        .then(() => updateSyncUI())
        .catch(() => {});
    }

    // 同期コードをクリップボードにコピー
    function copySyncCode() {
      const syncCode = getSyncCode();
      if (!syncCode) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(syncCode)
          .then(() => alert('同期コードをコピーしました'))
          .catch(() => _fallbackCopy(syncCode));
      } else {
        _fallbackCopy(syncCode);
      }
    }

    function _fallbackCopy(syncCode) {
      const input = document.querySelector('#sync-ui input[readonly]');
      if (input) {
        input.select();
        try { document.execCommand('copy'); alert('同期コードをコピーしました'); }
        catch (e) { alert('コピーできませんでした。\n手動で選択してコピーしてください。'); }
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
        alert('クラウドのデータを削除しました');
      } catch (e) {
        alert('削除に失敗しました。');
        console.error('Delete error:', e);
      }
    }

    // ===== 繝｢繝舌う繝ｫ繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ =====
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
      return document.querySelector(`.main-tab[onclick*="'${tabName}'"]`);
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
      switchTab('settings', document.querySelector('.main-tab[onclick*="\'settings\'"]'));
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

      // 段位チップ
      const rankWrapperId = `${tabId === 'overall' ? 'overall' : tabId}-rank-filter`;
      const rankWrapper = document.getElementById(rankWrapperId);
      if (rankWrapper) {
        const sel = rankWrapper.dataset.selected ? JSON.parse(rankWrapper.dataset.selected) : ['all'];
        if (!sel.includes('all') && sel.length > 0) {
          chips.push(`<button class="fchip" onclick="event.stopPropagation();resetRankFilterChip('${rankWrapperId}')">${sel.length}段位選択 ×</button>`);
        }
      }

      el.innerHTML = chips.join('');
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
    function getCharBestWorstMap(charMatches, minGames = 3) {
      const mapGroups = {};
      charMatches.forEach(m => {
        if (!m.map) return;
        if (!mapGroups[m.map]) mapGroups[m.map] = [];
        mapGroups[m.map].push(m);
      });
      const valid = Object.keys(mapGroups)
        .filter(k => mapGroups[k].length >= minGames)
        .map(k => ({ name: k, ...calculateWinrate(mapGroups[k], currentPerspective) }));
      if (valid.length === 0) return { best: null, worst: null };
      valid.sort((a, b) => parseFloat(b.winrate) - parseFloat(a.winrate));
      const worstCandidate = valid[valid.length - 1];
      return { best: valid[0], worst: valid.length >= 2 && parseFloat(worstCandidate.winrate) < 100 ? worstCandidate : null };
    }

    function getMapBestWorstChar(mapMatches, minGames = 3) {
      const charGroups = {};
      mapMatches.forEach(m => {
        if (!m.myCharacter) return;
        if (!charGroups[m.myCharacter]) charGroups[m.myCharacter] = [];
        charGroups[m.myCharacter].push(m);
      });
      const valid = Object.keys(charGroups)
        .filter(k => charGroups[k].length >= minGames)
        .map(k => ({ name: k, ...calculateWinrate(charGroups[k], currentPerspective) }));
      if (valid.length === 0) return { best: null, worst: null };
      valid.sort((a, b) => parseFloat(b.winrate) - parseFloat(a.winrate));
      const worstCandidate = valid[valid.length - 1];
      return { best: valid[0], worst: valid.length >= 2 && parseFloat(worstCandidate.winrate) < 100 ? worstCandidate : null };
    }

    function getOppBestWorstMap(oppMatches, minGames = 3) {
      return getCharBestWorstMap(oppMatches, minGames);
    }

    function buildTopCharCard(charName, allCharMatches, perspectiveMatches, type) {
      const charMatches = allCharMatches[charName] || [];
      const stats = calculateWinrate(charMatches, currentPerspective);
      const pickRate = perspectiveMatches.length > 0
        ? (charMatches.length / perspectiveMatches.length * 100).toFixed(1)
        : '0.0';
      const { best, worst } = getCharBestWorstMap(charMatches);
      const iconType = currentPerspective === 'survivor' ? 'survivor' : 'hunter';
      const iconSrc = buildIconPath(charName, iconType);
      const isBest = type === 'best';
      const winrateColor = isBest ? '#059669' : '#dc2626';
      const sideLabel = currentPerspective === 'survivor' ? 'サバイバー' : 'ハンター';
      const headLabel = isBest ? `✨ TOP${sideLabel}` : `⚠️ 苦手${sideLabel}`;
      const cardClass = isBest ? 'top-card top-card-best' : 'top-card top-card-worst';

      return `
        <div class="${cardClass}" onclick="openDetailPage('char','${escapeHTML(charName)}')">
          <div class="top-card-head">${headLabel}</div>
          <div class="top-card-body">
            <div class="top-card-icon-wrap">
              <img class="top-card-char-icon" src="${iconSrc}" alt="${escapeHTML(charName)}" onerror="this.style.display='none'">
            </div>
            <div class="top-card-info">
              <div class="top-card-name">${escapeHTML(charName)}</div>
              <div class="top-card-winrate" style="color:${winrateColor}">${stats.winrate}%</div>
              <div class="top-card-sub">${stats.wins}勝${stats.losses}敗${stats.draws}分 / ${charMatches.length}試合<br>Pick ${pickRate}%</div>
            </div>
          </div>
          <div class="top-card-detail-row" style="padding:4px 10px 8px;border-top:1px solid rgba(0,0,0,0.06)">
            <div class="top-card-detail-item"><strong>得意マップ</strong><span>${best ? `${escapeHTML(best.name)}<em>${best.winrate}%</em>` : '—'}</span></div>
            <div class="top-card-detail-item"><strong>苦手マップ</strong><span>${worst ? `${escapeHTML(worst.name)}<em>${worst.winrate}%</em>` : '—'}</span></div>
          </div>
        </div>`;
    }

    function buildTopMapCard(mapName, allMapMatches, type) {
      const mapMatches = allMapMatches[mapName] || [];
      const stats = calculateWinrate(mapMatches, currentPerspective);
      const { best, worst } = getMapBestWorstChar(mapMatches);
      const iconSrc = getMapIconPath(mapName);
      const isBest = type === 'best';
      const winrateColor = isBest ? '#059669' : '#dc2626';
      const headLabel = isBest ? '✨ 得意マップ' : '⚠️ 苦手マップ';
      const cardClass = isBest ? 'top-card top-card-best' : 'top-card top-card-worst';

      return `
        <div class="${cardClass}" onclick="openDetailPage('map','${escapeHTML(mapName)}')">
          <div class="top-card-head">${headLabel}</div>
          <div class="top-card-body">
            <div class="top-card-icon-wrap">
              <img class="top-card-map-icon" src="${iconSrc}" alt="${escapeHTML(mapName)}" onerror="this.style.display='none'">
            </div>
            <div class="top-card-info">
              <div class="top-card-name">${escapeHTML(mapName)}</div>
              <div class="top-card-winrate" style="color:${winrateColor}">${stats.winrate}%</div>
              <div class="top-card-sub">${stats.wins}勝${stats.losses}敗${stats.draws}分 / ${mapMatches.length}試合</div>
            </div>
          </div>
          <div class="top-card-detail-row" style="padding:4px 10px 8px;border-top:1px solid rgba(0,0,0,0.06)">
            <div class="top-card-detail-item"><strong>得意キャラ</strong><span>${best ? `${escapeHTML(best.name)}<em>${best.winrate}%</em>` : '—'}</span></div>
            <div class="top-card-detail-item"><strong>苦手キャラ</strong><span>${worst ? `${escapeHTML(worst.name)}<em>${worst.winrate}%</em>` : '—'}</span></div>
          </div>
        </div>`;
    }

    function buildTopOpponentCard(oppName, allOppMatches, perspectiveMatches, type) {
      const oppMatches = allOppMatches[oppName] || [];
      const stats = calculateWinrate(oppMatches, currentPerspective);
      const pickRate = perspectiveMatches.length > 0
        ? (oppMatches.length / perspectiveMatches.length * 100).toFixed(1)
        : '0.0';
      const { best, worst } = getOppBestWorstMap(oppMatches);
      const iconType = currentPerspective === 'survivor' ? 'hunter' : 'survivor';
      const iconSrc = buildIconPath(oppName, iconType);
      const isBest = type === 'best';
      const winrateColor = isBest ? '#059669' : '#dc2626';
      const oppSideLabel = currentPerspective === 'survivor' ? 'ハンター' : 'サバイバー';
      const headLabel = isBest ? `✨ 得意${oppSideLabel}` : `⚠️ 苦手${oppSideLabel}`;
      const cardClass = isBest ? 'top-card top-card-best' : 'top-card top-card-worst';

      return `
        <div class="${cardClass}" onclick="openDetailPage('opponent','${escapeHTML(oppName)}')">
          <div class="top-card-head">${headLabel}</div>
          <div class="top-card-body">
            <div class="top-card-icon-wrap">
              <img class="top-card-char-icon" src="${iconSrc}" alt="${escapeHTML(oppName)}" onerror="this.style.display='none'">
            </div>
            <div class="top-card-info">
              <div class="top-card-name">${escapeHTML(oppName)}</div>
              <div class="top-card-winrate" style="color:${winrateColor}">${stats.winrate}%</div>
              <div class="top-card-sub">${stats.wins}勝${stats.losses}敗${stats.draws}分 / ${oppMatches.length}試合<br>Pick ${pickRate}%</div>
            </div>
          </div>
          <div class="top-card-detail-row" style="padding:4px 10px 8px;border-top:1px solid rgba(0,0,0,0.06)">
            <div class="top-card-detail-item"><strong>得意マップ</strong><span>${best ? `${escapeHTML(best.name)}<em>${best.winrate}%</em>` : '—'}</span></div>
            <div class="top-card-detail-item"><strong>苦手マップ</strong><span>${worst ? `${escapeHTML(worst.name)}<em>${worst.winrate}%</em>` : '—'}</span></div>
          </div>
        </div>`;
    }

    // ===== 詳細ページ =====
    let detailPagePreviousTab = 'input';
    let detailFilterState = { period: 'all', rank: 'all' };
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
        const _hasExtra = detailFilterState.charTabMap !== 'all' || detailFilterState.charTabOpponent !== 'all'
          || detailFilterState.mapTabChar !== 'all'
          || detailFilterState.oppTabMyChar !== 'all' || detailFilterState.oppTabHunter !== 'all' || detailFilterState.oppTabMap !== 'all';
        const _hasFilter = detailFilterState.period !== 'all' || detailFilterState.rank !== 'all' || _hasExtra;
        if (_hasFilter) {
          const _parts = [];
          if (detailFilterState.period !== 'all') _parts.push(_periodEl ? _periodEl.options[_periodEl.selectedIndex].text : detailFilterState.period);
          if (detailFilterState.rank !== 'all') _parts.push('段位絞り込み中');
          if (_hasExtra) _parts.push('追加フィルター適用中');
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
        detailPage.classList.remove('hidden');
        detailPage.scrollTop = 0;
      }
      window.scrollTo(0, 0);

      if (!skipPush) {
        history.pushState({ detail: true, type, name }, '',
          '?detail=' + encodeURIComponent(type) + '&name=' + encodeURIComponent(name));
      }
    }

    function closeDetailPage(skipPush = false) {
      const detailPage = document.getElementById('detail-page');
      if (detailPage) detailPage.classList.add('hidden');

      // タブコンテンツ復元
      const tabEl = document.getElementById(`${detailPagePreviousTab}-tab`);
      if (tabEl) tabEl.classList.add('active');

      // .main-tab ボタンの active 同期（デスクトップ用）
      document.querySelectorAll('.main-tab').forEach(btn => btn.classList.remove('active'));
      const mainTabBtn = document.querySelector(`.main-tab[onclick*="'${detailPagePreviousTab}'"]`);
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
      if (perspectiveMatches.length === 0) return '<div class="empty-state"><p>データがありません</p></div>';

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

      // マップ別成績
      html += buildDetailBarSection('マップ別成績', perspectiveMatches, m => m.map, 'map', 'dbs-char-map', true);

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
      if (perspectiveMatches.length === 0) return '<div class="empty-state"><p>データがありません</p></div>';

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
      if (perspectiveMatches.length === 0) return '<div class="empty-state"><p>データがありません</p></div>';

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
      html += buildDetailHistory(perspectiveMatches);
      return html;
    }

    function buildDetailBarSection(title, matchList, keyFn, type, sectionId, showPie = false) {
      const groups = {};
      matchList.forEach(m => {
        const k = keyFn(m);
        if (!k) return;
        if (!groups[k]) groups[k] = [];
        groups[k].push(m);
      });
      return buildDetailBarSectionFromStats(title, groups, type, sectionId, showPie);
    }

    function buildDetailBarSectionFromStats(title, groups, type, sectionId, showPie = false) {
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
        <div class="detail-bar-sort-control">
          <button type="button" class="detail-sort-key-btn${wrActive}" onclick="changeDetailBarSort('${sid}','winrate')">勝率</button>
          <button type="button" class="detail-sort-key-btn${mcActive}" onclick="changeDetailBarSort('${sid}','games')">試合数</button>
          <div class="detail-sort-divider"></div>
          <button type="button" class="detail-sort-arrow-btn${descActive}" onclick="changeDetailBarSortDir('${sid}','desc')">↓</button>
          <button type="button" class="detail-sort-arrow-btn${ascActive}" onclick="changeDetailBarSortDir('${sid}','asc')">↑</button>
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
          <div class="empty-state"><p>${minGames}試合以上のデータがありません</p></div>
        </div>`;
      }

      let html = `<div class="detail-section">
        ${sortBar}
        <div class="bar-chart-horizontal detail-bar-card">`;
      pageItems.forEach(({ key, s }) => {
        html += `
          <div class="bar-row">
            <div class="bar-label-wrapper">
              ${getBarIconHTML(key, type)}
              <div class="bar-label-text">
                <div class="bar-label">${escapeHTML(key)}</div>
                <div class="bar-sublabel">${s.wins}勝${s.losses}敗${s.draws}分 (${s.totalWithDraws}試合)</div>
              </div>
            </div>
            <div class="bar-wrapper">${renderBarHTML(s.winrate)}</div>
          </div>`;
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

        const sliceLabelPlugin = {
          id: `detailSliceLabel_${sectionId}`,
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
            ctx.font = 'bold 12px sans-serif';
            meta.data.forEach((arc, index) => {
              const value = chart.data.datasets[0].data[index];
              if (value / total < 0.05) return;
              const midAngle = (arc.startAngle + arc.endAngle) / 2;
              const midRadius = (arc.outerRadius + arc.innerRadius) / 2;
              const x = arc.x + midRadius * Math.cos(midAngle);
              const y = arc.y + midRadius * Math.sin(midAngle);
              const label = chart.data.labels[index];
              const displayChar = label.startsWith('「') ? label.charAt(1) : label.charAt(0);
              ctx.fillText(displayChar, x, y);
            });
            ctx.restore();
          }
        };

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
          ? `<img class="match-rank-icon" src="${getRankIconPath(match.rank, match.perspective)}" alt="${escapeHTML(match.rank)}" title="${escapeHTML(match.rank)}" onerror="this.outerHTML='${escapeHTML(match.rank)}'">` : '';
        let vsHTML = '';
        if (match.perspective === 'survivor') {
          const mySide  = [match.myCharacter, ...(match.teammates || [])].filter(Boolean).map(s => charIconImg(s, 'survivor')).join('');
          const oppSide = match.opponentHunter ? charIconImg(match.opponentHunter, 'hunter') : '';
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
        } else {
          const mySide  = match.myCharacter ? charIconImg(match.myCharacter, 'hunter') : '';
          const oppSide = (match.opponentSurvivors || []).map(s => charIconImg(s, 'survivor')).join('');
          vsHTML = `<div class="match-vs-row">${rankIconHTML}<div class="match-vs-side">${mySide}</div><span class="match-vs-text">vs</span><div class="match-vs-side">${oppSide}</div></div>`;
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
  