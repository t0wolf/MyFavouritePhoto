// 主应用模块

const App = {
  // 初始化应用
  async init() {
    console.log('🚀 初始化应用...');

    // 初始化主题
    Theme.init();

    // 初始化粒子效果
    Particles.init();

    // 初始化导航
    this.initNavigation();

    // 初始化各个模块
    await this.initModules();

    // 绑定全局事件
    this.bindGlobalEvents();

    // 初始化 Hero 区域
    this.initHero();

    // 加载统计数据
    this.loadStats();

    console.log('✅ 应用初始化完成');
  },

  // 初始化导航
  initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 更新按钮状态
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 切换视图
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });
  },

  // 切换视图
  switchView(view) {
    const galleryContainer = document.getElementById('galleryContainer');
    const albumsContainer = document.getElementById('albumsContainer');
    const heroSection = document.getElementById('heroSection');

    // 隐藏 Hero
    if (heroSection) {
      heroSection.style.display = 'none';
    }

    switch (view) {
      case 'gallery':
        galleryContainer.style.display = 'grid';
        albumsContainer.style.display = 'none';
        Album.backToAll();
        break;

      case 'albums':
        galleryContainer.style.display = 'none';
        albumsContainer.style.display = 'block';
        Album.loadAlbums();
        break;

      case 'favorites':
        galleryContainer.style.display = 'grid';
        albumsContainer.style.display = 'none';
        this.showFavorites();
        break;
    }
  },

  // 显示收藏照片
  showFavorites() {
    // 更新工具栏显示
    const photoCount = document.getElementById('photoCount');
    photoCount.textContent = '我的收藏';

    // 加载收藏照片
    Gallery.currentAlbumId = null;
    Gallery.searchQuery = '';
    Gallery.photos = [];

    // 重新加载，只显示收藏的
    Gallery.loadPhotosWithFavorites();
  },

  // 初始化模块
  async initModules() {
    // 初始化画廊
    Gallery.init();

    // 初始化灯箱
    Lightbox.init();

    // 初始化上传
    Upload.init();

    // 初始化相册
    Album.init();
  },

  // 初始化 Hero 区域
  initHero() {
    const heroSection = document.getElementById('heroSection');
    const heroUploadBtn = document.getElementById('heroUploadBtn');
    const heroDemoBtn = document.getElementById('heroDemoBtn');

    if (heroUploadBtn) {
      heroUploadBtn.addEventListener('click', () => {
        Upload.openModal();
      });
    }

    if (heroDemoBtn) {
      heroDemoBtn.addEventListener('click', () => {
        // 切换到全部照片视图
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-btn[data-view="gallery"]').classList.add('active');
        this.switchView('gallery');
      });
    }

    // 初始显示 Hero（如果没有照片的话）
    this.checkShowHero();
  },

  // 检查是否显示 Hero
  async checkShowHero() {
    const heroSection = document.getElementById('heroSection');
    const galleryContainer = document.getElementById('galleryContainer');

    try {
      const response = await API.photos.getAll({ limit: 1 });
      const hasPhotos = response.success && response.data.length > 0;

      if (heroSection) {
        heroSection.style.display = hasPhotos ? 'none' : 'flex';
      }
    } catch (error) {
      console.error('检查照片失败:', error);
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      // 获取照片数量
      const photosResponse = await API.photos.getAll({ limit: 1 });
      const statPhotos = document.getElementById('statPhotos');
      if (statPhotos && photosResponse.success) {
        this.animateNumber(statPhotos, photosResponse.pagination.total);
      }

      // 获取相册数量
      const albumsResponse = await API.albums.getAll();
      const statAlbums = document.getElementById('statAlbums');
      if (statAlbums && albumsResponse.success) {
        this.animateNumber(statAlbums, albumsResponse.data.length);
      }

      // 获取收藏数量
      const favoritesResponse = await API.photos.getAll({ is_favorite: true, limit: 1 });
      const statFavorites = document.getElementById('statFavorites');
      if (statFavorites && favoritesResponse.success) {
        this.animateNumber(statFavorites, favoritesResponse.pagination.total);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 数字动画
  animateNumber(element, target) {
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  },

  // 绑定全局事件
  bindGlobalEvents() {
    // 快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      }

      // Ctrl/Cmd + U: 打开上传
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        Upload.openModal();
      }
    });

    // 移动端搜索按钮
    this.initMobileSearch();

    // 监听照片上传成功事件
    window.addEventListener('photoUploaded', () => {
      this.checkShowHero();
      this.loadStats();
    });
  },

  // 初始化移动端搜索
  initMobileSearch() {
    // 在移动端，点击搜索图标显示搜索框
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
      // 创建移动端搜索按钮
      const mobileSearchBtn = document.createElement('button');
      mobileSearchBtn.className = 'mobile-search-btn';
      mobileSearchBtn.innerHTML = '🔍';
      mobileSearchBtn.style.display = 'none';

      // 在移动端显示
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      const handleMediaChange = (e) => {
        mobileSearchBtn.style.display = e.matches ? 'flex' : 'none';
      };

      mediaQuery.addEventListener('change', handleMediaChange);
      handleMediaChange(mediaQuery);

      // 点击显示搜索框
      mobileSearchBtn.addEventListener('click', () => {
        searchBox.classList.toggle('mobile-visible');
        if (searchBox.classList.contains('mobile-visible')) {
          searchBox.querySelector('input').focus();
        }
      });

      // 添加到导航栏
      const navbarActions = document.querySelector('.navbar-actions');
      navbarActions.insertBefore(mobileSearchBtn, navbarActions.firstChild);
    }
  }
};

// 为画廊添加加载收藏照片的方法
Gallery.loadPhotosWithFavorites = async function() {
  if (this.isLoading) return;

  this.isLoading = true;
  this.showLoading(true);

  try {
    const [sortBy, sortOrder] = this.currentSort.split('-');
    const options = {
      sortBy,
      sortOrder,
      is_favorite: true,
      limit: this.pageSize,
      offset: 0
    };

    const response = await API.photos.getAll(options);

    if (response.success) {
      this.photos = response.data;
      this.totalPhotos = response.pagination.total;
      this.renderPhotos(true);
      this.updatePhotoCount();
      this.updateLoadMoreButton();
    }
  } catch (error) {
    console.error('加载收藏照片失败:', error);
    Utils.showToast('加载收藏照片失败', 'error');
  } finally {
    this.isLoading = false;
    this.hideLoading();
  }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(error => {
    console.error('应用初始化失败:', error);
  });
});

// 导出应用模块
window.App = App;
