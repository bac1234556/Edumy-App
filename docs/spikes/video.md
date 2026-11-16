# Spike W7-D2: Phát video Cloudinary bằng expo-video (Issue #14)

> **Mục tiêu:** chọn định dạng phát, chất lượng upload và cách dùng `expo-video` để Member C (upload/Instructor Studio)
> và Member D (Learning player, lưu tiến độ) làm theo trong Tuần 8.
> **Phạm vi:** Expo SDK 51, `expo-video ~1.1.9` (dist-tag `sdk-51` trên npm), Android.

## 1. Kết luận (TL;DR)

| Hạng mục | Quyết định |
| --- | --- |
| Định dạng phát chính | **HLS adaptive** của Cloudinary: `.../video/upload/sp_auto/<public_id>.m3u8` |
| Định dạng dự phòng / preview ngắn | **MP4 tối ưu**: `.../video/upload/q_auto,vc_auto/<public_id>.mp4` |
| Lưu trong DB | `lessons.video_public_id` là nguồn chính; dựng URL từ public_id. `video_url` chỉ để tham khảo/MP4 fallback |
| File Instructor upload | MP4 **H.264 + AAC**, **720p** (1280×720), 30 fps, ~2.5–3 Mbps video, AAC 128 kbps, ≤ 100 MB/file |
| Khi upload (Member C) | Yêu cầu tạo sẵn HLS: `eager: [{ streaming_profile: 'auto', format: 'm3u8' }]`, `eager_async: true` |
| Player (Member D) | 1 `useVideoPlayer` cho cả màn học, đổi bài bằng `player.replace(uri)` |
| Tiến độ | **Poll** `player.currentTime` mỗi 1 s (SDK 51 chưa có event `timeUpdate`), lưu server mỗi 10 s + khi pause/rời màn |
| Hoàn thành bài | `currentTime >= 0.9 * duration` hoặc event `playToEnd` (khớp quy tắc ≥ 90% trong ERD) |
| Tiếp tục xem | Sau `statusChange === 'readyToPlay'` mới gán `player.currentTime = last_position_sec` |
| Fullscreen | `<VideoView allowsFullscreen nativeControls />`; mở bằng code qua `ref.enterFullscreen()` |

**Lý do chọn HLS:** player chỉ tải segment cần thiết (4–9 s/segment) nên seek nhanh và không phải tải cả file;
ExoPlayer tự hạ độ phân giải khi mạng yếu (3 mức 320p/480p/640p với `sp_auto` trên video mẫu).
MP4 gốc của video mẫu 13,5 s nặng **9,1 MB**, trong khi MP4 `q_auto,vc_auto` chỉ **0,82 MB** —
nếu phải dùng MP4 thì **luôn** thêm `q_auto,vc_auto`, không phát file gốc.

## 2. Kết quả đã kiểm chứng

Video mẫu public `demo/dog` của Cloudinary (13,5 s), đo ngày 2026-11-02 từ mạng văn phòng:

| Nguồn | URL (rút gọn) | HTTP | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- |
| MP4 gốc | `/dog.mp4` | 200 | 9 094 354 B | `video/mp4;codecs=avc1`, có `Accept-Ranges: bytes` (seek được) |
| MP4 tối ưu | `/q_auto,vc_auto/dog.mp4` | 200 | 820 940 B | nhỏ hơn ~11 lần, vẫn H.264 |
| HLS adaptive | `/sp_auto/dog.m3u8` | 200 | master 422 B | 3 biến thể 140–500 kbps; HLS v7, **fMP4** (`EXT-X-MAP`), segment ~4 s |
| HLS profile HD | `/sp_hd/dog.m3u8` | 200 | master 692 B | 4 biến thể đến 960×540; segment `.ts`, ~8 s |
| Thumbnail | `/so_2/dog.jpg` | 200 | 49 914 B | lấy frame giây thứ 2 làm ảnh bìa bài học |

API `expo-video 1.1.x` (đọc từ type definitions trong `node_modules/expo-video/build`):

- `VideoPlayer`: `currentTime` (đọc/ghi, dùng để seek tuyệt đối), `duration` (có từ 1.1.9, = 0 trước khi sẵn sàng),
  `playing`, `play()`, `pause()`, `seekBy(s)`, `replace(source)`, `replay()`.
- Event: `statusChange(idle | loading | readyToPlay | error)`, `playingChange`, `playToEnd`, `sourceChange`.
  **Không có** `timeUpdate` (có từ SDK 52) → phải poll.
