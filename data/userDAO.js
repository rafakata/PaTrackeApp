const db = require('./db');

class UserDAO {
  getByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  create(username, password) {
    return db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
  }
}

module.exports = new UserDAO();
