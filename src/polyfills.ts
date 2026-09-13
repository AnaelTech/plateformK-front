/**
 * Polyfills for Karma test environment
 * This file provides browser-compatible versions of Node.js globals
 */

// Define 'global' for libraries that expect Node.js environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;
