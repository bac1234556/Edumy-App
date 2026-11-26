// src/features/certificates/hooks.ts
// React Query hooks for Certificates (paginated + infinite).

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { getCertificatesApi, verifyCertificateApi } from './api';
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
    queryKey: queryKeys.certificates.list(page),
    queryFn: () => getCertificatesApi(page),
    enabled: isLoggedIn,
  });
}

export function useInfiniteCertificates() {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useInfiniteQuery({
    queryKey: ['certificates', 'infinite'] as const,
    queryFn: ({ pageParam }) => getCertificatesApi(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const current = lastPage.page?.number ?? 0;
      const total = lastPage.page?.totalPages ?? 0;
      return current + 1 < total ? current + 1 : undefined;
    },
    enabled: isLoggedIn,
  });
}

export function useCertificateVerification(code?: string) {
  const cleanCode = (code ?? '').trim();
  return useQuery({
    queryKey: ['certificates', 'verify', cleanCode] as const,
    queryFn: () => verifyCertificateApi(cleanCode),
    enabled: cleanCode.length > 0,
    retry: 1,
  });
}

export function useCertificateActions() {
  const { accessToken } = useSessionStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: async ({
      code,
      verifyUrl,
    }: {
      code: string;
      verifyUrl?: string | null;
    }) => {
      if (!accessToken) {
        throw new Error('Phiên đăng nhập không hợp lệ');
      }
      setIsDownloading(true);
      try {
        return await downloadAndShareCertificate(code, accessToken, verifyUrl);
      } finally {
        setIsDownloading(false);
      }
    },
  });

  const copyMutation = useMutation({
    mutationFn: ({ code, verifyUrl }: { code: string; verifyUrl?: string | null }) =>
      copyCertificateVerificationLink(code, verifyUrl),
  });

  return {
    downloadAndShare: downloadMutation.mutate,
    isDownloading,
    copyVerificationLink: copyMutation.mutate,
  };
}
