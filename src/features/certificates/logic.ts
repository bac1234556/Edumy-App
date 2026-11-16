// src/features/certificates/logic.ts
// Pure business logic and file/link utilities for Certificates (Rules 20, 40).

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { ENV } from '../../config/env';
import { webLinks } from '../../lib/web-links';

export interface CertificateItem {
  id: number;
  certificateCode: string;
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  studentName: string;
  instructorName?: string;
  issuedAt: string;
}

/**
 * Downloads the certificate PDF with Bearer auth and triggers system share dialog (Rules 20).
 */
export async function downloadAndShareCertificate(
  code: string,
  accessToken: string
): Promise<string> {
  const downloadUrl = `${ENV.API_BASE_URL}/me/certificates/${encodeURIComponent(code)}/pdf`;
  const targetUri = `${FileSystem.documentDirectory}certificate-${code}.pdf`;

  const downloadResult = await FileSystem.downloadAsync(downloadUrl, targetUri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (downloadResult.status !== 200) {
    throw new Error('Không thể tải tệp PDF chứng chỉ.');
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(downloadResult.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Chứng chỉ Edumy - ${code}`,
      UTI: 'com.adobe.pdf',
    });
  }

  return downloadResult.uri;
}

/**
 * Copies the public verification web link to the device clipboard.
 */
export async function copyCertificateVerificationLink(code: string): Promise<string> {
  const link = webLinks.certificate(code);
  await Clipboard.setStringAsync(link);
  return link;
}
