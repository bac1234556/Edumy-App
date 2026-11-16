# API contract used by Edumy Mobile

Base: `{EXPO_PUBLIC_API_BASE_URL}` = `http(s)://<host>:8080/api/v1`. JSON camelCase. Times ISO-8601 UTC.
Money = integer VND. Paging: query `page` (0-based), `size` (default 20, max 100); response
`{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`.
Errors: RFC 9457 ProblemDetail `{type,title,status,detail,code,traceId,errors?:[{field,message}]}`.

Shapes below were read from the backend DTOs at commit `c964463`. **The generated OpenAPI is the final word**
(`/v3/api-docs`, backend `dev` profile). If anything here disagrees with OpenAPI → STOP and report it.

Legend: ✅ exists today · ⛔ NOT READY (needs a backend prompt first; do not call, do not mock unless a prompt says so).

---

## 1. Auth & profile

| | Method & path | Body | Success | Notes |
|---|---|---|---|---|
| ⛔ B01 | `POST /auth/mobile/register` | `{email, password, fullName}` | 201 `MobileTokens` | logs in (UC-G05) |
| ⛔ B01 | `POST /auth/mobile/login` | `{email, password}` | 200 `MobileTokens` | 401 `AUTH_INVALID_CREDENTIALS`, 403 `AUTH_ACCOUNT_LOCKED`, 429 `AUTH_LOGIN_TEMPORARILY_BLOCKED` |
| ⛔ B01 | `POST /auth/mobile/refresh` | `{refreshToken}` | 200 `MobileTokens` | rotates; 401 → session over |
| ⛔ B01 | `POST /auth/mobile/logout` | `{refreshToken}` | 204 | works with an expired access token |
| ✅ | `POST /auth/password/forgot` | `{email}` | 202 (same body always) | 429 `RATE_LIMITED` |
| ✅ | `POST /auth/email-verification/resend` | — (Bearer) | 202 sent · 204 already verified | 429 `TOKEN_RESEND_TOO_SOON` |
| ✅ | `GET /me` | — | 200 `{id,email,fullName,emailVerified,roles[],createdAt}` | roles: `student`,`instructor`,`admin` |
| ✅ | `PATCH /me` | `{fullName}` (≤100) | 200 same as GET /me | |
| ✅ | `PUT /me/password` | `{currentPassword,newPassword}` | 2xx | 422 `PASSWORD_INCORRECT`, `PASSWORD_SAME_AS_OLD`; other sessions end |

`MobileTokens` = `{accessToken, expiresAt, refreshToken, refreshExpiresAt}`.

## 2. Catalog (public; a bad token is ignored → anonymous answer)

| | Method & path | Success |
|---|---|---|
| ✅ | `GET /catalog/courses?q=&categoryId=&price=free\|paid&sort=newest\|rating\|price_asc\|price_desc&page=&size=` | 200 `{content: CourseCard[], page, suggestions: CourseCard[]}` |
| ✅ | `GET /catalog/categories` | 200 `[{id,name,slug}]` |
| ✅ | `GET /catalog/courses/{slug}` | 200 `CourseDetail` · 404 unknown / not public |
| ✅ | `GET /catalog/courses/{slug}/reviews?page=` | 200 paged `{id,rating,comment,reviewerName,createdAt,updatedAt}` |
| ✅ | `GET /catalog/courses/{slug}/lessons/{lessonId}/preview` | 200 `{id,courseSlug,courseTitle,chapterTitle,title,contentType,videoUrl,articleContent,durationSeconds}` |

`CourseCard` = `{id,slug,title,thumbnailUrl,price,isFree,categoryId,categoryName,instructorName,averageRating,ratingCount,publishedAt}`.
`CourseDetail` = `{id,slug,title,description,thumbnailUrl,price,isFree,status,categoryId,categoryName,
mainInstructor{id,fullName},coInstructors[{id,fullName}],averageRating,ratingCount,totalLessons,totalDurationSeconds,
publishedAt,updatedAt,chapters[{id,title,lessons[{id,title,contentType,durationSeconds,isPreview}]}],
viewer{owned,inCart,isInstructor}|null}`.