- `useVideoPlayer(source)` tạo **player mới** mỗi khi `source` đổi → không truyền source động vào hook, dùng `replace()`.
- `VideoView`: `nativeControls`, `allowsFullscreen`, `contentFit`, `enterFullscreen()` / `exitFullscreen()` qua ref.

Màn spike `mobile/src/screens/VideoSpikeScreen.js` (route `/video-spike`): chọn 4 nguồn trên, phát/tạm dừng,
±10 s, tới 50%, toàn màn hình, hiển thị `status`, `currentTime / duration` (poll 500 ms) và thời gian tới `readyToPlay`.

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run lint` | PASS |
| `npm test` (6 test mới cho màn spike: poll thời gian, status/error, replace nguồn, seek) | PASS |
| `npx expo export --platform android` | PASS (bundle 3,04 MB) |
| Phát MP4/HLS, seek, fullscreen trên **điện thoại Android thật** | **MANUAL ACTION REQUIRED** — xem mục 3 |

## 3. Kiểm thử trên điện thoại thật (cần làm trước khi merge)

`expo-video` là native module. Nếu Expo Go báo thiếu module `ExpoVideo`, dùng development build:
`cd mobile && npx expo run:android` (cần Android SDK) hoặc EAS development build.

Mở màn spike: đăng nhập tài khoản STUDENT rồi mở deep link

```bash
# Development build (scheme "edumy" trong app.json)
adb shell am start -W -a android.intent.action.VIEW -d "edumy://video-spike" com.edumy.app
# Expo Go: mở exp://<IP-máy-dev>:8081/--/video-spike
```

Ghi kết quả vào bảng (thiết bị, Android version, mạng Wi-Fi/4G):

| # | Bước | MP4 gốc | MP4 q_auto | HLS sp_auto | HLS sp_hd |
| --- | --- | --- | --- | --- | --- |
| 1 | Phát được, có tiếng | ☐ | ☐ | ☐ | ☐ |
| 2 | `readyToPlay` sau … ms | | | | |
| 3 | `duration` ≈ 13,5 s | ☐ | ☐ | ☐ | ☐ |
| 4 | +10 s / −10 s / Tới 50% đúng vị trí | ☐ | ☐ | ☐ | ☐ |
| 5 | `currentTime` tăng đều khi phát, đứng yên khi pause | ☐ | ☐ | ☐ | ☐ |
| 6 | Toàn màn hình (nút + control native), xoay ngang, thoát ra vẫn phát | ☐ | ☐ | ☐ | ☐ |
| 7 | Đổi nguồn khi đang phát không crash | ☐ | ☐ | ☐ | ☐ |
| 8 | Tắt mạng giữa chừng → hiển thị lỗi, không crash | ☐ | ☐ | ☐ | ☐ |

Nếu HLS fMP4 (`sp_auto`) lỗi trên thiết bị cũ, chuyển sang profile có segment `.ts` (`sp_hd`) — kết luận còn lại giữ nguyên.

## 4. Hướng dẫn cho Tuần 8

**Member C — upload (Instructor Studio):**

1. Upload qua backend (signed) với `resource_type: 'video'`, kèm `eager` HLS + `eager_async: true` như bảng trên
   để tránh tạo HLS on-the-fly lần phát đầu (video dài sẽ chậm hoặc bị từ chối).
2. Lưu `video_public_id` và `duration_seconds` (Cloudinary trả `duration` trong response upload) vào `lessons`.
3. Validate phía app trước khi upload: đuôi `.mp4`/`.mov`, ≤ 100 MB; khuyến nghị 720p.

**Member D — Learning player:**

```js
const hls = (publicId) => `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/sp_auto/${publicId}.m3u8`;
const player = useVideoPlayer(hls(firstLesson.videoPublicId));
// Đổi bài: player.replace(hls(next.videoPublicId));
// Resume: khi statusChange === 'readyToPlay' → player.currentTime = progress.lastPositionSec;
// Poll 1 s: đọc player.currentTime / player.duration; mỗi 10 s (và khi pause/unmount)
//           PUT tiến độ → lesson_progress.last_position_sec; >= 90% → completed = true.
```

- Chỉ trả `videoPublicId`/URL cho bài đã mua hoặc `is_preview = true` (giữ nguyên quy tắc ở `GET /api/courses/{id}`).
- Không dùng URL ký (signed/token) ở MVP; nếu cần chặn chia sẻ link, cân nhắc ở giai đoạn sau.
