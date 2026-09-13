import { TypeUser } from '../../shared/models/User';

/**
 * Route de destination associée à chaque rôle.
 */
export const DASHBOARD_ROUTES: Record<string, string> = {
  [TypeUser.PROFESSEUR]: '/dashboard',
  [TypeUser.PARENT]: '/parent-dashboard',
  [TypeUser.ELEVE]: '/student-dashboard',
};

/**
 * Retourne la route du tableau de bord correspondant au rôle.
 *
 * @param typeUser rôle de l'utilisateur (éventuellement absent)
 * @param fallback route utilisée si le rôle est inconnu (par défaut `/login`)
 */
export function getDashboardRoute(
  typeUser: TypeUser | string | null | undefined,
  fallback = '/login',
): string {
  return (typeUser && DASHBOARD_ROUTES[typeUser]) || fallback;
}
