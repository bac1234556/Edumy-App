// src/features/profile/hooks.ts
// React Query mutation hooks for profile operations.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfileApi, changePasswordApi, ChangePasswordRequest } from './api';
import { resendVerificationApi } from '../auth/api';
import { useSessionStore } from '../../store/session';
import { queryKeys } from '../../api/query-keys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setProfile } = useSessionStore();

  return useMutation({
    mutationFn: (fullName: string) => updateProfileApi(fullName),
    onSuccess: (updatedProfile) => {
      setProfile(updatedProfile);
      queryClient.setQueryData(queryKeys.auth.me, updatedProfile);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePasswordApi(data),
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: (email?: string) => resendVerificationApi(email),
  });
}
