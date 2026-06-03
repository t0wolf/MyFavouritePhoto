const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'originals'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。只允许 JPG, PNG, GIF, WebP 和 SVG 格式。'), false);
  }
};

// Multer 配置
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 生成缩略图
async function generateThumbnail(file) {
  const thumbnailsDir = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails');
  const thumbnailPath = path.join(thumbnailsDir, file.filename);

  try {
    // 获取图片信息
    const metadata = await sharp(file.path).metadata();

    // 生成缩略图 (最大宽度 400px)
    await sharp(file.path)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath.replace(path.extname(thumbnailPath), '.jpg'));

    return {
      width: metadata.width,
      height: metadata.height,
      thumbnailFilename: file.filename.replace(path.extname(file.filename), '.jpg')
    };
  } catch (error) {
    console.error('生成缩略图失败:', error);
    // 如果缩略图生成失败，使用原图
    return {
      width: null,
      height: null,
      thumbnailFilename: file.filename
    };
  }
}

// 处理上传的中间件
const processUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = [];

    for (const file of req.files) {
      const result = await generateThumbnail(file);
      processedFiles.push({
        ...file,
        width: result.width,
        height: result.height,
        thumbnailFilename: result.thumbnailFilename
      });
    }

    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  processUpload
};
