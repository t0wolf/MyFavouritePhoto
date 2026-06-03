const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'photos.db');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

async function getDatabase() {
  if (db) {
    return db;
  }

  const SQL = await initSqlJs();

  // 如果数据库文件存在，读取它
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initDatabase() {
  const db = await getDatabase();

  // 创建相册表
  db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      cover_photo_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建照片表
  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      title TEXT,
      description TEXT,
      tags TEXT DEFAULT '[]',
      album_id INTEGER,
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
    )
  `);

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at)`);

  // 保存数据库
  saveDatabase();

  console.log('✅ 数据库初始化完成');
}

module.exports = {
  getDatabase,
  saveDatabase,
  initDatabase
};
