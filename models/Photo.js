const { getDatabase, saveDatabase } = require('../config/database');

class Photo {
  static async create(photoData) {
    const db = await getDatabase();

    db.run(`
      INSERT INTO photos (filename, originalname, mimetype, size, width, height, title, description, tags, album_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      photoData.filename,
      photoData.originalname,
      photoData.mimetype,
      photoData.size,
      photoData.width || null,
      photoData.height || null,
      photoData.title || null,
      photoData.description || null,
      JSON.stringify(photoData.tags || []),
      photoData.album_id || null
    ]);

    // 获取最后插入的ID
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];

    saveDatabase();
    return this.findById(id);
  }

  static async findById(id) {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM photos WHERE id = ?', [id]);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const photo = this._mapRow(result[0]);
    return photo;
  }

  static async findAll(options = {}) {
    const db = await getDatabase();
    let query = 'SELECT * FROM photos';
    const params = [];
    const conditions = [];

    if (options.album_id) {
      conditions.push('album_id = ?');
      params.push(options.album_id);
    }

    if (options.search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (options.is_favorite) {
      conditions.push('is_favorite = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 排序
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // 分页
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const result = db.exec(query, params);

    if (!result || result.length === 0) {
      return [];
    }

    return result[0].values.map(row => this._mapRow(result[0], row));
  }

  static async update(id, updateData) {
    const db = await getDatabase();
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'tags') {
          fields.push(`${key} = ?`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.run(`UPDATE photos SET ${fields.join(', ')} WHERE id = ?`, params);
    saveDatabase();

    return this.findById(id);
  }

  static async delete(id) {
    const db = await getDatabase();
    const photo = await this.findById(id);
    if (!photo) return null;

    db.run('DELETE FROM photos WHERE id = ?', [id]);
    saveDatabase();

    return photo;
  }

  static async count(options = {}) {
    const db = await getDatabase();
    let query = 'SELECT COUNT(*) as count FROM photos';
    const params = [];
    const conditions = [];

    if (options.album_id) {
      conditions.push('album_id = ?');
      params.push(options.album_id);
    }

    if (options.search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = db.exec(query, params);

    if (!result || result.length === 0) {
      return 0;
    }

    return result[0].values[0][0];
  }

  static async toggleFavorite(id) {
    const db = await getDatabase();
    db.run('UPDATE photos SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
    saveDatabase();

    return this.findById(id);
  }

  static _mapRow(result, row) {
    if (!row) {
      row = result.values[0];
    }

    const columns = result.columns;
    const photo = {};

    columns.forEach((col, index) => {
      photo[col] = row[index];
    });

    // 解析 JSON 标签
    if (photo.tags) {
      try {
        photo.tags = JSON.parse(photo.tags);
      } catch (e) {
        photo.tags = [];
      }
    } else {
      photo.tags = [];
    }

    return photo;
  }
}

module.exports = Photo;
