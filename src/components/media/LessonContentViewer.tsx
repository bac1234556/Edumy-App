// src/components/media/LessonContentViewer.tsx
// Modern Dark Cinema (#0B0F17) viewer for lesson content (video with expo-video / WebView fallback, article text)
// Shared between M04 preview and M06 learning room.

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { semantic } from '../../theme/tokens';

interface LessonContentViewerProps {
  contentType: 'video' | 'article';
  videoUrl?: string | null;
  articleContent?: string | null;
  title?: string;
}

export function isNativeVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m3u8');
}

export function LessonContentViewer({
  contentType,
  videoUrl,
  articleContent,
  title,
}: LessonContentViewerProps) {
  const isNative = isNativeVideoUrl(videoUrl);

  const player = useVideoPlayer(isNative && videoUrl ? videoUrl : '', (p) => {
    p.loop = false;
  });

  if (contentType === 'video') {
    if (!videoUrl) {
      return (
        <View style={styles.emptyVideoContainer}>
          <View style={styles.emptyVideoBadge}>
            <Ionicons name="videocam-off-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={styles.emptyVideoTitle}>LUỒNG VIDEO ĐANG XỬ LÝ</Text>
          <Text style={styles.emptyVideoSub}>
            Tệp bài giảng đang được đồng bộ hoặc chưa khả dụng.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cinemaWrapper}>
        <View style={styles.cinemaTopStrip}>
          <View style={styles.cinemaDotRow}>
            <View style={styles.cinemaLiveDot} />
            <Text style={styles.cinemaStripLabel}>
              {isNative ? 'EDUMY STREAM // HLS-MP4' : 'EDUMY STREAM // EMBED PLAYER'}
            </Text>
          </View>
          <Text style={styles.cinemaAspectLabel}>16:9 HD</Text>
        </View>

        <View style={styles.mediaContainer}>
          {isNative ? (
            <VideoView
              player={player}
              style={styles.nativeVideo}
              allowsFullscreen
              allowsPictureInPicture
            />
          ) : (
            <View style={styles.webViewContainer}>
              <WebView
                source={{ uri: videoUrl }}
                style={styles.webView}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  // Editorial Article Reader
  return (
    <ScrollView style={styles.articleScroll} contentContainerStyle={styles.articleContentContainer}>
      <View style={styles.articleCard}>
        <View style={styles.articleHeaderBar}>
          <Ionicons name="document-text-outline" size={14} color={semantic.brandPrimary} />
          <Text style={styles.articleKicker}>TÀI LIỆU BÀI ĐỌC CHUYÊN MÔN</Text>
        </View>
        {title && (
          <Text variant="h2" style={styles.articleTitle}>
            {title}
          </Text>
        )}
        {articleContent ? (
          <Text variant="body" style={styles.articleBody}>
            {articleContent}
          </Text>
        ) : (
          <View style={styles.emptyArticleBox}>
            <Ionicons name="reader-outline" size={32} color="#94A3B8" />
            <Text variant="bodySmall" style={styles.emptyArticleText}>
              Nội dung bài đọc đang được giảng viên biên tập.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;
const videoHeight = (screenWidth * 9) / 16;

const styles = StyleSheet.create({
  cinemaWrapper: {
    backgroundColor: '#0B0F17',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cinemaTopStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#070A10',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cinemaDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cinemaLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#14B8A6',
  },
  cinemaStripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  cinemaAspectLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  mediaContainer: {
    width: '100%',
    height: videoHeight,
    backgroundColor: '#0B0F17',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  webViewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0B0F17',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyVideoContainer: {
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0B0F17',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  emptyVideoBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyVideoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  emptyVideoSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  articleScroll: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  articleContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  articleCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 18,
  },
  articleHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  articleKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimary,
    letterSpacing: 0.8,
  },
  articleTitle: {
    marginBottom: 12,
    color: semantic.textPrimary,
  },
  articleBody: {
    fontSize: 15,
    lineHeight: 25,
    color: '#334155',
  },
  emptyArticleBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyArticleText: {
    color: semantic.textMuted,
    textAlign: 'center',
  },
});
