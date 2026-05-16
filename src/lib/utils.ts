/**
 * Retourne les initiales d'un nom d'atelier pour les placeholders.
 * Exemple : "Atelier de Mor" → "AM" (première et dernière initiale).
 */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Transforme un texte en slug URL-friendly.
 * "Sénégal Mobilier Moderne" → "senegal-mobilier-moderne"
 *
 * Étapes :
 * 1. tout en minuscules
 * 2. décomposer les accents (é = e + accent combinant)
 * 3. supprimer les diacritiques (la partie accent)
 * 4. remplacer tout ce qui n'est pas a-z 0-9 par un tiret
 * 5. retirer les tirets en début / fin
 */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
