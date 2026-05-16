import Link from "next/link";
import { getInitials } from "@/lib/utils";
// Prisma 7 expose les types modèles avec le suffixe `Model`. On alias pour rester
// lisible : on utilise `Workshop` dans le code, mais on sait que c'est `WorkshopModel`.
import type { WorkshopModel as Workshop } from "@/generated/prisma/models";

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <Link
      href={`/ateliers/${workshop.slug}`}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
    >
      {workshop.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={workshop.photoUrl}
          alt={workshop.name}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-amber-200 to-stone-300">
          <span className="text-5xl font-bold text-amber-900/40">
            {getInitials(workshop.name)}
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 group-hover:text-amber-900">
              {workshop.name}
            </h3>
            <p className="text-sm text-stone-500">{workshop.ownerName}</p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {workshop.neighborhood}
          </span>
        </div>

        <p className="mt-2 text-sm text-stone-500">
          {workshop.yearsExperience}{" "}
          {workshop.yearsExperience > 1 ? "ans" : "an"} d&apos;expérience
        </p>

        <p className="mt-3 line-clamp-3 text-sm text-stone-600">
          {workshop.description}
        </p>

        {workshop.specialties.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {workshop.specialties.map((s) => (
              <li
                key={s}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
