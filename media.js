/**
 * 自媒体运营模块
 */

const Media = {
  currentSection: 'calendar',

  render() {
    let html = renderAlerts();

    html += `
      <div class="segment">
        <button class="segment-item ${this.currentSection === 'calendar' ? 'active' : ''}" data-section="calendar">📅 发文日历</button>
        <button class="segment-item ${this.currentSection === 'ideas' ? 'active' : ''}" data-section="ideas">💡 灵感选题</button>
      </div>
    `;

    switch (this.currentSection) {
      case 'calendar': html += this.renderCalendarView(); break;
      case 'ideas': html += this.renderIdeasView(); break;
    }

    $('#appMain').innerHTML = html;
    this.bindEvents();
  },

  // ===== 发文日历 =====
  renderCalendarView() {
    const data = Store.get();
    const eventMap = {};

    Object.keys(data.media.calendar).forEach(ds => {
      const items = data.media.calendar[ds];
      if (items && items.length) {
        eventMap[ds] = items.map(i => ACCOUNT_COLORS[i.account] || '#FF7BA5');
      }
    });

    let html = `<div class="card">
      <div class="card-title"><span class="emoji">📅</span>发文日历</div>
      <div id="mediaCalendar"></div>
    </div>`;

    // 帐号图例
    html += `<div class="card">
      <div class="card-title"><span class="emoji">🏷️</span>帐号图例</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${data.media.accounts.map(acc => `
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:12px;height:12px;border-radius:50%;background:${ACCOUNT_COLORS[acc]};"></div>
            <span style="font-size:13px;">${acc}</span>
          </div>
        `).join('')}
      </div>
    </div>`;

    // 当天发文
    html += `<div class="card">
      <div class="card-title"><span class="emoji">📝</span>${fmtDate(currentDate)}发文安排</div>
      <button class="btn btn-sm" id="addPost">＋ 添加发文</button>
      <div style="margin-top:12px;" id="postList">`;

    const dayPosts = data.media.calendar[currentDate] || [];
    if (dayPosts.length) {
      html += dayPosts.map(p => `
        <div class="list-item" style="border-left:4px solid ${ACCOUNT_COLORS[p.account]};">
          <div class="list-item-header">
            <span class="list-item-title">${p.title}</span>
            <span class="tag" style="background:${ACCOUNT_BG[p.account]};color:${ACCOUNT_COLORS[p.account]};">${p.account}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-outline" data-edit-post="${p.id}">编辑</button>
            <button class="btn btn-sm btn-danger" data-del-post="${p.id}">删除</button>
          </div>
        </div>
      `).join('');
    } else {
      html += emptyState('📭', '今天还没有发文安排');
    }

    html += `</div></div>`;

    return html;
  },

  // ===== 灵感选题 =====
  renderIdeasView() {
    const data = Store.get();
    const accounts = data.media.accounts;
    const sel = this.ideaAccount || accounts[0];
    const kw = (this.ideaKeyword || '').trim().toLowerCase();
    const filterIdeas = list => kw
      ? list.filter(i => (i.title + (i.content || '')).toLowerCase().includes(kw))
      : list;

    let html = `<div class="card">
      <div class="card-title">灵感选题</div>
      <div class="segment">
        ${accounts.map(a => `<button class="segment-item ${sel === a ? 'active' : ''}" data-idea-account="${a}">${a}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <input class="input" id="ideaSearch" placeholder="搜索灵感标题或内容..." value="${this.ideaKeyword || ''}">
      </div>
      <button class="btn btn-sm" id="addIdea">＋ 添加灵感</button>
    </div>`;

    // 仅显示选中的帐号
    let ideas = data.media.ideas.filter(i => i.account === sel);
    ideas = filterIdeas(ideas);
    // 未发在前，已发在后
    const unpublished = ideas.filter(i => !i.published);
    const published = ideas.filter(i => i.published);

    if (!ideas.length) {
      html += emptyState('还没有灵感，记录一个吧');
    } else {
      if (unpublished.length) {
        html += `<div class="card"><div class="card-title">待发布 <span class="tag tag-pink" style="margin-left:auto;">${unpublished.length}</span></div>`;
        html += unpublished.map(i => this.renderIdeaItem(i)).join('');
        html += `</div>`;
      }
      if (published.length) {
        html += `<div class="card"><div class="card-title">已发布 <span class="tag tag-green" style="margin-left:auto;">${published.length}</span></div>`;
        html += published.map(i => this.renderIdeaItem(i)).join('');
        html += `</div>`;
      }
    }

    return html;
  },

  renderIdeaItem(i) {
    let html = `<div class="list-item" style="${i.published ? 'opacity:0.7;' : ''}border-left:4px solid ${ACCOUNT_COLORS[i.account]};">
      <div class="list-item-header">
        <span class="list-item-title">${i.title}</span>
        ${i.publishDate ? `<span class="tag tag-pink">${fmtDate(i.publishDate)}</span>` : ''}
        ${i.published ? `<span class="tag tag-green">已发布</span>` : ''}
      </div>`;
    if (i.content) {
      html += `<div class="list-item-meta" style="margin-bottom:6px;white-space:pre-wrap;">${i.content}</div>`;
    }
    html += `<div class="list-item-actions">
      ${!i.published && !i.publishDate ? `<button class="btn btn-sm btn-outline" data-schedule="${i.id}">📅 加入日历</button>` : ''}
      ${!i.published && i.publishDate ? `<button class="btn btn-sm btn-outline" data-unschedule="${i.id}">取消日历</button>` : ''}
      <button class="btn btn-sm btn-outline" data-edit-idea="${i.id}">编辑</button>
      ${!i.published ? `<button class="btn btn-sm" data-publish="${i.id}">标记已发</button>` : ''}
      <button class="btn btn-sm btn-danger" data-del-idea="${i.id}">删除</button>
    </div></div>`;
    return html;
  },

  bindEvents() {
    const self = this;

    $$('.segment-item').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.section) {
          self.currentSection = btn.dataset.section;
          self.render();
        }
      });
    });

    // 灵感帐号切换（按一个方向出现对应选题）
    $$('[data-idea-account]').forEach(btn => {
      btn.addEventListener('click', () => {
        self.ideaAccount = btn.dataset.ideaAccount;
        self.render();
      });
    });

    // 灵感搜索
    const ideaSearch = $('#ideaSearch');
    if (ideaSearch) {
      ideaSearch.addEventListener('input', e => {
        self.ideaKeyword = e.target.value;
        self.render();
        const box = $('#ideaSearch');
        if (box) {
          box.focus();
          const len = box.value.length;
          box.setSelectionRange(len, len);
        }
      });
    }

    // 渲染日历
    if (self.currentSection === 'calendar') {
      const calEl = $('#mediaCalendar');
      if (calEl) {
        const data = Store.get();
        const eventMap = {};
        Object.keys(data.media.calendar).forEach(ds => {
          const items = data.media.calendar[ds];
          if (items && items.length) {
            eventMap[ds] = items.map(i => ACCOUNT_COLORS[i.account] || '#FF7BA5');
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

    // 添加发文
    const addPost = $('#addPost');
    if (addPost) {
      addPost.addEventListener('click', () => self.showAddPostModal());
    }

    // 编辑发文
    $$('[data-edit-post]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.editPost;
        self.showAddPostModal(id);
      });
    });

    // 删除发文
    $$('[data-del-post]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delPost;
        confirmDialog('确认删除这篇发文安排？', () => {
          const data = Store.get();
          if (data.media.calendar[currentDate]) {
            data.media.calendar[currentDate] = data.media.calendar[currentDate].filter(p => p.id !== id);
            if (!data.media.calendar[currentDate].length) delete data.media.calendar[currentDate];
            Store.save();
            self.render();
          }
        });
      });
    });

    // 添加灵感
    const addIdea = $('#addIdea');
    if (addIdea) {
      addIdea.addEventListener('click', () => self.showAddIdeaModal());
    }

    // 编辑灵感
    $$('[data-edit-idea]').forEach(btn => {
      btn.addEventListener('click', () => {
        self.showAddIdeaModal(btn.dataset.editIdea);
      });
    });

    // 删除灵感
    $$('[data-del-idea]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delIdea;
        confirmDialog('确认删除这个灵感？', () => {
          const data = Store.get();
          const idea = data.media.ideas.find(i => i.id === id);
          // 如果有发布日期，从日历中移除
          if (idea && idea.publishDate && data.media.calendar[idea.publishDate]) {
            data.media.calendar[idea.publishDate] = data.media.calendar[idea.publishDate].filter(p => p.ideaId !== id);
            if (!data.media.calendar[idea.publishDate].length) delete data.media.calendar[idea.publishDate];
          }
          data.media.ideas = data.media.ideas.filter(i => i.id !== id);
          Store.save();
          self.render();
        });
      });
    });

    // 加入日历
    $$('[data-schedule]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.schedule;
        self.showScheduleModal(id);
      });
    });

    // 取消日历
    $$('[data-unschedule]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.unschedule;
        const data = Store.get();
        const idea = data.media.ideas.find(i => i.id === id);
        if (idea && idea.publishDate) {
          if (data.media.calendar[idea.publishDate]) {
            data.media.calendar[idea.publishDate] = data.media.calendar[idea.publishDate].filter(p => p.ideaId !== id);
            if (!data.media.calendar[idea.publishDate].length) delete data.media.calendar[idea.publishDate];
          }
          idea.publishDate = '';
          Store.save();
          self.render();
        }
      });
    });

    // 标记已发
    $$('[data-publish]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.publish;
        const data = Store.get();
        const idea = data.media.ideas.find(i => i.id === id);
        if (idea) {
          idea.published = true;
          // 标记日历中的发文为已完成
          if (idea.publishDate && data.media.calendar[idea.publishDate]) {
            const post = data.media.calendar[idea.publishDate].find(p => p.ideaId === id);
            if (post) post.done = true;
          }
          Store.save();
          toast('已标记为已发布');
          self.render();
        }
      });
    });
  },

  showAddPostModal(editId = null) {
    const data = Store.get();
    let post = null;
    if (editId) {
      post = (data.media.calendar[currentDate] || []).find(p => p.id === editId);
    }

    const html = `
      ${selectField('帐号', 'account', data.media.accounts.map(a => ({ value: a, label: a })), post?.account || '')}
      ${field('标题', `<input class="input" name="title" value="${post?.title || ''}" placeholder="发文标题">`)}
      ${field('日期', `<input class="input" type="date" name="date" value="${currentDate}">`)}
    `;

    showModal(editId ? '编辑发文' : '添加发文', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.account || !d.title) { toast('请填写完整'); return false; }
          const data = Store.get();
          const date = d.date || currentDate;
          if (editId) {
            // 从原日期移除
            if (data.media.calendar[currentDate]) {
              data.media.calendar[currentDate] = data.media.calendar[currentDate].filter(p => p.id !== editId);
              if (!data.media.calendar[currentDate].length) delete data.media.calendar[currentDate];
            }
            data.media.calendar[date] = data.media.calendar[date] || [];
            data.media.calendar[date].push({ id: editId, account: d.account, title: d.title, done: post?.done || false });
          } else {
            data.media.calendar[date] = data.media.calendar[date] || [];
            data.media.calendar[date].push({ id: uid(), account: d.account, title: d.title, done: false });
          }
          Store.save();
          toast('发文安排已保存');
          if (date !== currentDate) currentDate = date;
          this.render();
        }
      }
    ]);
  },

  showAddIdeaModal(editId = null) {
    const data = Store.get();
    let idea = null;
    if (editId) {
      idea = data.media.ideas.find(i => i.id === editId);
    }

    const html = `
      ${selectField('帐号', 'account', data.media.accounts.map(a => ({ value: a, label: a })), idea?.account || '')}
      ${field('标题', `<input class="input" name="title" value="${idea?.title || ''}" placeholder="选题标题">`)}
      ${field('内容', `<textarea class="textarea" name="content" placeholder="选题内容、大纲...">${idea?.content || ''}</textarea>`)}
    `;

    showModal(editId ? '编辑灵感' : '添加灵感', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.account || !d.title) { toast('请填写帐号和标题'); return false; }
          const data = Store.get();
          if (editId) {
            const idea = data.media.ideas.find(i => i.id === editId);
            idea.account = d.account;
            idea.title = d.title;
            idea.content = d.content;
          } else {
            data.media.ideas.push({
              id: uid(), account: d.account, title: d.title,
              content: d.content, publishDate: '', published: false
            });
          }
          Store.save();
          toast('灵感已保存');
          this.render();
        }
      }
    ]);
  },

  showScheduleModal(ideaId) {
    const data = Store.get();
    const idea = data.media.ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const html = `
      <p style="text-align:center;color:var(--ink-light);margin-bottom:14px;">将「${idea.title}」安排到哪天发布？</p>
      ${field('发布日期', `<input class="input" type="date" name="date" value="${todayStr()}">`)}
    `;

    showModal('加入发文日历', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '确认',
        onClick: wrap => {
          const d = getFormData(wrap);
          const date = d.date || todayStr();
          const data = Store.get();
          const idea = data.media.ideas.find(i => i.id === ideaId);
          if (idea) {
            idea.publishDate = date;
            data.media.calendar[date] = data.media.calendar[date] || [];
            data.media.calendar[date].push({
              id: uid(), account: idea.account, title: idea.title,
              done: false, ideaId: idea.id
            });
            Store.save();
            toast('已加入发文日历');
            this.render();
          }
        }
      }
    ]);
  }
};
