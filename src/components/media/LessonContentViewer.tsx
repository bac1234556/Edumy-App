// src/components/media/LessonContentViewer.tsx
// Unified viewer for lesson content (video with expo-video / WebView fallback, article text)
// Shared between M04 preview and M06 learning room.

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';

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

  // Initialize native player only if native URL is present
  const player = useVideoPlayer(isNative && videoUrl ? videoUrl : '', (p) => {
    p.loop = false;
  });

  if (contentType === 'video') {
    if (!videoUrl) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off-outline" size={48} color="#94A3B8" />
          <Text variant="body" style={styles.emptyText}>
            Video chưa khả dụng hoặc đang được xử lý.
          </Text>
        </View>
      );
    }

    return (
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
    );
  }

  // Article content
  return (
    <ScrollView style={styles.articleScroll} contentContainerStyle={styles.articleContentContainer}>
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
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
          <Text variant="body" style={styles.emptyText}>
            Nội dung bài đọc chưa được cập nhật.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;
const videoHeight = (screenWidth * 9) / 16;

const styles = StyleSheet.create({
  mediaContainer: {
    width: '100%',
    height: videoHeight,
    backgroundColor: '#0F172A',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  webViewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  articleScroll: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  articleContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  articleTitle: {
    marginBottom: 16,
    color: '#0F172A',
  },
  articleBody: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F1F5F9',
  },
  emptyText: {
    marginTop: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
