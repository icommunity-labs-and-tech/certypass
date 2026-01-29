'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tutorial.css';
import type { DriveStep, Config } from 'driver.js';
import type { TutorialContextValue, TourId } from './types';
import {
  markTourAsCompleted,
  shouldShowTour,
  resetTour as resetTourStorage,
  resetAllTours as resetAllToursStorage,
  getCompletedTours as getCompletedToursStorage,
} from './tutorialStorage';

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

interface TutorialProviderProps {
  children: React.ReactNode;
}

/**
 * Configuración global de Driver.js
 */
const defaultDriverConfig: Partial<Config> = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Finalizar',
  progressText: '{{current}} de {{total}}',
  smoothScroll: true,
  animate: true,
  allowClose: true,
  overlayOpacity: 0.6,
  stagePadding: 6,
  stageRadius: 12,
  popoverClass: 'certypass-tutorial-popover',
  popoverOffset: 10,
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const driverInstanceRef = useRef<ReturnType<typeof driver> | null>(null);
  const currentTourIdRef = useRef<TourId | null>(null);
  const [completedTours, setCompletedTours] = useState<TourId[]>(() => getCompletedToursStorage());

  // Ref para evitar marcar el tour como completado múltiples veces
  const isMarkingCompletedRef = useRef(false);

  // Función para marcar el tour como completado y limpiar el estado
  const markTourCompleted = useCallback((tourId: TourId | null) => {
    if (tourId && !isMarkingCompletedRef.current) {
      isMarkingCompletedRef.current = true;
      markTourAsCompleted(tourId);
      setCompletedTours(prev => {
        if (!prev.includes(tourId)) {
          return [...prev, tourId];
        }
        return prev;
      });
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        isMarkingCompletedRef.current = false;
      }, 100);
    }
  }, []);

  // Inicializar Driver.js solo en el cliente
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const driverInstance = driver({
      ...defaultDriverConfig,
      onCloseClick: (element, step, opts) => {
        // Cuando el usuario hace clic en el botón de cerrar (X)
        const tourId = currentTourIdRef.current;
        if (tourId && !isMarkingCompletedRef.current) {
          markTourCompleted(tourId);
        }
        // Cerrar el tour explícitamente
        if (driverInstance.isActive()) {
          driverInstance.destroy();
        }
      },
      onNextClick: (element, step, opts) => {
        // Verificar si es el último paso
        if (driverInstance.isLastStep()) {
          // Si es el último paso, el botón "Finalizar" se mostrará
          // Cuando se hace clic, marcar como completado y destruir
          const tourId = currentTourIdRef.current;
          if (tourId && !isMarkingCompletedRef.current) {
            markTourCompleted(tourId);
          }
          // Llamar a destroy() explícitamente para cerrar el tour
          setTimeout(() => {
            if (driverInstance.isActive()) {
              driverInstance.destroy();
            }
          }, 10);
        } else {
          // Si NO es el último paso, avanzar manualmente al siguiente paso
          // Esto es necesario porque al definir onNextClick, sobrescribimos el comportamiento por defecto
          driverInstance.moveNext();
        }
      },
      onDestroyStarted: (element, step, opts) => {
        // Este evento se dispara cuando el tour se está destruyendo
        // Marcar como completado si aún no se ha hecho (fallback para otros métodos de cierre)
        const tourId = currentTourIdRef.current;
        if (tourId && !isMarkingCompletedRef.current) {
          markTourCompleted(tourId);
        }
      },
      onDestroyed: () => {
        // Limpiar el tourId después de que el tour se haya destruido completamente
        currentTourIdRef.current = null;
        isMarkingCompletedRef.current = false;
      },
    });

    driverInstanceRef.current = driverInstance;

    return () => {
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy();
      }
    };
  }, [markTourCompleted]);

      const startTour = useCallback(
        (tourId: TourId, steps: DriveStep[], config?: Partial<Config>) => {
          if (!driverInstanceRef.current) {
            console.warn('Driver.js not initialized yet');
            return;
          }

          // Verificar si el tour ya fue completado (a menos que se fuerce con config.allowClose)
          if (!config?.allowClose && !shouldShowTour(tourId)) {
            return;
          }

          // Guardar el tourId actual para poder trackearlo cuando se destruya
          currentTourIdRef.current = tourId;

          // Filtrar pasos que no tienen elementos válidos en el DOM
          const validSteps = steps.filter((step) => {
            if (!step.element) {
              return true; // Permitir pasos sin elemento (popover flotante)
            }
            
            const element = typeof step.element === 'string'
              ? document.querySelector(step.element)
              : step.element;
            
            if (!element) {
              return false;
            }
            
            return true;
          });

          if (validSteps.length === 0) {
            console.warn(`Tutorial "${tourId}" has no valid steps`);
            return;
          }

          // Asegurar que cada paso tenga los botones habilitados
          const stepsWithButtons = validSteps.map((step) => ({
            ...step,
            popover: {
              ...step.popover,
              showButtons: step.popover?.showButtons || ['next', 'previous', 'close'],
            },
          }));

          // Iniciar el tour
          driverInstanceRef.current.setSteps(stepsWithButtons);
          driverInstanceRef.current.drive();
    },
    [markTourCompleted]
  );

  const isCompleted = useCallback((tourId: TourId): boolean => {
    return completedTours.includes(tourId);
  }, [completedTours]);

  const resetTour = useCallback((tourId: TourId): void => {
    resetTourStorage(tourId);
    setCompletedTours(prev => prev.filter(id => id !== tourId));
  }, []);

  const resetAllTours = useCallback((): void => {
    resetAllToursStorage();
    setCompletedTours([]);
  }, []);

  const getCompletedTours = useCallback((): TourId[] => {
    return completedTours;
  }, [completedTours]);

  const value: TutorialContextValue = {
    startTour,
    isCompleted,
    resetTour,
    resetAllTours,
    getCompletedTours,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

/**
 * Hook para acceder al contexto de tutorial
 */
export function useTutorialContext(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
}
