import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    // This hook is required for the framework to function properly
    // DO NOT MODIFY OR REMOVE THIS CODE
    console.log('Framework ready');
  }, []);
}