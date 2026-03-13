// Acceso a la base de datos SQLite
const db = require('./db');

class UserDAO {
  // Busca usuario por nombre
  getByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  // Crea un nuevo usuario
  create(username, password) {
    return db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
  }
}

// Exporta la instancia del DAO
module.exports = new UserDAO();
