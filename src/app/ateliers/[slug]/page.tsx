import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

// On garde la signature de params dans un type local pour éviter de la dupliquer
// entre generateMetadata et le composant page.
type Props = {
  params: Promise<{ slug: string }>;
};

// Title + meta description générés depuis la DB — Next l'appelle au moment du
// rendu, en parallèle du composant page lui-même.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workshop = await prisma.workshop.findUnique({ where: { slug } });
  if (!workshop) {
    return { title: "Atelier introuvable" };
  }
  return {
    title: `${workshop.name} — Annuaire des Menuisiers de Dakar`,
    description: workshop.description.slice(0, 160),
  };
}

export default async function WorkshopDetailPage({ params }: Props) {
  const { slug } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: { slug },
  });

  if (!workshop) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
        >
          <span aria-hidden>←</span> Retour à la liste
        </Link>
      </div>

      {/* Bandeau image / placeholder */}
      <div className="mx-auto mt-6 max-w-4xl px-6">
        {workshop.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={workshop.photoUrl}
            alt={workshop.name}
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-stone-300">
            <span className="text-7xl font-bold text-amber-900/40">
              {getInitials(workshop.name)}
            </span>
          </div>
        )}
      </div>

      <article className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {workshop.name}
            </h1>
            <p className="mt-2 text-lg text-stone-600">{workshop.ownerName}</p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
            {workshop.neighborhood}
          </span>
        </div>

        <p className="mt-4 text-stone-600">
          <span className="font-semibold text-stone-900">
            {workshop.yearsExperience}
          </span>{" "}
          {workshop.yearsExperience > 1 ? "ans" : "an"} d&apos;expérience
        </p>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {workshop.description}
          </p>
        </section>

        {workshop.specialties.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Spécialités
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {workshop.specialties.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-900"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border-t border-stone-200 pt-6">
          <p className="text-xs text-stone-400">
            Ajouté le{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
              workshop.createdAt
            )}
          </p>
        </section>
      </article>
    </main>
  );
}
