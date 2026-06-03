const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// 导入路由
const photoRoutes = require('./routes/photos');
const albumRoutes = require('./routes/albums');

// 导入数据库初始化
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const originalsDir = path.join(uploadsDir, 'originals');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, originalsDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 中间件配置
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API 路由
app.use('/api/photos', photoRoutes);
app.use('/api/albums', albumRoutes);

// 前端路由 - 所有其他请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 初始化数据库并启动服务器
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✨ 服务器已启动`);
      console.log(`📸 访问地址: http://localhost:${PORT}`);
      console.log(`🚀 环境: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });

module.exports = app;
