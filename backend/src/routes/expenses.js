const express = require("express");
const nodemailer = require("nodemailer");
const authMiddleware = require("../middleware/auth");

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️ SMTP no configurado. Los correos no se enviarán.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function expensesRouter(prisma) {
  const router = express.Router();

  // Últimos gastos
  router.get(
    "/latest",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const expenses = await prisma.expense.findMany({
          orderBy: { expenseDate: "desc" },
          take: 20,
        });
        res.json(expenses);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener gastos" });
      }
    }
  );

  // Crear gasto
  router.post(
    "/",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const {
          description,
          category,
          amount,
          currency,
          exchangeRate,
          expenseDate,
          invoiceNumber,
          supplier,
        } = req.body;

        if (!description || !amount || !currency) {
          return res.status(400).json({
            message: "Descripción, monto y moneda son obligatorios",
          });
        }

        const expense = await prisma.expense.create({
          data: {
            adminId: req.user.id,
            description,
            category,
            amount,
            currency,
            exchangeRate,
            expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
            invoiceNumber,
            supplier,
          },
        });

        // Email opcional al administrador con el gasto
        const transporter = createTransporter();
        if (transporter) {
          try {
            const subject = `Nuevo gasto registrado: ${description}`;
            const text = `
Se ha registrado un nuevo gasto del condominio:

Descripción: ${expense.description}
Categoría: ${expense.category || "-"}
Monto: ${expense.amount} ${expense.currency}
Fecha: ${expense.expenseDate.toISOString().slice(0, 10)}
Factura: ${expense.invoiceNumber || "-"}
Proveedor: ${expense.supplier || "-"}
Registrado por (ID usuario): ${expense.adminId}
`;

            await transporter.sendMail({
              from: process.env.SMTP_FROM,
              to: process.env.SMTP_FROM,
              subject,
              text,
            });
            console.log('📧 Correo de gasto enviado');
          } catch (mailErr) {
            console.error("Error enviando correo de gasto:", mailErr);
          }
        }

        res.status(201).json(expense);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al registrar gasto" });
      }
    }
  );

  // Eliminar gasto
  router.delete(
    "/:id",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const { id } = req.params;
        await prisma.expense.delete({
          where: { id: parseInt(id, 10) },
        });
        res.json({ message: "Gasto eliminado exitosamente" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar gasto" });
      }
    }
  );

  return router;
}

module.exports = expensesRouter;

