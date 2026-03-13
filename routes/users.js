var express = require('express');
var router = express.Router();
var userDAO = require('../data/userDAO');              // ← AÑADIDO

// ← RUTAS DE AUTENTICACIÓN (reemplaza tu ruta vacía)
router.get('/login', (req, res) => {                   // ← CAMBIADO
  if (req.session && req.session.isLogged) return res.redirect('/');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = userDAO.getByUsername(username);
  if (!user || user.password !== password) {
    return res.render('login', { error: 'Usuario o contraseña incorrectos' });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).send('Error al iniciar sesión');
    req.session.userId = user.id;
    req.session.user = { id: user.id, username: user.username };
    req.session.isLogged = true;
    res.redirect('/');
  });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  try {
    userDAO.create(username, password);
    res.render('login', { error: 'Cuenta creada. Inicia sesión.' });
  } catch {
    res.render('login', { error: 'El usuario ya existe' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sesionId');
    res.redirect('/login');
  });
});

module.exports = router;
