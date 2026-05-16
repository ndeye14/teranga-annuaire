import type { WorkshopModel as Workshop } from "@/generated/prisma/models";

type Props = {
  /**
   * Server Action appelée à la submission. Pour la création on passe
   * `createWorkshop` directement. Pour l'édition on passe
   * `updateWorkshop.bind(null, workshop.id)` (l'id est figé via bind).
   */
  action: (formData: FormData) => void | Promise<void>;
  /** Si fourni, le formulaire est pré-rempli avec ces valeurs (mode édition). */
  workshop?: Workshop;
  submitLabel?: string;
};

export function WorkshopForm({
  action,
  workshop,
  submitLabel = "Enregistrer",
}: Props) {
  return (
    <form
      action={action}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <Field
        label="Nom de l'atelier *"
        name="name"
        required
        defaultValue={workshop?.name}
      />
      <Field
        label="Propriétaire *"
        name="ownerName"
        required
        defaultValue={workshop?.ownerName}
      />
      <Field
        label="Quartier *"
        name="neighborhood"
        required
        defaultValue={workshop?.neighborhood}
      />
      <Field
        label="Années d'expérience *"
        name="yearsExperience"
        type="number"
        min="0"
        required
        defaultValue={workshop?.yearsExperience}
      />
      <Field
        label="Spécialités (séparées par des virgules)"
        name="specialties"
        placeholder="chaises, tables, armoires"
        containerClass="sm:col-span-2"
        defaultValue={workshop?.specialties.join(", ")}
      />

      {workshop?.photoUrl && (
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-stone-700">Photo actuelle</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={workshop.photoUrl}
            alt={workshop.name}
            className="mt-1 h-40 w-full rounded-lg border border-stone-200 object-cover sm:w-auto"
          />
          <p className="mt-1 text-xs text-stone-500">
            Choisis un fichier ci-dessous pour la remplacer (sinon elle reste).
          </p>
        </div>
      )}

      <div className="sm:col-span-2">
        <label
          className="block text-sm font-medium text-stone-700"
          htmlFor="photoFile"
        >
          Photo de l&apos;atelier {workshop ? "(optionnel)" : "(optionnel, JPG/PNG, max 5 MB)"}
        </label>
        <input
          id="photoFile"
          name="photoFile"
          type="file"
          accept="image/*"
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-stone-700 hover:file:bg-stone-200"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          className="block text-sm font-medium text-stone-700"
          htmlFor="description"
        >
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={workshop?.description}
          className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
  defaultValue,
  containerClass,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  defaultValue?: string | number;
  containerClass?: string;
}) {
  return (
    <div className={containerClass}>
      <label
        className="block text-sm font-medium text-stone-700"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}
