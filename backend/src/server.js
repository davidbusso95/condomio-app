const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const authRouter = require("./routes/auth");
const paymentsRouter = require("./routes/payments");
const expensesRouter = require("./routes/expenses");
const reportsRouter = require("./routes/reports");

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Condominio API" });
});

app.use("/api/auth", authRouter(prisma));
app.use("/api/payments", paymentsRouter(prisma));
app.use("/api/expenses", expensesRouter(prisma));
app.use("/api/reports", reportsRouter(prisma));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});

