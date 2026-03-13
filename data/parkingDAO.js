const db = require('./db');

class ParkingDAO {
  getActive(userId) {
    return db.prepare('SELECT * FROM parkings WHERE user_id = ? AND active = 1 ORDER BY id DESC LIMIT 1').get(userId);
  }

  getHistory(userId) {
    return db.prepare('SELECT id, user_id, lat, lng, timestamp, ended_at AS endedAt, active FROM parkings WHERE user_id = ? ORDER BY id DESC').all(userId);
  }

  getHistoryAll() {
    return db.prepare('SELECT id, user_id, lat, lng, timestamp, ended_at AS endedAt, active FROM parkings ORDER BY id DESC').all();
  }

  create(userId, lat, lng, timestamp) {
    this.deactivate_all(userId);
    return db.prepare('INSERT INTO parkings (user_id, lat, lng, timestamp, ended_at, active) VALUES (?, ?, ?, ?, NULL, 1)').run(userId, lat, lng, timestamp);
  }

  deactivate(id, endedAt = new Date().toISOString()) {
    return db.prepare('UPDATE parkings SET active = 0, ended_at = ? WHERE id = ?').run(endedAt, id);
  }

  deactivate_all(userId) {
    const endedAt = new Date().toISOString();
    return db.prepare('UPDATE parkings SET active = 0, ended_at = ? WHERE user_id = ? AND active = 1').run(endedAt, userId);
  }
}

module.exports = new ParkingDAO();
