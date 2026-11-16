"""Validate demo accounts, refreshed sessions, profile persistence and seeded curriculum."""
import json
import urllib.request

BASE = "http://127.0.0.1:8080/api/v1"

def request(path, data=None, token=None, method=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=None if data is None else json.dumps(data).encode(), headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as response:
        body = json.load(response)
        assert body["success"], body
        return body["data"]

for role in ("student", "instructor", "admin"):
    auth = request("/auth/login", {"email": role + "@edumy.com", "password": "Admin@123456"})
    assert auth["user"]["role"] == role.upper()
    refreshed = request("/auth/refresh-token", {"refreshToken": auth["refreshToken"]})
    token = refreshed["accessToken"]
    me = request("/users/me", token=token)
    changed = request("/users/me", {"fullName": me["fullName"], "bio": "W8 demo profile", "avatarUrl": me.get("avatarUrl")}, token, "PUT")
    assert changed["bio"] == "W8 demo profile"
    assert request("/users/me", token=token)["bio"] == changed["bio"]
    request("/users/me", {"fullName": me["fullName"], "bio": me.get("bio"), "avatarUrl": me.get("avatarUrl")}, token, "PUT")

courses = request("/courses?page=0&size=100")["content"]
assert len(courses) >= 10, len(courses)
for course in courses:
    detail = request("/courses/" + str(course["id"]))
    assert detail["thumbnailUrl"]
    assert detail["curriculum"]
    lessons = [lesson for section in detail["curriculum"] for lesson in section["lessons"]]
    assert len(lessons) >= 2
    assert any(lesson["isPreview"] and lesson.get("videoUrl") for lesson in lessons)
    assert all(not lesson.get("videoUrl") for lesson in lessons if not lesson["isPreview"])
print("W8 smoke passed: three demo roles, refresh rotation, profile update/read, >=10 courses")
