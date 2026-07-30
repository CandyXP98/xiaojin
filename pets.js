/**
 * 养宠日记模块
 */

// 宠物头像 SVG（不依赖 emoji，按类型与颜色绘制）
function petAvatarSVG(pet) {
  const colorMap = { '布丁': '#FF7BA5', '福宝': '#FFB964', '糖糖': '#7BD4B5', '奶茶': '#9CDEF0' };
  const color = pet.color || colorMap[pet.name] || '#FF7BA5';
  const isDog = pet.type === '狗';
  const ink = '#5A3D45';
  const ears = isDog
    ? `<path d="M9 15 q-3 7 -1 13 q4 -3 5 -9 z" fill="${color}"/>
       <path d="M35 15 q3 7 1 13 q-4 -3 -5 -9 z" fill="${color}"/>`
    : `<path d="M10 8 L16 19 L7 18 Z" fill="${color}"/>
       <path d="M34 8 L28 19 L37 18 Z" fill="${color}"/>`;
  const whiskers = isDog ? '' : `
    <line x1="4" y1="25" x2="11" y2="25" stroke="${ink}" stroke-width="0.8"/>
    <line x1="4" y1="28" x2="11" y2="27" stroke="${ink}" stroke-width="0.8"/>
    <line x1="40" y1="25" x2="33" y2="25" stroke="${ink}" stroke-width="0.8"/>
    <line x1="40" y1="28" x2="33" y2="27" stroke="${ink}" stroke-width="0.8"/>`;
  return `<svg viewBox="0 0 44 44" width="44" height="44" class="pet-avatar-svg">
    <circle cx="22" cy="23" r="21" fill="${color}"/>
    ${ears}
    <circle cx="22" cy="25" r="12.5" fill="#FFF"/>
    <circle cx="17.5" cy="23" r="1.8" fill="${ink}"/>
    <circle cx="26.5" cy="23" r="1.8" fill="${ink}"/>
    <path d="M22 26 l-1.6 1.8 h3.2 z" fill="#FF7BA5"/>
    <path d="M19.5 29 q2.5 2 5 0" stroke="${ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    ${whiskers}
  </svg>`;
}

