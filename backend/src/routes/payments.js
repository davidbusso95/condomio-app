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

function paymentsRouter(prisma) {
  const router = express.Router();

  // Listar pagos del usuario autenticado
  router.get(
    "/my",
    authMiddleware("OWNER"),
    async (req, res) => {
      try {
        const payments = await prisma.payment.findMany({
          where: { userId: req.user.id },
          orderBy: { paymentDate: "desc" },
        });
        res.json(payments);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener pagos" });
      }
    }
  );

  // Registrar un pago (propietario)
  router.post(
    "/",
    authMiddleware("OWNER"),
    async (req, res) => {
      try {
        const {
          amount,
          currency,
          exchangeRate,
          periodYear,
          periodMonth,
          paymentDate,
          method,
          note,
        } = req.body;

        if (!amount || !currency || !periodYear || !periodMonth) {
          return res.status(400).json({
            message:
              "Monto, moneda, año y mes del periodo son obligatorios",
          });
        }

        console.log("Creating payment with currency:", currency, "type:", typeof currency);

        const payment = await prisma.payment.create({
          data: {
            userId: req.user.id,
            amount: String(amount),
            currency: currency,
            exchangeRate: exchangeRate ? String(exchangeRate) : null,
            periodYear: parseInt(periodYear, 10),
            periodMonth: parseInt(periodMonth, 10),
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            method,
            note,
          },
          include: { user: true },
        });

        // Enviar correo con datos del pago
        const transporter = createTransporter();
        if (transporter) {
          try {
            const to = payment.user.email;
            const adminEmail = process.env.SMTP_FROM;

            const subject = `Registro de pago condominio - ${payment.user.name}`;
            const text = `
Se ha registrado un nuevo pago de condominio:

Propietario: ${payment.user.name}
Apartamento: ${payment.user.unitNumber || "-"}
Monto: ${payment.amount} ${payment.currency}
Periodo: ${payment.periodMonth}/${payment.periodYear}
Fecha de pago: ${payment.paymentDate.toISOString().slice(0, 10)}
Método: ${payment.method || "-"}
Nota: ${payment.note || "-"}
`;

            await transporter.sendMail({
              from: process.env.SMTP_FROM,
              to,
              cc: adminEmail,
              subject,
              text,
            });
            console.log('📧 Correo de pago enviado a:', to);
          } catch (mailErr) {
            console.error("Error enviando correo de pago:", mailErr);
          }
        }

        res.status(201).json(payment);
      } catch (err) {
        console.error("Error creating payment:", err);
        console.error("Error details:", err.message, err.meta);
        res.status(500).json({ 
          message: "Error al registrar pago",
          error: err.message 
        });
      }
    }
  );

  // Listar pagos (admin, con filtros opcionales)
  router.get(
    "/",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const { year, month } = req.query;
        const where = {};
        if (year) where.periodYear = parseInt(year, 10);
        if (month) where.periodMonth = parseInt(month, 10);

        const payments = await prisma.payment.findMany({
          where,
          orderBy: { paymentDate: "desc" },
          include: { user: true },
        });
        res.json(payments);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener pagos" });
      }
    }
  );

  // Últimos pagos (para admin - similar a latest expenses)
  router.get(
    "/latest",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const payments = await prisma.payment.findMany({
          orderBy: { paymentDate: "desc" },
          take: 20,
          include: { user: true },
        });
        res.json(payments);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener pagos" });
      }
    }
  );

  return router;
}

module.exports = paymentsRouter;

