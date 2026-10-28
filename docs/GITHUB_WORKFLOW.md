# Quy trình GitHub — Edumy

Áp dụng [PROJECT_PLAN.md](PROJECT_PLAN.md) và [api-conventions.md](api-conventions.md).
Issue #2 chỉ cấu hình cộng tác và CI; scaffold backend/mobile thuộc #3/#4, JWT thuộc #5.

## Từ Issue đến merge

1. Nhận assignment, xác định acceptance criteria, phụ thuộc và labels; đưa Issue từ
   **Backlog → Todo → In Progress** khi bắt đầu.
2. Dùng checkout cloud hiện có (không cần clone trên máy cá nhân):

   ```bash
   git fetch origin
   git switch develop
   git pull --ff-only origin develop
   git switch -c feature/2-setup-monorepo-ci
   # Task khác: feature/<issue-number>-<slug>; sửa lỗi: fix/<issue-number>-<slug>
   ```

   Nếu chưa có develop cục bộ: `git switch -c develop --track origin/develop`.
   Nếu remote chưa có develop: phối hợp owner chọn commit gốc và tạo nhánh; không tự reset nhánh.
3. Commit theo Conventional Commits, chỉ stage file thuộc Issue, chạy kiểm tra tương ứng.
   Push nhánh feature/fix, mở PR **vào develop**, điền PR template và `Closes #<issue>`.
4. Chuyển **In Review**, yêu cầu review chéo A → B → C → D → E → A.
   Cần ít nhất **1 Approve của thành viên khác**, CI thực sự phù hợp và hết conflict trước khi merge.
   Ghi N/A cho UI/API/Android không liên quan; ghi SKIPPED kèm lý do nếu chưa thể kiểm thử.
5. Sau review và xác minh acceptance criteria, Tech Lead merge vào develop. main chỉ nhận
   PR release từ develop; không push trực tiếp lên main/develop.
6. Đăng comment nghiệm thu có bằng chứng **trước khi đóng Issue**. Chỉ đưa **Done** sau nghiệm thu.
   GitHub chỉ tự đóng Issue qua closing keyword khi PR được merge vào **default branch**;
   merge vào develop có thể không đóng Issue. Owner kiểm tra rồi đóng thủ công nếu cần.
   Với Issue #2: không tự merge hoặc đóng; chờ review và cho phép của owner.

## CI: `.github/workflows/ci.yml`

