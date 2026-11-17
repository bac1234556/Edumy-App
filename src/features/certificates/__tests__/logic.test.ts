// src/features/certificates/__tests__/logic.test.ts
// Unit tests for Certificate download, sharing, and clipboard link copy.

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {
  downloadAndShareCertificate,
  copyCertificateVerificationLink,
} from '../logic';

describe('downloadAndShareCertificate', () => {
  it('downloads PDF with Bearer header and invokes Sharing', async () => {
    const uri = await downloadAndShareCertificate('CERT-EDUMY-999', 'mock_token_123');

    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      expect.stringContaining('/me/certificates/CERT-EDUMY-999/pdf'),
      expect.stringContaining('certificate-CERT-EDUMY-999.pdf'),
      {
        headers: {
          Authorization: 'Bearer mock_token_123',
        },
      }
    );

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      uri,
      expect.objectContaining({
        mimeType: 'application/pdf',
      })
    );
  });
});

describe('copyCertificateVerificationLink', () => {
  it('copies certificate verification URL to clipboard', async () => {
    const link = await copyCertificateVerificationLink('CERT-EDUMY-999');

    expect(link).toContain('/certificates/verify/CERT-EDUMY-999');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(link);
  });
});
