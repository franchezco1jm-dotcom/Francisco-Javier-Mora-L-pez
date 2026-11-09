import React from 'react';

/**
 * Robust React.lazy wrapper with exponential retry.
 * Prevents dynamic import network errors from crashing React or triggering browser page reloads.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 600
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then(resolve)
          .catch((err) => {
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), interval);
            } else {
              console.error('Blackberry Inventory: Error cargando módulo bajo demanda:', err);
              // Reject so ErrorBoundary or Suspense can handle it gracefully
              reject(err);
            }
          });
      };
      attempt(retries);
    })
  );
}
