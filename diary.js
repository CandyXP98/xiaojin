/**
 * 日程手帐模块
 */

const Diary = {
  currentSection: 'overview',
  calSelectedDate: null,

  render() {
    const data = Store.get();
    const diary = data.diary[currentDate] || {};

    let html = renderAlerts();

    // 日期选择器
    html += `
      <div class="date-picker">
        <button class="date-nav-btn" id="diaryPrev">‹</button>
        <input type="date" id="diaryDate" value="${currentDate}">
        <button class="date-nav-btn" id="diaryNext">›</button>
      </div>
    `;

    // 分段控制
    html += `
      <div class="segment">
        <button class="segment-item ${this.currentSection === 'overview' ? 'active' : ''}" data-section="overview">今日概览</button>
        <button class="segment-item ${this.currentSection === 'todo' ? 'active' : ''}" data-section="todo">待办事项</button>
        <button class="segment-item ${this.currentSection === 'checkin' ? 'active' : ''}" data-section="checkin">帐号打卡</button>
        <button class="segment-item ${this.currentSection === 'sleep' ? 'active' : ''}" data-section="sleep">睡眠</button>
      </div>
      <div class="segment">
        <button class="segment-item ${this.currentSection === 'diet' ? 'active' : ''}" data-section="diet">饮食</button>
        <button class="segment-item ${this.currentSection === 'health' ? 'active' : ''}" data-section="health">养生</button>
        <button class="segment-item ${this.currentSection === 'mindfulness' ? 'active' : ''}" data-section="mindfulness">正念日记</button>
        <button class="segment-item ${this.currentSection === 'summary' ? 'active' : ''}" data-section="summary">本月总结</button>
      </div>
    `;

    switch (this.currentSection) {
      case 'overview': html += this.renderOverview(diary); break;
      case 'todo': html += this.renderTodo(diary); break;
      case 'checkin': html += this.renderCheckin(diary); break;
      case 'sleep': html += this.renderSleep(diary); break;
      case 'diet': html += this.renderDiet(diary); break;
      case 'health': html += this.renderHealth(diary); break;
      case 'mindfulness': html += this.renderMindfulness(diary); break;
      case 'summary': html += this.renderSummary(diary); break;
    }

    $('#appMain').innerHTML = html;
    this.bindEvents();
  },

  // ===== 今日概览 =====
  renderOverview(diary) {
    const todos = getAggregatedTodos(currentDate);
    const doneCount = todos.filter(t => t.done).length;
    const sleepDur = diary.sleep ? calcSleepDuration(diary.sleep.bedtime, diary.sleep.wake) : '未记录';
    const mood = diary.mood || null;
    const moodMap = { happy: '😊 开心', normal: '😐 一般', sad: '😢 不开心', anxious: '😰 焦虑' };
    const moodEmoji = { happy: '😊', normal: '😐', sad: '😢', anxious: '😰' };
    const weather = diary.weather;

    // 按时段问候
    const h = new Date().getHours();
    let greet = '你好呀';
    if (h < 5) greet = '夜深了，注意休息';
    else if (h < 11) greet = '早上好';
    else if (h < 14) greet = '中午好';
    else if (h < 18) greet = '下午好';
    else greet = '晚上好';

    // 今日关注：未完成待办 + 提醒
    const pendingTodos = todos.filter(t => !t.done);
    const alerts = checkAlerts();

    let html = '';

    // 问候横幅
    html += `<div class="greet-banner">
      <div class="greet-emoji">${mood ? moodEmoji[mood] : '🌸'}</div>
      <div class="greet-text">
        <div class="greet-hi">${greet}，小金～</div>
        <div class="greet-sub">${fmtDate(currentDate)} · 今天还有 <b>${pendingTodos.length}</b> 件事待完成</div>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-title"><span class="emoji">📋</span>今日速览</div>
      <div class="overview-grid">
        <div class="overview-item">
          <div class="overview-num">${doneCount}/${todos.length}</div>
          <div class="overview-label">待办完成</div>
        </div>
        <div class="overview-item">
          <div class="overview-num" style="font-size:18px;">${sleepDur}</div>
          <div class="overview-label">睡眠时长</div>
        </div>
        <div class="overview-item">
          <div class="overview-num" style="font-size:18px;">${mood ? moodMap[mood] : '未记录'}</div>
          <div class="overview-label">今日心情</div>
        </div>
        <div class="overview-item">
          <div class="overview-num" style="font-size:18px;">${weather ? `${weather.temp}°` : '未获取'}</div>
          <div class="overview-label">今日天气</div>
        </div>
      </div>
      ${todos.length ? `
        <div class="section-title" style="margin-top:8px;">📌 今日待办</div>
        ${todos.slice(0, 5).map(t => this.renderTodoItem(t)).join('')}
        ${todos.length > 5 ? `<div style="text-align:center;color:var(--ink-light);font-size:12px;padding:6px;">还有${todos.length - 5}项，点「待办事项」查看全部</div>` : ''}
      ` : emptyState('📝', '今天还没有待办哦')}
    </div>`;

    // 月历：点日期看当天待办
    html += `<div class="card">
      <div class="card-title"><span class="emoji">📅</span>月历 · 点日期看当天待办</div>
      <div id="diaryMonthCalendar"></div>
    </div>`;
    html += this.renderCalTodos(this.calSelectedDate || currentDate);

    // 今日关注（提醒）
    if (alerts.length) {
      html += `<div class="card">
        <div class="card-title"><span class="emoji">🔔</span>今日关注</div>
        ${alerts.map(a => `<div class="alert-row"><span>${a.emoji}</span><span>${a.text}</span></div>`).join('')}
      </div>`;
    }

    // 天气卡片
    html += `<div class="card">
      <div class="card-title"><span class="emoji">🌤️</span>今日天气</div>
      ${this.renderWeatherCard(weather)}
      <button class="btn btn-sm btn-block" style="margin-top:10px;" id="fetchWeather">🌐 获取${Store.get().settings.location || '当地'}天气</button>
    </div>`;

    return html;
  },

  renderWeatherCard(weather) {
    if (!weather) {
      return `<div class="weather-display"><span class="weather-icon">❓</span><div class="weather-info"><div class="weather-desc">点击下方按钮获取当地天气</div></div></div>`;
    }
    const iconMap = {
      '晴': '☀️', '多云': '⛅', '阴': '☁️', '雨': '🌧️', '雪': '❄️', '雾': '🌫️'
    };
    let icon = '🌤️';
    for (const k in iconMap) {
      if (weather.desc && weather.desc.includes(k)) { icon = iconMap[k]; break; }
    }
    return `<div class="weather-display">
      <span class="weather-icon">${icon}</span>
      <div class="weather-info">
        <div class="weather-temp">${weather.temp}°C</div>
        <div class="weather-desc">${weather.desc || ''} · ${weather.location || ''}</div>
      </div>
    </div>`;
  },

  // 月历选中日的待办面板
  renderCalTodos(ds) {
    const d = parseDate(ds);
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    const title = `${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
    const todos = getAggregatedTodos(ds);
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">📌</span>${title} 待办 (${todos.length})</div>`;
    if (todos.length) {
      html += todos.map(t => this.renderTodoItem(t, ds)).join('');
    } else {
      html += emptyState('📝', '这一天还没有待办');
    }
    html += `</div>`;
    return html;
  },

  // 计算某月的待办事件点（用于月历标记）
  buildMonthEventMap(y, m) {
    const data = Store.get();
    const eventMap = {};
    const last = new Date(y, m + 1, 0).getDate();
    for (let day = 1; day <= last; day++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const colors = [];
      const todos = getAggregatedTodos(ds);
      if (todos.length) {
        colors.push(todos.some(t => !t.done) ? '#FF7BA5' : '#4CAF7A');
      }
      (data.craft.orders || []).forEach(o => {
        if (o.schedule && o.schedule[ds]) colors.push('#4A90D9');
      });
      if (colors.length) eventMap[ds] = colors.slice(0, 4);
    }
    return eventMap;
  },

  // ===== 待办事项 =====
  renderTodo(diary) {
    const todos = getAggregatedTodos(currentDate);
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">✅</span>待办事项 · ${fmtDate(currentDate)}</div>
      <button class="btn btn-sm" id="addTodo">＋ 添加待办</button>
      <div style="margin-top:12px;" id="todoList">`;

    if (todos.length) {
      html += todos.map(t => this.renderTodoItem(t)).join('');
    } else {
      html += emptyState('📝', '今天还没有待办，添加一个吧');
    }

    html += `</div></div>`;

    // 未来待办预览
    html += `<div class="card">
      <div class="card-title"><span class="emoji">📅</span>查看其他日期</div>
      <p style="color:var(--ink-light);font-size:13px;">点击上方日期选择器，可以添加未来任意一天的待办哦～</p>
    </div>`;

    return html;
  },

  renderTodoItem(t, ds = currentDate) {
    const sourceMap = { diary: '手帐', media: '发文', care: '养护', craft: '手作' };
    const sourceClass = t.source || 'diary';
    return `<div class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}" data-source="${sourceClass}" data-ref="${t.refId || ''}" data-date="${ds}">
      <div class="todo-check ${t.done ? 'done' : ''}"></div>
      <div class="todo-text">${t.text}</div>
      ${t.source && t.source !== 'diary' ? `<span class="todo-source ${sourceClass}">${sourceMap[t.source]}</span>` : ''}
      ${t.source === 'diary' ? `<button class="todo-del" data-del="${t.id}">×</button>` : ''}
    </div>`;
  },

  // ===== 帐号打卡 =====
  renderCheckin(diary) {
    const data = Store.get();
    const checkin = diary.checkin || {};
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">📱</span>帐号打卡 · ${fmtDate(currentDate)}</div>`;

    data.media.accounts.forEach(acc => {
      const status = checkin[acc] || {};
      html += `<div class="account-card" data-account="${acc}">
        <span class="account-name">${acc}</span>
        <div class="account-status">
          <button class="status-tag ${status.posted ? 'active' : ''}" data-account="${acc}" data-field="posted">已发文</button>
          <button class="status-tag ${status.active ? 'active' : ''}" data-account="${acc}" data-field="active">已活跃</button>
        </div>
      </div>`;
    });

    html += `</div>`;
    return html;
  },

  // ===== 睡眠记录 =====
  renderSleep(diary) {
    const sleep = diary.sleep || {};
    const duration = calcSleepDuration(sleep.bedtime, sleep.wake);
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">😴</span>睡眠记录 · ${fmtDate(currentDate)}</div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">入睡时间</label>
          <input class="input" type="time" id="sleepBed" value="${sleep.bedtime || ''}">
        </div>
        <div class="field">
          <label class="field-label">起床时间</label>
          <input class="input" type="time" id="sleepWake" value="${sleep.wake || ''}">
        </div>
      </div>
      <div class="record-row">
        <div class="record-label">睡眠时长</div>
        <div class="record-value" id="sleepDur">${duration || '请记录入睡和起床时间'}</div>
      </div>
      <button class="btn btn-block" id="saveSleep">保存睡眠记录</button>
    </div>`;

    // 近7天睡眠趋势
    html += `<div class="card">
      <div class="card-title"><span class="emoji">📊</span>近7天睡眠</div>
      ${this.renderSleepTrend()}
    </div>`;

    return html;
  },

  renderSleepTrend() {
    const data = Store.get();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = dateStr(d);
      const sleep = data.diary[ds]?.sleep;
      const dur = sleep ? calcSleepDuration(sleep.bedtime, sleep.wake) : '';
      const hours = dur ? parseInt(dur) : 0;
      days.push({ ds, dur, hours, label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
    const maxH = Math.max(8, ...days.map(d => d.hours));

    return `<div style="display:flex;align-items:flex-end;gap:6px;height:100px;padding:0 4px;">
      ${days.map(d => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="font-size:9px;color:var(--ink-light);">${d.dur ? d.hours + 'h' : '-'}</div>
          <div style="width:100%;background:linear-gradient(180deg,var(--pink-400),var(--pink-300));border-radius:6px 6px 0 0;height:${d.hours ? (d.hours / maxH * 70) : 4}px;min-height:4px;"></div>
          <div style="font-size:9px;color:var(--ink-light);">${d.label}</div>
        </div>
      `).join('')}
    </div>`;
  },

  // ===== 饮食记录 =====
  renderDiet(diary) {
    const diet = diary.diet || {};
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">🍱</span>饮食记录 · ${fmtDate(currentDate)}</div>
      <div class="section-title">三餐</div>
      ${this.dietField('早餐', 'breakfast', diet.breakfast)}
      ${this.dietField('午餐', 'lunch', diet.lunch)}
      ${this.dietField('晚餐', 'dinner', diet.dinner)}
      <div class="section-title">其他</div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">饮水量(杯)</label>
          <input class="input" type="number" id="dietWater" value="${diet.water || ''}" placeholder="几杯，如 6">
        </div>
        <div class="field">
          <label class="field-label">奶茶</label>
          <select class="select" id="dietMilkTea">
            <option value="" ${!diet.milkTea ? 'selected' : ''}>未喝</option>
            <option value="无糖" ${diet.milkTea === '无糖' ? 'selected' : ''}>无糖</option>
            <option value="三分糖" ${diet.milkTea === '三分糖' ? 'selected' : ''}>三分糖</option>
            <option value="五分糖" ${diet.milkTea === '五分糖' ? 'selected' : ''}>五分糖</option>
            <option value="全糖" ${diet.milkTea === '全糖' ? 'selected' : ''}>全糖</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">夜宵</label>
        <input class="input" id="dietSupper" value="${diet.supper || ''}" placeholder="吃了什么夜宵">
      </div>
      <button class="btn btn-block" id="saveDiet">保存饮食记录</button>
    </div>`;
    return html;
  },

  dietField(label, name, value) {
    return `<div class="field">
      <label class="field-label">${label}</label>
      <input class="input" id="diet_${name}" value="${value || ''}" placeholder="记录${label}内容">
    </div>`;
  },

  // ===== 养生记录 =====
  renderHealth(diary) {
    const health = diary.health || {};
    const content = health.content || health.exercise || '';
    let html = `<div class="card">
      <div class="card-title">养生记录 · ${fmtDate(currentDate)}</div>
      <div class="field">
        <label class="field-label">今天养生做了什么</label>
        <textarea class="textarea" id="health_content" style="min-height:120px;" placeholder="自由记录今天的养生内容，例如：喝了红豆薏米水、泡脚20分钟、做了拉伸……">${content}</textarea>
      </div>
      <button class="btn btn-block" id="saveHealth">保存养生记录</button>
    </div>`;
    return html;
  },

  // ===== 正念日记 =====
  renderMindfulness(diary) {
    const mind = diary.mindfulness || {};
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">🧘</span>正念日记 · ${fmtDate(currentDate)}</div>
      <div class="section-title">每日心情</div>
      <div class="mood-grid" id="moodGrid">
        ${[
          { key: 'happy', emoji: '😊', label: '开心' },
          { key: 'normal', emoji: '😐', label: '一般' },
          { key: 'sad', emoji: '😢', label: '不开心' },
          { key: 'anxious', emoji: '😰', label: '焦虑' }
        ].map(m => `<button class="mood-btn ${mind.mood === m.key ? 'active' : ''}" data-mood="${m.key}"><span class="emoji">${m.emoji}</span>${m.label}</button>`).join('')}
      </div>
      <div class="section-title">今日小确幸（至少3个）</div>
      <div class="lucky-list">
        ${(mind.lucky || ['', '', '']).map((l, i) => `
          <div class="lucky-item">
            <div class="lucky-num">${i + 1}</div>
            <input class="input lucky-input" data-lucky="${i}" value="${l || ''}" placeholder="今天发生的小确幸...">
          </div>
        `).join('')}
      </div>
      <button class="btn btn-sm btn-outline" id="addLucky">＋ 添加更多小确幸</button>
      <div class="section-title">发生的事和感受</div>
      <div id="eventList">
        ${(mind.events || []).map((e, i) => `
          <div class="list-item" data-event="${i}">
            <div class="list-item-header">
              <span class="list-item-meta">事件 ${i + 1}</span>
              <button class="todo-del" data-del-event="${i}">×</button>
            </div>
            <div class="field"><input class="input" data-event-what="${i}" value="${e.what || ''}" placeholder="发生了什么..."></div>
            <div class="field" style="margin-bottom:0;"><input class="input" data-event-feel="${i}" value="${e.feel || ''}" placeholder="我的感受..."></div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-sm btn-outline" id="addEvent" style="margin-top:8px;">＋ 添加事件</button>
      <button class="btn btn-block" id="saveMindfulness" style="margin-top:12px;">保存正念日记</button>
    </div>`;
    return html;
  },

  // ===== 本月总结 =====
  renderSummary(diary) {
    const data = Store.get();
    const now = parseDate(currentDate);
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 统计本月数据
    let totalTodos = 0, doneTodos = 0;
    let moodCount = { happy: 0, normal: 0, sad: 0, anxious: 0 };
    let sleepTotal = 0, sleepDays = 0;
    let postDays = 0, activeDays = 0;

    Object.keys(data.diary).forEach(ds => {
      if (!ds.startsWith(ym)) return;
      const d = data.diary[ds];
      const todos = getAggregatedTodos(ds);
      totalTodos += todos.length;
      doneTodos += todos.filter(t => t.done).length;
      if (d.mindfulness?.mood) moodCount[d.mindfulness.mood]++;
      if (d.sleep?.bedtime && d.sleep?.wake) {
        const [bh, bm] = d.sleep.bedtime.split(':').map(Number);
        const [wh, wm] = d.sleep.wake.split(':').map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins < 0) mins += 1440;
        sleepTotal += mins / 60;
        sleepDays++;
      }
      if (d.checkin) {
        data.media.accounts.forEach(acc => {
          if (d.checkin[acc]?.posted) postDays++;
          if (d.checkin[acc]?.active) activeDays++;
        });
      }
    });

    const monthSummary = data.diary[currentDate]?.summary || data.diary[`${ym}-01`]?.monthSummary || '';

    let html = `<div class="card">
      <div class="card-title"><span class="emoji">📊</span>${now.getFullYear()}年${now.getMonth() + 1}月总结</div>
      <div class="overview-grid">
        <div class="overview-item">
          <div class="overview-num">${doneTodos}/${totalTodos}</div>
          <div class="overview-label">待办完成</div>
        </div>
        <div class="overview-item">
          <div class="overview-num">${sleepDays ? (sleepTotal / sleepDays).toFixed(1) : 0}<span style="font-size:14px;">h</span></div>
          <div class="overview-label">日均睡眠</div>
        </div>
        <div class="overview-item">
          <div class="overview-num">${moodCount.happy}</div>
          <div class="overview-label">开心天数</div>
        </div>
        <div class="overview-item">
          <div class="overview-num">${postDays}</div>
          <div class="overview-label">发文打卡</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;">
        ${Object.entries(moodCount).map(([k, v]) => {
          const map = { happy: '😊开心', normal: '😐一般', sad: '😢不开心', anxious: '😰焦虑' };
          return `<span class="tag tag-pink">${map[k]}: ${v}天</span>`;
        }).join('')}
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-title"><span class="emoji">✍️</span>月度总结</div>
      <div class="field">
        <textarea class="textarea" id="monthSummary" style="min-height:150px;" placeholder="这个月的总结、反思和下月计划...">${monthSummary}</textarea>
      </div>
      <button class="btn btn-block" id="saveSummary">保存月度总结</button>
    </div>`;

    return html;
  },

  // ===== 事件绑定 =====
  bindEvents() {
    const self = this;

    // 日期选择
    const dateInput = $('#diaryDate');
    if (dateInput) {
      dateInput.addEventListener('change', e => {
        currentDate = e.target.value;
        self.calSelectedDate = currentDate;
        self.render();
      });
    }

    const prevBtn = $('#diaryPrev');
    const nextBtn = $('#diaryNext');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const d = parseDate(currentDate);
        d.setDate(d.getDate() - 1);
        currentDate = dateStr(d);
        self.calSelectedDate = currentDate;
        self.render();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const d = parseDate(currentDate);
        d.setDate(d.getDate() + 1);
        currentDate = dateStr(d);
        self.calSelectedDate = currentDate;
        self.render();
      });
    }

    // 分段控制
    $$('.segment-item').forEach(btn => {
      btn.addEventListener('click', () => {
        self.currentSection = btn.dataset.section;
        self.render();
      });
    });

    // 月历渲染（点日期看当天待办）
    const calEl = $('#diaryMonthCalendar');
    if (calEl) {
      const ds = self.calSelectedDate || currentDate;
      const dd = parseDate(ds);
      calendarState.year = dd.getFullYear();
      calendarState.month = dd.getMonth();
      const eventMap = self.buildMonthEventMap(calendarState.year, calendarState.month);
      renderCalendar(calEl, {
        eventMap,
        selectedDate: ds,
        onDateClick: ds2 => {
          self.calSelectedDate = ds2;
          self.render();
        }
      });
    }

    // 待办勾选（点击圆圈或整行）
    $$('.todo-item').forEach(item => {
      item.addEventListener('click', e => {
        // 排除删除按钮和来源标签
        if (e.target.closest('.todo-del') || e.target.closest('.todo-source')) return;
        const check = item.querySelector('.todo-check');
        const id = item.dataset.id;
        const source = item.dataset.source;
        const refId = item.dataset.ref;
        const ds = item.dataset.date || currentDate;
        const data = Store.get();
        const diary = data.diary[ds] || (data.diary[ds] = {});

        if (source === 'diary') {
          const todo = diary.todos.find(t => t.id === id);
          if (todo) { todo.done = !todo.done; Store.save(); }
        } else {
          // 媒体/养护/手作待办
          const done = !check.classList.contains('done');
          updateAggregatedTodoDone(ds, source, refId, done);
        }
        self.render();
      });
    });

    // 待办删除
    $$('.todo-del[data-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.del;
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        if (diary.todos) {
          diary.todos = diary.todos.filter(t => t.id !== id);
          Store.save();
          self.render();
        }
      });
    });

    // 添加待办
    const addTodoBtn = $('#addTodo');
    if (addTodoBtn) {
      addTodoBtn.addEventListener('click', () => {
        showModal('添加待办', `
          ${inputField('待办内容', 'text', '', '今天要做什么...')}
          ${selectField('日期', 'date', [
            { value: currentDate, label: fmtDate(currentDate) },
            ...self.getFutureDates(7)
          ], currentDate)}
        `, [
          { label: '取消', style: 'btn-outline' },
          {
            label: '添加',
            onClick: wrap => {
              const d = getFormData(wrap);
              if (!d.text) { toast('请输入待办内容'); return false; }
              const data = Store.get();
              const dt = d.date || currentDate;
              const diary = data.diary[dt] || (data.diary[dt] = {});
              diary.todos = diary.todos || [];
              diary.todos.push({ id: uid(), text: d.text, done: false });
              Store.save();
              if (dt === currentDate) self.render();
              else toast('已添加到' + fmtDate(dt));
            }
          }
        ]);
        // 改为 date picker
        const dateField = $('.modal-wrap [name="date"]');
        if (dateField) {
          dateField.outerHTML = `<input class="input" type="date" name="date" value="${currentDate}">`;
        }
      });
    }

    // 帐号打卡
    $$('.status-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const acc = tag.dataset.account;
        const field = tag.dataset.field;
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.checkin = diary.checkin || {};
        diary.checkin[acc] = diary.checkin[acc] || {};
        diary.checkin[acc][field] = !diary.checkin[acc][field];
        Store.save();
        self.render();
      });
    });

    // 睡眠保存
    const saveSleep = $('#saveSleep');
    if (saveSleep) {
      saveSleep.addEventListener('click', () => {
        const bedtime = $('#sleepBed').value;
        const wake = $('#sleepWake').value;
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.sleep = { bedtime, wake };
        Store.save();
        toast('睡眠记录已保存');
        self.render();
      });
    }

    // 睡眠实时计算
    const sleepBed = $('#sleepBed');
    const sleepWake = $('#sleepWake');
    const updateDur = () => {
      const dur = calcSleepDuration(sleepBed.value, sleepWake.value);
      $('#sleepDur').textContent = dur || '请记录入睡和起床时间';
    };
    if (sleepBed) sleepBed.addEventListener('input', updateDur);
    if (sleepWake) sleepWake.addEventListener('input', updateDur);

    // 饮食保存
    const saveDiet = $('#saveDiet');
    if (saveDiet) {
      saveDiet.addEventListener('click', () => {
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.diet = {
          breakfast: $('#diet_breakfast').value,
          lunch: $('#diet_lunch').value,
          dinner: $('#diet_dinner').value,
          water: $('#dietWater').value,
          milkTea: $('#dietMilkTea').value,
          supper: $('#dietSupper').value
        };
        Store.save();
        toast('饮食记录已保存');
      });
    }

    // 养生保存
    const saveHealth = $('#saveHealth');
    if (saveHealth) {
      saveHealth.addEventListener('click', () => {
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.health = {
          content: $('#health_content').value
        };
        Store.save();
        toast('养生记录已保存');
      });
    }

    // 正念日记 - 心情选择
    $$('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 添加小确幸
    const addLucky = $('#addLucky');
    if (addLucky) {
      addLucky.addEventListener('click', () => {
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.mindfulness = diary.mindfulness || { lucky: ['', '', ''] };
        diary.mindfulness.lucky = diary.mindfulness.lucky || ['', '', ''];
        diary.mindfulness.lucky.push('');
        Store.save();
        self.render();
      });
    }

    // 添加事件
    const addEvent = $('#addEvent');
    if (addEvent) {
      addEvent.addEventListener('click', () => {
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.mindfulness = diary.mindfulness || { lucky: ['', '', ''], events: [] };
        diary.mindfulness.events = diary.mindfulness.events || [];
        diary.mindfulness.events.push({ what: '', feel: '' });
        Store.save();
        self.render();
      });
    }

    // 删除事件
    $$('[data-del-event]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delEvent);
        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        if (diary.mindfulness?.events) {
          diary.mindfulness.events.splice(idx, 1);
          Store.save();
          self.render();
        }
      });
    });

    // 保存正念日记
    const saveMind = $('#saveMindfulness');
    if (saveMind) {
      saveMind.addEventListener('click', () => {
        const mood = $('.mood-btn.active')?.dataset.mood || '';
        const lucky = $$('.lucky-input').map(i => i.value);
        const events = $$('.list-item[data-event]').map(item => {
          const idx = item.dataset.event;
          return {
            what: $(`[data-event-what="${idx}"]`)?.value || '',
            feel: $(`[data-event-feel="${idx}"]`)?.value || ''
          };
        });

        // 检查小确幸至少3个
        const filledLucky = lucky.filter(l => l.trim());
        if (filledLucky.length < 3) {
          toast('小确幸需要至少填写3个');
          return;
        }

        const data = Store.get();
        const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
        diary.mindfulness = { mood, lucky, events };
        Store.save();
        toast('正念日记已保存');
      });
    }

    // 获取天气
    const fetchWeather = $('#fetchWeather');
    if (fetchWeather) {
      fetchWeather.addEventListener('click', () => self.fetchWeather());
    }

    // 保存月度总结
    const saveSummary = $('#saveSummary');
    if (saveSummary) {
      saveSummary.addEventListener('click', () => {
        const text = $('#monthSummary').value;
        const data = Store.get();
        const now = parseDate(currentDate);
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const diary = data.diary[ym] || (data.diary[ym] = {});
        diary.monthSummary = text;
        Store.save();
        toast('月度总结已保存');
      });
    }
  },

  getFutureDates(count) {
    const dates = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const ds = dateStr(d);
      dates.push({ value: ds, label: fmtDate(ds) });
    }
    return dates;
  },

  async fetchWeather() {
    toast('正在获取天气...');
    const data = Store.get();
    const city = data.settings.location || '杭州';
    try {
      // 使用 wttr.in 免费天气服务
      const resp = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const json = await resp.json();
      const current = json.current_condition[0];
      const temp = current.temp_C;
      const desc = current.lang_zh && current.lang_zh[0] ? current.lang_zh[0].value : current.weatherDesc[0].value;

      const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
      diary.weather = { temp, desc, location: city };
      Store.save();
      toast('天气获取成功');
      this.render();
    } catch (e) {
      console.error(e);
      // 降级：使用简单接口
      try {
        const resp = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%C`);
        const text = await resp.text();
        const match = text.match(/([-\d]+)°C\s+(.+)/);
        if (match) {
          const diary = data.diary[currentDate] || (data.diary[currentDate] = {});
          diary.weather = { temp: match[1], desc: match[2], location: city };
          Store.save();
          toast('天气获取成功');
          this.render();
        } else {
          toast('天气获取失败，请稍后重试');
        }
      } catch (e2) {
        toast('天气获取失败');
      }
    }
  }
};
