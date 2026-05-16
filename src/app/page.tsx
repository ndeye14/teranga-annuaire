import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkshopCard } from "@/components/WorkshopCard";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ quartier?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { quartier } = await searchParams;

  // Deux requêtes en parallèle : la liste des quartiers (pour les filtres) et
  // la liste d'ateliers (filtrée si un quartier est sélectionné).
  const [neighborhoods, workshops] = await Promise.all([
    prisma.workshop.findMany({
      select: { neighborhood: true },
      distinct: ["neighborhood"],
      orderBy: { neighborhood: "asc" },
    }),
    prisma.workshop.findMany({
      where: quartier ? { neighborhood: quartier } : undefined,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Annuaire des Menuisiers de Dakar
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-600">
            Un répertoire des ateliers de menuiserie de Dakar et de leur
            savoir-faire. Projet d&apos;étudiant alimenté au fil des visites de
            terrain.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-semibold text-stone-600">
            Quartier :
          </span>
          <FilterChip href="/" active={!quartier} label="Tous" />
          {neighborhoods.map(({ neighborhood }) => (
            <FilterChip
              key={neighborhood}
              href={`/?quartier=${encodeURIComponent(neighborhood)}`}
              active={quartier === neighborhood}
              label={neighborhood}
            />
          ))}
        </div>

        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">
            {quartier ? `Ateliers à ${quartier}` : "Tous les ateliers"}
          </h2>
          <span className="text-sm text-stone-500">
            {workshops.length}{" "}
            {workshops.length > 1 ? "ateliers" : "atelier"}
          </span>
        </div>

        {workshops.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
            Aucun atelier trouvé{quartier ? ` à ${quartier}` : ""}.{" "}
            {quartier && (
              <Link href="/" className="font-medium text-amber-700 underline">
                Voir tous les ateliers
              </Link>
            )}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((w) => (
              <WorkshopCard key={w.id} workshop={w} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  const base =
    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600";
  const variant = active
    ? "bg-amber-600 text-white hover:bg-amber-700"
    : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100";
  return (
    <Link href={href} className={`${base} ${variant}`}>
      {label}
    </Link>
  );
}
