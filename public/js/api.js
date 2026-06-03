// API 请求封装

const API = {
  baseUrl: '/api',

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API 请求错误:', error);
      throw error;
    }
  },

  // 照片相关 API
  photos: {
    // 获取照片列表
    async getAll(options = {}) {
      const params = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          params.append(key, options[key]);
        }
      });
      const query = params.toString();
      return API.request(`/photos${query ? '?' + query : ''}`);
    },

    // 获取单张照片
    async getById(id) {
      return API.request(`/photos/${id}`);
    },

    // 上传照片
    async upload(files, albumId = null, onProgress = null) {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });
      if (albumId) {
        formData.append('album_id', albumId);
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API.baseUrl}/photos/upload`);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || '上传失败'));
            } catch {
              reject(new Error('上传失败'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        xhr.send(formData);
      });
    },

    // 更新照片信息
    async update(id, data) {
      return API.request(`/photos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // 删除照片
    async delete(id) {
      return API.request(`/photos/${id}`, {
        method: 'DELETE'
      });
    },

    // 切换收藏状态
    async toggleFavorite(id) {
      return API.request(`/photos/${id}/favorite`, {
        method: 'POST'
      });
    },

    // 搜索照片
    async search(keyword) {
      return API.request(`/photos/search/${encodeURIComponent(keyword)}`);
    }
  },

  // 相册相关 API
  albums: {
    // 获取所有相册
    async getAll() {
      return API.request('/albums');
    },

    // 获取单个相册
    async getById(id) {
      return API.request(`/albums/${id}`);
    },

    // 创建相册
    async create(data) {
      return API.request('/albums', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    // 更新相册
    async update(id, data) {
      return API.request(`/albums/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // 删除相册
    async delete(id) {
      return API.request(`/albums/${id}`, {
        method: 'DELETE'
      });
    },

    // 添加照片到相册
    async addPhoto(albumId, photoId) {
      return API.request(`/albums/${albumId}/photos`, {
        method: 'POST',
        body: JSON.stringify({ photo_id: photoId })
      });
    },

    // 从相册移除照片
    async removePhoto(albumId, photoId) {
      return API.request(`/albums/${albumId}/photos/${photoId}`, {
        method: 'DELETE'
      });
    }
  }
};

// 导出 API
window.API = API;
