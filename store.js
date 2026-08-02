/**
 * 小金加油 - 数据存储层 + 工具函数
 */

const Store = {
  KEY: 'xiaojin_data_v1',
  _cache: null,

  _default() {
    return {
      // 日程手帐：按日期存储
      diary: {},
      // 自媒体运营
      media: {
        accounts: ['甲壳星愿', '妙搭', '小金讲健康'],
        calendar: {}, // { 'YYYY-MM-DD': [{ id, account, title }] }
        ideas: []
      },
      // 养宠日记
      pets: {
        list: [
          { id: 'p1', name: '布丁', type: '猫', color: '#FF7BA5', weights: [] },
          { id: 'p2', name: '福宝', type: '猫', color: '#FFB964', weights: [] },
          { id: 'p3', name: '糖糖', type: '猫', color: '#7BD4B5', weights: [] },
          { id: 'p4', name: '奶茶', type: '狗', color: '#9CDEF0', weights: [] }
        ],
        care: {}, // { 'YYYY-MM-DD': [{ id, pet, category, content }] }
        stock: []
      },
      // 手作专区
      craft: {
        materials: [],
        inspirations: [],  // 灵感记录：{ id, title, source, link, photo(base64), wantToMake }
        products: [],
        orders: [],
        stock: [] // 囤货清点：{ id, productName, price, made, sold }
      },
      // 个人成长
      growth: {
        books: [],
        movies: [],
        skills: []
      },
      settings: {
        location: '杭州'
      }
    };
  },

  load() {
    if (this._cache) return this._cache;
    let data;
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // 深合并
        data = this._deepMerge(this._default(), saved);
      } else {
        data = this._default();
      }
    } catch (e) {
      console.error('数据加载失败', e);
      data = this._default();
    }
    data = this._migrate(data);
    this._cache = data;
    return this._cache;
  },

  // 数据迁移：把旧版单一「售价」转为「价格区间」，并保证 craft.stock 存在
  _migrate(data) {
    if (data.craft) {
      if (!Array.isArray(data.craft.stock)) data.craft.stock = [];
      if (!Array.isArray(data.craft.inspirations)) data.craft.inspirations = [];
      if (Array.isArray(data.craft.products)) {
        data.craft.products.forEach(p => {
          if (p.priceMin == null) {
            if (typeof p.price === 'number') {
              p.priceMin = p.price;
              p.priceMax = p.price;
            } else {
              p.priceMin = 0;
              p.priceMax = 0;
            }
            delete p.price;
          }
        });
      }
    }
    return data;
  },

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this._cache));
    } catch (e) {
      console.error('数据保存失败', e);
      toast('数据保存失败');
    }
  },

  get() { return this.load(); },

  reset() {
    this._cache = this._default();
    this.save();
  },

  // 导出数据为 JSON 字符串
  exportJSON() {
    const data = this.load();
    return JSON.stringify({ __app: 'xiaojin', __v: 1, __time: new Date().toISOString(), data }, null, 2);
  },

  // 从 JSON 字符串导入（覆盖）
  importJSON(str) {
    const parsed = JSON.parse(str);
    const incoming = parsed.data || parsed;
    const def = this._default();
    this._cache = this._deepMerge(def, incoming);
    this.save();
  }

};

// ============ 工具函数 ============

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayStr() { return dateStr(new Date()); }

function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(s) {
  const d = parseDate(s);
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
}

function daysBetween(s1, s2) {
  const d1 = parseDate(s1);
  const d2 = parseDate(s2);
  return Math.round((d2 - d1) / 86400000);
}

// 全局当前日期
let currentDate = todayStr();

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2000);
}

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板')).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
    toast('已复制到剪贴板');
  }
}

function calcSleepDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return '';
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}小时${m}分`;
}

// 午睡时长：返回 "X小时Y分" / "Y分" / null（未记录）
function calcNapDuration(napStart, napEnd) {
  if (!napStart || !napEnd) return null;
  const [sh, sm] = napStart.split(':').map(Number);
  const [eh, em] = napEnd.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}小时${m}分`;
  return `${m}分`;
}

// 当日总睡眠分钟数（夜睡 + 午睡），无记录返回 null
function sleepTotalMinutes(sleep) {
  if (!sleep) return null;
  let night = 0;
  if (sleep.bedtime && sleep.wake) {
    const [bh, bm] = sleep.bedtime.split(':').map(Number);
    const [wh, wm] = sleep.wake.split(':').map(Number);
    let n = (wh * 60 + wm) - (bh * 60 + bm);
    if (n < 0) n += 1440;
    night = n;
  }
  let nap = 0;
  if (sleep.napStart && sleep.napEnd) {
    const [sh, sm] = sleep.napStart.split(':').map(Number);
    const [eh, em] = sleep.napEnd.split(':').map(Number);
    let p = (eh * 60 + em) - (sh * 60 + sm);
    if (p < 0) p += 1440;
    nap = p;
  }
  if (night === 0 && nap === 0) return null;
  return night + nap;
}

// 聚合待办（日记 + 发文日历 + 养护日历 + 排单日历）
function getAggregatedTodos(date) {
  const data = Store.get();
  const todos = [];

  const diary = data.diary[date];
  if (diary && diary.todos) {
    diary.todos.forEach(t => todos.push({ ...t, source: 'diary' }));
  }

  if (data.media.calendar[date]) {
    data.media.calendar[date].forEach(item => {
      todos.push({ id: item.id, text: `发文：${item.account} - ${item.title}`, done: item.done || false, source: 'media', refId: item.id });
    });
  }

  if (data.pets.care[date]) {
    data.pets.care[date].forEach(item => {
      todos.push({ id: item.id, text: `养护：${item.pet} ${item.category} ${item.content}`, done: item.done || false, source: 'care', refId: item.id });
    });
  }

  // 排单日历：当天要做的订单
  if (data.craft.orders) {
    data.craft.orders.forEach(o => {
      if (o.schedule && o.schedule[date] && o.status !== 'shipped' && o.status !== 'done') {
        todos.push({
          id: 'order_' + o.id + '_' + date,
          text: `手作：${o.productName} ×${o.quantity}（${o.customer}）`,
          done: o.schedule[date].done || false,
          source: 'craft',
          refId: o.id + '|' + date
        });
      }
    });
  }

  return todos;
}

// 更新关联待办的完成状态
function updateAggregatedTodoDone(date, source, refId, done) {
  const data = Store.get();
  if (source === 'media' && data.media.calendar[date]) {
    const item = data.media.calendar[date].find(i => i.id === refId);
    if (item) { item.done = done; Store.save(); }
  } else if (source === 'care' && data.pets.care[date]) {
    const item = data.pets.care[date].find(i => i.id === refId);
    if (item) { item.done = done; Store.save(); }
  } else if (source === 'craft') {
    const [orderId, d] = refId.split('|');
    const order = data.craft.orders.find(o => o.id === orderId);
    if (order && order.schedule && order.schedule[d]) {
      order.schedule[d].done = done;
      Store.save();
    }
  }
}

// 排单日历：订单不再由 AI 自动均分，改由用户手动把订单排到具体日期
// （通过 craft 模块的「添加订单到这天」在日历中记录）

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escAttr(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
