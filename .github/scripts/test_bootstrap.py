"""Exercise scaffold detection in disposable directories; never touch application files."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / '.github/scripts/check-project.sh'


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def write(self, path, data=''):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(data)
        return target

    def check(self, project):
        (self.root / 'output').unlink(missing_ok=True)
        result = subprocess.run(
            ['bash', str(SCRIPT), project], cwd=self.root,
            env={**os.environ, 'GITHUB_OUTPUT': str(self.root / 'output'),
                 'GITHUB_STEP_SUMMARY': str(self.root / 'summary')},
            text=True, capture_output=True)
        output = self.root / 'output'
        return result, output.read_text() if output.exists() else ''

    def mobile(self, package=None):
        self.write('mobile/package.json', json.dumps(
            package if package is not None else {'scripts': {'lint': 'eslint .'}}))
        self.write('mobile/package-lock.json', '{}')

    def test_absent_manifests_explicitly_skip(self):
        for project in ('backend', 'mobile'):
            with self.subTest(project=project):
                (self.root / 'output').unlink(missing_ok=True)
                result, output = self.check(project)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn('SKIPPED:', result.stdout)
                self.assertEqual(output, 'present=false\n')
                self.assertIn('not executed', (self.root / 'summary').read_text())

    def test_present_backend_requires_wrapper(self):
        self.write('backend/pom.xml', '<project/>')
        result, _ = self.check('backend')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Issue #3', result.stderr)

    def test_backend_wrapper_must_be_executable_and_configured(self):
        self.write('backend/pom.xml', '<project/>')
        wrapper = self.write('backend/mvnw', '#!/bin/sh\nexit 0\n')
        self.write('backend/.mvn/wrapper/maven-wrapper.properties', 'distributionUrl=example')
        self.assertNotEqual(self.check('backend')[0].returncode, 0)
        wrapper.chmod(0o755)
        result, output = self.check('backend')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'present=true\n')

    def test_mobile_requires_lockfile(self):
        self.mobile()
        (self.root / 'mobile/package-lock.json').unlink()
        result, _ = self.check('mobile')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('package-lock.json', result.stderr)

    def test_mobile_requires_lint(self):
        self.mobile({'scripts': {}})
        result, _ = self.check('mobile')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('scripts.lint', result.stderr)

    def test_mobile_npm_ready(self):
        self.mobile()
        result, output = self.check('mobile')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'present=true\n')

    def test_conflicting_lockfile_fails(self):
        self.mobile()
        self.write('mobile/yarn.lock')
        self.assertNotEqual(self.check('mobile')[0].returncode, 0)

    def test_other_package_manager_requires_ci_update(self):
        self.mobile({'packageManager': 'pnpm@10', 'scripts': {'lint': 'eslint .'}})
        self.assertNotEqual(self.check('mobile')[0].returncode, 0)

    def test_invalid_package_json_fails(self):
        self.mobile()
        self.write('mobile/package.json', '{broken')
        self.assertNotEqual(self.check('mobile')[0].returncode, 0)

    def test_invalid_argument_fails(self):
        self.assertEqual(self.check('unknown')[0].returncode, 2)

    def test_repository_configuration_present(self):
        for name in ('backend', 'mobile', 'docs', '.github'):
            self.assertTrue((ROOT / name).is_dir(), name)
        for name in ('README.md', '.gitignore', 'docs/GITHUB_WORKFLOW.md',
                     '.github/pull_request_template.md', '.github/workflows/ci.yml'):
            self.assertTrue((ROOT / name).is_file(), name)
        for name in ('feature', 'bug', 'chore'):
            self.assertTrue((ROOT / f'.github/ISSUE_TEMPLATE/{name}.yml').is_file())


if __name__ == '__main__':
    unittest.main()
