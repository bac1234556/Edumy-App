# Edumy API Contract v2

> **Base URL:** `/api/v1` (mặc định local: `http://localhost:5000/api/v1`)
> **OpenAPI Spec:** `docs/system/openapi.json` (export từ `/v3/api-docs` ở profile `dev`)

---

## 1. Định dạng chung

### 1.1. Response Envelope
Áp dụng cho mọi JSON dưới `/api/**` (trừ webhook thanh toán, IPN, `vnpay-return`, `/uploads/**`, `/v3/api-docs/**`, `/swagger-ui/**` và response nhị phân như PDF/`Resource`/`byte[]`).

**Thành công:**
```json
{
  "success": true,
  "message": "OK",
  "data": "<T>",
  "errors": null
}
```
`204 No Content` không có body.

**Lỗi:**
```json
{
  "success": false,
  "message": "<thông điệp tiếng Việt cho người dùng>",
  "data": null,
  "errors": {
    "code": "UPPER_SNAKE_CODE",
    "fields": { "<field>": "<msg>" },
    "traceId": "<uuid>"
  }
}
```
(`fields` là `null` nếu không phải lỗi validation).

### 1.2. HTTP Status
- `400`: body sai hoặc sai kiểu dữ liệu / validation
- `401`: chưa xác thực (token thiếu, sai chữ ký, hết hạn; sai thông tin đăng nhập; refresh token không hợp lệ/reuse)
- `403`: không có quyền (`FORBIDDEN`, `AUTH_ACCOUNT_LOCKED`, `LESSON_NOT_PREVIEWABLE`, `NOT_ENROLLED`)
- `404`: không tìm thấy (`NOT_FOUND`, `COURSE_NOT_FOUND`)
- `405`: sai method (`METHOD_NOT_ALLOWED`)
- `409`: xung đột trạng thái (`CONFLICT`, `AUTH_EMAIL_TAKEN`, `WITHDRAWAL_ALREADY_OPEN`, `WITHDRAWAL_MONTHLY_LIMIT_REACHED`, `CANNOT_CANCEL`, `ALREADY_PROCESSED`)
- `422`: vi phạm quy tắc nghiệp vụ (`COURSE_NOT_FREE`, `OWN_COURSE`, `CURRENT_PASSWORD_INCORRECT`, `PAYOUT_ACCOUNT_REQUIRED`, `WITHDRAWAL_BELOW_MINIMUM`, `WITHDRAWAL_EXCEEDS_BALANCE`)
- `429`: gửi quá nhanh (`EMAIL_RESEND_TOO_SOON`, `RATE_LIMITED`, kèm header `Retry-After` tính bằng giây)
- `500`: lỗi hệ thống (`INTERNAL_ERROR`)

### 1.3. Phân trang (`/api/v1`)
```json
{
  "content": [],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0
  }
}
```
`page` bắt đầu từ `0`.

### 1.4. Kiểu dữ liệu
- **Thời gian:** ISO-8601 UTC (`Instant`, ví dụ `2026-11-17T03:00:00Z`).
- **Tiền tệ:** số nguyên `long` (VND).
- **Roles:** mảng chuỗi `["STUDENT"]`, `["STUDENT", "INSTRUCTOR"]`, `["STUDENT", "INSTRUCTOR", "ADMIN"]`.

---

## 2. Danh sách Endpoint Mobile v2

### 2.1. Auth
| Method | Path | Auth | Request Body | Response (`data`) / Ghi chú | Mã lỗi chính |
|---|---|---|---|---|---|
| `POST` | `/auth/mobile/register` | Public | `{fullName, email, password}` | `201` `MobileTokens` (`isEmailVerified=false`, gửi mail xác thực) | `VALIDATION_ERROR`, `AUTH_EMAIL_TAKEN` |
| `POST` | `/auth/mobile/login` | Public | `{email, password}` | `200` `MobileTokens` | `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED` |
| `POST` | `/auth/mobile/refresh` | Public | `{refreshToken}` | `200` `MobileTokens` (rotate theo `familyId`) | `AUTH_REFRESH_INVALID`, `AUTH_REFRESH_REUSED`, `AUTH_ACCOUNT_LOCKED` |
| `POST` | `/auth/mobile/logout` | Public | `{refreshToken}` | `204 No Content` | - |
| `POST` | `/auth/forgot-password` | Public | `{email}` | `200` `{message}` (không tiết lộ email tồn tại) | `BAD_REQUEST` |
| `POST` | `/auth/verification-email/resend` | Bearer (hoặc `{email}`) | `{email}` (optional nếu đã auth) | `200` `{message}`, cooldown 60s | `EMAIL_RESEND_TOO_SOON` (429 + `Retry-After`), `NOT_FOUND` |

`MobileTokens` = `{ accessToken, expiresAt, refreshToken, refreshExpiresAt }` (ISO-8601 UTC).

