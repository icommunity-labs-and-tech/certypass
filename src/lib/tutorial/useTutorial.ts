'use client';

import { useEffect, useRef } from 'react';
import { useTutorialContext } from './TutorialProvider';
import { shouldShowTour } from './tutorialStorage';
import type { TourId, TutorialStep, UseTutorialOptions } from './types';

/**
 * Hook para usar tutoriales en componentes/páginas
 * 
 * @param tourId - ID único del tour
 * @param steps - Pasos del tour
 * @param options - Opciones de configuración
 * 
 * @example
 * ```tsx
 * useTutorial(TOUR_IDS.ITEMS_PAGE, itemsPageTour, {
 *   autoStart: true,
 *   delay: 500
 * });
 * ```
 */
export function useTutorial(
  tourId: TourId,
  steps: TutorialStep[],
  options: UseTutorialOptions = {}
) {
  const { startTour, isCompleted } = useTutorialContext();
  const { autoStart = false, dependencies = [], delay = 0 } = options;
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    // Si autoStart está deshabilitado o el tour ya fue completado, no hacer nada
    if (!autoStart || isCompleted(tourId) || hasStartedRef.current) {
      return;
    }

    // Verificar si el tour debe mostrarse
    if (!shouldShowTour(tourId)) {
      return;
    }

    // Esperar el delay especificado (útil para esperar que elementos se rendericen)
    const timeoutId = setTimeout(() => {
      // Verificar que el elemento objetivo existe
      const firstStep = steps[0];
      if (firstStep?.element) {
        const element = typeof firstStep.element === 'string'
          ? document.querySelector(firstStep.element)
          : firstStep.element;

        if (element) {
          hasStartedRef.current = true;
          startTour(tourId, steps);
        }
      } else {
        // Si no hay elemento específico, iniciar el tour de todas formas
        hasStartedRef.current = true;
        startTour(tourId, steps);
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, autoStart, delay, ...dependencies]);

  return {
    startTour: () => startTour(tourId, steps),
    isCompleted: isCompleted(tourId),
    tourId,
  };
}
