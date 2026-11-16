// src/features/certificates/api.ts
// Typed API fetchers for Certificates.

import { client } from '../../api/client';
import { components } from '../../api/schema';

export type CertificateItem = components['schemas']['CertificateItem'];
export type PageMetadata = components['schemas']['PageMetadata'];

export interface CertificatesListResponse {
  content: CertificateItem[];
  page: PageMetadata;
}

export async function getCertificatesApi(page: number = 0): Promise<CertificatesListResponse> {
  const response = await client.get<CertificatesListResponse>('/me/certificates', {
    params: { page, size: 20 },
  });
  const data = (response.data as { data?: CertificatesListResponse }).data || response.data;
  return data;
}
