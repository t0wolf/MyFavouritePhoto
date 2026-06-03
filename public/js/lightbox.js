// 灯箱查看器模块

const Lightbox = {
  // 状态
  photos: [],
  currentIndex: 0,
  isOpen: false,
  currentPhoto: null,

  // 初始化
  init() {
    this.bindEvents();
  },

  // 绑定事件
  bindEvents() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const overlay = lightbox.querySelector('.lightbox-overlay');

    // 关闭按钮
    closeBtn.addEventListener('click', () => this.close());

    // 上一张/下一张
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());

    // 点击背景关闭
    overlay.addEventListener('click', () => this.close());

    // 键盘事件
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });

    // 触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, { passive: true });

    // 灯箱内的操作按钮
    document.getElementById('lightboxFavorite').addEventListener('click', () => {
      this.toggleFavorite();
    });

    document.getElementById('lightboxEdit').addEventListener('click', () => {
      this.openEditModal();
    });

    document.getElementById('lightboxDelete').addEventListener('click', () => {
      this.deletePhoto();
    });
  },

  // 打开灯箱
  open(photos, index = 0) {
    this.photos = photos;
    this.currentIndex = index;
    this.isOpen = true;

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.showPhoto(index);
  },

  // 关闭灯箱
  close() {
    this.isOpen = false;

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  },

  // 显示照片
  showPhoto(index) {
    if (index < 0 || index >= this.photos.length) return;

    this.currentIndex = index;
    this.currentPhoto = this.photos[index];

    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDescription = document.getElementById('lightboxDescription');
    const lightboxFavorite = document.getElementById('lightboxFavorite');
    const lightboxSize = document.getElementById('lightboxSize');
    const lightboxDimensions = document.getElementById('lightboxDimensions');
    const lightboxDate = document.getElementById('lightboxDate');

    // 更新图片
    const originalSrc = `/uploads/originals/${this.currentPhoto.filename}`;
    lightboxImage.src = originalSrc;
    lightboxImage.alt = this.currentPhoto.title || '照片';

    // 更新信息
    lightboxTitle.textContent = this.currentPhoto.title || '未命名';
    lightboxDescription.textContent = this.currentPhoto.description || '';
    lightboxDescription.style.display = this.currentPhoto.description ? 'block' : 'none';

    // 更新收藏按钮
    lightboxFavorite.className = `favorite-btn ${this.currentPhoto.is_favorite ? 'active' : ''}`;
    lightboxFavorite.textContent = this.currentPhoto.is_favorite ? '❤️' : '♡';

    // 更新元数据
    lightboxSize.textContent = Utils.formatFileSize(this.currentPhoto.size);
    lightboxDimensions.textContent = this.currentPhoto.width && this.currentPhoto.height
      ? `${this.currentPhoto.width} × ${this.currentPhoto.height}`
      : '';
    lightboxDate.textContent = Utils.formatFullDate(this.currentPhoto.created_at);

    // 更新导航按钮状态
    this.updateNavigationButtons();
  },

  // 更新导航按钮
  updateNavigationButtons() {
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    prevBtn.style.display = this.currentIndex > 0 ? 'flex' : 'none';
    nextBtn.style.display = this.currentIndex < this.photos.length - 1 ? 'flex' : 'none';
  },

  // 上一张
  prev() {
    if (this.currentIndex > 0) {
      this.showPhoto(this.currentIndex - 1);
    }
  },

  // 下一张
  next() {
    if (this.currentIndex < this.photos.length - 1) {
      this.showPhoto(this.currentIndex + 1);
    }
  },

  // 处理滑动
  handleSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 向左滑动，下一张
        this.next();
      } else {
        // 向右滑动，上一张
        this.prev();
      }
    }
  },

  // 切换收藏状态
  async toggleFavorite() {
    if (!this.currentPhoto) return;

    try {
      const response = await API.photos.toggleFavorite(this.currentPhoto.id);
      if (response.success) {
        // 更新当前照片数据
        this.currentPhoto.is_favorite = response.data.is_favorite;

        // 更新灯箱中的收藏按钮
        const lightboxFavorite = document.getElementById('lightboxFavorite');
        lightboxFavorite.className = `favorite-btn ${this.currentPhoto.is_favorite ? 'active' : ''}`;
        lightboxFavorite.textContent = this.currentPhoto.is_favorite ? '❤️' : '♡';

        // 更新画廊中的卡片
        const cardBtn = document.querySelector(`.photo-card[data-id="${this.currentPhoto.id}"] .favorite-btn`);
        if (cardBtn) {
          cardBtn.className = `card-action-btn favorite-btn ${this.currentPhoto.is_favorite ? 'active' : ''}`;
          cardBtn.textContent = this.currentPhoto.is_favorite ? '❤️' : '♡';
        }

        // 更新画廊数据
        const photo = Gallery.photos.find(p => p.id === this.currentPhoto.id);
        if (photo) {
          photo.is_favorite = this.currentPhoto.is_favorite;
        }

        Utils.showToast(
          this.currentPhoto.is_favorite ? '已添加到收藏' : '已取消收藏',
          'success'
        );
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      Utils.showToast('操作失败', 'error');
    }
  },

  // 打开编辑弹窗
  openEditModal() {
    if (!this.currentPhoto) return;

    // 填充表单
    document.getElementById('editTitle').value = this.currentPhoto.title || '';
    document.getElementById('editDescription').value = this.currentPhoto.description || '';
    document.getElementById('editTags').value = (this.currentPhoto.tags || []).join(', ');

    // 打开弹窗
    document.getElementById('editModal').classList.add('active');
  },

  // 删除照片
  async deletePhoto() {
    if (!this.currentPhoto) return;

    const confirmed = await Utils.showConfirm(
      '删除照片',
      '确定要删除这张照片吗？此操作不可撤销。'
    );

    if (!confirmed) return;

    try {
      const response = await API.photos.delete(this.currentPhoto.id);
      if (response.success) {
        // 从画廊中移除
        Gallery.removePhoto(this.currentPhoto.id);

        // 更新灯箱照片列表
        this.photos = this.photos.filter(p => p.id !== this.currentPhoto.id);

        if (this.photos.length === 0) {
          // 没有更多照片，关闭灯箱
          this.close();
        } else {
          // 显示下一张或上一张
          if (this.currentIndex >= this.photos.length) {
            this.currentIndex = this.photos.length - 1;
          }
          this.showPhoto(this.currentIndex);
        }

        Utils.showToast('照片已删除', 'success');
      }
    } catch (error) {
      console.error('删除照片失败:', error);
      Utils.showToast('删除失败', 'error');
    }
  }
};

// 导出灯箱模块
window.Lightbox = Lightbox;
