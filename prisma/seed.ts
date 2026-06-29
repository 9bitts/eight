import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo12345";

type SeedUser = {
  email: string;
  displayName: string;
  handle: string;
  specialty: string;
  registrationType: string;
  registrationNumber: string;
  registrationCountry: string;
  location: string;
  verified: boolean;
  posts: string[];
};

const USERS: SeedUser[] = [
  {
    email: "ana@demo.eight",
    displayName: "Dra. Ana Beltrão",
    handle: "anabeltrao",
    specialty: "Cardiologia",
    registrationType: "CRM",
    registrationNumber: "123456-SP",
    registrationCountry: "BR",
    location: "São Paulo, BR",
    verified: true,
    posts: [
      "Voltando do congresso de cardiologia com a cabeça fervilhando sobre os novos protocolos de insuficiência cardíaca. Quem mais esteve lá? Vamos abrir um fio pra trocar o que cada um trouxe de mais útil. 🫀",
    ],
  },
  {
    email: "miguel@demo.eight",
    displayName: "Dr. Miguel Costa",
    handle: "miguelcosta",
    specialty: "Medicina Geral",
    registrationType: "OM",
    registrationNumber: "OM-48291",
    registrationCountry: "PT",
    location: "Lisboa, PT",
    verified: true,
    posts: [
      "Colegas que já fazem teleconsulta para a comunidade lusófona nos EUA e Canadá: como gerem a diferença de fuso e a questão da receita entre países? Estou a começar e toda a partilha ajuda.",
    ],
  },
  {
    email: "sarah@demo.eight",
    displayName: "Sarah Lin, MD",
    handle: "drsarahlin",
    specialty: "Endocrinology",
    registrationType: "NPI",
    registrationNumber: "1234567890",
    registrationCountry: "US",
    location: "Boston, US",
    verified: true,
    posts: [
      "New review on GLP-1 long-term adherence is worth your time. The drop-off after month 6 is steeper than most of us assume. Sharing my 5 key clinical takeaways below 🧵",
    ],
  },
  {
    email: "carla@demo.eight",
    displayName: "Enf. Carla Dias",
    handle: "carladias",
    specialty: "Enfermagem",
    registrationType: "COREN",
    registrationNumber: "987654-PT",
    registrationCountry: "PT",
    location: "Porto, PT",
    verified: true,
    posts: [
      "Implementámos um protocolo de acolhimento que reduziu o tempo de triagem em ~30%. Partilho o fluxograma para quem quiser adaptar na sua unidade. A enfermagem também faz inovação. 💙",
    ],
  },
];

const SUGGESTIONS = [
  {
    email: "joao@demo.eight",
    displayName: "Dr. João Reis",
    handle: "joaoreis",
    specialty: "Pediatria",
    registrationType: "CRM",
    registrationNumber: "111222-RJ",
    registrationCountry: "BR",
    location: "Rio de Janeiro, BR",
    verified: true,
    posts: [] as string[],
  },
  {
    email: "lucia@demo.eight",
    displayName: "Dra. Lúcia Mendes",
    handle: "luciamendes",
    specialty: "Dermatologia",
    registrationType: "CRM",
    registrationNumber: "333444-MG",
    registrationCountry: "BR",
    location: "Belo Horizonte, BR",
    verified: true,
    posts: [] as string[],
  },
  {
    email: "pedro@demo.eight",
    displayName: "Dr. Pedro Alves",
    handle: "pedroalves",
    specialty: "Psiquiatria",
    registrationType: "CRM",
    registrationNumber: "555666-RS",
    registrationCountry: "BR",
    location: "Porto Alegre, BR",
    verified: true,
    posts: [] as string[],
  },
];

async function createUser(u: SeedUser) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: {
      name: u.displayName,
      email: u.email,
      passwordHash,
      profile: {
        create: {
          handle: u.handle,
          displayName: u.displayName,
          specialty: u.specialty,
          registrationType: u.registrationType,
          registrationNumber: u.registrationNumber,
          registrationCountry: u.registrationCountry,
          location: u.location,
          verified: u.verified,
          verifiedAt: u.verified ? new Date() : null,
        },
      },
    },
    include: { profile: true },
  });

  if (user.profile && u.posts.length > 0) {
    for (const body of u.posts) {
      const exists = await prisma.post.findFirst({
        where: { authorId: user.profile.id, body },
      });
      if (!exists) {
        await prisma.post.create({
          data: { authorId: user.profile.id, body },
        });
      }
    }
  }

  return user;
}

async function main() {
  console.log("Semeando banco eight…");

  for (const u of [...USERS, ...SUGGESTIONS]) {
    await createUser(u);
    console.log(`  ✓ @${u.handle}`);
  }

  console.log("\nContas demo (senha: demo12345):");
  for (const u of USERS) {
    console.log(`  ${u.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
