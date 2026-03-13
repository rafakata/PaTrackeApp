// Inicializa la base de datos SQLite
const Database = require('better-sqlite3');
const db = new Database('./db.sqlite');

// Crea las tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parkings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    timestamp TEXT NOT NULL,
    ended_at TEXT,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Añade columna ended_at si no existe
try {
  db.prepare('ALTER TABLE parkings ADD COLUMN ended_at TEXT').run();
} catch (error) {
  if (!String(error.message).includes('duplicate column name')) {
    throw error;
  }
}

// Exporta la instancia de la base de datos
module.exports = db;
