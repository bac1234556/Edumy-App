// src/features/certificates/hooks.ts
// React Query hooks for Certificates.

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCertificatesApi } from './api';
import {
  downloadAndShareCertificate,
  copyCertificateVerificationLink,
} from './logic';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useCertificates(page: number = 0) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.certificates.all(page),
    queryFn: () => getCertificatesApi(page),
    enabled: isLoggedIn,
  });
}

export function useCertificateActions() {
  const { accessToken } = useSessionStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!accessToken) {
        throw new Error('Phiên đăng nhập không hợp lệ');
      }
      setIsDownloading(true);
      try {
        return await downloadAndShareCertificate(code, accessToken);
      } finally {
        setIsDownloading(false);
      }
    },
  });

  const copyMutation = useMutation({
    mutationFn: (code: string) => copyCertificateVerificationLink(code),
  });

  return {
    downloadAndShare: downloadMutation.mutate,
    isDownloading,
    copyVerificationLink: copyMutation.mutate,
  };
}
