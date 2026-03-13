const express = require("express");
const ExcelJS = require("exceljs");
const authMiddleware = require("../middleware/auth");

function reportsRouter(prisma) {
  const router = express.Router();

  // Estado de cuentas general (ingresos - egresos) en moneda base simple
  router.get(
    "/summary",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const { year, month } = req.query;

        const wherePayments = {};
        const whereExpenses = {};

        if (year) {
          wherePayments.periodYear = parseInt(year, 10);
          whereExpenses.expenseDate = {
            gte: new Date(parseInt(year, 10), 0, 1),
            lt: new Date(parseInt(year, 10) + 1, 0, 1),
          };
        }
        if (month && year) {
          const y = parseInt(year, 10);
          const m = parseInt(month, 10) - 1;
          whereExpenses.expenseDate = {
            gte: new Date(y, m, 1),
            lt: new Date(y, m + 1, 1),
          };
        }

        const payments = await prisma.payment.findMany({ where: wherePayments });
        const expenses = await prisma.expense.findMany({ where: whereExpenses });

        const totalPayments = payments.reduce(
          (acc, p) => acc + Number(p.amount),
          0
        );
        const totalExpenses = expenses.reduce(
          (acc, e) => acc + Number(e.amount),
          0
        );

        res.json({
          totalPayments,
          totalExpenses,
          balance: totalPayments - totalExpenses,
          paymentsCount: payments.length,
          expensesCount: expenses.length,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener resumen" });
      }
    }
  );

  // Propietarios con pagos pendientes de un periodo
  router.get(
    "/pending-owners",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const { year, month } = req.query;
        if (!year || !month) {
          return res
            .status(400)
            .json({ message: "Año y mes son obligatorios" });
        }
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);

        const owners = await prisma.user.findMany({
          where: { role: "OWNER", isActive: true },
          include: {
            payments: {
              where: { periodYear: y, periodMonth: m },
            },
          },
        });

        const pending = owners
          .filter((o) => o.payments.length === 0)
          .map((o) => ({
            id: o.id,
            name: o.name,
            email: o.email,
            unitNumber: o.unitNumber,
          }));

        res.json(pending);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener pendientes" });
      }
    }
  );

  // Exportar ingresos y egresos a Excel
  router.get(
    "/export-excel",
    authMiddleware("ADMIN"),
    async (req, res) => {
      try {
        const workbook = new ExcelJS.Workbook();

        // Hoja de pagos
        const paymentsSheet = workbook.addWorksheet("Pagos");
        paymentsSheet.addRow([
          "ID",
          "Propietario",
          "Email",
          "Unidad",
          "Monto",
          "Moneda",
          "Año",
          "Mes",
          "Fecha pago",
          "Método",
          "Nota",
        ]);

        const payments = await prisma.payment.findMany({
          include: { user: true },
          orderBy: { paymentDate: "desc" },
        });
        payments.forEach((p) => {
          paymentsSheet.addRow([
            p.id,
            p.user?.name,
            p.user?.email,
            p.user?.unitNumber,
            Number(p.amount),
            p.currency,
            p.periodYear,
            p.periodMonth,
            p.paymentDate.toISOString().slice(0, 10),
            p.method,
            p.note,
          ]);
        });

        // Hoja de gastos
        const expensesSheet = workbook.addWorksheet("Gastos");
        expensesSheet.addRow([
          "ID",
          "Descripción",
          "Categoría",
          "Monto",
          "Moneda",
          "Fecha",
          "Factura",
          "Proveedor",
          "AdminId",
        ]);

        const expenses = await prisma.expense.findMany({
          orderBy: { expenseDate: "desc" },
        });
        expenses.forEach((e) => {
          expensesSheet.addRow([
            e.id,
            e.description,
            e.category,
            Number(e.amount),
            e.currency,
            e.expenseDate.toISOString().slice(0, 10),
            e.invoiceNumber,
            e.supplier,
            e.adminId,
          ]);
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=condominio-reportes.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al exportar a Excel" });
      }
    }
  );

  return router;
}

module.exports = reportsRouter;

