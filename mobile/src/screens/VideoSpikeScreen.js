import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Chip, HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';

// Spike W7-D2 (#14): video mẫu public của Cloudinary, cùng một asset ở các định dạng khác nhau.
const CLOUDINARY = 'https://res.cloudinary.com/demo/video/upload';
export const SPIKE_SOURCES = [
  { key: 'mp4-raw', label: 'MP4 gốc', uri: `${CLOUDINARY}/dog.mp4` },
  { key: 'mp4-auto', label: 'MP4 q_auto', uri: `${CLOUDINARY}/q_auto,vc_auto/dog.mp4` },
  { key: 'hls-auto', label: 'HLS sp_auto', uri: `${CLOUDINARY}/sp_auto/dog.m3u8` },
  { key: 'hls-hd', label: 'HLS sp_hd', uri: `${CLOUDINARY}/sp_hd/dog.m3u8` },
];

// expo-video 1.1 (SDK 51) chưa có event timeUpdate nên phải poll currentTime.
const POLL_MS = 500;

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function VideoSpikeScreen() {
  const [source, setSource] = useState(SPIKE_SOURCES[0]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [position, setPosition] = useState({ currentTime: 0, duration: 0, playing: false });
  const [readyMs, setReadyMs] = useState(null);
  const startedAt = useRef(Date.now());
  const viewRef = useRef(null);
  // Giữ một player duy nhất và đổi nguồn bằng replace() (đổi tham số hook sẽ tạo player mới).
  const player = useVideoPlayer(SPIKE_SOURCES[0].uri, (p) => { p.loop = false; });

  useEffect(() => {
    const sub = player.addListener('statusChange', (next, _prev, err) => {
      setStatus(next);
      setError(next === 'error' ? err?.message || 'Không phát được video' : null);
      if (next === 'readyToPlay') setReadyMs((ms) => ms ?? Date.now() - startedAt.current);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPosition({ currentTime: player.currentTime, duration: player.duration, playing: player.playing });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [player]);

  const choose = (next) => {
    if (next.key === source.key) return;
    startedAt.current = Date.now();
    setReadyMs(null);
    setError(null);
    setSource(next);
    player.replace(next.uri);
  };

  const seekTo = (seconds) => {
    player.currentTime = Math.max(0, Math.min(seconds, player.duration || seconds));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text variant="headlineSmall">Spike: expo-video + Cloudinary</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SPIKE_SOURCES.map((s) => (
            <Chip key={s.key} testID={`source-${s.key}`} selected={s.key === source.key} showSelectedCheck={false} onPress={() => choose(s)}>
              {s.label}
            </Chip>
          ))}
        </View>
        <Text selectable variant="bodySmall">{source.uri}</Text>

        <View style={{ aspectRatio: 16 / 9, backgroundColor: '#000', justifyContent: 'center' }}>
          <VideoView
            ref={viewRef}
            testID="spike-video"
            style={{ width: '100%', height: '100%' }}
            player={player}
            nativeControls
            allowsFullscreen
            contentFit="contain"
          />
          {status === 'loading' && (
            <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center' }} accessibilityLabel="Đang tải video" />
          )}
        </View>
        <HelperText type="error" visible={!!error}>{error}</HelperText>

        <Text testID="spike-status">Trạng thái: {status}{position.playing ? ' (đang phát)' : ''}</Text>
        <Text testID="spike-time">
          currentTime / duration: {formatTime(position.currentTime)} / {formatTime(position.duration)}
          {' '}({position.currentTime.toFixed(1)}s / {position.duration.toFixed(1)}s)
        </Text>
        <Text testID="spike-ready">Thời gian tới readyToPlay: {readyMs == null ? '…' : `${readyMs} ms`}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button mode="contained" onPress={() => (player.playing ? player.pause() : player.play())}>
            {position.playing ? 'Tạm dừng' : 'Phát'}
          </Button>
          <Button mode="outlined" onPress={() => player.seekBy(-10)}>-10s</Button>
          <Button mode="outlined" onPress={() => player.seekBy(10)}>+10s</Button>
          <Button mode="outlined" testID="seek-half" onPress={() => seekTo((player.duration || 0) / 2)}>Tới 50%</Button>
          <Button mode="outlined" onPress={() => viewRef.current?.enterFullscreen()}>Toàn màn hình</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
