# APK nội bộ và nghiệm thu Android (W9-A3)

## EAS preview cho nhóm

`mobile/eas.json` có profile `preview`, `distribution: internal`, `buildType: apk`.
`app.json` cấu hình icon, splash, package `com.edumy.app`, version `1.0.0`,
`android.versionCode: 1`. Tăng versionCode cho mỗi bản phát hành mới.

Trong thư mục `mobile`, đăng nhập Expo rồi chạy `eas init` để liên kết project thật.
Cấu hình `EXPO_PUBLIC_API_URL=https://<demo-domain>/api` trong môi trường EAS của dự án,
sau đó chạy `npx eas-cli build --platform android --profile preview`.
Không đặt token/key trong repository. Chia sẻ URL APK do EAS trả về trong issue #66.

## Nghiệm thu bằng môi trường ảo

Theo lựa chọn của chủ yêu cầu, có thể thay 5 điện thoại bằng 5 Android emulator.
Workflow **Android preview** build một APK có JS bundle nhúng (không cần Metro),
sau đó cài và đăng nhập trên API 29, 30, 31, 33, 35. Mỗi job dùng MySQL/backend riêng,
tạo tài khoản riêng, đăng nhập qua UI thật và khởi động lại app để kiểm tra SecureStore.
Ảnh chụp màn hình, UI tree, log và kết quả JSON được lưu thành Actions artifacts.

Artifact `edumy-emulator-apk` chỉ dành cho emulator x86_64, dùng backend
`http://10.0.2.2:8080/api` và khóa ký debug nội bộ của template. Không phát hành APK
này lên Play Store hoặc coi nó là bản dùng trên điện thoại 4G. Bản cho nhóm dùng EAS
preview ở trên (HTTPS và kiến trúc thiết bị do EAS build).

## Auth integration

`AuthControllerTest` dùng `@SpringBootTest` + MockMvc, database H2 thật trong test:
register, hash password, login, refresh rotation, logout, 401, 403, tài khoản khóa,
và định dạng lỗi. Chạy `cd backend && ./mvnw -B verify`.
CI hiện có kiểm tra thêm migration MySQL và HTTP auth smoke.

Chỉ ghi PASS cho 5 emulator sau khi cả 5 job thành công. Không lấy `expo export`
làm bằng chứng APK cài đặt được; link run/artifacts là bằng chứng bàn giao.
