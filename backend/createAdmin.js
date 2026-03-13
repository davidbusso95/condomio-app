const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const name = "davidb";
  const email = "david.busso95@gmail.com";
  const plainPassword = "2840";

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    console.log("El usuario admin ya existe con id:", user.id);
    return;
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Usuario admin creado con éxito. ID:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

