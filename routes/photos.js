const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
const { upload, processUpload } = require('../middleware/upload');

// 获取所有照片
router.get('/', async (req, res) => {
  try {
    const options = {
      album_id: req.query.album_id ? parseInt(req.query.album_id) : null,
      search: req.query.search || null,
      is_favorite: req.query.is_favorite === 'true',
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null
    };

    const photos = await Photo.findAll(options);
    const total = await Photo.count(options);

    res.json({
      success: true,
      data: photos,
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('获取照片列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取照片列表失败'
    });
  }
});

// 获取单张照片
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(parseInt(req.params.id));
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('获取照片详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取照片详情失败'
    });
  }
});

// 上传照片
router.post('/upload', upload.array('photos', 20), processUpload, async (req, res) => {
  try {
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的照片'
      });
    }

    const uploadedPhotos = [];

    for (const file of req.processedFiles) {
      const photoData = {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        width: file.width,
        height: file.height,
        title: path.parse(file.originalname).name,
        album_id: req.body.album_id ? parseInt(req.body.album_id) : null
      };

      const photo = await Photo.create(photoData);
      uploadedPhotos.push(photo);
    }

    res.status(201).json({
      success: true,
      message: `成功上传 ${uploadedPhotos.length} 张照片`,
      data: uploadedPhotos
    });
  } catch (error) {
    console.error('上传照片失败:', error);
    res.status(500).json({
      success: false,
      message: '上传照片失败'
    });
  }
});

// 更新照片信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const photo = await Photo.findById(id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags
    };

    const updatedPhoto = await Photo.update(id, updateData);

    res.json({
      success: true,
      data: updatedPhoto
    });
  } catch (error) {
    console.error('更新照片失败:', error);
    res.status(500).json({
      success: false,
      message: '更新照片失败'
    });
  }
});

// 删除照片
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const photo = await Photo.findById(id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    // 删除文件
    const originalPath = path.join(__dirname, '..', 'public', 'uploads', 'originals', photo.filename);
    const thumbnailPath = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails', photo.filename.replace(path.extname(photo.filename), '.jpg'));

    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    await Photo.delete(id);

    res.json({
      success: true,
      message: '照片已删除'
    });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json({
      success: false,
      message: '删除照片失败'
    });
  }
});

// 切换收藏状态
router.post('/:id/favorite', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const photo = await Photo.toggleFavorite(id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: '切换收藏状态失败'
    });
  }
});

// 搜索照片
router.get('/search/:keyword', async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const photos = await Photo.findAll({ search: keyword });

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('搜索照片失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索照片失败'
    });
  }
});

module.exports = router;
