/**
 * 小金加油 - 主应用入口
 */

const App = {
  currentTab: 'diary',

  modules: {
    diary: Diary,
    media: Media,
    pets: Pets,
    craft: Craft,
    growth: Growth
  },

  init() {
    // 加载数据
    Store.load();

    // 初始化日历日期
    calendarState = {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    };

    // 更新顶部日期
    this.updateHeaderDate();

    // 渲染当前模块
    this.render();

    // 绑定底部导航
    this.bindTabBar();

    // 绑定设置按钮
    this.bindSettings();

    // 每分钟更新顶部日期
    setInterval(() => this.updateHeaderDate(), 60000);
  },

  render() {
    const module = this.modules[this.currentTab];
    if (module) {
      module.render();
      // 滚动到顶部
      $('#appMain').scrollTop = 0;
    }
  },

  updateHeaderDate() {
    const now = new Date();
    const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    const dateText = `${now.getMonth() + 1}月${now.getDate()}日 周${week}`;
    const el = $('#headerDate');
    if (el) el.textContent = dateText;
  },

  bindTabBar() {
    $$('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        if (tabName === this.currentTab) return;

        // 更新激活状态
        $$('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.currentTab = tabName;

        // 重置日历到当前月
        calendarState = {
          year: new Date().getFullYear(),
          month: new Date().getMonth()
        };

        // 重置当前日期为今天
        currentDate = todayStr();

        this.render();
      });
    });
  },

  bindSettings() {
    const settingsBtn = $('#headerSettings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        const data = Store.get();
        const dataSize = (JSON.stringify(data).length / 1024).toFixed(1);

        showModal('⚙️ 设置', `
          <div class="card" style="box-shadow:none;border:none;padding:0;">
            <div class="record-row">
              <div class="record-label">所在地</div>
              <input class="input" id="settingLocation" value="${data.settings.location}" placeholder="城市名" style="flex:1;">
            </div>
            <div class="record-row">
              <div class="record-label">所在地</div>
              <input class="input" id="settingLocation" value="${data.settings.location}" placeholder="城市名" style="flex:1;">
            </div>
            <div class="record-row">
              <div class="record-label">数据量</div>
              <div class="record-value">${dataSize} KB</div>
            </div>
            <div class="section-title" style="margin:14px 0 8px;">📦 数据备份</div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-outline" id="exportData" style="flex:1;justify-content:center;">导出备份</button>
              <button class="btn btn-outline" id="importData" style="flex:1;justify-content:center;">导入备份</button>
            </div>
            <input type="file" id="importFile" accept="application/json" style="display:none;">
            <button class="btn btn-block" id="saveSettings" style="margin-top:12px;">保存设置</button>
            <button class="btn btn-danger btn-block" id="resetData" style="margin-top:8px;">清空所有数据</button>
            <p style="text-align:center;color:var(--ink-lighter);font-size:11px;margin-top:12px;">🌸 小金加油 · 数据保存在本地浏览器</p>
          </div>
        `, []);

        $('#saveSettings').addEventListener('click', () => {
          const loc = $('#settingLocation').value.trim() || '杭州';
          data.settings.location = loc;
          Store.save();
          toast('设置已保存');
          closeModal();
        });

        // 导出备份
        $('#exportData').addEventListener('click', () => {
          const json = Store.exportJSON();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ds = dateStr(new Date());
          a.href = url;
          a.download = `小金加油备份_${ds}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          toast('备份已导出');
        });

        // 导入备份
        $('#importData').addEventListener('click', () => {
          $('#importFile').click();
        });
        $('#importFile').addEventListener('change', e => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              Store.importJSON(reader.result);
              toast('备份已导入，正在刷新');
              closeModal();
              App.render();
            } catch (err) {
              console.error(err);
              toast('导入失败：文件格式不正确');
            }
          };
          reader.readAsText(file);
        });

        $('#resetData').addEventListener('click', () => {
          confirmDialog('确认清空所有数据？此操作不可恢复！', () => {
            Store.reset();
            toast('数据已清空');
            App.render();
          });
        });
      });
    }
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
