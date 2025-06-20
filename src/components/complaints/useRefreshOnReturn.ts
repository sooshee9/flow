import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Calls the provided callback when the user returns to the root dashboard page ("/").
 * This is a workaround for Next.js App Router not triggering useEffect on navigation back.
 */
export function useRefreshOnReturn(callback: () => void) {
  const router = useRouter();

  useEffect(() => {
    // Listen for browser navigation (popstate)
    const onPopState = () => {
      if (window.location.pathname === '/') {
        callback();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [callback]);
}
