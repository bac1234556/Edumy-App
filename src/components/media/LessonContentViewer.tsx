// src/components/media/LessonContentViewer.tsx
// Light-mode Pure White & Ocean Blue viewer for lesson content (video with Web HTML5 / expo-video / WebView fallback, article text)
// Shared between M04 preview and M06 learning room.

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ResponsiveContainer } from '../ui/ResponsiveContainer';
import { microShadow, radius, semantic } from '../../theme/tokens';

interface LessonContentViewerProps {
  contentType: 'video' | 'article';
  videoUrl?: string | null;
  articleContent?: string | null;
  title?: string;
  onOpenWebsite?: () => void;
  enforceWatchFull?: boolean;
  onVideoEnded?: () => void;
}

export function isNativeVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.m3u8') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov')
  );
}

export function LessonContentViewer({
  contentType,
  videoUrl,
  articleContent,
  title,
  onOpenWebsite,
  enforceWatchFull = false,
  onVideoEnded,
}: LessonContentViewerProps) {
  const isNative = isNativeVideoUrl(videoUrl);
  const maxWatchedTimeRef = useRef<number>(0);
  const endedTriggeredRef = useRef<boolean>(false);
  const [watchPercent, setWatchPercent] = useState<number>(0);

  useEffect(() => {
    maxWatchedTimeRef.current = 0;
    endedTriggeredRef.current = false;
    setWatchPercent(0);
  }, [videoUrl]);

  const player = useVideoPlayer(
    Platform.OS !== 'web' && isNative && videoUrl ? videoUrl : '',
    (p) => {
      p.loop = false;
    }
  );

  // Listen for video completion on native iOS/Android player
  useEffect(() => {
    if (Platform.OS === 'web' || !player) return;
    const sub = player.addListener('playToEnd', () => {
      if (!endedTriggeredRef.current) {
        endedTriggeredRef.current = true;
        setWatchPercent(100);
        onVideoEnded?.();
      }
    });
    return () => {
      sub.remove();
    };
  }, [player, onVideoEnded]);

  if (contentType === 'video') {
    const embedUrl =
      videoUrl && (videoUrl.includes('youtube.com/watch?v=') || videoUrl.includes('youtu.be/'))
        ? videoUrl
            .replace('watch?v=', 'embed/')
            .replace('youtu.be/', 'www.youtube.com/embed/')
        : videoUrl;

    return (
      <View style={styles.videoSection}>
        <ResponsiveContainer>
          <View style={[styles.videoCard, microShadow]}>
            <View style={styles.videoCardHeader}>
              <Badge
                variant="info"
                label={isNative ? 'Video bài giảng' : 'Trình phát nhúng'}
                icon={
                  <Ionicons name="play-circle-outline" size={14} color={semantic.brandPrimary} />
                }
              />
              <Text variant="caption" tabular style={styles.aspectLabel}>
                {enforceWatchFull
                  ? `Đã xem ${Math.min(100, Math.round(watchPercent))}% · Không tua nhanh`
                  : '16:9 HD'}
              </Text>
            </View>

            {!videoUrl ? (
              <View style={styles.emptyVideoContainer}>
                <View style={styles.emptyVideoIconBox}>
                  <Ionicons name="videocam-off-outline" size={26} color={semantic.brandPrimary} />
                </View>
                <Text variant="h3" style={styles.emptyVideoTitle}>
                  Video đang được xử lý
                </Text>
                <Text variant="bodySmall" style={styles.emptyVideoSub}>
                  Tệp bài giảng đang được đồng bộ hoặc chưa khả dụng trên thiết bị này.
                </Text>
              </View>
            ) : (
              <View style={styles.mediaFrame}>
                {Platform.OS === 'web' ? (
                  isNative ? (
                    React.createElement('video', {
                      key: videoUrl,
                      src: videoUrl,
                      controls: true,
                      playsInline: true,
                      preload: 'metadata',
                      controlsList: 'nodownload',
                      style: {
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#0f172a',
                        objectFit: 'contain',
                        display: 'block',
                      },
                      onTimeUpdate: (e: any) => {
                        const v = e.currentTarget;
                        if (!v) return;
                        if (v.currentTime > maxWatchedTimeRef.current && v.currentTime - maxWatchedTimeRef.current < 3) {
                          maxWatchedTimeRef.current = v.currentTime;
                        }
                        if (v.duration > 0) {
                          const pct = (maxWatchedTimeRef.current / v.duration) * 100;
                          setWatchPercent(pct);
                          if (pct >= 95 && !endedTriggeredRef.current) {
                            endedTriggeredRef.current = true;
                            onVideoEnded?.();
                          }
                        }
                      },
                      onSeeking: (e: any) => {
                        if (!enforceWatchFull) return;
                        const v = e.currentTarget;
                        if (v && v.currentTime > maxWatchedTimeRef.current + 2) {
                          v.currentTime = maxWatchedTimeRef.current;
                        }
                      },
                      onEnded: () => {
                        setWatchPercent(100);
                        if (!endedTriggeredRef.current) {
                          endedTriggeredRef.current = true;
                          onVideoEnded?.();
                        }
                      },
                    })
                  ) : (
                    React.createElement('iframe', {
                      key: embedUrl,
                      src: embedUrl,
                      title: title || 'Video bài giảng',
                      allowFullScreen: true,
                      style: {
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: '#0f172a',
                      },
                    })
                  )
                ) : isNative ? (
                  <VideoView
                    player={player}
                    style={styles.nativeVideo}
                    nativeControls
                    allowsFullscreen
                    allowsPictureInPicture
                  />
                ) : (
                  <WebView
                    source={{ uri: embedUrl || videoUrl }}
                    style={styles.webView}
                    allowsFullscreenVideo
                    javaScriptEnabled
                    domStorageEnabled
                  />
                )}
              </View>
            )}
          </View>
        </ResponsiveContainer>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.articleScroll}
      contentContainerStyle={styles.articleContentContainer}
    >
      <ResponsiveContainer>
        <View style={[styles.articleCard, microShadow]}>
          <View style={styles.articleHeaderBar}>
            <Badge
              variant="info"
              label="Tài liệu bài đọc"
              icon={
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={semantic.brandPrimary}
                />
              }
            />
          </View>
          {Boolean(title) && (
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
              <View style={styles.emptyArticleIconBox}>
                <Ionicons name="globe-outline" size={26} color={semantic.brandPrimary} />
              </View>
              <Text variant="bodySmall" style={styles.emptyArticleText}>
                Nội dung bài đọc chi tiết được trình bày đầy đủ trên website Edumy.
              </Text>
              {onOpenWebsite && (
                <Button
                  title="Mở trên website"
                  variant="secondary"
                  onPress={onOpenWebsite}
                  style={styles.openWebButton}
                />
              )}
            </View>
          )}
        </View>
      </ResponsiveContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  videoSection: {
    backgroundColor: semantic.surfaceCanvas,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  videoCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 12,
  },
  videoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aspectLabel: {
    color: semantic.textMuted,
    fontWeight: '600',
  },
  mediaFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
    backgroundColor: semantic.surfaceMuted,
  },
  emptyVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  emptyVideoIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyVideoTitle: {
    color: semantic.textPrimary,
    textAlign: 'center',
  },
  emptyVideoSub: {
    marginTop: 4,
    color: semantic.textMuted,
    textAlign: 'center',
  },
  articleScroll: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  articleContentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  articleCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 18,
  },
  articleHeaderBar: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
  },
  articleTitle: {
    marginBottom: 12,
    color: semantic.textPrimary,
  },
  articleBody: {
    fontSize: 15,
    lineHeight: 24,
    color: semantic.textBody,
  },
  emptyArticleBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyArticleIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArticleText: {
    color: semantic.textSecondary,
    textAlign: 'center',
  },
  openWebButton: {
    marginTop: 4,
  },
});
