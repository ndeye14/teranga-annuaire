import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkshopForm } from "@/components/WorkshopForm";
import { createWorkshop } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const workshops = await prisma.workshop.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-4">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← Voir le site public
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-stone-900">Administration</h1>
        <p className="mt-2 text-sm text-amber-700">
          ⚠️ Page sans authentification — usage interne seulement.
        </p>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-stone-900">
            Ajouter un atelier
          </h2>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
            >
              {error}
            </div>
          )}

          <div className="mt-4">
            <WorkshopForm
              action={createWorkshop}
              submitLabel="Ajouter l'atelier"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-stone-900">
            Ateliers existants ({workshops.length})
          </h2>
          {workshops.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              Aucun atelier en base.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {workshops.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">
                      {w.name}
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      {w.ownerName} · {w.neighborhood}
                    </p>
                  </div>
                  <Link
                    href={`/admin/${w.slug}/edit`}
                    className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-900"
                  >
                    Modifier
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
