// src/hooks/useRefetchOnScreenFocus.ts
// Refetches screen queries when returning to focus, skipping the initial mount focus.

import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefetchOnScreenFocus(refetch: () => void) {
  const isFirstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
