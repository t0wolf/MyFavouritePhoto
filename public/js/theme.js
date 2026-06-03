// 主题切换功能

const Theme = {
  // 当前主题
  currentTheme: 'light',

  // 初始化主题
  init() {
    // 从本地存储获取保存的主题
    const savedTheme = localStorage.getItem('theme');

    // 如果有保存的主题，使用它；否则检查系统偏好
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // 检查系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }

    // 应用主题
    this.applyTheme(this.currentTheme);

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
      }
    });

    // 绑定切换按钮事件
    this.bindToggle();
  },

  // 应用主题
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;

    // 更新按钮图标
    this.updateToggleIcon();
  },

  // 切换主题
  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.currentTheme = newTheme;

    // 保存到本地存储
    localStorage.setItem('theme', newTheme);

    // 应用主题
    this.applyTheme(newTheme);

    // 显示提示
    Utils.showToast(
      newTheme === 'dark' ? '已切换到暗色主题' : '已切换到亮色主题',
      'info',
      2000
    );
  },

  // 更新切换按钮图标
  updateToggleIcon() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      const lightIcon = toggleBtn.querySelector('.theme-icon-light');
      const darkIcon = toggleBtn.querySelector('.theme-icon-dark');

      if (this.currentTheme === 'dark') {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'inline';
      } else {
        lightIcon.style.display = 'inline';
        darkIcon.style.display = 'none';
      }
    }
  },

  // 绑定切换按钮事件
  bindToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }
  },

  // 获取当前主题
  getTheme() {
    return this.currentTheme;
  },

  // 检查是否为暗色主题
  isDark() {
    return this.currentTheme === 'dark';
  }
};

// 导出主题模块
window.Theme = Theme;
