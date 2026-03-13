var express = require('express');
var router = express.Router();
var parkingDAO = require('../data/parkingDAO');        // ← AÑADIDO
var { requireLogin } = require('../middlewares/auth'); // ← AÑADIDO

/* GET home page. */
router.get('/', async function(req, res, next) {       // ← CAMBIADO (async)
  let activeParking = null;
  let history = [];
  if (req.session && req.session.isLogged) {           // ← AÑADIDO (verificar sesión)
    activeParking = parkingDAO.getActive(req.session.userId);
    history = parkingDAO.getHistory(req.session.userId); // Solo historial del usuario
  } else {
    // Historial local del navegador (solo lo suyo)
    history = [];
  }
  res.render('index', {
    title: 'Express',
    activeParking,
    history
  });
});

// ← AÑADIDAS RUTAS DEL PARKING TRACKER
router.post('/api/parking', requireLogin, (req, res) => {
  const { lat, lng, timestamp } = req.body;
  const info = parkingDAO.create(req.session.userId, lat, lng, timestamp);
  res.json({ ok: true, id: info.lastInsertRowid });
});

router.post('/api/parking/end', requireLogin, (req, res) => {
  const active = parkingDAO.getActive(req.session.userId);
  if (active) parkingDAO.deactivate(active.id);
  res.json({ ok: true });
});


module.exports = router;