Chạy mọi PR vào main/develop, push main/develop/feature/**/fix/** và workflow_dispatch.
Không dùng path filter để required checks luôn xuất hiện. Quyền chỉ `contents: read`.

| Check cố định | Hành vi |
| --- | --- |
| `Repository configuration` | Luôn chạy kiểm tra cấu trúc và các tình huống bootstrap trong thư mục tạm bằng Python unittest. |
| `Backend verify` | Ubuntu, Temurin Java 21, cache Maven theo pom; chạy `./mvnw -B verify` tại backend/. |
| `Mobile lint` | Ubuntu, Node 22 LTS (dòng LTS hỗ trợ yêu cầu Node >=18 của Expo SDK 51 hiện tại), cache npm theo lock; chạy `npm ci`, rồi `npm run lint` tại mobile/. |

Chỉ khi **manifest chưa tồn tại**, bước verify/lint mới SKIPPED; lý do xuất hiện trong log và
job summary. Kết quả job bootstrap xanh **không đồng nghĩa Maven/lint đã chạy**.
Khi manifest tồn tại, thiếu prerequisite sẽ FAIL, không tiếp tục báo xanh:

- **#3:** commit `backend/mvnw` có executable bit và `.mvn/wrapper/maven-wrapper.properties`
  cùng các artifact wrapper cần thiết; bảo đảm `./mvnw -B verify` chạy noninteractive.
  Cấu hình môi trường test/DB cần thiết thuộc #3, không tắt test để vượt CI.
- **#4:** commit `mobile/package-lock.json`, định nghĩa `scripts.lint` cùng dependency/config lint;
  lint phải noninteractive, không tự cài package hoặc sửa file. npm ci phát hiện lock không khớp.
  Nếu đổi package manager, đổi đồng bộ guard, lệnh frozen install, cache và lint trong cùng PR;
  không commit nhiều lockfile. Xác minh Node/Expo compatibility khi nâng SDK.

Tại thời điểm triển khai trên develop `f5c7a7e`, đã có pom.xml và package.json từ #7–#9,
nhưng chưa có wrapper/lockfile/lint. Vì vậy hai preflight hiện **FAIL đúng thiết kế**;
Maven verification và lint thật **chưa chạy**. Không thêm scaffold hoặc placeholder test để che lỗi.

Kiểm tra tại root:

```bash
python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v
bash -n .github/scripts/check-project.sh
bash .github/scripts/check-project.sh backend
bash .github/scripts/check-project.sh mobile
git diff --check
```

## Thiết lập trên GitHub (owner thực hiện và xác minh)

Commit file không cấu hình được Projects, labels hoặc branch protection. Khi triển khai này,
Git read hoạt động nhưng GitHub REST/GraphQL trả Forbidden; các mục dưới đây chưa được xác minh.
Không xóa/sửa quy tắc hoặc trạng thái đang dùng khi chưa được owner cho phép.

### Labels

Repository → **Issues → Labels**. So sánh toàn bộ nhãn hiện có với mục Labels của PROJECT_PLAN.md.
Giữ nguyên nhãn đã có; chỉ **New label** cho tên thực sự thiếu (không tạo nhãn đồng nghĩa):

- `type:feature`, `type:bug`, `type:chore`, `type:test`, `type:docs`
- `area:backend`, `area:mobile`, `area:devops`
- `module:auth`, `module:catalog`, `module:instructor`, `module:learning`, `module:admin`
- `priority:high`, `priority:medium`, `priority:low`
- `size:S` (≤4 giờ), `size:M` (≤1 ngày), `size:L` (≤2 ngày)

Issue Forms dùng đúng tên trong kế hoạch, chưa tự gán label vì chưa kiểm tra được danh sách remote.
Người triage chọn nhãn đã tồn tại; có thể bật auto-label sau khi owner xác nhận tên chính xác.

### Project board

1. Repository → **Projects**, kiểm tra project đã liên kết; kiểm tra thêm Projects của owner.
   Tái sử dụng project Edumy phù hợp. Chỉ tạo project mới nếu chắc chắn chưa có, rồi liên kết repository.
2. Project **Settings → Fields → Status**: kiểm tra dữ liệu đang dùng, phối hợp owner chuyển các
   giá trị cũ trước khi bỏ option thừa. Kết quả phải có **đúng 5 options**, theo thứ tự:
   **Backlog, Todo, In Progress, In Review, Done**.
3. Tạo/đổi view thành **Board**, **Group by → Status**, lưu view. Kiểm tra cả cột ẩn và No status.
4. **Add item → Add item from repository**, chọn Edumy-App; thêm các Issues hiện có liên quan
   tuần 7, gồm #2/#3/#4/#5 (kiểm tra nội dung trước khi gán), người phụ trách và milestone.
   Gán Status cho mỗi thẻ; không coi No status là trạng thái thứ sáu.
5. Kiểm tra quyền truy cập của 5 thành viên bằng xác nhận thực tế từ từng người.
   Lưu URL board và ảnh/bằng chứng 5 cột vào comment #2; chưa có bằng chứng thì chưa tick hoàn tất.
   Tránh automation tự đưa #2 sang Done/đóng Issue trước nghiệm thu.

### main và develop

Repository → **Settings → Rules → Rulesets** (hoặc **Branches → Branch protection rules**):
kiểm tra rule hiện có trước, giữ nguyên điều kiện mạnh hơn. Tạo/cập nhật rule cho **main và develop**,
không áp dụng cho feature/** hoặc fix/**:

- Enforcement **Active**; require PR trước merge, ít nhất **1 approval** từ người khác.
- Require status checks: `Repository configuration`, `Backend verify`, `Mobile lint`.
  Chọn đúng check do GitHub Actions tạo sau run đầu tiên; xác minh tên hiển thị thực tế.
  Hai check ứng dụng hiện fail do #3/#4 chưa hoàn tất, không tắt guard hoặc bỏ required check để merge.
  Nếu bootstrap chặn thứ tự merge, owner phối hợp đưa prerequisite #3/#4 vào trước.
- Block force pushes và deletion; không bật tùy chọn cho phép force push/deletion.
- Không cho bypass direct push kể cả admin nếu khả năng GitHub/plan hỗ trợ; không cấp bypass
  chung cho team. Với classic protection bật **Do not allow bypassing the above settings**.
- Không bật **Restrict updates** nếu nó chặn cả merge PR bình thường. Require PR + không bypass
  phải chặn direct push mà vẫn cho feature development và merge PR đã được duyệt.
- Xác minh rule áp dụng cả hai nhánh; các thành viên có quyền tạo feature branch và mở/review PR.
  Không dùng force push hoặc xóa nhánh thật để thử policy. Nếu plan/quyền không hỗ trợ enforcement,
  ghi hạn chế và nhờ owner xử lý; không tuyên bố protection đã bật.

## Mở PR Issue #2 sau khi kết nối GitHub khả dụng

Sau khi xác minh base vẫn là develop, commit các file thuộc task trên nhánh
`feature/2-setup-monorepo-ci`, push không dùng force rồi:

```bash
gh pr create --base develop --head feature/2-setup-monorepo-ci \
  --title 'chore(devops): setup monorepo workflow and CI (#2)' \
  --body-file /workspace/.edumy-local/issue-2-pr.md
```

PR body được chuẩn bị ngoài checkout; nội dung gồm `Closes #2`, file thay đổi, kết quả kiểm tra
và việc thủ công còn thiếu. Chưa có URL PR/run thì không coi PR hoặc CI GitHub đã được tạo/chạy.
