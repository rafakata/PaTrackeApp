// Middleware para requerir login
function requireLogin(req, res, next) {
  if (req.session && req.session.isLogged) return next();
  res.redirect('/login');
}

// Exporta el middleware
module.exports = { requireLogin };
