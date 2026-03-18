// ===== ダークモード（ちらつき防止） =====
(function () {
  if (localStorage.getItem('identity5_dark_mode') === 'on') {
    document.body.classList.add('dark-mode');
  }
})();

// ===== HTMLエスケープ（XSS対策） =====
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== 定数 =====
const SURVIVORS = ['幸運児', '医師', '弁護士', '泥棒', '庭師', 'マジシャン', '冒険家', '傭兵', '祭司', '空軍', '機械技師', 'オフェンス', '心眼', '調香師', 'カウボーイ', '踊り子', '占い師', '納棺師', '探鉱者', '呪術師', '野人', '曲芸師', '一等航海士', 'バーメイド', 'ポストマン', '墓守', '「囚人」', '昆虫学者', '画家', 'バッツマン', '玩具職人', '患者', '「心理学者」', '小説家', '「少女」', '泣きピエロ', '教授', '骨董商', '作曲家', '記者', '航空エンジニア', '応援団', '人形師', '火災調査員', '「レディ・ファウロ」', '「騎士」', '気象学者', '弓使い', '「脱出マスター」', '幻灯師', '闘牛士'];

const HUNTERS = ['復讐者', '道化師', '断罪狩人', 'リッパー', '結魂者', '芸者', '白黒無常', '写真家', '狂眼', '黄衣の王', '夢の魔女', '泣き虫', '魔トカゲ', '血の女王', 'ガードNo.26', '「使徒」', 'ヴァイオリニスト', '彫刻師', 'アンデッド', '破輪', '漁師', '蝋人形師', '「悪夢」', '書記官', '隠者', '夜の番人', 'オペラ歌手', '「フールズ・ゴールド」', '時空の影', '「足萎えの羊」', '「フラバルー」', '雑貨商', '「ビリヤードプレイヤー」', '「女王蜂」'];

const MAPS = ['軍需工場', '赤の教会', '聖心病院', '湖景村', '月の河公園', 'レオの思い出', '永眠町', '中華街', '罪の森'];

const RANKS = ['1段', '2段', '3段', '4段', '5段', '6段', '7段', '最高峰'];
const RANK_NAMES = RANKS; // challenge-app.js 互換エイリアス

// ===== ひらがな読みデータ =====
const SURVIVOR_READINGS = {
  '幸運児': 'こううんじ', '医師': 'いし', '弁護士': 'べんごし', '泥棒': 'どろぼう',
  '庭師': 'にわし', 'マジシャン': 'まじしゃん', '冒険家': 'ぼうけんか', '傭兵': 'ようへい',
  '祭司': 'さいし', '空軍': 'くうぐん', '機械技師': 'きかいぎし', 'オフェンス': 'おふぇんす',
  '心眼': 'しんがん', '調香師': 'ちょうこうし', 'カウボーイ': 'かうぼーい', '踊り子': 'おどりこ',
  '占い師': 'うらないし', '納棺師': 'のうかんし', '探鉱者': 'たんこうしゃ', '呪術師': 'じゅじゅつし',
  '野人': 'やじん', '曲芸師': 'きょくげいし', '一等航海士': 'いっとうこうかいし',
  'バーメイド': 'ばーめいど', 'ポストマン': 'ぽすとまん', '墓守': 'はかもり',
  '「囚人」': 'しゅうじん', '昆虫学者': 'こんちゅうがくしゃ', '画家': 'がか',
  'バッツマン': 'ばっつまん', '玩具職人': 'おもちゃしょくにん', '患者': 'かんじゃ',
  '「心理学者」': 'しんりがくしゃ', '小説家': 'しょうせつか', '「少女」': 'しょうじょ',
  '泣きピエロ': 'なきぴえろ', '教授': 'きょうじゅ', '骨董商': 'こっとうしょう',
  '作曲家': 'さっきょくか', '記者': 'きしゃ', '航空エンジニア': 'こうくうえんじにあ',
  '応援団': 'おうえんだん', '人形師': 'にんぎょうし', '火災調査員': 'かさいちょうさいん',
  '「レディ・ファウロ」': 'れでぃふぁうろ', '「騎士」': 'きし', '気象学者': 'きしょうがくしゃ',
  '弓使い': 'ゆみつかい', '「脱出マスター」': 'だっしゅつますたー だつます',
  '幻灯師': 'げんとうし', '闘牛士': 'とうぎゅうし'
};

