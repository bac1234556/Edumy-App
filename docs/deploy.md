# Deploy backend demo trên VPS (W9-A2)

## Điều kiện

VPS Linux có Docker Engine + Compose v2, DNS A/AAAA của `DEMO_DOMAIN` trỏ tới VPS,
TCP 80/443 mở từ Internet. MySQL và Java chỉ chạy trong mạng Docker, không publish
3306/8080. Caddy tự cấp/gia hạn chứng chỉ HTTPS và chuyển HTTP sang HTTPS.
Không bật profile `demo` trên Internet: profile này chứa tài khoản seed có mật khẩu công khai.

## Cấu hình và triển khai

Từ thư mục repository trên VPS:

```sh
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
openssl rand -hex 32 # tạo riêng DB_PASSWORD
openssl rand -hex 32 # tạo riêng MYSQL_ROOT_PASSWORD
openssl rand -hex 32 # tạo JWT_SECRET
```

Điền các giá trị vào `deploy/.env`, không commit hoặc gửi chúng vào issue/log.
`APP_VERSION` là SHA commit đã kiểm thử (`git rev-parse HEAD`). `DEMO_DOMAIN` chỉ
là hostname, không gồm scheme/path. Điền email quản trị cho ACME.

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yml build backend
docker compose --env-file deploy/.env -f deploy/compose.yml up -d
docker compose --env-file deploy/.env -f deploy/compose.yml ps
curl --fail https://api.example.com/api/health
```

Flyway chạy migration khi backend khởi động; dữ liệu MySQL, avatar và chứng chỉ
nằm trên volume riêng. Xem log khi cần:
`docker compose --env-file deploy/.env -f deploy/compose.yml logs --tail=100 backend caddy`.
Không dùng `down -v` trên môi trường đã có dữ liệu.

Swagger: `https://api.example.com/swagger-ui`. API mobile:
`EXPO_PUBLIC_API_URL=https://api.example.com/api` (biến được đóng vào bundle,
cần build lại APK sau khi đổi). Tạo tài khoản bằng API register; không dùng mật khẩu seed.

## Kiểm chứng từ bên ngoài

1. Tắt WiFi trên điện thoại, bật 4G/5G.
2. Mở `/api/health` bằng HTTPS, kiểm tra chứng chỉ hợp lệ.
3. Cài APK đã cấu hình URL trên, đăng ký/đăng nhập và tải hồ sơ.
4. Ghi URL, SHA deploy, thời gian, thiết bị và kết quả vào #65.

Healthcheck từ VPS hay kiểm thử localhost không thay thế bước kiểm tra bằng 4G.

## Sao lưu và rollback

Trước mỗi nâng cấp, giữ lại SHA/image cũ và tạo backup (tệp SQL chứa dữ liệu nhạy cảm):

```sh
umask 077
docker compose --env-file deploy/.env -f deploy/compose.yml exec -T mysql \
  sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump -u "$MYSQL_USER" --single-transaction --no-tablespaces "$MYSQL_DATABASE"' \
  > backup-before-upgrade.sql
```

Build image mới từ SHA đã kiểm thử, cập nhật `APP_VERSION`, chạy `up -d --no-build backend`.
Nếu kiểm tra health/auth thất bại và schema tương thích ngược, đổi `APP_VERSION` về
SHA cũ trong `.env` và chạy:

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml up -d --no-build backend
curl --fail https://api.example.com/api/health
```

Giữ image cũ, không prune trước khi nghiệm thu. Flyway không tự đảo migration.
Nếu migration không tương thích ngược, dừng backend và khôi phục backup vào database
riêng đã được xác minh trước khi trỏ image cũ vào đó; thao tác phục hồi có thể làm mất
các bản ghi phát sinh sau backup nên phải thống nhất thời điểm phục hồi với người vận hành.

## Trạng thái bàn giao

Repository cung cấp cấu hình triển khai và rollback. Việc deploy HTTPS lên VPS thật
và kiểm chứng trên 4G cần VPS/domain và quyền truy cập của dự án; không thể suy ra
đã deploy chỉ từ việc build image thành công.

## Môi trường ảo thay VPS/4G (đã được chủ yêu cầu chấp nhận)

Dùng Docker Compose >= 2.24.4, image backend đã build và file biến môi trường
ở trên. Override chỉ publish HTTPS trên loopback, dùng CA nội bộ của Caddy:

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml -f deploy/compose.virtual.yml up -d --no-build
docker compose --env-file deploy/.env -f deploy/compose.yml -f deploy/compose.virtual.yml \
  cp caddy:/data/caddy/pki/authorities/local/root.crt ./virtual-root.crt
curl --cacert virtual-root.crt --fail https://localhost:18443/api/health
```

Dùng `--cacert` để kiểm tra chuỗi tin cậy thật, không dùng `-k`. Mô phỏng client
ngoài backend bằng container độc lập cùng Docker network, kết nối Caddy bằng HTTPS;
chạy register/login/refresh/401/403 qua Caddy. Sau đó khởi động lại backend từ cùng
image và kiểm tra login lại để xác nhận MySQL/secret được giữ nguyên.

Đây là nghiệm thu mạng cô lập và TLS trên máy ảo, không phải chứng chỉ công khai,
VPS Internet hoặc thử nghiệm sóng 4G thật.
