import { prisma } from "@/lib/prisma";
import { WorkshopCard } from "@/components/WorkshopCard";

// On force le rendu dynamique : à chaque visite, Next.js relit la DB.
// Sans ça, en prod Next pourrait servir une version statique mise en cache au build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const workshops = await prisma.workshop.findMany({
    orderBy: { createdAt: "desc" },
  });

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
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">
            Tous les ateliers
          </h2>
          <span className="text-sm text-stone-500">
            {workshops.length}{" "}
            {workshops.length > 1 ? "ateliers" : "atelier"}
          </span>
        </div>

        {workshops.length === 0 ? (
          <p className="text-stone-500">Aucun atelier pour le moment.</p>
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