const HUNTER_READINGS = {
  '復讐者': 'ふくしゅうしゃ れお', '道化師': 'どうけし ぴえろ',
  '断罪狩人': 'だんざいかりゅうど しか', 'リッパー': 'りっぱー',
  '結魂者': 'けっこんしゃ くも', '芸者': 'げいしゃ みちこ',
  '白黒無常': 'しろくろむじょう', '写真家': 'しゃしんか じょぜふ',
  '狂眼': 'きょうがん ばるく', '黄衣の王': 'おういのおう たこ はすたー',
  '夢の魔女': 'ゆめのまじょ', '泣き虫': 'なきむし',
  '魔トカゲ': 'まとかげ るきの', '血の女王': 'ちのじょおう まりー',
  'ガードNo.26': 'がーどにじゅうろく ぼんぼん', '「使徒」': 'しと あん',
  'ヴァイオリニスト': 'ゔぁいおりにすと あんとにお', '彫刻師': 'ちょうこくし がらてあ',
  'アンデッド': 'あんでっど', '破輪': 'はりん うぃる',
  '漁師': 'りょうし ぐれいす', '蝋人形師': 'ろうにんぎょうし',
  '「悪夢」': 'あくむ', '書記官': 'しょきかん きーがん',
  '隠者': 'いんじゃ', '夜の番人': 'よるのばんにん いたか',
  'オペラ歌手': 'おぺらかしゅ さんぐりあ', '「フールズ・ゴールド」': 'ふーるずごーるど ふるご',
  '時空の影': 'じくうのかげ あいゔぃ', '「足萎えの羊」': 'あしなえのひつじ',
  '「フラバルー」': 'ふらばるー', '雑貨商': 'ざっかしょう',
  '「ビリヤードプレイヤー」': 'びりやーどぷれいやー', '「女王蜂」': 'じょおうばち'
};

// ===== カタカナ→ひらがな変換 =====
function katakanaToHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

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

// ===== Firebase 設定 =====
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD11HYRuGLn0N4_eFhXfTK5R-3QyJ4RsSo",
  authDomain: "idvtracker.firebaseapp.com",
  projectId: "idvtracker",
  storageBucket: "idvtracker.firebasestorage.app",
  messagingSenderId: "1027492627968",
  appId: "1:1027492627968:web:ad567e2e79b3a1574bbae5"
};

function initFirebase() {
  try {
    if (typeof firebase === 'undefined') return;
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    return firebase.firestore();
  } catch (e) {
    console.warn('Firebase init failed:', e);
    return null;
  }
}

// ===== SearchableSelect（統合版） =====
// app.js用: getExcluded, onSelected, syncFromSelect, _userTyped
// challenge-app.js用: onChange（コンストラクタ引数）
class SearchableSelect {
  constructor(selectEl, onChange) {
    this.select = selectEl;
    this.value = selectEl.value;
    this.highlightIndex = -1;
    this.isOpen = false;
    this.options = [];
    this._filteredOptions = [];
    this._touchHandled = false;
    this._userTyped = false;
    this.getExcluded = null;
    this.onSelected = null;
    this.onChange = onChange || null;

    this._build();
    this._bindEvents();
  }

  _build() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'searchable-select-wrapper';
    this.select.parentNode.insertBefore(this.wrapper, this.select);
    this.wrapper.appendChild(this.select);

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'ss-input';
    this.input.placeholder = '検索して選択...';
    this.input.autocomplete = 'off';
    this.wrapper.insertBefore(this.input, this.select);

