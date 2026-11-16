# W8 Platform & Auth (#38, #39, #40)

## Local development

Run `docker compose up --build` from the repository root. Compose starts MySQL 8,
waits for health, builds the Java 21 backend and runs Flyway with the `demo` profile.
The API listens on port 8080. Subsequent starts preserve MySQL and avatar volumes;
Flyway applies each migration once. The demo migration is separate from production
migrations and is enabled only by the `demo` Spring profile. Do not enable it in production.

Demo accounts: `student@edumy.com`, `instructor@edumy.com`, `admin@edumy.com`.
Each uses the local demo password `Admin@123456` (stored as BCrypt). There are ten
published courses across six categories, each with a section, preview lesson and
locked lesson. The pre-existing `admin@edumy.vn` account remains available.

For mobile: `cd mobile && npm ci && npm start`. Set `EXPO_PUBLIC_API_URL` to the API
base URL reachable by the device, ending in `/api/v1` (or the compatible `/api`).
The Android emulator default is `http://10.0.2.2:8080/api`. On a physical device,
configure forwarding or a reachable development host; Compose binds ports to loopback.

## Implemented flows

- `POST /api/v1/auth/refresh-token` rotates refresh credentials; `/refresh` remains
  compatible. Axios shares one pending refresh across concurrent 401s and retries once.
  Invalid refresh credentials clear SecureStore; temporary network failure preserves
  the session. Role layouts restrict Student, Instructor and Admin navigation.
- `GET/PUT /api/v1/users/me` returns `ApiResponse<UserResponse>`, validates the name,
  biography and avatar URL, and only edits the authenticated account. Email and role
  cannot be changed through this endpoint.
- `POST /api/v1/users/me/avatar` accepts multipart `file`, validates PNG/JPEG content,
  limits images to 2 MB and 4096 pixels per dimension, then re-encodes PNG under a
  random filename. Uploaded avatars are publicly readable; files persist in the
  Compose avatar volume. `app.avatar-directory` configures storage outside Compose.
  The Profile screen saves the returned URL and synchronizes name/avatar to shared
  session state and the role header. Image picking targets Android/iOS.

## Validation

From `backend`: `./mvnw -B verify`. With the demo API running, execute
`python3 scripts/smoke_auth.py --check-seeded-admin` and `python3 scripts/smoke_w8.py`.
The latter checks three role logins, refresh rotation, profile persistence and ten
courses with populated curricula and preview access rules.
From `mobile`: `npm run lint`, `npm test -- --runInBand`, and
`CI=1 EXPO_OFFLINE=1 npx expo export --platform android --max-workers 2`.
CI also runs the demo migration and HTTP smoke script against MySQL 8.

Android device/emulator interaction, remote CI success and independent PR approval
must be verified separately before their issue checklist entries are checked.
