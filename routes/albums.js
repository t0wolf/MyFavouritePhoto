const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Photo = require('../models/Photo');

// 获取所有相册
router.get('/', async (req, res) => {
  try {
    const albums = await Album.findAll();
    res.json({
      success: true,
      data: albums
    });
  } catch (error) {
    console.error('获取相册列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取相册列表失败'
    });
  }
});

// 获取单个相册
router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(parseInt(req.params.id));
    if (!album) {
      return res.status(404).json({
        success: false,
        message: '相册不存在'
      });
    }

    res.json({
      success: true,
      data: album
    });
  } catch (error) {
    console.error('获取相册详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取相册详情失败'
    });
  }
});

// 创建相册
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '相册名称不能为空'
      });
    }

    const album = await Album.create({ name: name.trim(), description });

    res.status(201).json({
      success: true,
      data: album
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: '相册名称已存在'
      });
    }

    console.error('创建相册失败:', error);
    res.status(500).json({
      success: false,
      message: '创建相册失败'
    });
  }
});

// 更新相册
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: '相册不存在'
      });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description
    };

    const updatedAlbum = await Album.update(id, updateData);

    res.json({
      success: true,
      data: updatedAlbum
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: '相册名称已存在'
      });
    }

    console.error('更新相册失败:', error);
    res.status(500).json({
      success: false,
      message: '更新相册失败'
    });
  }
});

// 删除相册
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: '相册不存在'
      });
    }

    await Album.delete(id);

    res.json({
      success: true,
      message: '相册已删除'
    });
  } catch (error) {
    console.error('删除相册失败:', error);
    res.status(500).json({
      success: false,
      message: '删除相册失败'
    });
  }
});

// 添加照片到相册
router.post('/:id/photos', async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const { photo_id } = req.body;

    if (!photo_id) {
      return res.status(400).json({
        success: false,
        message: '请选择要添加的照片'
      });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: '相册不存在'
      });
    }

    const photo = await Photo.findById(parseInt(photo_id));
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '照片不存在'
      });
    }

    const updatedAlbum = await Album.addPhoto(albumId, parseInt(photo_id));

    res.json({
      success: true,
      data: updatedAlbum
    });
  } catch (error) {
    console.error('添加照片到相册失败:', error);
    res.status(500).json({
      success: false,
      message: '添加照片到相册失败'
    });
  }
});

// 从相册移除照片
router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const photoId = parseInt(req.params.photoId);

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: '相册不存在'
      });
    }

    const updatedAlbum = await Album.removePhoto(albumId, photoId);

    res.json({
      success: true,
      data: updatedAlbum
    });
  } catch (error) {
    console.error('从相册移除照片失败:', error);
    res.status(500).json({
      success: false,
      message: '从相册移除照片失败'
    });
  }
});

module.exports = router;
