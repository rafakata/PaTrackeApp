// Rutas principales de la aplicación
var express = require('express');
var router = express.Router();
var parkingDAO = require('../data/parkingDAO');        
var { requireLogin } = require('../middlewares/auth'); 

// Página principal: muestra estado y historial
router.get('/', async function(req, res, next) {      
  let activeParking = null;
  let history = [];
  if (req.session && req.session.isLogged) {          
    activeParking = parkingDAO.getActive(req.session.userId);
    history = parkingDAO.getHistory(req.session.userId); 
  } else {
    history = [];
  }
  res.render('index', {
    title: 'Express',
    activeParking,
    history
  });
});

// API: crear aparcamiento
router.post('/api/parking', requireLogin, (req, res) => {
  const { lat, lng, timestamp } = req.body;
  const info = parkingDAO.create(req.session.userId, lat, lng, timestamp);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// API: finalizar aparcamiento
router.post('/api/parking/end', requireLogin, (req, res) => {
  const active = parkingDAO.getActive(req.session.userId);
  if (active) parkingDAO.deactivate(active.id);
  res.json({ ok: true });
});

// Exporta el router
module.exports = router;