## 3. Cart & orders (no payment endpoints — see "Never call")

| | Method & path | Body | Success |
|---|---|---|---|
| ✅ | `GET /cart` | — | 200 `{items[{courseId,title,slug,thumbnailUrl,price,isFree,instructor{id,fullName},addedAt,purchasable,unavailableReason}],itemCount,purchasableCount,totalAmount}` |
| ✅ | `POST /cart/items` | `{courseId}` | 201 cart · 404 not sellable · 422 `CART_COURSE_FREE`/`CART_OWN_COURSE` · 409 `CART_COURSE_ALREADY_OWNED`/`CART_ITEM_DUPLICATE` |
| ✅ | `DELETE /cart/items/{courseId}` | — | 204 · 404 |
| ✅ | `GET /orders?page=` | — | 200 paged `{orderCode,totalAmount,status,cancelReason,itemCount,createdAt,paidAt,cancelledAt}` |
| ✅ | `GET /orders/{orderCode}` | — | 200 `{orderCode,totalAmount,status,cancelReason,createdAt,paidAt,cancelledAt,items[{courseId,title,slug,thumbnailUrl,unitPrice}],payments[{transactionRef,amount,status,qrExpiresAt,confirmedAt,createdAt}]}` |

Order status: `pending`, `paid`, `cancelled` (cancelReason `user`, `replaced`, `expired`).

## 4. Learning

| | Method & path | Body | Success |
|---|---|---|---|
| ✅ | `POST /courses/{courseId}/enrollments` | — | 201 new / 200 existing `Enrollment` · 422 `ENROLLMENT_COURSE_NOT_FREE`, `ENROLLMENT_OWN_COURSE` |
| ✅ | `GET /me/enrollments?page=` | — | 200 paged `Enrollment` |
| ✅ | `GET /learn/courses/{courseId}` | — | 200 `{courseId,title,enrolled,progress{completedLessons,totalLessons,percent}\|null,chapters[{id,title,lessons[{id,title,contentType,durationSeconds,preview,completed}]}]}` |
| ✅ | `GET /learn/lessons/{lessonId}` | — | 200 `{id,courseId,chapterId,title,contentType,durationSeconds,videoUrl,articleContent,completed\|null}` |
| ✅ | `POST /learn/lessons/{lessonId}/visit` | — | 204 (no-op for instructors/admins) |
| ✅ | `PUT /learn/lessons/{lessonId}/completion` | `{completed}` | 200 `{lessonId,completed,completedAt,completedLessons,totalLessons,progressPercent,certificateCode,certificateIssued}` |

`Enrollment` = `{id,course{id,title,slug,thumbnailUrl,published},enrollSource,enrolledAt,completedLessons,totalLessons,progressPercent,lastAccessedLessonId,lastAccessedAt,certificateCode}`.
No relation: published course → 403 `ENROLLMENT_REQUIRED`; otherwise 404.

## 5. Q&A, reviews, certificates

| | Method & path | Body | Success |
|---|---|---|---|
| ✅ | `GET /courses/{courseId}/questions?page=` | — | 200 paged `{id,courseId,courseTitle,lessonId,title,resolved,status,asker{id,fullName},answerCount,instructorReplied,createdAt}` |
| ✅ | `GET /questions/{id}` | — | 200 thread `{id,courseId,lessonId,title,content,resolved,status,asker,instructorReplied,createdAt,updatedAt,answers[{id,author{id,fullName},authorType,content,status,createdAt,updatedAt}]}` |
| ✅ | `POST /courses/{courseId}/questions` | `{title≤200, content≤5000, lessonId?}` | 201 thread · 422 `LESSON_COURSE_MISMATCH` · 409 `QA_QUESTION_DUPLICATE` |
| ✅ | `PATCH /questions/{id}` · `DELETE /questions/{id}` | `{title,content}` | 200 thread · 204 |
| ✅ | `POST /questions/{id}/resolve` | `{resolved}` | 200 thread |
| ✅ | `POST /questions/{id}/answers` · `PATCH /answers/{id}` · `DELETE /answers/{id}` | `{content≤5000}` | 201/200 answer · 204 |
| ✅ | `POST /courses/{courseId}/reviews` | `{rating 1–5, comment≤2000}` | 201 new / 200 updated `{id,courseId,rating,comment,status,createdAt,updatedAt}` · 409 `REVIEW_HIDDEN_BY_ADMIN` |
| ✅ | `PATCH /reviews/{id}` · `DELETE /reviews/{id}` | `{rating,comment}` | 200 · 204 (withdrawn) |
| ✅ | `GET /me/certificates?page=` | — | 200 paged `{id,certificateCode,enrollmentId,courseId,courseTitle,studentName,instructorName,issuedAt}` |
| ✅ | `GET /me/certificates/{code}/pdf` | — | 200 `application/pdf` (Bearer required) · 500 `CERTIFICATE_PDF_FAILED` |

