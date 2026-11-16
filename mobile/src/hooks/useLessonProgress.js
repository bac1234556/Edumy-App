import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { saveLessonProgress } from '../api/progress';

export const SAVE_EVERY_SECONDS = 10;
export const COMPLETE_RATIO = 0.9;

export function buildProgressPayload(currentTime, duration, forceCompleted = false) {
  const time = Number.isFinite(currentTime) && currentTime > 0 ? currentTime : 0;
  const total = Number.isFinite(duration) && duration > 0 ? duration : 0;
  return {
    positionSec: Math.floor(time),
    completed: forceCompleted || (total > 0 && time / total >= COMPLETE_RATIO),
  };
}

/**
 * W9-D2: lưu vị trí xem mỗi 10 giây khi đang phát, khi tạm dừng, khi hết video, khi app xuống nền
 * và khi rời màn hình/đổi bài. Mỗi lần lưu dùng lessonId của video đang phát (không phải bài vừa bấm).
 * Chỉ lưu khi canSave() = true (video đã sẵn sàng và đã tua tới điểm học tiếp) để không ghi đè vị trí cũ bằng 0.
 */
export function useLessonProgress({ player, lessonId, canSave, onSaved }) {
  const canSaveRef = useRef(canSave);
  const onSavedRef = useRef(onSaved);
  const lastSent = useRef(null);
  canSaveRef.current = canSave;
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (!lessonId) return undefined;
    // Ảnh chụp gần nhất: lúc unmount player có thể đã bị giải phóng nên không đọc trực tiếp được nữa.
    // valid = true chỉ sau khi đọc được vị trí lúc video đã sẵn sàng và đã tua tới điểm học tiếp;
    // nếu chưa có ảnh chụp hợp lệ thì không lưu, tránh ghi đè vị trí cũ bằng 0.
    const snapshot = { time: 0, duration: 0, playing: false, valid: false };
    const readLive = () => {
      try {
        snapshot.time = player.currentTime;
        snapshot.duration = player.duration;
        snapshot.playing = player.playing;
        if (canSaveRef.current?.()) snapshot.valid = true;
      } catch { /* player đã giải phóng: dùng ảnh chụp cũ */ }
    };
    const save = (forceCompleted = false, live = true) => {
      if (live) readLive();
      if (!snapshot.valid || !canSaveRef.current?.()) return;
      const payload = buildProgressPayload(snapshot.time, snapshot.duration, forceCompleted);
      const prev = lastSent.current;
      if (prev && prev.lessonId === lessonId && prev.positionSec === payload.positionSec
        && prev.completed === payload.completed) return;
      lastSent.current = { lessonId, ...payload };
      saveLessonProgress(lessonId, payload)
        .then((result) => onSavedRef.current?.(result))
        .catch(() => {
          // Lần sau thử lại: bỏ dấu "đã gửi" của bản ghi thất bại.
          if (lastSent.current?.lessonId === lessonId) lastSent.current = null;
        });
    };

    const subs = [
      player.addListener('playingChange', (isPlaying) => { if (!isPlaying) save(); }),
      player.addListener('playToEnd', () => save(true)),
    ];
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      readLive();
      if (ticks % SAVE_EVERY_SECONDS === 0 && snapshot.playing) save(false, false);
    }, 1000);
    const appState = AppState.addEventListener('change', (state) => { if (state !== 'active') save(); });

    return () => {
      clearInterval(timer);
      subs.forEach((sub) => sub.remove());
      appState.remove();
      save(false, false);
    };
  }, [player, lessonId]);
}
