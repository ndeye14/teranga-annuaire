import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const workshops = [
  {
    slug: "atelier-de-mor-medina",
    name: "Atelier de Mor",
    ownerName: "Mor Diop",
    neighborhood: "Médina",
    yearsExperience: 15,
    specialties: ["chaises", "tables basses", "armoires"],
    description:
      "Atelier familial spécialisé dans le mobilier en bois massif depuis trois générations. Travail soigné du teck et du caïlcédrat, finitions à l'huile naturelle.",
    photoUrl: null,
  },
  {
    slug: "bois-et-tradition-yoff",
    name: "Bois & Tradition",
    ownerName: "Aliou Ndiaye",
    neighborhood: "Yoff",
    yearsExperience: 22,
    specialties: ["portes", "fenêtres", "escaliers"],
    description:
      "Menuiserie de bâtiment installée à Yoff. Spécialiste des grandes pièces sur mesure pour villas et immeubles : portes d'entrée, fenêtres persiennes, escaliers en bois exotique.",
    photoUrl: null,
  },
  {
    slug: "senegal-mobilier-parcelles",
    name: "Sénégal Mobilier Moderne",
    ownerName: "Fatou Sow",
    neighborhood: "Parcelles Assainies",
    yearsExperience: 8,
    specialties: ["bureaux", "étagères", "meubles design"],
    description:
      "Atelier jeune avec une approche contemporaine. Mobilier pour bureaux et particuliers, lignes épurées inspirées du design scandinave avec une touche afro-moderne.",
    photoUrl: null,
  },
];

async function main() {
  for (const w of workshops) {
    const result = await prisma.workshop.upsert({
      where: { slug: w.slug },
      update: w,
      create: w,
    });
    console.log(`  ↳ ${result.name} (${result.slug})`);
  }
  console.log(`✅ Seed terminé : ${workshops.length} ateliers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