    this.clearBtn = document.createElement('button');
    this.clearBtn.type = 'button';
    this.clearBtn.className = 'ss-clear';
    this.clearBtn.innerHTML = '×';
    this.clearBtn.tabIndex = -1;
    this.wrapper.insertBefore(this.clearBtn, this.select);

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'ss-dropdown';
    this.wrapper.appendChild(this.dropdown);

    if (this.select.value) {
      this.input.value = this.select.value;
      this.input.classList.add('has-value');
      this.clearBtn.classList.add('visible');
    }
  }

  _bindEvents() {
    this._onFocus = () => {
      this._userTyped = false;
      this._refreshOptions();
      this._filterAndRender('');
      this._open();
    };
    this._onInput = () => {
      this._userTyped = true;
      this._filterAndRender(this.input.value);
      if (!this.isOpen) this._open();
    };
    this._onKeydown = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); this._moveHighlight(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this._moveHighlight(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); this._selectHighlighted(); }
      else if (e.key === 'Escape') { this._close(); this.input.blur(); }
    };
    this._onClearClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.setValue('');
      this.input.focus();
    };
    this._onDocClick = (e) => {
      if (!this.wrapper.contains(e.target)) {
        this._close();
        this.input.value = this.value || '';
      }
    };

    this.input.addEventListener('focus', this._onFocus);
    this.input.addEventListener('input', this._onInput);
    this.input.addEventListener('keydown', this._onKeydown);
    this.clearBtn.addEventListener('click', this._onClearClick);
    document.addEventListener('click', this._onDocClick);
  }

  destroy() {
    this.input.removeEventListener('focus', this._onFocus);
    this.input.removeEventListener('input', this._onInput);
    this.input.removeEventListener('keydown', this._onKeydown);
    this.clearBtn.removeEventListener('click', this._onClearClick);
    document.removeEventListener('click', this._onDocClick);
    if (this.wrapper.parentNode) {
      this.wrapper.parentNode.insertBefore(this.select, this.wrapper);
      this.wrapper.remove();
    }
    this.select.style.display = '';
  }

  _refreshOptions() {
    this.options = [];
    this.select.querySelectorAll('option').forEach(opt => {
      if (opt.value === '') return;
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
    if (this.value) excluded.add(this.value);

    const removeChoon = s => s.replace(/ー/g, '');
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
          let score;
          if (label.includes(q) || reading.includes(q)) score = 0;
          else if (removeChoon(label).includes(qNoChoon) || removeChoon(reading).includes(qNoChoon)) score = 1;
          else score = 2;
          return { opt, score };
        });

      scored.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const aPrefix = a.opt.label.toLowerCase().startsWith(q) || a.opt.reading.startsWith(q);
        const bPrefix = b.opt.label.toLowerCase().startsWith(q) || b.opt.reading.startsWith(q);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;
        return 0;
      });

      filtered = scored.map(({ opt }) => opt);

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
      div.textContent = opt.label;

      div.addEventListener('mousedown', (e) => e.preventDefault());
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._touchHandled) { this._touchHandled = false; return; }
        this._selectOption(opt);
      });
      div.addEventListener('touchstart', (e) => {
        this._touchStartX = e.touches[0].clientX;
        this._touchStartY = e.touches[0].clientY;
      }, { passive: true });
      div.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - (this._touchStartX || 0);
        const dy = e.changedTouches[0].clientY - (this._touchStartY || 0);
        if (Math.sqrt(dx * dx + dy * dy) > 10) return;
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
    if (this.onChange) this.onChange(opt.value);
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
  }

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
    // app.js の updatePlaceholderStyle は各ページ側で定義（存在する場合のみ呼ぶ）
    if (typeof updatePlaceholderStyle === 'function') updatePlaceholderStyle(this.select);
  }

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
