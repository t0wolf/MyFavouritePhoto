// 相册管理模块

const Album = {
  // 状态
  albums: [],
  currentAlbumId: null,
  editingAlbumId: null,

  // 初始化
  init() {
    this.bindEvents();
    this.loadAlbums();
  },

  // 绑定事件
  bindEvents() {
    // 创建相册按钮
    const createAlbumBtn = document.getElementById('createAlbumBtn');
    if (createAlbumBtn) {
      createAlbumBtn.addEventListener('click', () => {
        this.openCreateModal();
      });
    }

    // 相册弹窗按钮
    const saveAlbumBtn = document.getElementById('saveAlbum');
    const cancelAlbumBtn = document.getElementById('cancelAlbum');

    saveAlbumBtn.addEventListener('click', () => {
      this.saveAlbum();
    });

    cancelAlbumBtn.addEventListener('click', () => {
      this.closeAlbumModal();
    });

    document.getElementById('albumModal').querySelector('.modal-close').addEventListener('click', () => {
      this.closeAlbumModal();
    });

    document.getElementById('albumModal').querySelector('.modal-overlay').addEventListener('click', () => {
      this.closeAlbumModal();
    });

    // 编辑弹窗按钮
    const saveEditBtn = document.getElementById('saveEdit');
    const cancelEditBtn = document.getElementById('cancelEdit');

    saveEditBtn.addEventListener('click', () => {
      this.savePhotoEdit();
    });

    cancelEditBtn.addEventListener('click', () => {
      this.closeEditModal();
    });

    document.getElementById('editModal').querySelector('.modal-close').addEventListener('click', () => {
      this.closeEditModal();
    });

    document.getElementById('editModal').querySelector('.modal-overlay').addEventListener('click', () => {
      this.closeEditModal();
    });

    // 照片选择弹窗按钮
    const confirmPhotoSelectBtn = document.getElementById('confirmPhotoSelect');
    const cancelPhotoSelectBtn = document.getElementById('cancelPhotoSelect');

    confirmPhotoSelectBtn.addEventListener('click', () => {
      this.confirmAddPhotosToAlbum();
    });

    cancelPhotoSelectBtn.addEventListener('click', () => {
      this.closePhotoSelectModal();
    });

    document.getElementById('photoSelectModal').querySelector('.modal-close').addEventListener('click', () => {
      this.closePhotoSelectModal();
    });

    document.getElementById('photoSelectModal').querySelector('.modal-overlay').addEventListener('click', () => {
      this.closePhotoSelectModal();
    });
  },

  // 加载相册列表
  async loadAlbums() {
    try {
      const response = await API.albums.getAll();
      if (response.success) {
        this.albums = response.data;
        this.renderAlbums();
        this.updateAlbumView();
      }
    } catch (error) {
      console.error('加载相册失败:', error);
      Utils.showToast('加载相册失败', 'error');
    }
  },

  // 渲染相册列表
  renderAlbums() {
    const grid = document.getElementById('albumsGrid');
    grid.innerHTML = '';

    this.albums.forEach(album => {
      const card = this.createAlbumCard(album);
      grid.appendChild(card);
    });
  },

  // 创建相册卡片
  createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.dataset.id = album.id;

    const coverHtml = album.cover_photo
      ? `<img src="/uploads/thumbnails/${album.cover_photo.filename.replace(/\.[^.]+$/, '.jpg')}" alt="${album.name}">`
      : `<div class="album-cover-placeholder">📁</div>`;

    card.innerHTML = `
      <div class="album-cover">
        ${coverHtml}
      </div>
      <div class="album-info">
        <h3 class="album-name">${album.name}</h3>
        ${album.description ? `<p class="album-description">${album.description}</p>` : ''}
        <div class="album-meta">
          <span class="album-photo-count">📷 ${album.photo_count} 张</span>
          <span>${Utils.formatDate(album.created_at)}</span>
        </div>
      </div>
      <div class="album-actions">
        <button class="card-action-btn" data-action="edit" data-id="${album.id}" title="编辑">
          ✏️
        </button>
        <button class="card-action-btn" data-action="add-photos" data-id="${album.id}" title="添加照片">
          ➕
        </button>
        <button class="card-action-btn" data-action="delete" data-id="${album.id}" title="删除">
          🗑️
        </button>
      </div>
    `;

    // 点击查看相册
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-action-btn')) {
        this.openAlbum(album.id);
      }
    });

    // 操作按钮
    card.querySelectorAll('.card-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);

        switch (action) {
          case 'edit':
            this.openEditModal(id);
            break;
          case 'add-photos':
            this.openPhotoSelectModal(id);
            break;
          case 'delete':
            this.deleteAlbum(id);
            break;
        }
      });
    });

    return card;
  },

  // 打开相册
  openAlbum(albumId) {
    this.currentAlbumId = albumId;
    const album = this.albums.find(a => a.id === albumId);

    // 更新导航
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // 显示相册视图
    document.getElementById('galleryContainer').style.display = 'grid';
    document.getElementById('albumsContainer').style.display = 'none';

    // 更新工具栏
    const photoCount = document.getElementById('photoCount');
    if (album) {
      photoCount.textContent = `${album.name} - ${album.photo_count} 张照片`;
    }

    // 加载相册照片
    Gallery.setAlbum(albumId);
  },

  // 返回全部照片
  backToAll() {
    this.currentAlbumId = null;

    // 更新导航
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === 'gallery') {
        btn.classList.add('active');
      }
    });

    // 显示全部照片
    document.getElementById('galleryContainer').style.display = 'grid';
    document.getElementById('albumsContainer').style.display = 'none';

    Gallery.setAlbum(null);
  },

  // 更新相册视图显示
  updateAlbumView() {
    // 这个方法可以在切换视图时调用
  },

  // 打开创建相册弹窗
  openCreateModal() {
    this.editingAlbumId = null;
    document.getElementById('albumModalTitle').textContent = '创建相册';
    document.getElementById('albumName').value = '';
    document.getElementById('albumDescription').value = '';
    document.getElementById('albumModal').classList.add('active');
  },

  // 打开编辑相册弹窗
  openEditModal(albumId) {
    const album = this.albums.find(a => a.id === albumId);
    if (!album) return;

    this.editingAlbumId = albumId;
    document.getElementById('albumModalTitle').textContent = '编辑相册';
    document.getElementById('albumName').value = album.name;
    document.getElementById('albumDescription').value = album.description || '';
    document.getElementById('albumModal').classList.add('active');
  },

  // 关闭相册弹窗
  closeAlbumModal() {
    document.getElementById('albumModal').classList.remove('active');
    this.editingAlbumId = null;
  },

  // 保存相册
  async saveAlbum() {
    const name = document.getElementById('albumName').value.trim();
    const description = document.getElementById('albumDescription').value.trim();

    if (!name) {
      Utils.showToast('请输入相册名称', 'warning');
      return;
    }

    try {
      let response;

      if (this.editingAlbumId) {
        // 更新相册
        response = await API.albums.update(this.editingAlbumId, { name, description });
      } else {
        // 创建相册
        response = await API.albums.create({ name, description });
      }

      if (response.success) {
        Utils.showToast(
          this.editingAlbumId ? '相册已更新' : '相册已创建',
          'success'
        );
        this.closeAlbumModal();
        this.loadAlbums();
      }
    } catch (error) {
      console.error('保存相册失败:', error);
      Utils.showToast(error.message || '保存失败', 'error');
    }
  },

  // 删除相册
  async deleteAlbum(albumId) {
    const album = this.albums.find(a => a.id === albumId);
    if (!album) return;

    const confirmed = await Utils.showConfirm(
      '删除相册',
      `确定要删除相册"${album.name}"吗？相册中的照片不会被删除。`
    );

    if (!confirmed) return;

    try {
      const response = await API.albums.delete(albumId);
      if (response.success) {
        Utils.showToast('相册已删除', 'success');
        this.loadAlbums();

        // 如果当前在查看这个相册，返回全部照片
        if (this.currentAlbumId === albumId) {
          this.backToAll();
        }
      }
    } catch (error) {
      console.error('删除相册失败:', error);
      Utils.showToast('删除失败', 'error');
    }
  },

  // 显示添加照片到相册对话框
  showAddToAlbumDialog(photoId) {
    if (this.albums.length === 0) {
      Utils.showToast('请先创建一个相册', 'warning');
      return;
    }

    // 简单实现：使用 prompt 选择相册
    const albumNames = this.albums.map((a, i) => `${i + 1}. ${a.name}`).join('\n');
    const choice = prompt(`选择要添加到的相册 (输入数字):\n${albumNames}`);

    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < this.albums.length) {
        this.addPhotoToAlbum(this.albums[index].id, photoId);
      }
    }
  },

  // 添加照片到相册
  async addPhotoToAlbum(albumId, photoId) {
    try {
      const response = await API.albums.addPhoto(albumId, photoId);
      if (response.success) {
        Utils.showToast('已添加到相册', 'success');
        this.loadAlbums();
      }
    } catch (error) {
      console.error('添加到相册失败:', error);
      Utils.showToast('添加失败', 'error');
    }
  },

  // 打开照片选择弹窗
  async openPhotoSelectModal(albumId) {
    this.currentAlbumId = albumId;

    try {
      // 加载所有照片
      const response = await API.photos.getAll({ limit: 100 });
      if (response.success) {
        this.renderPhotoSelectGrid(response.data);
        document.getElementById('photoSelectModal').classList.add('active');
      }
    } catch (error) {
      console.error('加载照片失败:', error);
      Utils.showToast('加载照片失败', 'error');
    }
  },

  // 渲染照片选择网格
  renderPhotoSelectGrid(photos) {
    const grid = document.getElementById('photoSelectGrid');
    grid.innerHTML = '';

    photos.forEach(photo => {
      const item = document.createElement('div');
      item.className = 'photo-select-item';
      item.dataset.id = photo.id;

      const thumbnailSrc = `/uploads/thumbnails/${photo.filename.replace(/\.[^.]+$/, '.jpg')}`;

      item.innerHTML = `
        <img src="${thumbnailSrc}" alt="${photo.title || '照片'}" loading="lazy">
        <div class="select-check">✓</div>
      `;

      item.addEventListener('click', () => {
        item.classList.toggle('selected');
      });

      grid.appendChild(item);
    });
  },

  // 关闭照片选择弹窗
  closePhotoSelectModal() {
    document.getElementById('photoSelectModal').classList.remove('active');
  },

  // 确认添加照片到相册
  async confirmAddPhotosToAlbum() {
    const selectedItems = document.querySelectorAll('#photoSelectGrid .photo-select-item.selected');

    if (selectedItems.length === 0) {
      Utils.showToast('请选择要添加的照片', 'warning');
      return;
    }

    const albumId = this.currentAlbumId;
    let successCount = 0;

    for (const item of selectedItems) {
      const photoId = parseInt(item.dataset.id);
      try {
        await API.albums.addPhoto(albumId, photoId);
        successCount++;
      } catch (error) {
        console.error(`添加照片 ${photoId} 失败:`, error);
      }
    }

    if (successCount > 0) {
      Utils.showToast(`成功添加 ${successCount} 张照片`, 'success');
      this.closePhotoSelectModal();
      this.loadAlbums();

      // 如果当前在查看这个相册，刷新
      if (this.currentAlbumId === albumId) {
        Gallery.refresh();
      }
    }
  },

  // 关闭编辑弹窗
  closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
  },

  // 保存照片编辑
  async savePhotoEdit() {
    const photoId = Lightbox.currentPhoto?.id;
    if (!photoId) return;

    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const tagsInput = document.getElementById('editTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

    try {
      const response = await API.photos.update(photoId, { title, description, tags });
      if (response.success) {
        // 更新灯箱中的数据
        if (Lightbox.currentPhoto) {
          Lightbox.currentPhoto.title = title;
          Lightbox.currentPhoto.description = description;
          Lightbox.currentPhoto.tags = tags;

          // 更新显示
          document.getElementById('lightboxTitle').textContent = title || '未命名';
          document.getElementById('lightboxDescription').textContent = description;
          document.getElementById('lightboxDescription').style.display = description ? 'block' : 'none';
        }

        // 更新画廊中的数据
        const photo = Gallery.photos.find(p => p.id === photoId);
        if (photo) {
          photo.title = title;
          photo.description = description;
          photo.tags = tags;
        }

        // 更新卡片显示
        const card = document.querySelector(`.photo-card[data-id="${photoId}"] .photo-card-title`);
        if (card) {
          card.textContent = title || '未命名';
        }

        Utils.showToast('照片信息已更新', 'success');
        this.closeEditModal();
      }
    } catch (error) {
      console.error('保存照片信息失败:', error);
      Utils.showToast('保存失败', 'error');
    }
  }
};

// 导出相册模块
window.Album = Album;
