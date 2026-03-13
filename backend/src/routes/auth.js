const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function authRouter(prisma) {
  const router = express.Router();

  // Crear usuario (admin o propietario) - solo para fase inicial o uso interno
  router.post("/register", async (req, res) => {
    try {
      const { name, email, password, role = "OWNER", unitNumber } = req.body;

      if (!email || !password || !name) {
        return res
          .status(400)
          .json({ message: "Nombre, email y contraseña son obligatorios" });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          unitNumber,
        },
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        unitNumber: user.unitNumber,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error al registrar usuario" });
    }
  });

  // Login
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email y contraseña son obligatorios" });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          unitNumber: user.unitNumber,
        },
        process.env.JWT_SECRET || "dev-secret",
        { expiresIn: "8h" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          unitNumber: user.unitNumber,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error en el login" });
    }
  });

  return router;
}

module.exports = authRouter;