### 2.2. Hồ sơ cá nhân (`/me`)
| Method | Path | Auth | Request Body | Response (`data`) | Mã lỗi chính |
|---|---|---|---|---|---|
| `GET` | `/me` | Bearer | - | `Me {id, email, fullName, emailVerified, roles[], status, createdAt}` | `UNAUTHORIZED`, `NOT_FOUND` |
| `PATCH` | `/me` | Bearer | `{fullName}` | `Me` | `UNAUTHORIZED`, `VALIDATION_ERROR` |
| `PUT` | `/me/password` | Bearer | `{currentPassword, newPassword}` | `204 No Content` (revoke mọi refresh token) | `UNAUTHORIZED`, `VALIDATION_ERROR`, `CURRENT_PASSWORD_INCORRECT` (422) |

### 2.3. Catalog (`/catalog`)
| Method | Path | Auth | Query | Response (`data`) | Mã lỗi chính |
|---|---|---|---|---|---|
| `GET` | `/catalog/categories` | Public | - | `[{id, name, slug}]` | - |
| `GET` | `/catalog/courses` | Public | `q, categoryId, price=free\|paid, sort=newest\|rating\|price_asc\|price_desc, page, size` | `{content: CourseCard[], page, suggestions: CourseCard[]}` | - |
| `GET` | `/catalog/courses/{slugOrId}` | Optional Bearer | - | `CourseDetail` | `COURSE_NOT_FOUND` (404) |
| `GET` | `/catalog/courses/{slugOrId}/reviews` | Public | `page, size` | `Page<CatalogReview>` | `COURSE_NOT_FOUND` (404) |
| `GET` | `/catalog/courses/{slugOrId}/lessons/{lessonId}/preview` | Optional Bearer | - | `LessonContent` | `COURSE_NOT_FOUND`, `NOT_FOUND`, `LESSON_NOT_PREVIEWABLE` (403) |

- `CourseCard`: `{id, slug, title, thumbnailUrl, price, isFree, categoryId, categoryName, instructorName, averageRating|null, ratingCount, publishedAt}`
- `CourseDetail`: các field của `CourseCard` + `description, mainInstructor{id, fullName}, coInstructors[{id, fullName}], totalLessons, totalQuizzes, totalDurationSeconds, chapters[{id, title, lessons[{id, title, contentType, durationSeconds, isPreview}]}], viewer{owned, isInstructor}|null`
- `LessonContent`: `{id, courseId, title, contentType, videoUrl|null, articleContent|null, durationSeconds, prevLessonId|null, nextLessonId|null}`

### 2.4. Học tập & Chứng chỉ
| Method | Path | Auth | Body / Query | Response (`data`) | Mã lỗi chính |
|---|---|---|---|---|---|
| `POST` | `/courses/{courseId}/enrollments` | Bearer | - | `{enrollmentId, courseId}` (idempotent 200) | `COURSE_NOT_FOUND` (404), `OWN_COURSE` (422), `COURSE_NOT_FREE` (422) |
| `GET` | `/me/enrollments` | Bearer | `page, size` | `Page<Enrollment>` | `UNAUTHORIZED` |
| `GET` | `/learn/courses/{courseId}` | Bearer | - | `LearnRoom` | `UNAUTHORIZED`, `COURSE_NOT_FOUND`, `NOT_ENROLLED` (403) |
| `GET` | `/learn/lessons/{lessonId}` | Bearer | - | `LessonContent` + `completed` | `UNAUTHORIZED`, `NOT_FOUND`, `NOT_ENROLLED` (403) |
| `POST` | `/learn/lessons/{lessonId}/visit` | Bearer | - | `204 No Content` | `UNAUTHORIZED`, `NOT_FOUND`, `NOT_ENROLLED` (403) |
| `PUT` | `/learn/lessons/{lessonId}/completion` | Bearer | `{completed}` | `{lessonId, completed, progressPercent, certificateCode|null, certificateJustIssued}` | `UNAUTHORIZED`, `NOT_FOUND`, `NOT_ENROLLED` (403) |
| `GET` | `/me/certificates` | Bearer | `page, size` | `Page<{code, courseId, courseTitle, issuedAt, verifyUrl}>` | `UNAUTHORIZED` |
| `GET` | `/me/certificates/{code}/pdf` | Bearer | - | Binary `application/pdf` (không bọc envelope) | `UNAUTHORIZED`, `NOT_FOUND` |

