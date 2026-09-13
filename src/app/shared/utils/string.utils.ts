/**
 * Retourne les initiales d'un nom complet (ex. "Jean Dupont" → "JD").
 * Prend les premières lettres de chaque mot, en majuscules, max 2 caractères.
 */
export function getInitials(name: string): string {
  if (!name?.trim()) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}
