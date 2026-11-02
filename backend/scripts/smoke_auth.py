"""Exercise real HTTP + database auth without logging credentials or tokens."""
import json
import sys
import urllib.error
import urllib.request
import uuid

base = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8080/api'


def request(path, expected, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status, result = response.status, json.load(response)
    except urllib.error.HTTPError as error:
        status, result = error.code, json.load(error)
    if status != expected:
        raise AssertionError(f'{path}: expected HTTP {expected}, got {status}')
    if result.get('success') != (expected < 400):
        raise AssertionError(f'{path}: invalid success envelope')
    return result.get('data')


assert request('/health', 200)['status'] == 'UP'
for role in ['STUDENT', 'INSTRUCTOR']:
    email = 'smoke-' + uuid.uuid4().hex + '@example.com'
    password = 'SmokePass123!'
    payload = {'email': email, 'password': password, 'fullName': 'Smoke User', 'role': role}
    request('/auth/register', 201, payload)
    session = request('/auth/login', 200, {'email': email, 'password': password})
    profile = request('/users/me', 200, token=session['accessToken'])
    assert profile['role'] == role and profile['email'] == email
    assert 'passwordHash' not in profile
    request('/admin/users', 403, token=session['accessToken'])
    request('/auth/register', 409, payload)
    request('/auth/login', 401, {'email': email, 'password': 'WrongPass123!'})
    refreshed = request('/auth/refresh', 200, {'refreshToken': session['refreshToken']})
    request('/auth/refresh', 401, {'refreshToken': session['refreshToken']})
    request('/auth/logout', 200, {'refreshToken': refreshed['refreshToken']})
    request('/auth/refresh', 401, {'refreshToken': refreshed['refreshToken']})
    print(role + ': register/login/me/permissions/validation/refresh/logout PASS')
