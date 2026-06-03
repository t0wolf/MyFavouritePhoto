// 照片画廊模块

const Gallery = {
  // 状态
  photos: [],
  currentPage: 1,
  pageSize: 20,
  totalPhotos: 0,
  isLoading: false,
  currentView: 'grid', // 'grid' 或 'masonry'
  currentSort: 'created_at-DESC',
  currentAlbumId: null,
  searchQuery: '',

  // 初始化
  init() {
    this.bindEvents();
    this.loadPhotos();
    this.setupInfiniteScroll();
  },

  // 绑定事件
  bindEvents() {
    // 视图切换按钮
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.mode);
      });
    });

    // 排序选择
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.currentSort = sortSelect.value;
        this.resetAndLoad();
      });
    }

    // 搜索
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && searchBtn) {
      const debouncedSearch = Utils.debounce(() => {
        this.searchQuery = searchInput.value.trim();
        this.resetAndLoad();
      }, 300);

      searchInput.addEventListener('input', debouncedSearch);
      searchBtn.addEventListener('click', () => {
        this.searchQuery = searchInput.value.trim();
        this.resetAndLoad();
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchQuery = searchInput.value.trim();
          this.resetAndLoad();
        }
      });
    }
  },

  // 设置无限滚动
  setupInfiniteScroll() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMore();
      });
    }

    // 也可以使用 Intersection Observer 实现自动加载
    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoading && this.photos.length < this.totalPhotos) {
            this.loadMore();
          }
        });
      }, {
        rootMargin: '200px'
      });

      observer.observe(loadMore);
    }
  },

  // 加载照片
  async loadPhotos(append = false) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading(!append);

    try {
      const [sortBy, sortOrder] = this.currentSort.split('-');
      const options = {
        sortBy,
        sortOrder,
        limit: this.pageSize,
        offset: append ? this.photos.length : 0
      };

      if (this.currentAlbumId) {
        options.album_id = this.currentAlbumId;
      }

      if (this.searchQuery) {
        options.search = this.searchQuery;
      }

      const response = await API.photos.getAll(options);

      if (response.success) {
        if (append) {
          this.photos = [...this.photos, ...response.data];
        } else {
          this.photos = response.data;
        }

        this.totalPhotos = response.pagination.total;
        this.renderPhotos(!append);
        this.updatePhotoCount();
        this.updateLoadMoreButton();
      }
    } catch (error) {
      console.error('加载照片失败:', error);
      Utils.showToast('加载照片失败', 'error');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  },

  // 加载更多
  async loadMore() {
    if (this.photos.length >= this.totalPhotos) return;
    this.currentPage++;
    await this.loadPhotos(true);
  },

  // 重置并重新加载
  resetAndLoad() {
    this.currentPage = 1;
    this.photos = [];
    this.loadPhotos(false);
  },

  // 渲染照片
  renderPhotos(clear = true) {
    const container = document.getElementById('galleryContainer');
    const emptyState = document.getElementById('emptyState');

    if (clear) {
      // 清空容器，但保留空状态
      const cards = container.querySelectorAll('.photo-card');
      cards.forEach(card => card.remove());
    }

    if (this.photos.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const startIndex = clear ? 0 : container.querySelectorAll('.photo-card').length;

    this.photos.forEach((photo, index) => {
      if (index < startIndex) return;

      const card = this.createPhotoCard(photo);
      container.appendChild(card);

      // 添加入场动画
      setTimeout(() => {
        card.classList.add('animate-in');
      }, (index - startIndex) * 50);
    });
  },

  // 创建照片卡片
  createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.dataset.id = photo.id;

    const thumbnailSrc = `/uploads/thumbnails/${photo.filename.replace(/\.[^.]+$/, '.jpg')}`;
    const originalSrc = `/uploads/originals/${photo.filename}`;

    card.innerHTML = `
      <div class="photo-card-image">
        <img src="${thumbnailSrc}" alt="${photo.title || '照片'}" loading="lazy">
        <div class="photo-card-overlay">
          <h3 class="photo-card-title">${photo.title || '未命名'}</h3>
          <span class="photo-card-date">${Utils.formatDate(photo.created_at)}</span>
        </div>
        <div class="photo-card-actions">
          <button class="card-action-btn favorite-btn ${photo.is_favorite ? 'active' : ''}"
                  data-id="${photo.id}" title="收藏">
            ${photo.is_favorite ? '❤️' : '♡'}
          </button>
          <button class="card-action-btn" data-id="${photo.id}" title="添加到相册">
            📁
          </button>
        </div>
      </div>
    `;

    // 点击打开灯箱
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-action-btn')) {
        const index = this.photos.findIndex(p => p.id === photo.id);
        Lightbox.open(this.photos, index);
      }
    });

    // 收藏按钮
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleFavorite(photo.id);
    });

    // 添加到相册按钮
    const albumBtn = card.querySelector('.card-action-btn:not(.favorite-btn)');
    albumBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      Album.showAddToAlbumDialog(photo.id);
    });

    return card;
  },

  // 切换收藏状态
  async toggleFavorite(photoId) {
    try {
      const response = await API.photos.toggleFavorite(photoId);
      if (response.success) {
        // 更新本地数据
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
          photo.is_favorite = response.data.is_favorite;
        }

        // 更新 UI
        const btn = document.querySelector(`.favorite-btn[data-id="${photoId}"]`);
        if (btn) {
          btn.classList.toggle('active');
          btn.textContent = response.data.is_favorite ? '❤️' : '♡';
        }

        Utils.showToast(
          response.data.is_favorite ? '已添加到收藏' : '已取消收藏',
          'success'
        );
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      Utils.showToast('操作失败', 'error');
    }
  },

  // 切换视图模式
  switchView(mode) {
    this.currentView = mode;

    // 更新按钮状态
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // 更新容器类名
    const container = document.getElementById('galleryContainer');
    container.className = `gallery-container ${mode}-view`;
  },

  // 显示/隐藏加载状态
  showLoading(show = true) {
    const loadMore = document.getElementById('loadMore');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (show) {
      loadMore.style.display = 'block';
      loadMoreBtn.disabled = true;
      loadMoreBtn.querySelector('.spinner').style.display = 'inline-block';
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.querySelector('.spinner').style.display = 'none';
    }
  },

  hideLoading() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.querySelector('.spinner').style.display = 'none';
    }
  },

  // 更新照片数量显示
  updatePhotoCount() {
    const countEl = document.getElementById('photoCount');
    if (countEl) {
      countEl.textContent = `${this.totalPhotos} 张照片`;
    }
  },

  // 更新加载更多按钮
  updateLoadMoreButton() {
    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
      loadMore.style.display = this.photos.length < this.totalPhotos ? 'block' : 'none';
    }
  },

  // 设置当前相册
  setAlbum(albumId) {
    this.currentAlbumId = albumId;
    this.resetAndLoad();
  },

  // 刷新画廊
  refresh() {
    this.resetAndLoad();
  },

  // 删除照片后更新
  removePhoto(photoId) {
    this.photos = this.photos.filter(p => p.id !== photoId);
    this.totalPhotos--;

    const card = document.querySelector(`.photo-card[data-id="${photoId}"]`);
    if (card) {
      card.remove();
    }

    this.updatePhotoCount();

    if (this.photos.length === 0) {
      document.getElementById('emptyState').style.display = 'block';
    }
  }
};

// 导出画廊模块
window.Gallery = Gallery;
