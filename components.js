/**
 * 通用组件库 - 弹窗、日历、表单辅助
 */

// ===== 弹窗系统 =====
function showModal(title, contentHTML, actions = []) {
  const mask = $('#modalMask');
  const wrap = $('#modalWrap');

  let actionsHTML = '';
  if (actions.length) {
    actionsHTML = `<div class="modal-actions">${actions.map((a, i) =>
      `<button class="btn ${a.style || ''}" data-action="${i}">${a.label}</button>`
    ).join('')}</div>`;
  }

  wrap.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-title">${title}</div>
    ${contentHTML}
    ${actionsHTML}
  `;

  mask.classList.add('show');
  setTimeout(() => wrap.classList.add('show'), 10);

  actions.forEach((a, i) => {
    wrap.querySelector(`[data-action="${i}"]`).addEventListener('click', () => {
      if (a.onClick) a.onClick(wrap);
      if (a.close !== false) closeModal();
    });
  });

  return wrap;
}

function closeModal() {
  const mask = $('#modalMask');
  const wrap = $('#modalWrap');
  wrap.classList.remove('show');
  mask.classList.remove('show');
}

// 点击遮罩关闭
document.addEventListener('click', e => {
  if (e.target.id === 'modalMask') closeModal();
});

// ===== 确认弹窗 =====
function confirmDialog(message, onConfirm) {
  showModal('确认', `<p style="text-align:center;color:var(--ink-light);padding:10px 0;">${message}</p>`, [
    { label: '取消', style: 'btn-outline' },
    { label: '确认', onClick: onConfirm }
  ]);
}

// ===== 日历组件 =====
let calendarState = { year: new Date().getFullYear(), month: new Date().getMonth() };

function renderCalendar(container, options = {}) {
  const {
    onDateClick,
    eventMap = {}, // { 'YYYY-MM-DD': [colors] }
    selectedDate = null,
    showEvents = true
  } = options;

  const y = calendarState.year;
  const m = calendarState.month;
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const prevMonthDays = new Date(y, m, 0).getDate();
  const today = todayStr();

  let html = `
    <div class="calendar-header">
      <div class="calendar-title">${y}年${m + 1}月</div>
      <div class="calendar-nav">
        <button class="date-nav-btn" id="calPrev">‹</button>
        <button class="date-nav-btn" id="calToday">·</button>
        <button class="date-nav-btn" id="calNext">›</button>
      </div>
    </div>
    <div class="calendar-grid">
  `;

  ['日', '一', '二', '三', '四', '五', '六'].forEach(w => {
    html += `<div class="calendar-weekday">${w}</div>`;
  });

  // 上月填充
  for (let i = startWeekday - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month">${prevMonthDays - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const classes = ['calendar-day'];
    if (ds === today) classes.push('today');
    if (ds === selectedDate) classes.push('selected');

    let dotsHTML = '';
    if (showEvents && eventMap[ds] && eventMap[ds].length) {
      const colors = eventMap[ds];
      dotsHTML = `<div class="dots">${colors.slice(0, 4).map(c => `<div class="dot" style="background:${c}"></div>`).join('')}</div>`;
    }
    html += `<div class="${classes.join(' ')}" data-date="${ds}">${d}${dotsHTML}</div>`;
  }

  // 下月填充
  const totalCells = startWeekday + daysInMonth;
  const fillCount = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= fillCount; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  $('#calPrev').addEventListener('click', () => {
    calendarState.month--;
    if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
    renderCalendar(container, options);
  });

  $('#calNext').addEventListener('click', () => {
    calendarState.month++;
    if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
    renderCalendar(container, options);
  });

  $('#calToday').addEventListener('click', () => {
    const now = new Date();
    calendarState.year = now.getFullYear();
    calendarState.month = now.getMonth();
    renderCalendar(container, options);
  });

  container.querySelectorAll('.calendar-day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      const ds = el.dataset.date;
      if (onDateClick) onDateClick(ds);
    });
  });
}

// ===== 表单字段生成器 =====
function field(label, inputHTML) {
  return `<div class="field"><label class="field-label">${label}</label>${inputHTML}</div>`;
}

function inputField(label, name, value = '', placeholder = '', type = 'text') {
  return field(label, `<input class="input" name="${name}" type="${type}" value="${value}" placeholder="${placeholder}">`);
}

function textareaField(label, name, value = '', placeholder = '') {
  return field(label, `<textarea class="textarea" name="${name}" placeholder="${placeholder}">${value}</textarea>`);
}

function selectField(label, name, options, value = '') {
  const opts = options.map(o =>
    `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  return field(label, `<select class="select" name="${name}">${opts}</select>`);
}

