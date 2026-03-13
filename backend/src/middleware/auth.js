const jwt = require("jsonwebtoken");

function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: "Permisos insuficientes" });
      }
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };
}

module.exports = authMiddleware;

