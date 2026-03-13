const db = require('./db');

class ParkingDAO {
  getActive(userId) {
    return db.prepare('SELECT * FROM parkings WHERE user_id = ? AND active = 1 ORDER BY id DESC LIMIT 1').get(userId);
  }

  getHistory(userId) {
    return db.prepare('SELECT * FROM parkings WHERE user_id = ? ORDER BY id DESC').all(userId);
  }

  create(userId, lat, lng, timestamp) {
    // ← AÑADIDO: Desactivar anteriores ANTES de crear nuevo
    this.deactivate_all(userId);
    return db.prepare('INSERT INTO parkings (user_id, lat, lng, timestamp, active) VALUES (?, ?, ?, ?, 1)').run(userId, lat, lng, timestamp);
  }

  deactivate(id) {
    return db.prepare('UPDATE parkings SET active = 0 WHERE id = ?').run(id);
  }

  // ← NUEVO MÉTODO (1 línea)
  deactivate_all(userId) {
    return db.prepare('UPDATE parkings SET active = 0 WHERE user_id = ? AND active = 1').run(userId);
  }
}

module.exports = new ParkingDAO();