// 从弹窗中获取表单数据
function getFormData(wrap) {
  const data = {};
  wrap.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') {
      data[el.name] = el.checked;
    } else {
      data[el.name] = el.value.trim();
    }
  });
  return data;
}

// ===== 空状态 =====
function emptyState(emoji, text) {
  return `<div class="empty-state"><span class="emoji">${emoji}</span><div class="text">${text}</div></div>`;
}

// ===== 提醒检查 =====
function checkAlerts() {
  const data = Store.get();
  const alerts = [];
  const today = todayStr();

  // 囤货过期提醒
  data.pets.stock.forEach(s => {
    if (s.expireDate) {
      const left = daysBetween(today, s.expireDate);
      const remaining = s.quantity - (s.used || 0);
      if (remaining > 0 && left <= 3) {
        alerts.push({
          emoji: '⏰',
          text: left < 0 ? `「${s.name}」已过期${-left}天` : `「${s.name}」${left}天后过期`
        });
      }
    }
  });

  // 材料用完提醒
  data.craft.materials.forEach(m => {
    if (m.quantity - (m.used || 0) <= 0) {
      alerts.push({ emoji: '📦', text: `材料「${m.name}」已用完` });
    }
  });

  // 订单 deadline 提醒
  data.craft.orders.forEach(o => {
    if (o.status !== 'shipped' && o.status !== 'done' && o.deadline) {
      const left = daysBetween(today, o.deadline);
      if (left <= 2) {
        alerts.push({ emoji: '🔥', text: `订单「${o.productName}」deadline${left < 0 ? '已过' : `还剩${left}天`}` });
      }
    }
  });

  return alerts;
}

function renderAlerts() {
  const alerts = checkAlerts();
  if (!alerts.length) return '';
  return alerts.map(a => `<div class="alert-banner"><span class="emoji">${a.emoji}</span><span>${a.text}</span></div>`).join('');
}

// ===== 帐号颜色映射 =====
const ACCOUNT_COLORS = {
  '甲壳星愿': '#FF7BA5',
  '妙搭': '#7BD4B5',
  '小金讲健康': '#FFB964'
};

const ACCOUNT_BG = {
  '甲壳星愿': '#FFE4EC',
  '妙搭': '#E8F8F1',
  '小金讲健康': '#FFF5E0'
};

// ===== SVG 折线图 =====
// points: [{ label, value }]，返回 SVG 字符串
function renderLineChart(points, options = {}) {
  const {
    color = '#FF7BA5',
    height = 120,
    width = 320,
    unit = '',
    fill = true
  } = options;

  if (!points || points.length === 0) {
    return `<div style="text-align:center;color:var(--ink-lighter);font-size:12px;padding:20px 0;">暂无数据</div>`;
  }

  const padL = 30, padR = 12, padT = 12, padB = 22;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const values = points.map(p => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 0.5; max += 0.5; }
  const range = max - min;

  const n = points.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padL + (n > 1 ? i * stepX : innerW / 2);
    const y = padT + innerH - ((p.value - min) / range) * innerH;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const gradId = 'grad_' + uid().slice(0, 6);

  let dots = coords.map((c, i) => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    ${n <= 12 ? `<text x="${c.x.toFixed(1)}" y="${(padT + innerH + 14).toFixed(1)}" font-size="8" fill="var(--ink-light)" text-anchor="middle">${c.label}</text>` : ''}
  `).join('');

  let yLabels = '';
  if (n <= 8) {
    yLabels = `
      <text x="${padL - 4}" y="${(padT + 4).toFixed(1)}" font-size="8" fill="var(--ink-light)" text-anchor="end">${max.toFixed(1)}${unit}</text>
      <text x="${padL - 4}" y="${(padT + innerH).toFixed(1)}" font-size="8" fill="var(--ink-light)" text-anchor="end">${min.toFixed(1)}${unit}</text>
    `;
  }

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block;">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    ${yLabels}
    ${fill ? `<path d="${areaPath}" fill="url(#${gradId})"/>` : ''}
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  </svg>`;
}
