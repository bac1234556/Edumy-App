// Shared QA Test Harness for Edumy Mobile (Edumy-App) — Pure Node.js v24 + Ajv
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const QA_ROOT = path.resolve(__dirname, '..');
export const APP_ROOT = path.resolve(QA_ROOT, '../..');
export const EVIDENCE_DIR = path.join(QA_ROOT, 'evidence');
export const EXEC_LOG_CSV = path.join(QA_ROOT, 'EDU-TEL-M-001_Execution_Log.csv');
export const WEB_STATE_FILE = path.resolve(APP_ROOT, '../Edumy-main/docs/testing/web/scripts/qa_env_state.json');

export const API_V1 = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api/v1';
export const API_ROOT = API_V1.replace(/\/api\/v1\/?$/, '');
export const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE_URL || 'http://localhost:3002';
export const MAILPIT_BASE = process.env.QA_MAILPIT_BASE || 'http://localhost:8026';

export const COMMIT_PAIR = process.env.QA_COMMIT_PAIR || 'Edumy-App@6cf1e9e / Edumy-main@260de6b';
export const CURRENT_CYCLE = process.env.QA_CYCLE || 'C1';

// Ephemeral test-only credentials (never written unmasked to evidence or docs)
export const QA_PASS = process.env.QA_TEST_PASSWORD || 'QaTest@2026!';
export const SEED_ADMIN_PASS = process.env.QA_SEED_ADMIN_PASS || 'Admin@123';
export const SEPAY_API_KEY = process.env.QA_SEPAY_KEY || 'edumy_sepay_webhook_secret_key_2026';

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

export function nowHcmIso() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}+07:00`;
}

export function sanitizeSecrets(obj) {
  const secretKeys = /password|token|secret|apikey|authorization|cookie|hash|resettoken|accountnumber$/i;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj
      .replaceAll(QA_PASS, '***')
      .replaceAll(SEED_ADMIN_PASS, '***')
      .replaceAll(SEPAY_API_KEY, '***')
      .replace(/998877665544/g, '••••••••5544')
      .replace(/123456789012/g, '••••••••9012')
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer ***')
      .replace(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, '***JWT***');
  }
  if (Array.isArray(obj)) return obj.map(sanitizeSecrets);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (secretKeys.test(k) && typeof v === 'string' && v.length > 0) {
        out[k] = '***';
      } else {
        out[k] = sanitizeSecrets(v);
      }
    }
    return out;
  }
  return obj;
}

export function loadSeedState() {
  return JSON.parse(fs.readFileSync(WEB_STATE_FILE, 'utf8'));
}

export async function apiV1(method, endpoint, { token, body, headers = {}, rawResponse = false } = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_V1}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const reqHeaders = { Accept: 'application/json', ...headers };
  if (token) reqHeaders.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined && body !== null) {
    reqHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const started = performance.now();
  const res = await fetch(url, { method, headers: reqHeaders, body: payload });
  const durationMs = Number((performance.now() - started).toFixed(2));
  if (rawResponse) {
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), buffer: buf, durationMs };
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { rawText: text }; }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: json,
    durationMs
  };
}

export async function mobileLogin(email, password = QA_PASS) {
  const res = await apiV1('POST', '/auth/mobile/login', { body: { email, password } });
  return {
    status: res.status,
    body: res.body,
    accessToken: res.body?.data?.accessToken || null,
    refreshToken: res.body?.data?.refreshToken || null,
  };
}

function csvEscape(val) {
  const s = sanitizeSecrets(String(val ?? '')).replace(/\r?\n/g, ' ');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function recordMobileRun({
  runNumber,
  cycle = CURRENT_CYCLE,
  tcId,
  module,
  type,
  priority,
  platform,
  status,
  actual,
  defectId = '',
  environment = 'Node.js v24.16.0 / Expo Web Chrome 157 / edumy-test',
  note = '',
  evidenceData = {}
}) {
  const runId = `RUN-M-${cycle}-${String(runNumber).padStart(4, '0')}`;
  const evFile = `${runId}_${tcId}.json`;
  const evRel = `evidence/${evFile}`;
  const ts = nowHcmIso();

  const fullEvidence = sanitizeSecrets({
    runId,
    cycle,
    tcId,
    module,
    type,
    priority,
    platform,
    status,
    actual,
    defectId,
    commit: COMMIT_PAIR,
    environment,
    timestamp: ts,
    note,
    ...evidenceData
  });

  fs.writeFileSync(path.join(EVIDENCE_DIR, evFile), JSON.stringify(fullEvidence, null, 2), 'utf8');

  const row = [
    runId, cycle, tcId, module, type, priority, platform,
    status, actual, defectId, evRel,
    COMMIT_PAIR, environment, ts, 'QA Lead', note
  ].map(csvEscape).join(',') + '\n';

  fs.appendFileSync(EXEC_LOG_CSV, row, 'utf8');
  console.log(`[${runId}] ${tcId} (${platform}) => ${status}: ${actual.slice(0, 110)}`);
  return runId;
}
