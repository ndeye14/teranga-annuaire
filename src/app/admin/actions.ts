"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * Server Action appelée par le formulaire `/admin`.
 * Lit les champs du FormData, valide, crée l'atelier, redirige vers la home.
 */
export async function createWorkshop(formData: FormData) {
  // Lecture des champs — toujours `String(... ?? "")` pour gérer null/File
  const name = String(formData.get("name") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const photoUrlRaw = String(formData.get("photoUrl") ?? "").trim();
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const yearsExperience = Number(formData.get("yearsExperience"));

  // Validation côté serveur (HTML5 required est utile en UX mais peut être bypass)
  if (!name || !ownerName || !neighborhood || !description) {
    redirect(
      `/admin?error=${encodeURIComponent("Tous les champs marqués * sont requis")}`
    );
  }
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
    redirect(
      `/admin?error=${encodeURIComponent("Années d'expérience doit être un nombre positif")}`
    );
  }

  const specialties = specialtiesRaw
    ? specialtiesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const slug = slugify(name);

  // Garde-fou : unicité du slug. On pourrait laisser Prisma lever l'erreur P2002
  // et la catcher, mais une vérification explicite donne un message plus clair.
  const existing = await prisma.workshop.findUnique({ where: { slug } });
  if (existing) {
    redirect(
      `/admin?error=${encodeURIComponent(
        `Un atelier nommé "${name}" existe déjà (slug : ${slug})`
      )}`
    );
  }

  await prisma.workshop.create({
    data: {
      name,
      slug,
      ownerName,
      neighborhood,
      yearsExperience,
      specialties,
      description,
      photoUrl: photoUrlRaw || null,
    },
  });

  // Invalide le cache de la home pour que le nouvel atelier apparaisse.
  revalidatePath("/");
  // Redirige vers la home : l'utilisateur voit sa création immédiatement.
  redirect("/");
}

/**
 * Server Action de mise à jour. Appelée par le formulaire `/admin/[slug]/edit`,
 * avec l'id bound via `.bind(null, workshop.id)`.
 * Le slug N'est PAS modifiable (l'URL doit rester stable).
 */
export async function updateWorkshop(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const photoUrlRaw = String(formData.get("photoUrl") ?? "").trim();
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const yearsExperience = Number(formData.get("yearsExperience"));

  if (!name || !ownerName || !neighborhood || !description) {
    redirect(
      `/admin?error=${encodeURIComponent("Tous les champs marqués * sont requis")}`
    );
  }
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
    redirect(
      `/admin?error=${encodeURIComponent("Années d'expérience doit être un nombre positif")}`
    );
  }

  const specialties = specialtiesRaw
    ? specialtiesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // prisma.update throw si aucun record ne correspond — c'est suffisant comme garde-fou
  const updated = await prisma.workshop.update({
    where: { id },
    data: {
      name,
      ownerName,
      neighborhood,
      yearsExperience,
      specialties,
      description,
      photoUrl: photoUrlRaw || null,
    },
  });

  // Trois revalidations ciblées : home, page détail, admin.
  // Alternative paresseuse : revalidatePath("/", "layout") — invalide TOUTES les routes.
  revalidatePath("/");
  revalidatePath(`/ateliers/${updated.slug}`);
  revalidatePath("/admin");
  redirect("/admin");
}
