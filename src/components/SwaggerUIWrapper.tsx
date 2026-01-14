'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to avoid SSR issues
// @ts-expect-error - swagger-ui-react types may not be available
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

interface SwaggerUIWrapperProps {
  url: string;
}

/**
 * Wrapper for SwaggerUI that suppresses warnings from the library
 * SwaggerUI uses deprecated React lifecycle methods which cause warnings
 * in React strict mode, but this is a known issue with the library itself
 */
export default function SwaggerUIWrapper({ url }: SwaggerUIWrapperProps) {
  useEffect(() => {
    // Suppress console warnings from swagger-ui-react about deprecated lifecycle methods
    // These are from the library itself, not our code
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('UNSAFE_componentWillReceiveProps') ||
          message.includes('ExamplesSelect') ||
          message.includes('ExamplesSelectValueRetainer'))
      ) {
        // Suppress warnings from swagger-ui-react
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const SwaggerUIComponent = SwaggerUI as any;
  return <SwaggerUIComponent url={url} />;
}



