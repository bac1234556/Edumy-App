# Quy trình GitHub — Edumy (W7-A1 / Issue #2)

Áp dụng cùng [PROJECT_PLAN.md](PROJECT_PLAN.md) và [api-conventions.md](api-conventions.md).
Dùng checkout cloud hiện có; không yêu cầu thành viên clone về máy cá nhân.

## Nhánh và vòng đời công việc

- `main`: release ổn định; `develop`: tích hợp.
- Tính năng: `feature/<issue-number>-<slug>`; sửa lỗi: `fix/<issue-number>-<slug>`.
- Commit theo Conventional Commits, ví dụ `chore(devops): setup CI (#2)`.
- Không push trực tiếp main/develop, không force-push các nhánh được bảo vệ.

1. Nhận assignment, chọn labels/acceptance criteria; chuyển Issue từ **Backlog → Todo → In Progress**.
2. Từ root repository, kiểm tra working tree trước khi tạo nhánh:

   ```bash
   git status --short
   git fetch origin develop
   # Nếu chưa có develop cục bộ:
   git switch -c develop --track origin/develop
   # Nếu đã có develop: git switch develop && git pull --ff-only origin develop
   git switch -c feature/<issue-number>-<slug>
   ```

   Không reset nhánh có công việc chưa đẩy. Nếu remote chưa có develop, phối hợp owner tạo từ commit đã thống nhất.
3. Chỉ commit file của task, chạy verify/lint tương ứng, push nhánh và mở PR vào **develop**.
   Dùng PR template; mô tả phải có `Closes #<issue>`, cách test, kết quả, ảnh nếu đổi UI.
4. Chuyển **In Review**. Review chéo A → B → C → D → E → A; cần ít nhất **1 approval từ người khác**,
   CI thật sự PASS và hết conflict trước khi Tech Lead merge. PR release từ develop vào main cũng cần review.
5. Sau nghiệm thu, đăng comment với bằng chứng và link PR/Actions **trước khi đóng Issue**, rồi chuyển **Done**.
   Closing keyword chỉ tự đóng khi merge vào default branch; merge vào develop có thể cần đóng thủ công.
   Với #2, không tự merge hoặc đăng completion comment; owner review/merge/xác minh trước khi dùng comment cuối.

## CI và kiểm thử

Workflow `.github/workflows/ci.yml` chạy:

