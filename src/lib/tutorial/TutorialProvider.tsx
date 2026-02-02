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
  const hasMarkedCompletedRef = useRef(false);

  // Función para marcar el tour como completado
  const markTourCompleted = useCallback((tourId: TourId | null) => {
    if (tourId && !hasMarkedCompletedRef.current) {
      hasMarkedCompletedRef.current = true;
      markTourAsCompleted(tourId);
      setCompletedTours(prev => {
        if (!prev.includes(tourId)) {
          return [...prev, tourId];
        }
        return prev;
      });
    }
  }, []);

  // Inicializar Driver.js solo en el cliente
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const driverInstance = driver({
      ...defaultDriverConfig,
      onCloseClick: () => {
        // Usuario hizo clic en el botón de cerrar (X)
        const tourId = currentTourIdRef.current;
        markTourCompleted(tourId);
        if (driverInstance.isActive()) {
          driverInstance.destroy();
        }
      },
      onNextClick: () => {
        // Verificar si es el último paso ANTES de hacer cualquier acción
        if (driverInstance.isLastStep()) {
          // Usuario hizo clic en "Finalizar"
          const tourId = currentTourIdRef.current;
          markTourCompleted(tourId);
          if (driverInstance.isActive()) {
            driverInstance.destroy();
          }
        } else {
          // Avanzar al siguiente paso
          driverInstance.moveNext();
        }
      },
      onDestroyed: () => {
        // Limpiar refs cuando el tour se destruye
        currentTourIdRef.current = null;
        hasMarkedCompletedRef.current = false;
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

      // Resetear el flag de completado para el nuevo tour
      hasMarkedCompletedRef.current = false;

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
    []
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
