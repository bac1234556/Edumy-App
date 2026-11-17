// src/features/certificates/api.ts
// Typed API fetchers for Certificates.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type CertificateItem = components['schemas']['MyCertificateDto'];
export type PageMetadata = components['schemas']['PageMeta'];
export type CertificatesListResponse = components['schemas']['PageResponseMyCertificateDto'];

export async function getCertificatesApi(page: number = 0): Promise<CertificatesListResponse> {
  const response = await client.get('/me/certificates', {
    params: { page, size: 20 },
  });
  return unwrap<CertificatesListResponse>(response.data);
}
