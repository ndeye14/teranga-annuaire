import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkshopForm } from "@/components/WorkshopForm";
import { updateWorkshop } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditWorkshopPage({ params }: Props) {
  const { slug } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: { slug },
  });

  if (!workshop) {
    notFound();
  }

  // .bind fige l'id en premier argument. La fonction renvoyée prend ensuite
  // simplement le FormData → c'est ce que `<form action={...}>` attend.
  const updateAction = updateWorkshop.bind(null, workshop.id);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-4">
          <Link
            href="/admin"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← Retour à l&apos;admin
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-stone-900">
          Modifier l&apos;atelier
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Slug : <code className="text-stone-700">{workshop.slug}</code>{" "}
          (non modifiable — l&apos;URL doit rester stable)
        </p>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <WorkshopForm
            action={updateAction}
            workshop={workshop}
            submitLabel="Mettre à jour"
          />
        </section>
      </div>
    </main>
  );
}
