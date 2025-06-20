// Simple React hook to get a query param value from the URL
import { useMemo } from 'react';

export function useQueryParam(key: string): string | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }, [typeof window !== 'undefined' ? window.location.search : '']);
}
