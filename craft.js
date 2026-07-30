/**
 * 手作专区模块
 */

const Craft = {
  currentSection: 'materials',
  orderView: 'today',

  render() {
    let html = renderAlerts();

    html += `
      <div class="segment">
        <button class="segment-item ${this.currentSection === 'materials' ? 'active' : ''}" data-section="materials">📦 材料库存</button>
        <button class="segment-item ${this.currentSection === 'inspirations' ? 'active' : ''}" data-section="inspirations">💡 灵感记录</button>
        <button class="segment-item ${this.currentSection === 'products' ? 'active' : ''}" data-section="products">🎨 产品设计</button>
        <button class="segment-item ${this.currentSection === 'orders' ? 'active' : ''}" data-section="orders">📋 排单日历</button>
      </div>
    `;

    switch (this.currentSection) {
      case 'materials': html += this.renderMaterialsView(); break;
      case 'inspirations': html += this.renderInspirationsView(); break;
      case 'products': html += this.renderProductsView(); break;
      case 'orders': html += this.renderOrdersView(); break;
    }

    $('#appMain').innerHTML = html;
    this.bindEvents();
  },

  // ===== 材料库存 =====
  renderMaterialsView() {
    const data = Store.get();
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">📦</span>材料库存</div>
      <button class="btn btn-sm" id="addMaterial">＋ 添加材料</button>
    </div>`;

    if (!data.craft.materials.length) {
      html += `<div class="card">${emptyState('📦', '还没有材料记录')}</div>`;
      return html;
    }

    data.craft.materials.forEach(m => {
      const remaining = m.quantity - (m.used || 0);
      const isUsedUp = remaining <= 0;
      const isLow = remaining > 0 && remaining <= Math.max(1, m.quantity * 0.2);

      let statusTag = '';
      if (isUsedUp) statusTag = '<span class="tag tag-red">已用完</span>';
      else if (isLow) statusTag = '<span class="tag tag-orange">库存不足</span>';

      html += `<div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${m.name} ${statusTag}</span>
          <button class="todo-del" data-del-mat="${m.id}">×</button>
        </div>
        <div class="list-item-meta">
          ${m.category ? `🏷️ ${m.category} · ` : ''}💰 ¥${m.price || 0}
        </div>
        <div class="record-row" style="margin-top:8px;">
          <div class="record-label">已用</div>
          <div class="record-value">${m.used || 0} / ${m.quantity}</div>
          <button class="icon-btn" data-use-mat="${m.id}" data-action="minus">−</button>
          <button class="icon-btn" data-use-mat="${m.id}" data-action="plus">＋</button>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (m.used || 0) / m.quantity * 100)}%;"></div></div>
        <div style="font-size:12px;color:var(--ink-light);text-align:right;">剩余 ${Math.max(0, remaining)}</div>
      </div>`;
    });

    return html;
  },

  // ===== 灵感记录 =====
  renderInspirationsView() {
    const data = Store.get();
    const list = data.craft.inspirations || [];
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">💡</span>灵感记录 <span style="font-size:12px;color:var(--ink-light);font-weight:400;">共 ${list.length} 条</span></div>
      <button class="btn btn-sm" id="addInspiration">＋ 记录灵感</button>
    </div>`;

    if (!list.length) {
      html += `<div class="card">${emptyState('💡', '还没有灵感记录，看到喜欢的就记下来吧')}</div>`;
      return html;
    }

    // Pinterest 风格双列卡片
    html += `<div class="inspiration-grid">`;
    list.forEach(insp => {
      const imgHTML = insp.photo
        ? `<img src="${insp.photo}" alt="${escHtml(insp.title)}" loading="lazy">`
        : `<span class="inspiration-img-placeholder">📷</span>`;

      const wantTagClass = insp.wantToMake ? 'active' : '';
      const wantText = insp.wantToMake ? '✓ 已想做' : '已想做';

      html += `<div class="inspiration-card" data-insp-id="${insp.id}">
        <div class="inspiration-img-wrap">
          ${imgHTML}
          <div class="inspiration-card-actions">
            <button class="inspiration-card-btn" data-edit-insp="${insp.id}" title="编辑">✏️</button>
            <button class="inspiration-card-btn" data-del-insp="${insp.id}" title="删除">🗑️</button>
          </div>
        </div>
        <div class="inspiration-body">
          <div class="inspiration-title">${escHtml(insp.title)}</div>
          <div class="inspiration-source">${insp.source ? escHtml(insp.source) : ''}</div>
          <div class="inspiration-tags">
            ${insp.link ? `<button class="insp-tag insp-tag-link" data-open-link="${escAttr(insp.link)}" title="打开链接">🔗 链接</button>` : ''}
            <button class="insp-tag insp-tag-ruler" data-edit-insp="${insp.id}" title="查看详情">📐 尺寸</button>
            <button class="insp-tag ${wantTagClass}" data-toggle-want="${insp.id}">${wantText}</button>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
    return html;
  },

  showInspirationModal(editId = null) {
    const data = Store.get();
    let insp = null;
    if (editId) insp = (data.craft.inspirations || []).find(x => x.id === editId);

    const currentPhoto = insp?.photo || '';

    const html = `
      ${field('标题', `<input class="input" name="title" value="${insp?.title || ''}" placeholder="如：猫咪零钱包">`)}
      ${field('来源', `<input class="input" name="source" value="${insp?.source || ''}" placeholder="如：抖音 / 小红书 / Pinterest">`)}
      ${field('链接', `<input class="input" name="link" value="${insp?.link || ''}" placeholder="原始链接（可直接打开）">`)}
      ${field('照片', `
        <div class="photo-upload-area" id="inspPhotoArea" data-photo="">
          <div id="inspPhotoPreview">${currentPhoto ? `<img src="${currentPhoto}" alt="preview">` : `<div class="photo-upload-icon">📷</div><div class="photo-upload-hint">点击上传照片</div>`}</div>
          <input type="file" accept="image/*" id="inspPhotoInput" style="display:none;">
        </div>
      `)}
      ${field('备注', `<textarea class="textarea" name="note" placeholder="想法、材质、颜色等...">${insp?.note || ''}</textarea>`)}
    `;

    showModal(editId ? '编辑灵感' : '记录灵感', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.title) { toast('请输入标题'); return false; }
          const photoData = wrap.querySelector('#inspPhotoArea').dataset.photo || '';
          const data = Store.get();
          if (!data.craft.inspirations) data.craft.inspirations = [];
          if (editId) {
            const item = data.craft.inspirations.find(x => x.id === editId);
            if (item) {
              item.title = d.title;
              item.source = d.source;
              item.link = d.link;
              if (photoData) item.photo = photoData;
              item.note = d.note;
            }
          } else {
            data.craft.inspirations.push({
              id: uid(),
              title: d.title,
              source: d.source,
              link: d.link,
              photo: photoData,
              note: d.note,
              wantToMake: false
            });
          }
          Store.save();
          toast('灵感已保存');
          this.render();
        }
      }
    ]);

    // 照片上传逻辑（延迟绑定，等 modal 渲染完）
    setTimeout(() => this._bindPhotoUpload('inspPhotoArea', 'inspPhotoInput', 'inspPhotoPreview'), 50);
  },

  _bindPhotoUpload(areaId, inputId, previewId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!area || !input || !preview) return;

    area.addEventListener('click', () => input.click());
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { toast('请选择图片文件'); return; }
      if (file.size > 3 * 1024 * 1024) { toast('图片不能超过 3MB'); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        const base64 = ev.target.result;
        area.dataset.photo = base64;
        area.classList.add('has-image');
        preview.innerHTML = `<img src="${base64}" alt="preview">`;
      };
      reader.readAsDataURL(file);
    });
  },

  // ===== 产品设计 =====
  renderProductsView() {
    const data = Store.get();
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">🎨</span>产品设计</div>
      <button class="btn btn-sm" id="addProduct">＋ 添加产品</button>
    </div>`;

    if (!data.craft.products.length) {
      html += `<div class="card">${emptyState('🎨', '还没有产品设计')}</div>`;
      return html;
    }

    data.craft.products.forEach(p => {
      const profitMin = (p.priceMin || 0) - (p.cost || 0);
      const profitMax = (p.priceMax || 0) - (p.cost || 0);

      const photoHTML = p.photo
        ? `<div class="product-photo-thumb"><img src="${p.photo}" alt="${escHtml(p.name)}" loading="lazy"></div>`
        : '';

      html += `<div class="list-item">
        <div class="list-item-header">
          <div class="product-with-photo" style="width:100%;">
            ${photoHTML}
            <div class="product-info">
              <span class="list-item-title">${escHtml(p.name)}</span>
              ${p.size ? `<div class="list-item-meta">📐 ${escHtml(p.size)}</div>` : ''}
            </div>
          </div>
          <button class="todo-del" data-del-prod="${p.id}">×</button>
        </div>
        <div class="list-item-meta">
          💰 成本 ¥${p.cost || 0} · 预期售价 ¥${p.priceMin || 0}–¥${p.priceMax || 0}
        </div>
        <div class="list-item-meta" style="margin-top:4px;">
          <span style="color:#4CAF7A;font-weight:600;">预期利润 ¥${profitMin}–¥${profitMax} / 个</span>
        </div>
        ${p.note ? `<div class="list-item-meta" style="margin-top:4px;">📝 ${escHtml(p.note)}</div>` : ''}
        <div class="list-item-actions">
          <button class="btn btn-sm btn-outline" data-edit-prod="${p.id}">编辑</button>
        </div>
      </div>`;
    });

    return html;
  },

  // ===== 排单日历 =====
  renderOrdersView() {
    const data = Store.get();
    let html = '';

    // 总览统计
    const total = data.craft.orders.length;
    const done = data.craft.orders.filter(o => o.status === 'done').length;
    const shipped = data.craft.orders.filter(o => o.status === 'shipped').length;
    const undone = data.craft.orders.filter(o => o.status !== 'done' && o.status !== 'shipped').length;
    const revenue = data.craft.orders.filter(o => o.status === 'shipped' || o.status === 'done').reduce((sum, o) => {
      const product = data.craft.products.find(p => p.name === o.productName);
      const cost = product ? product.cost : 0;
      const price = o.price || (product ? product.priceMin : 0) || 0;
      return sum + price * o.quantity - cost * o.quantity;
    }, 0);

    // 囤货清点的已赚利润：卖出数量 × (单价 − 成本)
    const stockProfit = (data.craft.stock || []).reduce((sum, s) => {
      const product = data.craft.products.find(p => p.name === s.productName);
      const cost = product ? product.cost : 0;
      const unitProfit = (s.price || 0) - cost;
      return sum + unitProfit * (s.sold || 0);
    }, 0);

    const totalProfit = revenue + stockProfit;

    html += `<div class="card">
      <div class="card-title"><span class="emoji">📊</span>排单总览</div>
      <div class="overview-grid">
        <div class="overview-item">
          <div class="overview-num">${undone}</div>
          <div class="overview-label">未完成</div>
        </div>
        <div class="overview-item">
          <div class="overview-num">${done}</div>
          <div class="overview-label">已完成</div>
        </div>
        <div class="overview-item">
          <div class="overview-num">${shipped}</div>
          <div class="overview-label">已发货</div>
        </div>
        <div class="overview-item">
          <div class="overview-num">¥${totalProfit}</div>
          <div class="overview-label">已赚利润</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--ink-light);margin:6px 0 10px;">已赚 = 订单 ¥${revenue} ＋ 囤货 ¥${stockProfit}</div>
      <button class="btn btn-sm" id="addOrder">＋ 添加订单</button>
    </div>`;

    // 子导航：当日排单 / 所有订单 / 囤货清点（并列）
    html += `<div class="segment">
      <button class="segment-item ${this.orderView === 'today' ? 'active' : ''}" data-order-view="today">📝 当日排单</button>
      <button class="segment-item ${this.orderView === 'orders' ? 'active' : ''}" data-order-view="orders">📋 所有订单</button>
      <button class="segment-item ${this.orderView === 'stock' ? 'active' : ''}" data-order-view="stock">🏷️ 囤货清点</button>
    </div>`;

    if (this.orderView === 'today') {
    // 日历
    const eventMap = {};
    data.craft.orders.forEach(o => {
      if (o.schedule) {
        Object.keys(o.schedule).forEach(ds => {
          if (!eventMap[ds]) eventMap[ds] = [];
          eventMap[ds].push(o.urgent ? '#FF1744' : '#4A90D9');
        });
      }
    });

    html += `<div class="card">
      <div class="card-title"><span class="emoji">📅</span>排单日历</div>
      <div id="orderCalendar"></div>
    </div>`;

    // 当天排单（手动把订单排到这一天）
    const addableOrders = data.craft.orders.filter(o =>
      o.status !== 'done' && o.status !== 'shipped' && !(o.schedule && o.schedule[currentDate])
    );

    html += `<div class="card">
      <div class="card-title"><span class="emoji">📝</span>${fmtDate(currentDate)}排单</div>`;

    const dayOrders = data.craft.orders.filter(o =>
      o.schedule && o.schedule[currentDate] && o.status !== 'shipped'
    );
    if (dayOrders.length) {
      dayOrders.forEach(o => {
        const s = o.schedule[currentDate];
        const doneStyle = (s.done || o.status === 'done') ? 'opacity:0.6;' : '';
        html += `<div class="list-item" style="${o.urgent ? 'border-left:4px solid #FF1744;' : ''}${doneStyle}">
          <div class="list-item-header">
            <span class="list-item-title">${o.productName} · ${o.customer}</span>
            <div style="display:flex;gap:4px;flex-shrink:0;">
              ${(s.done || o.status === 'done') ? '<span class="tag tag-green">已完成</span>' : ''}
              ${o.urgent ? '<span class="tag tag-urgent">🔥加急</span>' : ''}
            </div>
          </div>
          <div class="list-item-meta">📅 ${o.deadline || '未设'} · 共 ${o.quantity} 个</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:8px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:12px;color:var(--ink-light);">计划</span>
              <span style="font-size:14px;font-weight:600;color:var(--ink);">${s.qty}</span>
              <button class="icon-btn" data-day-qty="${o.id}|${currentDate}" data-act="minus">−</button>
              <button class="icon-btn" data-day-qty="${o.id}|${currentDate}" data-act="plus">＋</button>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;">
              <button class="btn btn-sm ${(s.done || o.status === 'done') ? '' : 'btn-outline'}" data-day-done="${o.id}|${currentDate}" style="padding:4px 10px;font-size:11px;">${(s.done || o.status === 'done') ? '✅完成' : '标记完成'}</button>
              <button class="btn btn-sm btn-danger" data-remove-from-day="${o.id}|${currentDate}" style="padding:4px 10px;font-size:11px;">移除</button>
            </div>
          </div>
          ${o.note ? `<div style="font-size:12px;color:var(--ink-light);margin-top:4px;">📝 ${o.note}</div>` : ''}
        </div>`;
      });
    } else {
      html += emptyState('🎉', '今天还没有排单');
    }

    // 把订单排到这一天
    if (addableOrders.length) {
      html += `<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:10px;">
        <div style="font-size:13px;color:var(--ink);margin-bottom:6px;font-weight:600;">＋ 把订单排到这一天</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select class="input" id="addToDaySelect" style="flex:1;">${addableOrders.map(o => `<option value="${o.id}">${o.productName} ×${o.quantity} · ${o.customer}</option>`).join('')}</select>
          <button class="btn btn-sm" id="addToDay">添加</button>
        </div>
      </div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--ink-light);margin-top:8px;">没有可排的未完成订单（都已排到这天，或暂无订单）。</div>`;
    }
    html += `</div>`;

    } else if (this.orderView === 'orders') {
    // 所有订单列表
    const kw = (this.orderKeyword || '').trim().toLowerCase();
    const statusFilter = this.orderStatusFilter || 'all';
    html += `<div class="card">
      <div class="card-title"><span class="emoji">📋</span>所有订单</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <input class="input" id="orderSearch" placeholder="🔍 搜索产品/客户..." value="${this.orderKeyword || ''}">
      </div>
      <div class="segment" style="margin-bottom:10px;">
        ${['all', 'pending', 'done', 'shipped'].map(s => `<button class="segment-item ${statusFilter === s ? 'active' : ''}" data-order-filter="${s}">${s === 'all' ? '全部' : { pending: '未完成', done: '已完成', shipped: '已发货' }[s]}</button>`).join('')}
      </div>`;

    if (!data.craft.orders.length) {
      html += emptyState('📋', '还没有订单');
    } else {
      // 过滤
      let filtered = data.craft.orders;
      if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
      if (kw) filtered = filtered.filter(o => (o.productName + o.customer + (o.note || '')).toLowerCase().includes(kw));

      // 排序：未完成在前，加急优先
      const sorted = [...filtered].sort((a, b) => {
        const aDone = a.status === 'done' || a.status === 'shipped';
        const bDone = b.status === 'done' || b.status === 'shipped';
        if (aDone !== bDone) return aDone ? 1 : -1;
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
        return 0;
      });

      if (!sorted.length) {
        html += emptyState('🔍', '没有匹配的订单');
      } else {
        sorted.forEach(o => {
          const product = data.craft.products.find(p => p.name === o.productName);
          const statusMap = { pending: '未完成', done: '已完成', shipped: '已发货' };
          html += `<div class="list-item" style="${o.urgent && o.status === 'pending' ? 'border:2px solid #FF1744;' : ''} ${o.status !== 'pending' ? 'opacity:0.7;' : ''}">
            <div class="list-item-header">
              <span class="list-item-title">${o.productName} ×${o.quantity}</span>
              <div>
                ${o.urgent && o.status === 'pending' ? '<span class="tag tag-urgent">🔥加急</span>' : ''}
                <span class="tag ${o.status === 'shipped' ? 'tag-green' : o.status === 'done' ? 'tag-blue' : 'tag-pink'}">${statusMap[o.status]}</span>
              </div>
            </div>
            <div class="list-item-meta">
              👤 ${o.customer} · 📍 ${o.address || '无地址'}
            </div>
            <div class="list-item-meta">
              📅 deadline: ${o.deadline || '未设置'}
              ${product ? ` · 💰 ¥${(o.price || product.priceMin || 0) * o.quantity}` : ''}
            </div>
            ${o.note ? `<div class="list-item-meta" style="margin-top:2px;">📝 ${o.note}</div>` : ''}
            <div class="list-item-actions" style="flex-wrap:wrap;gap:6px;">
              <button class="btn btn-sm ${o.status === 'pending' ? '' : 'btn-outline'}" data-order-status="${o.id}" data-status="pending">未完成</button>
              <button class="btn btn-sm ${o.status === 'done' ? '' : 'btn-outline'}" data-order-status="${o.id}" data-status="done">已完成</button>
              <button class="btn btn-sm ${o.status === 'shipped' ? '' : 'btn-outline'}" data-order-status="${o.id}" data-status="shipped">已发货</button>
              <button class="btn btn-sm btn-outline" data-edit-order="${o.id}">编辑</button>
              ${o.status === 'pending' ? `<button class="btn btn-sm btn-outline" data-add-order-today="${o.id}">排到所选日</button>` : ''}
              <button class="btn btn-sm btn-danger" data-del-order="${o.id}">删除</button>
            </div>
          </div>`;
        });
      }
    }
    html += `</div>`;

    } else {
    // 囤货清点
    html += this.renderStockSection();
    } // end orderView switch

    return html;
  },

  // ===== 囤货清点 =====
  renderStockSection() {
    const data = Store.get();
    const products = data.craft.products;
    let html = `<div class="card">
      <div class="card-title"><span class="emoji">🏷️</span>囤货清点</div>
      <button class="btn btn-sm" id="addStock">＋ 添加囤货</button>
    </div>`;

    if (!products.length) {
      html += `<div class="card">${emptyState('🎨', '请先在「产品设计」中添加产品')}</div>`;
      return html;
    }

    const stock = data.craft.stock || [];
    if (!stock.length) {
      html += `<div class="card">${emptyState('📦', '还没有囤货记录')}</div>`;
      return html;
    }

    stock.forEach(s => {
      const product = products.find(p => p.name === s.productName);
      const cost = product ? product.cost : 0;
      const unitProfit = (s.price || 0) - cost;
      const earned = unitProfit * (s.sold || 0);
      html += `<div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${s.productName}</span>
          <button class="todo-del" data-del-stock="${s.id}">×</button>
        </div>
        <div class="list-item-meta">单价 ¥${s.price || 0} · 成本 ¥${cost} · 单利 ¥${unitProfit}</div>
        <div class="record-row" style="margin-top:8px;">
          <div class="record-label">已做</div>
          <div class="record-value">${s.made || 0}</div>
          <button class="icon-btn" data-stock-made="${s.id}" data-act="minus">−</button>
          <button class="icon-btn" data-stock-made="${s.id}" data-act="plus">＋</button>
        </div>
        <div class="record-row" style="margin-top:6px;">
          <div class="record-label">卖出</div>
          <div class="record-value">${s.sold || 0}</div>
          <button class="icon-btn" data-stock-sold="${s.id}" data-act="minus">−</button>
          <button class="icon-btn" data-stock-sold="${s.id}" data-act="plus">＋</button>
        </div>
        <div style="font-size:13px;color:#4CAF7A;margin-top:6px;font-weight:600;">已赚 ¥${earned}</div>
        <div class="list-item-actions">
          <button class="btn btn-sm btn-outline" data-edit-stock="${s.id}">改单价</button>
        </div>
      </div>`;
    });

    return html;
  },

  showStockModal(editId = null) {
    const data = Store.get();
    let s = null;
    if (editId) s = data.craft.stock.find(x => x.id === editId);

    const productOptions = data.craft.products.map(p => ({ value: p.name, label: `${p.name} (预期¥${p.priceMin}–¥${p.priceMax})` }));
    const priceHint = editId && s
      ? `当前单价 ¥${s.price || 0}`
      : '实际卖出单价（默认取预期下限）';

    const html = `
      ${productOptions.length
        ? selectField('产品', 'productName', [...[{value:'',label:'选择产品'}], ...productOptions], s?.productName || '')
        : field('产品名', `<input class="input" name="productName" value="${s?.productName || ''}" placeholder="请先在产品设计添加">`)
      }
      ${field('单价（实际售价）', `<input class="input" type="number" step="0.01" name="price" value="${s?.price ?? ''}" placeholder="${priceHint}">`)}
      ${editId ? `<div class="field-row">
        <div class="field">${field('已做', `<input class="input" type="number" name="made" value="${s?.made || 0}">`)}</div>
        <div class="field">${field('卖出', `<input class="input" type="number" name="sold" value="${s?.sold || 0}">`)}</div>
      </div>` : ''}
    `;

    showModal(editId ? '编辑囤货' : '添加囤货', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.productName || d.price === '' || isNaN(parseFloat(d.price))) { toast('请选择产品并填写单价'); return false; }
          const data = Store.get();
          if (editId) {
            const s = data.craft.stock.find(x => x.id === editId);
            s.productName = d.productName;
            s.price = parseFloat(d.price) || 0;
            if (d.made !== undefined) s.made = parseInt(d.made) || 0;
            if (d.sold !== undefined) s.sold = parseInt(d.sold) || 0;
          } else {
            data.craft.stock.push({
              id: uid(),
              productName: d.productName,
              price: parseFloat(d.price) || 0,
              made: 0,
              sold: 0
            });
          }
          Store.save();
          toast('已保存');
          this.render();
        }
      }
    ]);
  },

  bindEvents() {
    const self = this;

    $$('.segment-item').forEach(btn => {
      if (!btn.dataset.section) return; // 订单筛选按钮不在此处理
      btn.addEventListener('click', () => {
        self.currentSection = btn.dataset.section;
        self.render();
      });
    });

    // 排单日历子导航：当日排单 / 所有订单 / 囤货清点（并列切换）
    $$('[data-order-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        self.orderView = btn.dataset.orderView;
        self.render();
      });
    });

    // 订单搜索
    const orderSearch = $('#orderSearch');
    if (orderSearch) {
      orderSearch.addEventListener('input', e => {
        self.orderKeyword = e.target.value;
        self.render();
        const box = $('#orderSearch');
        if (box) { box.focus(); const len = box.value.length; box.setSelectionRange(len, len); }
      });
    }

    // 订单状态筛选
    $$('[data-order-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        self.orderStatusFilter = btn.dataset.orderFilter;
        self.render();
      });
    });

    // ===== 材料 =====
    const addMat = $('#addMaterial');
    if (addMat) {
      addMat.addEventListener('click', () => {
        const data = Store.get();
        const categories = [...new Set(data.craft.materials.map(m => m.category).filter(Boolean))];
        const html = `
          ${field('名称', `<input class="input" name="name" placeholder="如：布料">`)}
          ${field('品类', `<input class="input" name="category" list="matCats" placeholder="如：布料/配件/工具">`)}
          <div class="field-row">
            <div class="field">${field('价格', `<input class="input" type="number" step="0.01" name="price" placeholder="¥">`)}</div>
            <div class="field">${field('数量', `<input class="input" type="number" name="quantity" value="1">`)}</div>
          </div>
        `;
        showModal('添加材料', html, [
          { label: '取消', style: 'btn-outline' },
          {
            label: '保存',
            onClick: wrap => {
              const d = getFormData(wrap);
              if (!d.name || !d.quantity) { toast('请填写名称和数量'); return false; }
              const data = Store.get();
              data.craft.materials.push({
                id: uid(),
                name: d.name,
                category: d.category,
                price: parseFloat(d.price) || 0,
                quantity: parseInt(d.quantity),
                used: 0
              });
              Store.save();
              toast('材料已添加');
              self.render();
            }
          }
        ]);
      });
    }

    // 材料用量
    $$('[data-use-mat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.useMat;
        const action = btn.dataset.action;
        const data = Store.get();
        const m = data.craft.materials.find(x => x.id === id);
        if (m) {
          if (action === 'plus') {
            if ((m.used || 0) < m.quantity) m.used = (m.used || 0) + 1;
            else { toast('已用完'); return; }
          } else {
            if ((m.used || 0) > 0) m.used = (m.used || 0) - 1;
          }
          Store.save();
          self.render();
        }
      });
    });

    // 删除材料
    $$('[data-del-mat]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这个材料？', () => {
          const data = Store.get();
          data.craft.materials = data.craft.materials.filter(m => m.id !== btn.dataset.delMat);
          Store.save();
          self.render();
        });
      });
    });

    // ===== 灵感记录 =====
    const addInsp = $('#addInspiration');
    if (addInsp) {
      addInsp.addEventListener('click', () => self.showInspirationModal());
    }

    $$('[data-edit-insp]').forEach(btn => {
      btn.addEventListener('click', () => self.showInspirationModal(btn.dataset.editInsp));
    });

    $$('[data-del-insp]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这条灵感记录？', () => {
          const data = Store.get();
          data.craft.inspirations = (data.craft.inspirations || []).filter(i => i.id !== btn.dataset.delInsp);
          Store.save();
          self.render();
        });
      });
    });

    // 已想做 切换
    $$('[data-toggle-want]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.toggleWant;
        const data = Store.get();
        const insp = (data.craft.inspirations || []).find(x => x.id === id);
        if (insp) {
          insp.wantToMake = !insp.wantToMake;
          Store.save();
          self.render();
        }
      });
    });

    // 打开链接
    $$('[data-open-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.openLink;
        if (url) window.open(url, '_blank');
      });
    });

    // ===== 产品 =====
    const addProd = $('#addProduct');
    if (addProd) {
      addProd.addEventListener('click', () => self.showProductModal());
    }

    $$('[data-edit-prod]').forEach(btn => {
      btn.addEventListener('click', () => self.showProductModal(btn.dataset.editProd));
    });

    $$('[data-del-prod]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这个产品？', () => {
          const data = Store.get();
          data.craft.products = data.craft.products.filter(p => p.id !== btn.dataset.delProd);
          Store.save();
          self.render();
        });
      });
    });

    // ===== 订单 =====
    const addOrder = $('#addOrder');
    if (addOrder) {
      addOrder.addEventListener('click', () => self.showOrderModal());
    }

    $$('[data-edit-order]').forEach(btn => {
      btn.addEventListener('click', () => self.showOrderModal(btn.dataset.editOrder));
    });

    $$('[data-del-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这个订单？', () => {
          const data = Store.get();
          data.craft.orders = data.craft.orders.filter(o => o.id !== btn.dataset.delOrder);
          Store.save();
          self.render();
        });
      });
    });

    // 订单状态切换
    $$('[data-order-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.orderStatus;
        const status = btn.dataset.status;
        const data = Store.get();
        const o = data.craft.orders.find(x => x.id === id);
        if (o) {
          o.status = status;
          // 标记为已完成时，自动复制客户名和地址
          if (status === 'done') {
            const text = `${o.customer}\n${o.address || ''}`;
            copyText(text);
            toast('已完成，客户信息已复制');
          }
          Store.save();
          if (status !== 'done') self.render();
          else self.render();
        }
      });
    });

    // ===== 囤货清点 =====
    const addStock = $('#addStock');
    if (addStock) {
      addStock.addEventListener('click', () => self.showStockModal());
    }

    $$('[data-edit-stock]').forEach(btn => {
      btn.addEventListener('click', () => self.showStockModal(btn.dataset.editStock));
    });

    $$('[data-del-stock]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这条囤货记录？', () => {
          const data = Store.get();
          data.craft.stock = data.craft.stock.filter(s => s.id !== btn.dataset.delStock);
          Store.save();
          self.render();
        });
      });
    });

    // 已做 步进
    $$('[data-stock-made]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.stockMade;
        const act = btn.dataset.act;
        const data = Store.get();
        const s = data.craft.stock.find(x => x.id === id);
        if (s) {
          if (act === 'plus') s.made = (s.made || 0) + 1;
          else s.made = Math.max(0, (s.made || 0) - 1);
          Store.save();
          self.render();
        }
      });
    });

    // 卖出 步进
    $$('[data-stock-sold]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.stockSold;
        const act = btn.dataset.act;
        const data = Store.get();
        const s = data.craft.stock.find(x => x.id === id);
        if (s) {
          if (act === 'plus') s.sold = (s.sold || 0) + 1;
          else s.sold = Math.max(0, (s.sold || 0) - 1);
          Store.save();
          self.render();
        }
      });
    });

    // ===== 订单每日计划：数量调整 =====
    $$('[data-day-qty]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [id, ds] = btn.dataset.dayQty.split('|');
        const act = btn.dataset.act;
        const data = Store.get();
        const o = data.craft.orders.find(x => x.id === id);
        if (o && o.schedule && o.schedule[ds]) {
          const s = o.schedule[ds];
          if (act === 'plus') s.qty = (s.qty || 0) + 1;
          else s.qty = Math.max(0, (s.qty || 0) - 1);
          Store.save();
          self.render();
        }
      });
    });

    // 订单每日计划：完成切换（标记当日完成同时将该订单整体置为已完成）
    $$('[data-day-done]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [id, ds] = btn.dataset.dayDone.split('|');
        const data = Store.get();
        const o = data.craft.orders.find(x => x.id === id);
        if (o && o.schedule && o.schedule[ds]) {
          const nowDone = !o.schedule[ds].done;
          o.schedule[ds].done = nowDone;
          if (nowDone) o.status = 'done';
          else if (o.status === 'done') o.status = 'pending';
          Store.save();
          self.render();
        }
      });
    });

    // 把订单排到当前选中的这一天
    const addToDay = $('#addToDay');
    if (addToDay) {
      addToDay.addEventListener('click', () => {
        const sel = $('#addToDaySelect');
        const id = sel ? sel.value : '';
        if (!id) return;
        const data = Store.get();
        const o = data.craft.orders.find(x => x.id === id);
        if (o) {
          if (!o.schedule) o.schedule = {};
          o.schedule[currentDate] = { qty: o.quantity, done: false };
          Store.save();
          toast(`已排到 ${fmtDate(currentDate)}`);
          self.render();
        }
      });
    }

    // 从这一天移除订单排单
    $$('[data-remove-from-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [id, ds] = btn.dataset.removeFromDay.split('|');
        confirmDialog('从这一天移除该订单排单？', () => {
          const data = Store.get();
          const o = data.craft.orders.find(x => x.id === id);
          if (o && o.schedule && o.schedule[ds]) {
            delete o.schedule[ds];
            Store.save();
            self.render();
          }
        });
      });
    });

    // 订单列表里快速排到所选日
    $$('[data-add-order-today]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.addOrderToday;
        const data = Store.get();
        const o = data.craft.orders.find(x => x.id === id);
        if (o && o.status !== 'done' && o.status !== 'shipped') {
          if (!o.schedule) o.schedule = {};
          o.schedule[currentDate] = { qty: o.quantity, done: false };
          Store.save();
          toast(`已排到 ${fmtDate(currentDate)}`);
          self.render();
        }
      });
    });

    // 渲染排单日历
    if (self.currentSection === 'orders') {
      const calEl = $('#orderCalendar');
      if (calEl) {
        const data = Store.get();
        const eventMap = {};
        data.craft.orders.forEach(o => {
          if (o.schedule) {
            Object.keys(o.schedule).forEach(ds => {
              if (!eventMap[ds]) eventMap[ds] = [];
              eventMap[ds].push(o.urgent ? '#FF1744' : '#4A90D9');
            });
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
  },

  showProductModal(editId = null) {
    const data = Store.get();
    let p = null;
    if (editId) p = data.craft.products.find(x => x.id === editId);

    const currentPhoto = p?.photo || '';

    const html = `
      ${field('名称', `<input class="input" name="name" value="${p?.name || ''}" placeholder="产品名称">`)}
      <div class="field-row">
        <div class="field">${field('成本', `<input class="input" type="number" step="0.01" name="cost" value="${p?.cost || ''}" placeholder="¥">`)}</div>
        <div class="field">${field('预期售价下限', `<input class="input" type="number" step="0.01" name="priceMin" value="${p?.priceMin || ''}" placeholder="¥">`)}</div>
      </div>
      <div class="field-row">
        <div class="field">${field('预期售价上限', `<input class="input" type="number" step="0.01" name="priceMax" value="${p?.priceMax || ''}" placeholder="¥">`)}</div>
        <div class="field"></div>
      </div>
      ${field('尺寸', `<input class="input" name="size" value="${p?.size || ''}" placeholder="如：20×15cm / 长30宽20高10">`)}
      ${field('产品照片', `
        <div class="photo-upload-area" id="prodPhotoArea" data-photo="">
          <div id="prodPhotoPreview">${currentPhoto ? `<img src="${currentPhoto}" alt="preview">` : `<div class="photo-upload-icon">📷</div><div class="photo-upload-hint">点击上传产品照片</div>`}</div>
          <input type="file" accept="image/*" id="prodPhotoInput" style="display:none;">
        </div>
      `)}
      ${field('备注', `<textarea class="textarea" name="note" placeholder="产品备注...">${p?.note || ''}</textarea>`)}
    `;

    showModal(editId ? '编辑产品' : '添加产品', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.name) { toast('请输入名称'); return false; }
          const photoData = wrap.querySelector('#prodPhotoArea').dataset.photo || '';
          const data = Store.get();
          if (editId) {
            const p = data.craft.products.find(x => x.id === editId);
            p.name = d.name; p.cost = parseFloat(d.cost) || 0;
            p.priceMin = parseFloat(d.priceMin) || 0;
            p.priceMax = parseFloat(d.priceMax) || 0;
            p.size = d.size;
            if (photoData) p.photo = photoData;
            p.note = d.note;
          } else {
            data.craft.products.push({
              id: uid(), name: d.name,
              cost: parseFloat(d.cost) || 0,
              priceMin: parseFloat(d.priceMin) || 0,
              priceMax: parseFloat(d.priceMax) || 0,
              size: d.size,
              photo: photoData,
              note: d.note
            });
          }
          Store.save();
          toast('产品已保存');
          this.render();
        }
      }
    ]);

    // 照片上传逻辑
    setTimeout(() => this._bindPhotoUpload('prodPhotoArea', 'prodPhotoInput', 'prodPhotoPreview'), 50);
  },

  showOrderModal(editId = null) {
    const data = Store.get();
    let o = null;
    if (editId) o = data.craft.orders.find(x => x.id === editId);

    const productOptions = data.craft.products.map(p => ({ value: p.name, label: `${p.name} (预期¥${p.priceMin}–¥${p.priceMax})` }));

    const html = `
      ${productOptions.length ?
        selectField('产品', 'productName', [...[{value:'',label:'选择产品'}], ...productOptions], o?.productName || '') :
        field('产品名', `<input class="input" name="productName" value="${o?.productName || ''}" placeholder="请先在「产品设计」添加">`)
      }
      <div class="field-row">
        <div class="field">${field('数量', `<input class="input" type="number" name="quantity" value="${o?.quantity || 1}">`)}</div>
        <div class="field">${field('单价', `<input class="input" type="number" step="0.01" name="price" value="${o?.price || ''}" placeholder="实际售价（默认取预期下限）">`)}</div>
      </div>
      ${field('客户名', `<input class="input" name="customer" value="${o?.customer || ''}" placeholder="客户姓名">`)}
      ${field('收货地址', `<textarea class="textarea" name="address" placeholder="收货地址">${o?.address || ''}</textarea>`)}
      ${field('Deadline', `<input class="input" type="date" name="deadline" value="${o?.deadline || ''}">`)}
      ${field('备注', `<input class="input" name="note" value="${o?.note || ''}" placeholder="订单备注">`)}
      <div class="field">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" name="urgent" ${o?.urgent ? 'checked' : ''} style="width:20px;height:20px;">
          <span style="font-size:14px;color:var(--ink);">🔥 加急单</span>
        </label>
      </div>
    `;

    showModal(editId ? '编辑订单' : '添加订单', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.productName || !d.quantity || !d.customer) { toast('请填写产品、数量和客户名'); return false; }
          const data = Store.get();

          // 获取价格（默认取预期售价下限）
          const product = data.craft.products.find(p => p.name === d.productName);
          const price = d.price ? parseFloat(d.price) : (product ? product.priceMin : 0);

          if (editId) {
            const o = data.craft.orders.find(x => x.id === editId);
            o.productName = d.productName;
            o.quantity = parseInt(d.quantity);
            o.price = price;
            o.customer = d.customer;
            o.address = d.address;
            o.deadline = d.deadline;
            o.note = d.note;
            o.urgent = d.urgent;
            // 排单日期由用户在日历中手动添加，这里不自动生成
          } else {
            const newOrder = {
              id: uid(),
              productName: d.productName,
              quantity: parseInt(d.quantity),
              price: price,
              customer: d.customer,
              address: d.address,
              deadline: d.deadline,
              note: d.note,
              urgent: d.urgent,
              status: 'pending',
              createdDate: todayStr(),
              schedule: {} // 排单日期由用户在日历中手动添加
            };
            data.craft.orders.push(newOrder);
          }
          Store.save();
          toast('订单已保存');
          this.render();
        }
      }
    ]);
  }
};
