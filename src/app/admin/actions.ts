"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload une photo dans le bucket Supabase Storage `workshop-photos`.
 * Path : `{slug}.{ext}`. Si une photo existait déjà au même path, elle est écrasée
 * (upsert: true).
 * Helper interne (pas exporté → reste un module function, pas une Server Action).
 */
async function uploadPhoto(file: File, slug: string): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo trop volumineuse (max 5 MB)");
  }

  // Récupère l'extension depuis le nom du fichier d'origine
  const dot = file.name.lastIndexOf(".");
  const ext = (dot >= 0 ? file.name.slice(dot + 1) : "jpg").toLowerCase();
  const path = `${slug}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true, // écrase si même path existe (cas update)
    });
  if (uploadError) {
    throw new Error("Upload échoué : " + uploadError.message);
  }

  // URL publique — pure construction côté client, pas un appel réseau
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Server Action appelée par le formulaire `/admin`.
 * Lit les champs du FormData, valide, crée l'atelier, redirige vers la home.
 */
export async function createWorkshop(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const yearsExperience = Number(formData.get("yearsExperience"));
  const photoFile = formData.get("photoFile") as File | null;

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

  const existing = await prisma.workshop.findUnique({ where: { slug } });
  if (existing) {
    redirect(
      `/admin?error=${encodeURIComponent(
        `Un atelier nommé "${name}" existe déjà (slug : ${slug})`
      )}`
    );
  }

  // Upload de la photo avant la création en DB. Si ça pète, on redirige avec
  // l'erreur — pas d'atelier créé sans sa photo qu'on aurait promise.
  let photoUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    try {
      photoUrl = await uploadPhoto(photoFile, slug);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload échoué";
      redirect(`/admin?error=${encodeURIComponent(msg)}`);
    }
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
      photoUrl,
    },
  });

  revalidatePath("/");
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
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const yearsExperience = Number(formData.get("yearsExperience"));
  const photoFile = formData.get("photoFile") as File | null;

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

  // On a besoin du slug pour nommer le fichier uploadé (slug est immuable)
  const existing = await prisma.workshop.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) {
    redirect(`/admin?error=${encodeURIComponent("Atelier introuvable")}`);
  }

  // Upload optionnel : si pas de fichier, on garde l'ancien photoUrl tel quel
  // (en ne mettant pas la clé dans `data`, Prisma ne touche pas au champ).
  let newPhotoUrl: string | undefined = undefined;
  if (photoFile && photoFile.size > 0) {
    try {
      newPhotoUrl = await uploadPhoto(photoFile, existing.slug);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload échoué";
      redirect(`/admin?error=${encodeURIComponent(msg)}`);
    }
  }

  const updated = await prisma.workshop.update({
    where: { id },
    data: {
      name,
      ownerName,
      neighborhood,
      yearsExperience,
      specialties,
      description,
      // photoUrl n'est inclus que si on a uploadé un nouveau fichier
      ...(newPhotoUrl !== undefined && { photoUrl: newPhotoUrl }),
    },
  });

  revalidatePath("/");
  revalidatePath(`/ateliers/${updated.slug}`);
  revalidatePath("/admin");
  redirect("/admin");
}
