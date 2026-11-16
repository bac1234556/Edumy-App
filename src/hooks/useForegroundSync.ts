// src/hooks/useForegroundSync.ts
// Invalidate Cart, Orders and My Learning queries whenever the app returns to foreground (M05).

import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';

export function useForegroundSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // User may have just completed a checkout or payment on the website
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.myEnrollments() });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [queryClient]);
}
