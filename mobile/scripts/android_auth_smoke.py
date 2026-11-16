"""Installable-APK login smoke test on an Android emulator (stdlib + adb)."""
import json
import os
import pathlib
import re
import subprocess
import time
import urllib.request
import uuid
import xml.etree.ElementTree as ET

OUT = pathlib.Path(os.environ.get('SMOKE_OUTPUT', 'android-smoke'))
OUT.mkdir(parents=True, exist_ok=True)

def adb(*args):
    return subprocess.check_output(['adb', *args], timeout=30)

def tree():
    adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
    return ET.fromstring(adb('exec-out', 'cat', '/sdcard/window.xml'))

def wait_node(predicate, timeout=60):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            root = tree()
            (OUT / 'last-ui.xml').write_bytes(ET.tostring(root))
            for node in root.iter('node'):
                if predicate(node.attrib):
                    return node.attrib
        except (subprocess.SubprocessError, ET.ParseError):
            pass
        time.sleep(2)
    print((OUT / 'last-ui.xml').read_text(), flush=True)
    raise AssertionError('Expected Android UI not found; see last-ui.xml')

def tap(node):
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', node['bounds']))
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))

def field(label, value):
    is_field = lambda a: a.get('class') == 'android.widget.EditText' and a.get('content-desc') == label
    tap(wait_node(is_field))
    # Wait for focus and keyboard-driven layout changes before injecting keys.
    wait_node(lambda a: is_field(a) and a.get('focused') == 'true')
    for character in value:
        adb('shell', 'input', 'text', character)
        time.sleep(0.12)
    wait_node(lambda a: is_field(a) and (a.get('text') == value if label == 'Email'
              else len(a.get('text', '')) == len(value)))
    adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
    # Take a fresh, settled tree before choosing the next field's bounds.
    tree()

email = 'android-' + uuid.uuid4().hex[:12] + '@example.com'
password = 'Preview123456'
request = urllib.request.Request('http://127.0.0.1:8080/api/auth/register',
    data=json.dumps({'email': email, 'password': password, 'fullName': 'Android Smoke', 'role': 'STUDENT'}).encode(),
    headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(request, timeout=20) as response:
    assert response.status == 201
try:
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'edumy://login', 'com.edumy.app')
    field('Email', email)
    field('Mật khẩu', password)
    tap(wait_node(lambda a: a.get('resource-id', '').endswith('auth-submit')))
    wait_node(lambda a: 'Góc học viên' in a.get('text', '') or 'Góc học viên' in a.get('content-desc', ''))
    # A force-stop/relaunch must restore the secure session, not ask for login again.
    adb('shell', 'am', 'force-stop', 'com.edumy.app')
    adb('shell', 'monkey', '-p', 'com.edumy.app', '1')
    wait_node(lambda a: 'Góc học viên' in a.get('text', '') or 'Góc học viên' in a.get('content-desc', ''))
    (OUT / 'result.json').write_text(json.dumps({'login': 'passed', 'sessionRestore': 'passed',
        'androidApi': adb('shell', 'getprop', 'ro.build.version.sdk').decode().strip()}))
finally:
    (OUT / 'screen.png').write_bytes(adb('exec-out', 'screencap', '-p'))
    (OUT / 'logcat.txt').write_bytes(adb('logcat', '-d', '-t', '1000'))

