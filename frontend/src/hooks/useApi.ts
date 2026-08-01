import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface UseApiReturn<T, P extends any[]> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, P extends any[] = []>(
  apiFunc: (...args: P) => Promise<T>,
  options?: UseApiOptions<T>
): UseApiReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunc(...args);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
        setError(errorMessage);
        options?.onError?.(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunc, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
