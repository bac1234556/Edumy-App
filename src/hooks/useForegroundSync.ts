// src/hooks/useForegroundSync.ts
// Invalidate learning, certificates, earnings, instructor & profile queries when returning to foreground.

import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';

export function useForegroundSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.instructor.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [queryClient]);
}
