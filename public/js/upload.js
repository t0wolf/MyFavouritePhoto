// 上传功能模块

const Upload = {
  // 状态
  files: [],
  isUploading: false,
  selectedAlbumId: null,

  // 初始化
  init() {
    this.bindEvents();
    this.loadAlbumOptions();
  },

  // 绑定事件
  bindEvents() {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const startUploadBtn = document.getElementById('startUpload');
    const cancelUploadBtn = document.getElementById('cancelUpload');
    const clearFilesBtn = document.getElementById('clearFiles');
    const albumSelect = document.getElementById('uploadAlbumSelect');

    // 打开上传弹窗
    uploadBtn.addEventListener('click', () => {
      this.openModal();
    });

    // 关闭弹窗
    cancelUploadBtn.addEventListener('click', () => {
      this.closeModal();
    });

    uploadModal.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal();
    });

    uploadModal.querySelector('.modal-overlay').addEventListener('click', () => {
      this.closeModal();
    });

    // 拖拽上传
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });

    // 点击上传
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      this.handleFiles(fileInput.files);
      fileInput.value = ''; // 重置 input
    });

    // 开始上传
    startUploadBtn.addEventListener('click', () => {
      this.startUpload();
    });

    // 清空文件
    clearFilesBtn.addEventListener('click', () => {
      this.clearFiles();
    });

    // 相册选择
    albumSelect.addEventListener('change', () => {
      this.selectedAlbumId = albumSelect.value || null;
    });
  },

  // 加载相册选项
  async loadAlbumOptions() {
    try {
      const response = await API.albums.getAll();
      if (response.success) {
        const select = document.getElementById('uploadAlbumSelect');
        select.innerHTML = '<option value="">不选择相册</option>';

        response.data.forEach(album => {
          const option = document.createElement('option');
          option.value = album.id;
          option.textContent = album.name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('加载相册列表失败:', error);
    }
  },

  // 打开弹窗
  openModal() {
    this.files = [];
    this.isUploading = false;
    this.selectedAlbumId = null;

    // 重置 UI
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('startUpload').disabled = true;
    document.getElementById('uploadAlbumSelect').value = '';

    // 打开弹窗
    document.getElementById('uploadModal').classList.add('active');
  },

  // 关闭弹窗
  closeModal() {
    if (this.isUploading) {
      Utils.showToast('正在上传中，请等待完成', 'warning');
      return;
    }

    document.getElementById('uploadModal').classList.remove('active');
    this.files = [];

    // 刷新画廊
    if (this.files.length > 0) {
      Gallery.refresh();
    }
  },

  // 处理文件
  handleFiles(fileList) {
    const validFiles = Array.from(fileList).filter(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        Utils.showToast(`${file.name} 不是图片文件`, 'error');
        return false;
      }

      // 检查文件大小 (50MB)
      if (file.size > 50 * 1024 * 1024) {
        Utils.showToast(`${file.name} 超过 50MB 限制`, 'error');
        return false;
      }

      return true;
    });

    this.files = [...this.files, ...validFiles];
    this.updatePreview();
    this.updateUploadButton();
  },

  // 更新预览
  updatePreview() {
    const previewContainer = document.getElementById('uploadPreview');
    const previewList = document.getElementById('previewList');
    const fileCount = document.getElementById('fileCount');

    if (this.files.length === 0) {
      previewContainer.style.display = 'none';
      return;
    }

    previewContainer.style.display = 'block';
    fileCount.textContent = `${this.files.length} 个文件`;

    previewList.innerHTML = '';

    this.files.forEach((file, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFile(index);
      });

      previewItem.appendChild(img);
      previewItem.appendChild(removeBtn);
      previewList.appendChild(previewItem);
    });
  },

  // 移除文件
  removeFile(index) {
    this.files.splice(index, 1);
    this.updatePreview();
    this.updateUploadButton();
  },

  // 清空文件
  clearFiles() {
    this.files = [];
    this.updatePreview();
    this.updateUploadButton();
  },

  // 更新上传按钮状态
  updateUploadButton() {
    const startUploadBtn = document.getElementById('startUpload');
    startUploadBtn.disabled = this.files.length === 0 || this.isUploading;
  },

  // 开始上传
  async startUpload() {
    if (this.files.length === 0 || this.isUploading) return;

    this.isUploading = true;
    this.updateUploadButton();

    // 显示进度条
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressContainer.style.display = 'block';

    try {
      const response = await API.photos.upload(
        this.files,
        this.selectedAlbumId,
        (progress) => {
          progressFill.style.width = `${progress}%`;
          progressText.textContent = `上传中... ${Math.round(progress)}%`;
        }
      );

      if (response.success) {
        progressFill.style.width = '100%';
        progressText.textContent = '上传完成！';

        Utils.showToast(response.message, 'success');

        // 触发照片上传成功事件
        window.dispatchEvent(new Event('photoUploaded'));

        // 延迟关闭弹窗
        setTimeout(() => {
          this.closeModal();
          Gallery.refresh();
        }, 1000);
      }
    } catch (error) {
      console.error('上传失败:', error);
      progressText.textContent = '上传失败';
      Utils.showToast(error.message || '上传失败', 'error');
    } finally {
      this.isUploading = false;
      this.updateUploadButton();
    }
  }
};

// 导出上传模块
window.Upload = Upload;