Known gap **G-01**: there is no endpoint "my review of course X". Creating/updating works through `POST /courses/{id}/reviews`
(AC-14), but pre-filling the form or withdrawing needs the review id. If a prompt needs it → STOP and ask for a backend change.

## 6. Instructor money mode (phân hệ 06) — ⛔ NOT READY until backend prompts B03 and B04

| | Method & path | Body | Success |
|---|---|---|---|
| ⛔ | `GET /me/earnings/summary` | — | 200 `{hasEarnings,totalEarned,pendingBalance,inWithdrawal,withdrawn,availableBalance,minWithdrawal,maturityPolicy:"monthly"\|"immediate"}` |
| ⛔ | `GET /me/earnings/monthly?year=` | — | 200 `[{month:"2026-11",amount,matured}]` |
| ⛔ | `GET /me/earnings/courses` | — | 200 `[{courseId,courseTitle,role:"main"\|"co",amount}]` |
| ⛔ | `GET /me/earnings/entries?courseId=&month=&page=` | — | 200 paged `{id,orderCode,courseId,courseTitle,role,unitPrice,platformFeeBps,shareBps,amount,earnedAt,maturesAt}` |
| ⛔ | `GET /me/payout-account` | — | 200 `{bankName,accountNumberLast4,accountHolder,updatedAt}` · 404 none |
| ⛔ | `PUT /me/payout-account` | `{bankName,accountNumber,accountHolder,currentPassword}` | 200 masked · 422 `PASSWORD_INCORRECT` |
| ⛔ | `POST /me/withdrawals` | `{amount}` | 201 `Withdrawal` · 422 `WITHDRAWAL_BELOW_MINIMUM`/`WITHDRAWAL_EXCEEDS_BALANCE`/`PAYOUT_ACCOUNT_REQUIRED` · 409 `WITHDRAWAL_ALREADY_OPEN` |
| ⛔ | `GET /me/withdrawals?page=` | — | 200 paged `Withdrawal` |
| ⛔ | `POST /me/withdrawals/{id}/cancel` | — | 200 `Withdrawal` · 409 not `requested` |

`Withdrawal` = `{id,amount,status:"requested"|"paid"|"rejected"|"cancelled",bankName,accountNumberLast4,accountHolder,
transferReference,rejectReason,createdAt,handledAt,cancelledAt}`.
These shapes are the **proposal** in EDU-MOB-SRS-001 §8; after B03/B04 the backend OpenAPI wins — regenerate types.

## 7. Website links (UC-M01) — `src/lib/web-links.ts`, base `{EXPO_PUBLIC_WEB_BASE_URL}`
| Purpose | Path |
|---|---|
| Course page | `/courses/{slug}` |
| Order page | `/orders/{orderCode}` |
| Certificate verification | `/certificates/{code}` |
| Cart | `/cart` — **to confirm (Q-M02)**; keep it a single constant |

## Never call from the app
`POST /orders` · `POST /orders/{code}/cancel` · `POST /orders/{code}/payments` · `GET /orders/{code}/payments/current` ·
`/webhooks/**` · `/admin/**` · authoring endpoints under `/instructor/**` and `/courses/{id}/invitations/**` ·
`/me/instructor-registration` · cookie auth `/auth/login|register|refresh|logout` · `/auth/password/reset` and
`/auth/email-verification/confirm` (done on the website through the email link).
