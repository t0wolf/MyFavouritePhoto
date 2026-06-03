const { getDatabase, saveDatabase } = require('../config/database');

class Album {
  static async create(albumData) {
    const db = await getDatabase();

    db.run(`
      INSERT INTO albums (name, description)
      VALUES (?, ?)
    `, [albumData.name, albumData.description || null]);

    // 获取最后插入的ID
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];

    saveDatabase();
    return this.findById(id);
  }

  static async findById(id) {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM albums WHERE id = ?', [id]);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const album = this._mapRow(result[0]);

    // 获取相册中的照片数量
    const countResult = db.exec('SELECT COUNT(*) as count FROM photos WHERE album_id = ?', [id]);
    album.photo_count = countResult[0].values[0][0];

    // 获取封面照片
    if (album.cover_photo_id) {
      const coverResult = db.exec('SELECT filename FROM photos WHERE id = ?', [album.cover_photo_id]);
      if (coverResult && coverResult.length > 0 && coverResult[0].values.length > 0) {
        album.cover_photo = { filename: coverResult[0].values[0][0] };
      }
    }

    return album;
  }

  static async findAll() {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM albums ORDER BY created_at DESC');

    if (!result || result.length === 0) {
      return [];
    }

    const albums = [];

    for (const row of result[0].values) {
      const album = this._mapRow(result[0], row);

      // 获取相册中的照片数量
      const countResult = db.exec('SELECT COUNT(*) as count FROM photos WHERE album_id = ?', [album.id]);
      album.photo_count = countResult[0].values[0][0];

      // 获取封面照片
      if (album.cover_photo_id) {
        const coverResult = db.exec('SELECT filename FROM photos WHERE id = ?', [album.cover_photo_id]);
        if (coverResult && coverResult.length > 0 && coverResult[0].values.length > 0) {
          album.cover_photo = { filename: coverResult[0].values[0][0] };
        }
      }

      albums.push(album);
    }

    return albums;
  }

  static async update(id, updateData) {
    const db = await getDatabase();
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.run(`UPDATE albums SET ${fields.join(', ')} WHERE id = ?`, params);
    saveDatabase();

    return this.findById(id);
  }

  static async delete(id) {
    const db = await getDatabase();
    // 将相册中的照片设为无相册
    db.run('UPDATE photos SET album_id = NULL WHERE album_id = ?', [id]);
    db.run('DELETE FROM albums WHERE id = ?', [id]);
    saveDatabase();

    return { id };
  }

  static async addPhoto(albumId, photoId) {
    const db = await getDatabase();
    db.run('UPDATE photos SET album_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [albumId, photoId]);

    // 如果相册没有封面，设置第一张照片为封面
    const album = await this.findById(albumId);
    if (!album.cover_photo_id) {
      db.run('UPDATE albums SET cover_photo_id = ? WHERE id = ?', [photoId, albumId]);
    }

    saveDatabase();
    return this.findById(albumId);
  }

  static async removePhoto(albumId, photoId) {
    const db = await getDatabase();
    db.run('UPDATE photos SET album_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND album_id = ?', [photoId, albumId]);

    // 如果移除的是封面照片，更新封面
    const album = await this.findById(albumId);
    if (album.cover_photo_id === photoId) {
      const nextPhotoResult = db.exec('SELECT id FROM photos WHERE album_id = ? LIMIT 1', [albumId]);
      const nextPhotoId = nextPhotoResult && nextPhotoResult.length > 0 && nextPhotoResult[0].values.length > 0
        ? nextPhotoResult[0].values[0][0]
        : null;
      db.run('UPDATE albums SET cover_photo_id = ? WHERE id = ?', [nextPhotoId, albumId]);
    }

    saveDatabase();
    return this.findById(albumId);
  }

  static _mapRow(result, row) {
    if (!row) {
      row = result.values[0];
    }

    const columns = result.columns;
    const album = {};

    columns.forEach((col, index) => {
      album[col] = row[index];
    });

    return album;
  }
}

module.exports = Album;
