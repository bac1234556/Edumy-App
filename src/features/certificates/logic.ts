// src/features/certificates/logic.ts
// Pure business logic and file/link utilities for Certificates.

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { ENV } from '../../config/env';
import { webLinks } from '../../lib/web-links';
import { CertificateItem } from './api';

export type { CertificateItem };

/**
 * Downloads the certificate PDF with Bearer auth and triggers system share dialog on native.
 * On web, opens the public verification URL in browser.
 */
export async function downloadAndShareCertificate(
  code: string,
  accessToken: string,
  verifyUrl?: string | null
): Promise<string> {
  const verificationLink = verifyUrl || webLinks.certificateVerify(code);

  if (Platform.OS === 'web') {
    await WebBrowser.openBrowserAsync(verificationLink);
    return verificationLink;
  }

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
export async function copyCertificateVerificationLink(
  code: string,
  verifyUrl?: string | null
): Promise<string> {
  const link = verifyUrl || webLinks.certificateVerify(code);
  await Clipboard.setStringAsync(link);
  return link;
}
