import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Card, HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import { errorMessage } from '../api/client';
import {
  certificateKey, downloadCertificatePdf, fetchCourseCertificate, saveToDeviceFolder, verifyCertificate,
} from '../api/certificate';

function Centered({ children }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>{children}</View>;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Lỗi tự tạo (tải file, chia sẻ) có sẵn thông điệp tiếng Việt; lỗi mạng/HTTP của axios thì dùng errorMessage.
function actionMessage(error) {
  if (error && !error.isAxiosError && !error.response && error.message) return error.message;
  return errorMessage(error);
}

export function CertificateScreen({ courseId, onBack }) {
  const certificate = useQuery({
    queryKey: certificateKey(courseId),
    queryFn: () => fetchCourseCertificate(courseId),
    enabled: !!courseId,
    retry: false,
  });
  const [notice, setNotice] = useState(null);
  const code = certificate.data?.code;

  const download = useMutation({
    mutationFn: async () => {
      const uri = await downloadCertificatePdf(code);
      return (await saveToDeviceFolder(uri, code)) ? 'saved' : 'app';
    },
    onSuccess: (where) => setNotice(where === 'saved'
      ? 'Đã lưu chứng chỉ vào thư mục bạn chọn.'
      : 'Đã tải chứng chỉ về bộ nhớ ứng dụng. Bấm "Chia sẻ" để lưu hoặc gửi file.'),
  });
  const share = useMutation({
    mutationFn: async () => {
      const uri = await downloadCertificatePdf(code);
      if (!(await Sharing.isAvailableAsync())) throw new Error('Thiết bị không hỗ trợ chia sẻ file');
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Chia sẻ chứng chỉ', UTI: 'com.adobe.pdf' });
    },
    onSuccess: () => setNotice(null),
  });
  const verify = useMutation({ mutationFn: () => verifyCertificate(code) });
  const busy = download.isPending || share.isPending;
  const actionError = download.error || share.error;

  let body;
  if (!courseId) {
    body = <Centered><Text testID="certificate-empty">Không có khóa học để xem chứng chỉ</Text></Centered>;
  } else if (certificate.isPending) {
    body = <Centered><ActivityIndicator accessibilityLabel="Đang tải chứng chỉ" /></Centered>;
  } else if (certificate.isError && certificate.error?.response?.status === 404) {
    body = (
      <Centered>
        <Text variant="titleMedium" testID="certificate-empty" style={{ textAlign: 'center' }}>
          Bạn chưa hoàn thành khóa học nên chưa có chứng chỉ
        </Text>
        <Text style={{ textAlign: 'center' }}>Hoàn thành tất cả bài học để nhận chứng chỉ PDF.</Text>
        <Button mode="contained" onPress={onBack}>Quay lại</Button>
      </Centered>
    );
  } else if (certificate.isError) {
    body = (
      <Centered>
        <Text accessibilityRole="alert">{errorMessage(certificate.error)}</Text>
        <Button mode="contained" onPress={() => certificate.refetch()}>Thử lại</Button>
      </Centered>
    );
  } else {
    const c = certificate.data;
    body = (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card mode="outlined">
          <Card.Content style={{ gap: 6, alignItems: 'center', paddingVertical: 16 }}>
            <Text variant="labelLarge" style={{ color: '#2563EB' }}>EDUMY</Text>
            <Text variant="titleLarge">Chứng chỉ hoàn thành</Text>
            <Text>Chứng nhận</Text>
            <Text variant="headlineSmall" testID="certificate-student">{c.studentName}</Text>
            <Text>đã hoàn thành khóa học</Text>
            <Text variant="titleMedium" style={{ textAlign: 'center' }} testID="certificate-course">{c.courseTitle}</Text>
            {c.instructorName ? <Text>Giảng viên: {c.instructorName}</Text> : null}
            <Text>Ngày cấp: {formatDate(c.issuedAt)}</Text>
            <Text variant="titleMedium" selectable testID="certificate-code">{c.code}</Text>
          </Card.Content>
        </Card>

        {notice ? <Text testID="certificate-notice">{notice}</Text> : null}
        <HelperText type="error" visible={!!actionError}>{actionError ? actionMessage(actionError) : ''}</HelperText>

        <Button mode="contained" testID="certificate-download" loading={download.isPending}
          disabled={busy} onPress={() => { setNotice(null); download.mutate(); }}>
          Tải về PDF
        </Button>
        <Button mode="outlined" testID="certificate-share" loading={share.isPending}
          disabled={busy} onPress={() => { setNotice(null); share.mutate(); }}>
          Chia sẻ
        </Button>
        <Button mode="text" testID="certificate-verify" loading={verify.isPending}
          disabled={verify.isPending} onPress={() => verify.mutate()}>
          Xác minh chứng chỉ
        </Button>
        {verify.isSuccess && (
          <Text testID="certificate-verified" style={{ color: '#16A34A' }}>
            ✓ Chứng chỉ hợp lệ: {verify.data.studentName} · {verify.data.courseTitle}
          </Text>
        )}
        {verify.isError && <Text accessibilityRole="alert">{errorMessage(verify.error)}</Text>}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Button onPress={onBack}>← Quay lại</Button>
        <Text variant="titleLarge">Chứng chỉ</Text>
      </View>
      {body}
    </SafeAreaView>
  );
}