### 2.5. Q&A và Đánh giá
| Method | Path | Auth | Body / Query | Response (`data`) | Mã lỗi chính |
|---|---|---|---|---|---|
| `GET` | `/courses/{courseId}/questions` | Optional Bearer | `lessonId, mineOnly, unansweredOnly, q, page, size` | Spring `Page<QuestionSummaryResponse>` | `NOT_FOUND` |
| `GET` | `/questions/{questionId}` | Public | - | `QuestionThreadResponse` | `NOT_FOUND` |
| `POST` | `/courses/{courseId}/questions` | Bearer | `{lessonId?, title, content}` | `QuestionSummaryResponse` | `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND` |
| `PUT`/`PATCH` | `/questions/{questionId}` | Bearer | `{title?, content?}` | `QuestionThreadResponse` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` |
| `DELETE` | `/questions/{questionId}` | Bearer | - | `{message}` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |
| `POST` | `/questions/{questionId}/answers` | Bearer | `{content}` | `AnswerResponse` | `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND` |
| `PUT`/`PATCH` | `/answers/{answerId}` | Bearer | `{content}` | `AnswerResponse` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` |
| `DELETE` | `/answers/{answerId}` | Bearer | - | `{message}` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |
| `POST`/`PUT`/`PATCH` | `/questions/{questionId}/resolve` | Bearer | `{resolved?: boolean}` | `QuestionSummaryResponse` | `UNAUTHORIZED`, `NOT_FOUND` |
| `POST` | `/courses/{courseId}/reviews` | Bearer (Student) | `{rating, comment}` | `Review` | `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST` |
| `PUT` | `/reviews/{id}` | Bearer | `Review` | `204 No Content` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |
| `DELETE` | `/reviews/{id}` | Bearer | - | `204 No Content` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |

### 2.6. Kênh giảng viên & Payout (`/instructor`, `/me/earnings`, `/me/payout-account`, `/me/withdrawals`)
| Method | Path | Auth | Body / Query | Response (`data`) | Mã lỗi chính |
|---|---|---|---|---|---|
| `GET` | `/instructor/overview` | Instructor/Admin | - | `{totals, money, series30d, unansweredQuestions, pendingInvitations, recentReviews}` | `UNAUTHORIZED`, `FORBIDDEN` |
| `GET` | `/instructor/courses` | Instructor/Admin | - | `[{courseId, title, thumbnailUrl, status, role, shareBps, students, averageRating|null, ratingCount, netEarnings}]` | `UNAUTHORIZED`, `FORBIDDEN` |
| `GET` | `/instructor/courses/{courseId}/students` | Instructor/Admin | `page, size` | `Page<StudentRosterItem>` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |
| `GET` | `/instructor/questions` | Instructor/Admin | `courseId?, status=unanswered\|all, page, size` | `Page<QuestionSummaryResponse>` | `UNAUTHORIZED`, `FORBIDDEN` |
| `GET` | `/instructor/invitations` | Instructor/Admin | - | `CoInstructorInvitation[]` | `UNAUTHORIZED`, `FORBIDDEN` |
| `POST` | `/instructor/invitations/{id}/accept` | Instructor/Admin | - | `{invitation, message}` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |
| `POST` | `/instructor/invitations/{id}/decline` | Instructor/Admin | - | `{invitation, message}` | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` |
| `GET` | `/me/earnings/summary` | Bearer | - | `{hasEarnings, totalEarned, pendingBalance, inWithdrawal, withdrawn, availableBalance, minWithdrawal, holdDays, nextMaturityAt|null, maxWithdrawalsPerMonth, withdrawalsUsedThisMonth, canWithdrawThisMonth, nextWithdrawalAt|null}` | `UNAUTHORIZED` |
| `GET` | `/me/earnings/monthly` | Bearer | `year?` | `[{month, amount, matured}]` | `UNAUTHORIZED` |
| `GET` | `/me/earnings/courses` | Bearer | - | `[{courseId, courseTitle, role, amount}]` | `UNAUTHORIZED` |
| `GET` | `/me/earnings/entries` | Bearer | `courseId?, month?, page, size` | `Page<{id, orderCode, courseId, courseTitle, role, unitPrice, platformFeeBps, shareBps, amount, earnedAt, maturesAt, matured}>` | `UNAUTHORIZED` |
| `GET` | `/me/payout-account` | Bearer | - | `PayoutAccountDto` (chỉ hiện 4 số cuối) | `UNAUTHORIZED` |
| `PUT` | `/me/payout-account` | Bearer | `{bankName, accountNumber, accountHolder, currentPassword}` | `PayoutAccountDto` | `UNAUTHORIZED`, `VALIDATION_ERROR`, `CURRENT_PASSWORD_INCORRECT` |
| `GET` | `/me/withdrawals` | Bearer | `page, size` | `Page<WithdrawalResponseDto>` | `UNAUTHORIZED` |
| `POST` | `/me/withdrawals` | Bearer | `{amount}` | `WithdrawalResponseDto` | `PAYOUT_ACCOUNT_REQUIRED`, `WITHDRAWAL_BELOW_MINIMUM`, `WITHDRAWAL_EXCEEDS_BALANCE`, `WITHDRAWAL_ALREADY_OPEN` (409), `WITHDRAWAL_MONTHLY_LIMIT_REACHED` (409) |
| `POST` | `/me/withdrawals/{id}/cancel` | Bearer | - | `204 No Content` | `NOT_FOUND`, `CANNOT_CANCEL` (409) |
