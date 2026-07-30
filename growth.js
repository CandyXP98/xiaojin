/**
 * 个人成长模块 - 读书、观影、技能学习
 */

const Growth = {
  currentSection: 'books',

  render() {
    let html = renderAlerts();

    html += `
      <div class="segment">
        <button class="segment-item ${this.currentSection === 'books' ? 'active' : ''}" data-section="books">📚 读书</button>
        <button class="segment-item ${this.currentSection === 'movies' ? 'active' : ''}" data-section="movies">🎬 观影</button>
        <button class="segment-item ${this.currentSection === 'skills' ? 'active' : ''}" data-section="skills">💡 技能学习</button>
      </div>
    `;

    switch (this.currentSection) {
      case 'books': html += this.renderBooksView(); break;
      case 'movies': html += this.renderMoviesView(); break;
      case 'skills': html += this.renderSkillsView(); break;
    }

    $('#appMain').innerHTML = html;
    this.bindEvents();
  },

  renderBooksView() {
    const data = Store.get();
    const books = data.growth.books || [];
    const reading = books.filter(b => b.status === 'reading');
    const finished = books.filter(b => b.status === 'finished');
    const wantRead = books.filter(b => b.status === 'want');

    let html = `<div class="card">
      <div class="card-title"><span class="emoji">📚</span>读书记录</div>
      <div class="overview-grid">
        <div class="overview-item"><div class="overview-num">${reading.length}</div><div class="overview-label">在读</div></div>
        <div class="overview-item"><div class="overview-num">${finished.length}</div><div class="overview-label">已读</div></div>
        <div class="overview-item"><div class="overview-num">${wantRead.length}</div><div class="overview-label">想读</div></div>
        <div class="overview-item"><div class="overview-num">${finished.reduce((s, b) => s + (b.pages || 0), 0)}</div><div class="overview-label">已读页数</div></div>
      </div>
      <button class="btn btn-sm" id="addBook">＋ 添加书籍</button>
    </div>`;

    if (reading.length) {
      html += `<div class="card"><div class="card-title">📖 在读</div>`;
      reading.forEach(b => html += this.renderBookItem(b));
      html += `</div>`;
    }
    if (wantRead.length) {
      html += `<div class="card"><div class="card-title">📝 想读</div>`;
      wantRead.forEach(b => html += this.renderBookItem(b));
      html += `</div>`;
    }
    if (finished.length) {
      html += `<div class="card"><div class="card-title">✅ 已读</div>`;
      finished.forEach(b => html += this.renderBookItem(b));
      html += `</div>`;
    }
    if (!books.length) {
      html += `<div class="card">${emptyState('📚', '还没有读书记录')}</div>`;
    }

    return html;
  },

  renderBookItem(b) {
    const statusMap = { reading: '在读', finished: '已读', want: '想读' };
    const statusClass = { reading: 'tag-pink', finished: 'tag-green', want: 'tag-gray' };
    return `<div class="list-item">
      <div class="list-item-header">
        <span class="list-item-title">${b.title}</span>
        <span class="tag ${statusClass[b.status]}">${statusMap[b.status]}</span>
      </div>
      ${b.author ? `<div class="list-item-meta">✍️ ${b.author}</div>` : ''}
      ${b.pages ? `<div class="list-item-meta">📄 ${b.pages}页</div>` : ''}
      ${b.note ? `<div class="list-item-meta" style="margin-top:4px;white-space:pre-wrap;">📝 ${b.note}</div>` : ''}
      <div class="list-item-actions">
        <button class="btn btn-sm btn-outline" data-edit-book="${b.id}">编辑</button>
        <button class="btn btn-sm btn-danger" data-del-book="${b.id}">删除</button>
      </div>
    </div>`;
  },

  renderMoviesView() {
    const data = Store.get();
    const movies = data.growth.movies || [];
    const watched = movies.filter(m => m.status === 'watched');
    const wantWatch = movies.filter(m => m.status === 'want');

    let html = `<div class="card">
      <div class="card-title"><span class="emoji">🎬</span>观影记录</div>
      <div class="overview-grid">
        <div class="overview-item"><div class="overview-num">${watched.length}</div><div class="overview-label">已看</div></div>
        <div class="overview-item"><div class="overview-num">${wantWatch.length}</div><div class="overview-label">想看</div></div>
      </div>
      <button class="btn btn-sm" id="addMovie">＋ 添加影片</button>
    </div>`;

    if (watched.length) {
      html += `<div class="card"><div class="card-title">✅ 已看</div>`;
      watched.forEach(m => html += this.renderMovieItem(m));
      html += `</div>`;
    }
    if (wantWatch.length) {
      html += `<div class="card"><div class="card-title">📝 想看</div>`;
      wantWatch.forEach(m => html += this.renderMovieItem(m));
      html += `</div>`;
    }
    if (!movies.length) {
      html += `<div class="card">${emptyState('🎬', '还没有观影记录')}</div>`;
    }

    return html;
  },

  renderMovieItem(m) {
    const statusMap = { watched: '已看', want: '想看' };
    const statusClass = { watched: 'tag-green', want: 'tag-gray' };
    return `<div class="list-item">
      <div class="list-item-header">
        <span class="list-item-title">${m.title}</span>
        <span class="tag ${statusClass[m.status]}">${statusMap[m.status]}</span>
      </div>
      ${m.type ? `<div class="list-item-meta">🎭 ${m.type}</div>` : ''}
      ${m.rating ? `<div class="list-item-meta">⭐ ${'★'.repeat(m.rating)}${'☆'.repeat(5 - m.rating)}</div>` : ''}
      ${m.note ? `<div class="list-item-meta" style="margin-top:4px;white-space:pre-wrap;">📝 ${m.note}</div>` : ''}
      <div class="list-item-actions">
        <button class="btn btn-sm btn-outline" data-edit-movie="${m.id}">编辑</button>
        <button class="btn btn-sm btn-danger" data-del-movie="${m.id}">删除</button>
      </div>
    </div>`;
  },

  renderSkillsView() {
    const data = Store.get();
    const skills = data.growth.skills || [];

    let html = `<div class="card">
      <div class="card-title"><span class="emoji">💡</span>技能学习</div>
      <button class="btn btn-sm" id="addSkill">＋ 添加技能</button>
    </div>`;

    if (!skills.length) {
      html += `<div class="card">${emptyState('💡', '还没有技能学习记录')}</div>`;
      return html;
    }

    skills.forEach(s => {
      const progress = s.total ? Math.round((s.current || 0) / s.total * 100) : 0;
      const statusMap = { learning: '学习中', paused: '暂停', done: '已掌握' };
      const statusClass = { learning: 'tag-pink', paused: 'tag-gray', done: 'tag-green' };
      html += `<div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${s.name}</span>
          <span class="tag ${statusClass[s.status]}">${statusMap[s.status]}</span>
        </div>
        ${s.total ? `
          <div class="record-row" style="margin-top:6px;">
            <div class="record-label">进度</div>
            <div class="record-value">${s.current || 0} / ${s.total}</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%;"></div></div>
          <div style="font-size:12px;color:var(--ink-light);text-align:right;">${progress}%</div>
        ` : ''}
        ${s.note ? `<div class="list-item-meta" style="margin-top:4px;white-space:pre-wrap;">📝 ${s.note}</div>` : ''}
        <div class="list-item-actions">
          <button class="btn btn-sm btn-outline" data-edit-skill="${s.id}">编辑</button>
          <button class="btn btn-sm btn-danger" data-del-skill="${s.id}">删除</button>
        </div>
      </div>`;
    });

    return html;
  },

  bindEvents() {
    const self = this;

    $$('.segment-item').forEach(btn => {
      btn.addEventListener('click', () => {
        self.currentSection = btn.dataset.section;
        self.render();
      });
    });

    // ===== 读书 =====
    const addBook = $('#addBook');
    if (addBook) addBook.addEventListener('click', () => self.showBookModal());

    $$('[data-edit-book]').forEach(btn => {
      btn.addEventListener('click', () => self.showBookModal(btn.dataset.editBook));
    });

    $$('[data-del-book]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这本书？', () => {
          const data = Store.get();
          data.growth.books = data.growth.books.filter(b => b.id !== btn.dataset.delBook);
          Store.save();
          self.render();
        });
      });
    });

    // ===== 观影 =====
    const addMovie = $('#addMovie');
    if (addMovie) addMovie.addEventListener('click', () => self.showMovieModal());

    $$('[data-edit-movie]').forEach(btn => {
      btn.addEventListener('click', () => self.showMovieModal(btn.dataset.editMovie));
    });

    $$('[data-del-movie]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这部影片？', () => {
          const data = Store.get();
          data.growth.movies = data.growth.movies.filter(m => m.id !== btn.dataset.delMovie);
          Store.save();
          self.render();
        });
      });
    });

    // ===== 技能 =====
    const addSkill = $('#addSkill');
    if (addSkill) addSkill.addEventListener('click', () => self.showSkillModal());

    $$('[data-edit-skill]').forEach(btn => {
      btn.addEventListener('click', () => self.showSkillModal(btn.dataset.editSkill));
    });

    $$('[data-del-skill]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDialog('确认删除这个技能？', () => {
          const data = Store.get();
          data.growth.skills = data.growth.skills.filter(s => s.id !== btn.dataset.delSkill);
          Store.save();
          self.render();
        });
      });
    });
  },

  showBookModal(editId = null) {
    const data = Store.get();
    let b = null;
    if (editId) b = data.growth.books.find(x => x.id === editId);

    const html = `
      ${field('书名', `<input class="input" name="title" value="${b?.title || ''}" placeholder="书名">`)}
      ${field('作者', `<input class="input" name="author" value="${b?.author || ''}" placeholder="作者">`)}
      <div class="field-row">
        <div class="field">${field('页数', `<input class="input" type="number" name="pages" value="${b?.pages || ''}" placeholder="总页数">`)}</div>
        <div class="field">${selectField('状态', 'status', [
          { value: 'want', label: '想读' },
          { value: 'reading', label: '在读' },
          { value: 'finished', label: '已读' }
        ], b?.status || 'want')}</div>
      </div>
      ${field('笔记', `<textarea class="textarea" name="note" placeholder="读书笔记...">${b?.note || ''}</textarea>`)}
    `;

    showModal(editId ? '编辑书籍' : '添加书籍', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.title) { toast('请输入书名'); return false; }
          const data = Store.get();
          if (editId) {
            const b = data.growth.books.find(x => x.id === editId);
            Object.assign(b, { title: d.title, author: d.author, pages: parseInt(d.pages) || 0, status: d.status, note: d.note });
          } else {
            data.growth.books.push({
              id: uid(), title: d.title, author: d.author,
              pages: parseInt(d.pages) || 0, status: d.status, note: d.note
            });
          }
          Store.save();
          toast('书籍已保存');
          this.render();
        }
      }
    ]);
  },

  showMovieModal(editId = null) {
    const data = Store.get();
    let m = null;
    if (editId) m = data.growth.movies.find(x => x.id === editId);

    const html = `
      ${field('片名', `<input class="input" name="title" value="${m?.title || ''}" placeholder="电影/剧集名称">`)}
      <div class="field-row">
        <div class="field">${field('类型', `<input class="input" name="type" value="${m?.type || ''}" placeholder="如：剧情/喜剧">`)}</div>
        <div class="field">${selectField('状态', 'status', [
          { value: 'want', label: '想看' },
          { value: 'watched', label: '已看' }
        ], m?.status || 'want')}</div>
      </div>
      ${selectField('评分', 'rating', [
        { value: '', label: '未评分' },
        { value: '1', label: '★' },
        { value: '2', label: '★★' },
        { value: '3', label: '★★★' },
        { value: '4', label: '★★★★' },
        { value: '5', label: '★★★★★' }
      ], m?.rating ? String(m.rating) : '')}
      ${field('笔记', `<textarea class="textarea" name="note" placeholder="观影感受...">${m?.note || ''}</textarea>`)}
    `;

    showModal(editId ? '编辑影片' : '添加影片', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.title) { toast('请输入片名'); return false; }
          const data = Store.get();
          if (editId) {
            const m = data.growth.movies.find(x => x.id === editId);
            Object.assign(m, { title: d.title, type: d.type, status: d.status, rating: d.rating ? parseInt(d.rating) : 0, note: d.note });
          } else {
            data.growth.movies.push({
              id: uid(), title: d.title, type: d.type,
              status: d.status, rating: d.rating ? parseInt(d.rating) : 0, note: d.note
            });
          }
          Store.save();
          toast('影片已保存');
          this.render();
        }
      }
    ]);
  },

  showSkillModal(editId = null) {
    const data = Store.get();
    let s = null;
    if (editId) s = data.growth.skills.find(x => x.id === editId);

    const html = `
      ${field('技能名称', `<input class="input" name="name" value="${s?.name || ''}" placeholder="如：英语、编程">`)}
      ${selectField('状态', 'status', [
        { value: 'learning', label: '学习中' },
        { value: 'paused', label: '暂停' },
        { value: 'done', label: '已掌握' }
      ], s?.status || 'learning')}
      <div class="field-row">
        <div class="field">${field('当前进度', `<input class="input" type="number" name="current" value="${s?.current || ''}" placeholder="如 30">`)}</div>
        <div class="field">${field('总进度', `<input class="input" type="number" name="total" value="${s?.total || ''}" placeholder="如 100">`)}</div>
      </div>
      ${field('笔记', `<textarea class="textarea" name="note" placeholder="学习笔记...">${s?.note || ''}</textarea>`)}
    `;

    showModal(editId ? '编辑技能' : '添加技能', html, [
      { label: '取消', style: 'btn-outline' },
      {
        label: '保存',
        onClick: wrap => {
          const d = getFormData(wrap);
          if (!d.name) { toast('请输入技能名称'); return false; }
          const data = Store.get();
          if (editId) {
            const s = data.growth.skills.find(x => x.id === editId);
            Object.assign(s, {
              name: d.name, status: d.status,
              current: parseInt(d.current) || 0, total: parseInt(d.total) || 0,
              note: d.note
            });
          } else {
            data.growth.skills.push({
              id: uid(), name: d.name, status: d.status,
              current: parseInt(d.current) || 0, total: parseInt(d.total) || 0,
              note: d.note
            });
          }
          Store.save();
          toast('技能已保存');
          this.render();
        }
      }
    ]);
  }
};