const Pets = {
  currentSection: 'pets',

  render() {
    let html = renderAlerts();

    html += `
      <div class="segment">
        <button class="segment-item ${this.currentSection === 'pets' ? 'active' : ''}" data-section="pets">宠物体重</button>
        <button class="segment-item ${this.currentSection === 'care' ? 'active' : ''}" data-section="care">养护日历</button>
        <button class="segment-item ${this.currentSection === 'stock' ? 'active' : ''}" data-section="stock">囤货清单</button>
      </div>
    `;

    switch (this.currentSection) {
      case 'pets': html += this.renderPetsView(); break;
      case 'care': html += this.renderCareView(); break;
      case 'stock': html += this.renderStockView(); break;
    }

    $('#appMain').innerHTML = html;
    this.bindEvents();
  },

  // ===== 宠物体重 =====
  renderPetsView() {
    const data = Store.get();
    const pets = data.pets.list;
    const selId = this.weightPet || (pets[0] && pets[0].id);
    let html = '';

    // 宠物选择按钮：点一个出现一个宠物的体重记录
    if (pets.length > 1) {
      html += `<div class="segment">` + pets.map(p =>
        `<button class="segment-item ${p.id === selId ? 'active' : ''}" data-weight-pet="${p.id}">${p.name}</button>`
      ).join('') + `</div>`;
    }

    const pet = pets.find(p => p.id === selId) || pets[0];
    if (pet) html += this.renderPetWeightCard(pet);

    return html;
  },

  // 单个宠物体重卡片
  renderPetWeightCard(pet) {
    const weights = pet.weights || [];
    const colorMap = { '布丁': '#FF7BA5', '福宝': '#FFB964', '糖糖': '#7BD4B5', '奶茶': '#9CDEF0' };
    const chartColor = pet.color || colorMap[pet.name] || '#FF7BA5';
    const latestWeight = weights.length ? weights[weights.length - 1].weight : '未记录';

    let changeTip = '';
    if (weights.length >= 2) {
      const cur = weights[weights.length - 1].weight;
      const prev = weights[weights.length - 2].weight;
      const diff = (cur - prev).toFixed(2);
      const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '＝';
      const c = diff > 0 ? '#E8943C' : diff < 0 ? '#4CAF7A' : 'var(--ink-light)';
      changeTip = `<span style="font-size:11px;color:${c};margin-left:6px;">${arrow} ${diff > 0 ? '+' : ''}${diff}</span>`;
    }

    let html = `<div class="card">
      <div class="card-title">${pet.name} <span class="tag tag-pink" style="margin-left:auto;">${pet.type}</span></div>
      <div class="pet-card">
        <div class="pet-avatar">${petAvatarSVG(pet)}</div>
        <div class="pet-info">
          <div class="pet-name">${pet.name}</div>
          <div class="pet-type">${pet.type}</div>
        </div>
        <div class="pet-weight">${latestWeight}${latestWeight !== '未记录' ? ' kg' : ''}${changeTip}</div>
      </div>`;

    // 体重折线图
    if (weights.length >= 2) {
      html += `<div class="section-title">体重趋势</div>
        <div style="background:var(--pink-50);border-radius:12px;padding:8px 4px;">
          ${renderLineChart(weights.map(w => ({ label: w.date.slice(5), value: w.weight })), { color: chartColor, unit: 'kg' })}
        </div>`;
    }

    // 体重历史记录（可改/可删）
    if (weights.length) {
      html += `<div class="section-title">体重记录</div>`;
      weights.slice().reverse().forEach((w, ri) => {
        const idx = weights.length - 1 - ri;
        html += `<div class="record-row" style="cursor:pointer;" data-edit-weight="${pet.id}|${idx}">
          <div class="record-label" style="width:auto;">${w.date.slice(5)}</div>
          <div class="record-value">${w.weight} kg</div>
          <button class="icon-btn" data-edit-weight="${pet.id}|${idx}" title="修改">改</button>
          <button class="icon-btn" data-del-weight="${pet.id}|${idx}" title="删除">删</button>
        </div>`;
      });
    }

    html += `<button class="btn btn-sm btn-block" style="margin-top:10px;" data-add-weight="${pet.id}">记录体重</button>
    </div>`;

    return html;
  },

  // ===== 养护日历 =====
  renderCareView() {
    const data = Store.get();
    const eventMap = {};

    Object.keys(data.pets.care).forEach(ds => {
      const items = data.pets.care[ds];
      if (items && items.length) {
        const catColors = {
          '驱虫': '#FF7BA5', '卫生': '#7BD4B5', '喂养': '#FFB964',
          '清洁': '#9CDEF0', '健康': '#FF94B5', '其他': '#C5B0B7'
        };
        eventMap[ds] = items.map(i => catColors[i.category] || '#FF7BA5');
      }
    });

    let html = `<div class="card">
      <div class="card-title">养护日历</div>
      <div id="careCalendar"></div>
    </div>`;

    // 分类图例
    html += `<div class="card">
      <div class="card-title">养护分类</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${[
          { name: '驱虫', color: '#FF7BA5' },
          { name: '卫生', color: '#7BD4B5' },
          { name: '喂养', color: '#FFB964' },
          { name: '清洁', color: '#9CDEF0' },
          { name: '健康', color: '#FF94B5' },
          { name: '其他', color: '#C5B0B7' }
        ].map(c => `
          <div style="display:flex;align-items:center;gap:4px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${c.color};"></div>
            <span style="font-size:12px;">${c.name}</span>
          </div>
        `).join('')}
      </div>
    </div>`;

    // 当天养护
    html += `<div class="card">
      <div class="card-title">${fmtDate(currentDate)}养护安排</div>
      <button class="btn btn-sm" id="addCare">＋ 添加养护</button>
      <div style="margin-top:12px;" id="careList">`;

    const dayCares = data.pets.care[currentDate] || [];
    if (dayCares.length) {
      const catColors = {
        '驱虫': '#FF7BA5', '卫生': '#7BD4B5', '喂养': '#FFB964',
        '清洁': '#9CDEF0', '健康': '#FF94B5', '其他': '#C5B0B7'
      };
      html += dayCares.map(c => `
        <div class="list-item" style="border-left:4px solid ${catColors[c.category]};">
          <div class="list-item-header">
            <span class="list-item-title">${c.content}</span>
            <span class="tag" style="background:${catColors[c.category]}20;color:${catColors[c.category]};">${c.category}</span>
          </div>
          <div class="list-item-meta">${c.pet}</div>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-danger" data-del-care="${c.id}">删除</button>
          </div>
        </div>
      `).join('');
    } else {
      html += emptyState('今天没有养护安排');
    }

    html += `</div></div>`;
    return html;
  },

  // ===== 囤货清单 =====
  renderStockView() {
    const data = Store.get();
    let html = `<div class="card">
      <div class="card-title">囤货清单</div>
      <button class="btn btn-sm" id="addStock">＋ 添加商品</button>
    </div>`;

    if (!data.pets.stock.length) {
      html += `<div class="card">${emptyState('还没有囤货记录')}</div>`;
      return html;
    }

    const today = todayStr();
    data.pets.stock.forEach(s => {
      const remaining = s.quantity - (s.used || 0);
      const expireDays = s.expireDate ? daysBetween(today, s.expireDate) : null;
      const isExpired = expireDays !== null && expireDays < 0 && remaining > 0;
      const isExpiringSoon = expireDays !== null && expireDays >= 0 && expireDays <= 3 && remaining > 0;
      const isUsedUp = remaining <= 0;

      let statusTag = '';
      if (isUsedUp) statusTag = '<span class="tag tag-gray">已用完</span>';
      else if (isExpired) statusTag = '<span class="tag tag-red">已过期</span>';
      else if (isExpiringSoon) statusTag = '<span class="tag tag-red">即将过期</span>';

      html += `<div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${s.name} ${statusTag}</span>
          <button class="todo-del" data-del-stock="${s.id}">×</button>
        </div>
        <div class="list-item-meta">
          购买：${s.buyDate || '未记录'} · 价格：¥${s.price || 0} · 数量：${s.quantity}
        </div>
        ${s.expireDate ? `<div class="list-item-meta">保质期至：${s.expireDate} ${expireDays >= 0 ? `(还剩${expireDays}天)` : ''}</div>` : ''}
        <div class="record-row" style="margin-top:8px;">
          <div class="record-label">已用</div>
          <div class="record-value">${s.used || 0} / ${s.quantity}</div>
          <button class="icon-btn" data-use-stock="${s.id}" data-action="minus">−</button>
          <button class="icon-btn" data-use-stock="${s.id}" data-action="plus">＋</button>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (s.used || 0) / s.quantity * 100)}%;"></div></div>
        ${remaining > 0 && !isExpired ? `<div style="font-size:12px;color:var(--ink-light);text-align:right;">剩余 ${remaining}</div>` : ''}
      </div>`;
    });

    return html;
  },

  // 打开体重录入/编辑弹窗
  openWeightModal(petId, index) {
    const data = Store.get();
    const pet = data.pets.list.find(p => p.id === petId);
    const editing = (index !== undefined && index !== null);
    const rec = editing ? pet.weights[index] : null;
    showModal(editing ? `修改${pet.name}体重` : `记录${pet.name}体重`, `
      ${field('体重(kg)', `<input class="input" type="number" step="0.01" name="weight" value="${rec ? rec.weight : ''}" placeholder="如 4.5">`)}
      ${field('日期', `<input class="input" type="date" name="date" value="${rec ? rec.date : todayStr()}">`)}
    `, [
      { label: '取消', style: 'btn-outline' },
      {
        label: editing ? '保存修改' : '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.weight) { toast('请输入体重'); return false; }
          const data = Store.get();
          const pet = data.pets.list.find(p => p.id === petId);
          pet.weights = pet.weights || [];
          if (editing) {
            pet.weights[index] = { date: d.date || todayStr(), weight: parseFloat(d.weight) };
          } else {
            pet.weights.push({ date: d.date || todayStr(), weight: parseFloat(d.weight) });
          }
          Store.save();
          toast(editing ? '已修改' : '体重已记录');
          this.render();
        }
      }
    ]);
  },

  bindEvents() {
    const self = this;

    $$('.segment-item').forEach(btn => {
      if (!btn.dataset.section) return;
      btn.addEventListener('click', () => {
        self.currentSection = btn.dataset.section;
        self.render();
      });
    });

    // 渲染养护日历
    if (self.currentSection === 'care') {
      const calEl = $('#careCalendar');
      if (calEl) {
        const data = Store.get();
        const eventMap = {};
        const catColors = {
          '驱虫': '#FF7BA5', '卫生': '#7BD4B5', '喂养': '#FFB964',
          '清洁': '#9CDEF0', '健康': '#FF94B5', '其他': '#C5B0B7'
        };
        Object.keys(data.pets.care).forEach(ds => {
          const items = data.pets.care[ds];
          if (items && items.length) {
            eventMap[ds] = items.map(i => catColors[i.category] || '#FF7BA5');
          }
        });
        renderCalendar(calEl, {
          eventMap,
          selectedDate: currentDate,
          onDateClick: ds => {
            currentDate = ds;
            self.render();
          }
        });
      }
    }

    // 添加体重
    $$('[data-add-weight]').forEach(btn => {
      btn.addEventListener('click', () => {
        self.openWeightModal(btn.dataset.addWeight);
      });
    });

    // 体重记录：宠物选择按钮
    $$('[data-weight-pet]').forEach(btn => {
      btn.addEventListener('click', () => {
        self.weightPet = btn.dataset.weightPet;
        self.render();
      });
    });

    // 修改体重
    $$('[data-edit-weight]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const [petId, idx] = btn.dataset.editWeight.split('|');
        self.openWeightModal(petId, parseInt(idx));
      });
    });

    // 删除体重
    $$('[data-del-weight]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const [petId, idx] = btn.dataset.delWeight.split('|');
        confirmDialog('确认删除这条体重记录？', () => {
          const data = Store.get();
          const pet = data.pets.list.find(p => p.id === petId);
          if (pet && pet.weights[idx]) {
            pet.weights.splice(idx, 1);
            Store.save();
            self.render();
          }
        });
      });
    });

    // 添加养护
    const addCare = $('#addCare');
    if (addCare) {
      addCare.addEventListener('click', () => {
        const data = Store.get();
        const html = `
          ${selectField('宠物', 'pet', data.pets.list.map(p => ({ value: p.name, label: `${p.name}（${p.type}）` })))}
          ${selectField('分类', 'category', [
            { value: '驱虫', label: '驱虫' },
            { value: '卫生', label: '卫生' },
            { value: '喂养', label: '喂养' },
            { value: '清洁', label: '清洁' },
            { value: '健康', label: '健康' },
            { value: '其他', label: '其他' }
          ])}
          ${field('内容', `<input class="input" name="content" placeholder="如：体内驱虫">`)}
          ${field('日期', `<input class="input" type="date" name="date" value="${currentDate}">`)}
        `;
        showModal('添加养护', html, [
          { label: '取消', style: 'btn-outline' },
          {
            label: '保存',
            onClick: wrap => {
              const d = getFormData(wrap);
              if (!d.pet || !d.category || !d.content) { toast('请填写完整'); return false; }
              const data = Store.get();
              const date = d.date || currentDate;
              data.pets.care[date] = data.pets.care[date] || [];
              data.pets.care[date].push({ id: uid(), pet: d.pet, category: d.category, content: d.content, done: false });
              Store.save();
              toast('养护已添加');
              if (date !== currentDate) currentDate = date;
              self.render();
            }
          }
        ]);
      });
    }

    // 删除养护
    $$('[data-del-care]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delCare;
        confirmDialog('确认删除这条养护记录？', () => {
          const data = Store.get();
          if (data.pets.care[currentDate]) {
            data.pets.care[currentDate] = data.pets.care[currentDate].filter(c => c.id !== id);
            if (!data.pets.care[currentDate].length) delete data.pets.care[currentDate];
            Store.save();
            self.render();
          }
        });
      });
    });

    // 添加囤货
    const addStock = $('#addStock');
    if (addStock) {
      addStock.addEventListener('click', () => {
        const html = `
          ${field('商品名称', `<input class="input" name="name" placeholder="如：猫粮">`)}
          <div class="field-row">
            <div class="field">${field('数量', `<input class="input" type="number" name="quantity" placeholder="如 3" value="1">`)}</div>
            <div class="field">${field('价格', `<input class="input" type="number" step="0.01" name="price" placeholder="¥">`)}</div>
          </div>
          <div class="field-row">
            <div class="field">${field('购买日期', `<input class="input" type="date" name="buyDate" value="${todayStr()}">`)}</div>
            <div class="field">${field('保质期至', `<input class="input" type="date" name="expireDate">`)}</div>
          </div>
        `;
        showModal('添加囤货', html, [
          { label: '取消', style: 'btn-outline' },
          {
            label: '保存',
            onClick: wrap => {
              const d = getFormData(wrap);
              if (!d.name || !d.quantity) { toast('请填写名称和数量'); return false; }
              const data = Store.get();
              data.pets.stock.push({
                id: uid(),
                name: d.name,
                quantity: parseInt(d.quantity),
                price: parseFloat(d.price) || 0,
                buyDate: d.buyDate,
                expireDate: d.expireDate,
                used: 0
              });
              Store.save();
              toast('商品已添加');
              self.render();
            }
          }
        ]);
      });
    }

    // 囤货使用量增减
    $$('[data-use-stock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.useStock;
        const action = btn.dataset.action;
        const data = Store.get();
        const s = data.pets.stock.find(x => x.id === id);
        if (s) {
          if (action === 'plus') {
            if ((s.used || 0) < s.quantity) s.used = (s.used || 0) + 1;
            else { toast('已用完'); return; }
          } else {
            if ((s.used || 0) > 0) s.used = (s.used || 0) - 1;
          }
          Store.save();
          self.render();
        }
      });
    });

    // 删除囤货
    $$('[data-del-stock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delStock;
        confirmDialog('确认删除这个商品？', () => {
          const data = Store.get();
          data.pets.stock = data.pets.stock.filter(s => s.id !== id);
          Store.save();
          self.render();
        });
      });
    });
  }
};
