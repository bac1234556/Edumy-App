// app/certificates/verify/[code].tsx — Hiển thị chứng chỉ hoàn thành khóa học theo form chuẩn
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import {
  useCertificateActions,
  useCertificateVerification,
} from '../../../src/features/certificates/hooks';
import { ENV } from '../../../src/config/env';
import { webLinks } from '../../../src/lib/web-links';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { formatDate } from '../../../src/lib/date';
import { notify } from '../../../src/lib/dialog';
import { monoFontFamily, radius, semantic } from '../../../src/theme/tokens';

export default function CertificateVerifyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const certCode = typeof code === 'string' ? decodeURIComponent(code) : '';

  const { data: cert, isLoading, isError, error, refetch } = useCertificateVerification(certCode);
  const { downloadAndShare, isDownloading, copyVerificationLink } = useCertificateActions();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chứng chỉ hoàn thành', headerBackTitle: 'Quay lại' }} />
        <Loading message="Đang xác thực và tải chứng chỉ..." />
      </View>
    );
  }

  if (isError || !cert || cert.valid === false) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Xác thực chứng chỉ', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          icon={<Ionicons name="ribbon-outline" size={28} color={semantic.danger} />}
          message={
            cert?.message ||
            error?.message ||
            'Không tìm thấy chứng chỉ hoặc mã xác thực không hợp lệ.'
          }
          retryLabel="Thử lại"
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const displayCode = cert.certificateUrl || certCode;
  const studentName = cert.studentName || 'Học viên Edumy';
  const courseTitle = cert.courseTitle || cert.courseName || 'Khóa học trực tuyến Edumy';
  const instructorName = cert.instructorName || 'Ban Giảng huấn Edumy';
  const issuedDateText = cert.issuedAt ? formatDate(cert.issuedAt) : '—';
  const verifyLink =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/certificates/verify/${encodeURIComponent(displayCode)}`
      : webLinks.certificateVerify(displayCode);

  const handleDownloadPdf = () => {
    if (Platform.OS === 'web') {
      const apiBase = ENV.API_BASE_URL.replace(/\/+$/, '');
      const pdfUrl = `${apiBase}/certificates/${encodeURIComponent(displayCode)}/pdf`;
      void WebBrowser.openBrowserAsync(pdfUrl);
      return;
    }
    downloadAndShare(
      { code: displayCode, verifyUrl: verifyLink },
      {
        onError: (err) => {
          void notify('Tải chứng chỉ', err.message || 'Không thể tải tệp PDF chứng chỉ.');
        },
      }
    );
  };

  const handlePrintWeb = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    copyVerificationLink(
      { code: displayCode, verifyUrl: verifyLink },
      {
        onSuccess: () => {
          void notify('Đã sao chép', 'Liên kết xác thực chứng chỉ đã được sao chép vào bộ nhớ tạm.');
        },
        onError: () => {
          void notify('Lỗi', 'Không thể sao chép liên kết.');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Chứng chỉ hoàn thành',
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ResponsiveContainer maxWidth={900}>
          {/* Action Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={16} color="#15803D" />
              <Text style={styles.verifiedPillText}>Chứng chỉ hợp lệ — Đã xác thực bởi Edumy</Text>
            </View>

            <View style={styles.toolbarButtons}>
              <Button
                title="Tải PDF"
                onPress={handleDownloadPdf}
                loading={isDownloading}
                disabled={isDownloading}
                icon={<Ionicons name="download-outline" size={16} color="#FFFFFF" />}
                style={styles.toolbarBtn}
              />
              {Platform.OS === 'web' && (
                <Button
                  title="In chứng chỉ"
                  variant="secondary"
                  onPress={handlePrintWeb}
                  icon={<Ionicons name="print-outline" size={16} color={semantic.textPrimary} />}
                  style={styles.toolbarBtn}
                />
              )}
              <Button
                title="Sao chép link"
                variant="outline"
                onPress={handleCopyLink}
                icon={<Ionicons name="share-social-outline" size={16} color={semantic.brandPrimary} />}
                style={styles.toolbarBtn}
              />
            </View>
          </View>

          {/* Standard Certificate Frame */}
          <View style={styles.certificatePaper}>
            <View style={styles.outerBorder}>
              <View style={styles.innerBorder}>
                {/* Decorative corner accents */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {/* Brand Header */}
                <View style={styles.brandRow}>
                  <View style={styles.brandEmblem}>
                    <Ionicons name="ribbon" size={28} color="#B45309" />
                  </View>
                  <Text style={styles.brandName}>EDUMY E-LEARNING PLATFORM</Text>
                </View>

                {/* Certificate Title */}
                <Text style={styles.certMainTitle}>CHỨNG CHỈ</Text>
                <Text style={styles.certSubTitle}>HOÀN THÀNH KHÓA HỌC</Text>
                <Text style={styles.certEnglishSub}>CERTIFICATE OF COMPLETION</Text>

                <View style={styles.goldDivider} />

                {/* Recipient */}
                <Text style={styles.introText}>Trân trọng chứng nhận học viên</Text>
                <Text style={styles.studentName}>{studentName}</Text>

                {/* Course */}
                <Text style={styles.introText}>
                  Đã hoàn thành xuất sắc chương trình đào tạo trực tuyến
                </Text>
                <Text style={styles.courseTitle}>{courseTitle}</Text>

                {/* Signatures & Official Seal */}
                <View style={styles.signatureRow}>
                  <View style={styles.signatureCol}>
                    <Text style={styles.dateValue}>{issuedDateText}</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>NGÀY CẤP</Text>
                  </View>

                  <View style={styles.sealContainer}>
                    <View style={styles.sealOuter}>
                      <View style={styles.sealInner}>
                        <Ionicons name="checkmark-done" size={20} color="#92400E" />
                        <Text style={styles.sealText}>EDUMY</Text>
                        <Text style={styles.sealSubText}>VERIFIED</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.signatureCol}>
                    <Text style={styles.instructorSignature}>{instructorName}</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>GIẢNG VIÊN HƯỚNG DẪN</Text>
                  </View>
                </View>

                {/* Certificate Metadata Footer */}
                <View style={styles.footerMeta}>
                  <Text style={styles.certCodeText}>Mã chứng chỉ: {displayCode}</Text>
                  <Text style={styles.verifyUrlText} numberOfLines={1} ellipsizeMode="middle">
                    Xác thực tại: {verifyLink}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomNav}>
            <Button
              title="Danh sách chứng chỉ của tôi"
              variant="outline"
              onPress={() => router.push('/account/certificates' as const)}
            />
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  toolbar: {
    marginBottom: 16,
    gap: 12,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  toolbarButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolbarBtn: {
    minWidth: 120,
  },
  certificatePaper: {
    backgroundColor: '#FFFDF7',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  outerBorder: {
    borderWidth: 6,
    borderColor: '#1E3A8A',
    padding: 6,
    backgroundColor: '#FFFDF7',
  },
  innerBorder: {
    borderWidth: 2,
    borderColor: '#D97706',
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#1E3A8A',
  },
  cornerTL: {
    top: 6,
    left: 6,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 6,
    right: 6,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 6,
    left: 6,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 6,
    right: 6,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  brandEmblem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  certMainTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#0F172A',
    textAlign: 'center',
  },
  certSubTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#334155',
    textAlign: 'center',
    marginTop: 4,
  },
  certEnglishSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
  },
  goldDivider: {
    width: 110,
    height: 3,
    backgroundColor: '#D97706',
    borderRadius: 2,
    marginVertical: 20,
  },
  introText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 6,
  },
  studentName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D4ED8',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  courseTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 27,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  signatureRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  signatureCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateValue: {
    fontFamily: monoFontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  instructorSignature: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  signatureLine: {
    width: '100%',
    maxWidth: 160,
    height: 1.5,
    backgroundColor: '#334155',
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
    textAlign: 'center',
  },
  sealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  sealInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  sealSubText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  footerMeta: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  certCodeText: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  verifyUrlText: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: '100%',
  },
  bottomNav: {
    marginTop: 20,
    alignItems: 'center',
  },
});
