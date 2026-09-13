/**
 * Utilitaires de test pour réinitialiser les espions Jasmine sans dépendre
 * des types `jasmine` (fichier inclus dans le build applicatif).
 */

interface ResettableSpy {
  calls: { reset(): void };
}

function isResettableSpy(value: unknown): value is ResettableSpy {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'calls' in value &&
    typeof (value as ResettableSpy).calls?.reset === 'function'
  );
}

/**
 * Réinitialise récursivement tous les espions Jasmine contenus dans les objets
 * fournis. À appeler dans un `beforeEach` pour éviter que les compteurs
 * d'appels ne fuient d'un test à l'autre (l'ordre d'exécution Jasmine est
 * aléatoire).
 */
export function resetSpies(...targets: unknown[]): void {
  const seen = new Set<unknown>();

  const visit = (value: unknown): void => {
    if (value === null || value === undefined || seen.has(value)) {
      return;
    }
    seen.add(value);

    if (isResettableSpy(value)) {
      value.calls.reset();
      return;
    }

    if (typeof value === 'object') {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        visit(nested);
      }
    }
  };

  targets.forEach(visit);
}
