import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Par défaut, le corps d'une Server Action est limité à 1 MB.
    // On bumpe à 6 MB pour accueillir des photos d'ateliers (max 5 MB + champs texte).
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
