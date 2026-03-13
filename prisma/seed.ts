import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CLASSES = [
  { name: "መዝሙር", description: "Hymns and spiritual songs department" },
  { name: "ትምህርቲ", description: "Teaching and education department" },
  { name: "ኪነጥበብ", description: "Arts and creative expression department" },
  { name: "አባላት ጉዳይ", description: "Member affairs department" },
  { name: "ኦዲት እና ኢንስፔክሽን", description: "Audit and inspection department" },
  { name: "ልምዓት", description: "Development department" },
];

async function main() {
  console.log("Seeding database...");

  // Create classes
  for (const cls of CLASSES) {
    const existing = await prisma.class.findFirst({
      where: { name: cls.name },
    });
    if (!existing) {
      await prisma.class.create({
        data: {
          name: cls.name,
          description: cls.description,
        },
      });
    }
  }

  console.log(`Created ${CLASSES.length} classes`);

  // Create a default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@debrenegest.com" },
    update: {},
    create: {
      fullName: "System Admin",
      name: "System Admin",
      email: "admin@debrenegest.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Created admin user: admin@debrenegest.com / admin123");
  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
