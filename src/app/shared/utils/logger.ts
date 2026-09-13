import { environment } from '../../../environments/environment';

type LogArgs = unknown[];

/**
 * Logger applicatif.
 *
 * Remplace les appels directs à `console.*` (interdits par ESLint) et
 * n'écrit rien en production.
 */
export const logger = {
  log(...args: LogArgs): void {
    if (!environment.production) {
      console.log(...args);
    }
  },
  debug(...args: LogArgs): void {
    if (!environment.production) {
      console.debug(...args);
    }
  },
  info(...args: LogArgs): void {
    if (!environment.production) {
      console.info(...args);
    }
  },
  warn(...args: LogArgs): void {
    if (!environment.production) {
      console.warn(...args);
    }
  },
  error(...args: LogArgs): void {
    if (!environment.production) {
      console.error(...args);
    }
  },
};
