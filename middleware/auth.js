const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Accès refusé. Aucun jeton fourni."
    });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Jeton invalide."
    });
  }
};

const authorizeRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Accès refusé. Vous n'avez pas la permission nécessaire."
    });
  }
  next();
};

module.exports = {
  verifyToken,
  authorizeRole
};