- PR vào main/develop; push main/develop/feature/**/fix/**; workflow_dispatch.
- `Backend verify`: Ubuntu, Temurin JDK 21, Maven cache, **MySQL 8 service với health check**,
  chạy đúng `./mvnw -B verify` tại backend/. Báo cáo Surefire được upload cả khi test fail.
- `Mobile lint`: Ubuntu, Node 22 LTS (tương thích yêu cầu Node >=18 của Expo SDK 51), npm cache,
  chạy `npm ci` và `npm run lint` tại mobile/.
- Quyền tối thiểu `contents: read`. Không skipTests, không continue-on-error, không thay lint bằng echo,
  không tắt Flyway hay đổi `ddl-auto=validate` của ứng dụng.
- MySQL credential trong workflow chỉ dành cho service test dùng một lần, không dùng production secret.
- Maven wrapper chuẩn Apache 3.9.9/3.3.2 chỉ dùng script, không thêm JAR binary; distribution có SHA-256.
- ESLint kiểm tra JS/JSX, core recommended và React Hooks, nhận diện React JSX; lỗi hoặc warning làm job fail.
  Lockfile giữ nguyên dependency ứng dụng, chỉ bổ sung tooling lint. Khi nâng Expo phải xác minh lại Node.

Chạy tại cloud:

```bash
cd /workspace/Edumy-App/mobile
npm ci
npm run lint

cd /workspace/Edumy-App/backend
# Cần MySQL8 khỏe mạnh, database sạch và tài khoản test hợp lệ.
# Đặt DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD cho database test, không dùng production.
./mvnw -B verify
```

Không dùng kết quả cũ để xác nhận commit mới. Phân biệt PASS/FAIL/SKIPPED/MANUAL ACTION REQUIRED.
MySQL migration/schema lỗi phải được báo đúng nguyên nhân, không chuyển test sang H2 để che lỗi.

## Kết quả xác minh bản làm lại

- PASS: Maven wrapper khởi chạy bằng Java 21; `./mvnw -B verify` trên MySQL8,
  và `clean verify` trên database sạch: **2 tests, 0 failures/errors/skipped**.
- PASS: Flyway áp dụng cả 3 migrations, Hibernate `validate` thành công; 6 categories seed còn nguyên.
- PASS: nâng `reviews.rating` lên INT vẫn giữ CHECK 1–5 (INSERT rating=6 bị từ chối).
- PASS: Node22 `npm ci`, `npm run lint`; actionlint và YAML/forms validation.
- Lỗi baseline đã tái hiện: thiếu bảng courses và kiểu rating không khớp entity.
  Theo chấp thuận của owner, bổ sung hai migrations nhỏ `V20261028_1000` và `V20261028_1001`;
  không sửa migration đã có, entity, controller, service hoặc test assertions.
- Không dùng H2, không tự tạo schema bằng Hibernate, không tắt Flyway/test để CI xanh.
- Android runtime/APK và chức năng chưa có của #3/#4/#5 không được kiểm tra trong task CI này.
- GitHub-hosted run phải đối chiếu link/commit mới nhất trước khi nghiệm thu.

## GitHub settings cần owner xác minh

GitHub API trong cloud trả **Forbidden**, nên không thể kết luận rằng settings đã được cấu hình.
Trang công khai đã xác minh đủ labels dưới đây; không tạo label trùng:

- `type:feature`, `type:bug`, `type:chore`, `type:test`, `type:docs`.
- `area:backend`, `area:mobile`, `area:devops`.
- `module:auth`, `module:catalog`, `module:instructor`, `module:learning`, `module:admin`.
- `priority:high`, `priority:medium`, `priority:low`; `size:S`, `size:M`, `size:L`.

Issue Forms Feature/Bug/Chore tự gán type label tương ứng. Người triage chọn area/module/priority/size.
Nếu danh sách thay đổi, vào **Issues → Labels**, so sánh tên chính xác trước khi tạo label mới.

### Project board

1. Repository → **Projects**, đồng thời kiểm tra Projects của owner. Tái sử dụng Project Edumy phù hợp;
   chỉ tạo mới khi xác nhận chưa có. Liên kết Project với repository.
2. Project **Settings → Fields → Status**: cần **đúng 5 options** theo thứ tự
   **Backlog, Todo, In Progress, In Review, Done**. Chuyển thẻ khỏi option cũ trước khi loại bỏ option thừa,
   không xóa dữ liệu của nhóm khi chưa thống nhất.
3. Tạo/chọn **Board view**, **Group by → Status**, lưu view; kiểm tra cả các cột ẩn.
4. **Add item → Add item from repository → Edumy-App**, thêm Issues liên quan (gồm #2/#3/#4/#5),
   assignee/milestone và Status. Gán trạng thái để không có thẻ No status.
5. Xác minh quyền truy cập của cả 5 thành viên; ghi URL board và bằng chứng 5 cột vào nghiệm thu.

Trang Issue #2 lúc audit hiển thị **No projects**; chưa có bằng chứng board đạt yêu cầu.

### Branch protection main và develop

Vào **Settings → Rules → Rulesets** (hoặc **Branches → Branch protection rules**):

- Kiểm tra rule hiện có trước, giữ nguyên điều kiện mạnh hơn. Target chính xác **main và develop**,
  không khóa feature/** hoặc fix/**.
- Enforcement **Active**, **Require a pull request before merging**, tối thiểu **1 approval** từ người khác.
- **Require status checks**: chọn `Backend verify` và `Mobile lint` do GitHub Actions tạo
  sau khi run xuất hiện; xác minh đúng tên trên PR.
- **Block force pushes**, **Restrict deletions**; classic protection không cho phép force-push/deletion.
- Không cho bypass direct-push kể cả admin nếu plan hỗ trợ; classic bật **Do not allow bypassing the above settings**.
  Không bật rule Restrict updates làm chặn luôn PR merge thông thường.
- Xác minh từng thành viên tạo/push feature branch và mở/review PR được. Chưa có xác nhận thực tế
  thì không đánh dấu tiêu chí “cả 5 người push được nhánh feature” hoàn tất.
- Nếu GitHub plan/quyền không hỗ trợ enforcement, báo limitation; không coi việc commit workflow là đã bật protection.

### PR #23 và Issue #2

PR: https://github.com/bac1234556/Edumy-App/pull/23

Base `develop`, head `feature/2-setup-monorepo-ci`. Không tạo PR trùng.
Trang PR lúc audit còn dòng `Closes #` chưa điền số; Issue #2 có **No branches or pull requests**.
Owner sửa description bằng file cloud `/workspace/.edumy-local/issue-2-pr.md`, gồm dòng chính xác:

```text
Closes #2
```

Nếu closing keyword chưa liên kết vì base develop không phải default branch, dùng PR sidebar
**Development** để liên kết Issue #2 và xác minh lại trên Issue. Sau đó hoàn tất board/protection,
CI, một approval và merge trước khi dùng comment nghiệm thu.

Khi API khả dụng, cập nhật PR hiện có bằng:

```bash
gh pr edit 23 --repo bac1234556/Edumy-App --body-file /workspace/.edumy-local/issue-2-pr.md
```
