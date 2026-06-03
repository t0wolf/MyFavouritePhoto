# 我的照片集 - 个人照片收集网站

一个精美的个人照片收集和展示网站，使用 Node.js + Express + SQLite 构建。

## ✨ 功能特点

### 📸 照片管理
- **拖拽上传** - 支持拖拽或点击上传照片
- **批量上传** - 支持同时上传多张照片
- **自动压缩** - 自动生成缩略图，优化加载速度
- **照片信息** - 支持编辑标题、描述和标签

### 📁 相册功能
- **创建相册** - 按主题整理照片
- **相册管理** - 编辑、删除相册
- **封面自动选择** - 自动设置相册封面

### 🖼️ 展示模式
- **网格视图** - 整齐的网格布局
- **瀑布流视图** - 瀑布流布局展示
- **灯箱查看** - 全屏查看大图，支持左右切换

### 🎨 界面特性
- **明暗主题** - 支持亮色/暗色主题切换
- **响应式设计** - 完美适配手机、平板和桌面
- **流畅动画** - 精致的过渡和交互动画
- **键盘快捷键** - 支持快捷键操作

### 🔍 其他功能
- **搜索功能** - 按标题、描述、标签搜索
- **收藏功能** - 收藏喜欢的照片
- **无限滚动** - 自动加载更多照片
- **本地存储** - 主题偏好本地保存

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装步骤

1. **克隆或下载项目**
   ```bash
   cd myfavouritephoto
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务器**
   ```bash
   npm start
   ```

4. **访问网站**
   打开浏览器访问 `http://localhost:3000`

### 开发模式
```bash
npm run dev
```
使用 nodemon 监听文件变化，自动重启服务器。

## 📁 项目结构

```
myfavouritephoto/
├── server.js                 # Express 服务器入口
├── package.json             # 项目配置
├── config/
│   └── database.js          # 数据库配置
├── models/
│   ├── Photo.js             # 照片数据模型
│   └── Album.js             # 相册数据模型
├── routes/
│   ├── photos.js            # 照片 API 路由
│   └── albums.js            # 相册 API 路由
├── middleware/
│   └── upload.js            # 文件上传中间件
├── public/
│   ├── index.html           # 主页面
│   ├── css/                 # 样式文件
│   ├── js/                  # JavaScript 文件
│   └── uploads/             # 上传文件存储
│       ├── originals/       # 原始图片
│       └── thumbnails/      # 缩略图
└── data/                    # 数据库文件
    └── photos.db            # SQLite 数据库
```

## 🔧 配置说明

### 端口配置
默认端口为 3000，可通过环境变量修改：
```bash
PORT=8080 npm start
```

### 文件上传限制
- 单个文件最大：50MB
- 支持格式：JPG, PNG, GIF, WebP, SVG
- 单次最多上传：20 张照片

## 📱 键盘快捷键

- `Ctrl/Cmd + K` - 聚焦搜索框
- `Ctrl/Cmd + U` - 打开上传窗口
- `←` - 上一张照片（灯箱中）
- `→` - 下一张照片（灯箱中）
- `ESC` - 关闭弹窗/灯箱

## 🌐 部署说明

### 部署到云服务器

1. **上传项目文件到服务器**

2. **安装依赖**
   ```bash
   npm install --production
   ```

3. **使用 PM2 启动（推荐）**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "myfavouritephoto"
   pm2 save
   pm2 startup
   ```

4. **配置 Nginx 反向代理（可选）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **配置 HTTPS（推荐）**
   使用 Let's Encrypt 或其他 SSL 证书服务。

### 环境变量

- `PORT` - 服务器端口（默认：3000）
- `NODE_ENV` - 运行环境（development/production）

## 🛠️ 技术栈

- **后端**
  - Node.js
  - Express.js
  - SQLite (sql.js)
  - Multer (文件上传)
  - Sharp (图片处理)

- **前端**
  - HTML5
  - CSS3 (CSS Variables, Grid, Flexbox)
  - JavaScript (ES6+)
  - 原生 Fetch API

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 完整的照片管理功能
- 相册分类功能
- 明暗主题切换
- 响应式设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 💡 提示

- 首次使用时，请上传一些照片开始体验
- 可以创建不同的相册来分类整理照片
- 使用收藏功能标记你喜欢的照片
- 尝试切换明暗主题，找到你喜欢的风格
