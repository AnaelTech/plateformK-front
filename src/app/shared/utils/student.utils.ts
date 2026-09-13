import { User } from '../models/User';

const LEVEL_THRESHOLDS = [
  { minAge: 18, level: 'Terminale ou +' },
  { minAge: 17, level: 'Terminale' },
  { minAge: 16, level: '1ère' },
  { minAge: 15, level: 'Seconde' },
  { minAge: 14, level: '3ème' },
  { minAge: 13, level: '4ème' },
  { minAge: 12, level: '5ème' },
  { minAge: 11, level: '6ème' },
];

/**
 * Détermine le niveau scolaire d'un élève en fonction de son année de naissance.
 */
export function getStudentLevel(eleve: User): string {
  if (!eleve.birthDate) return 'Niveau non défini';

  const birthYear = new Date(eleve.birthDate).getFullYear();
  const age = new Date().getFullYear() - birthYear;

  return LEVEL_THRESHOLDS.find((t) => age >= t.minAge)?.level ?? 'CM2 ou -';
}
