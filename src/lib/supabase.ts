import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton, même raison qu'avec Prisma : éviter de créer une nouvelle connexion
// à chaque rechargement HMR en dev.
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env"
    );
  }
  // Note : c'est la clé `service_role` (admin). Ne JAMAIS importer ce module
  // depuis un fichier `"use client"`.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabase: SupabaseClient =
  globalForSupabase.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

export const STORAGE_BUCKET = "workshop-photos";
