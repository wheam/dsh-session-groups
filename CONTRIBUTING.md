# Contributing

Thanks for helping improve `dsh-session-groups`.

## Before opening an issue

- Confirm the problem on DeepSeek Harness `0.1.1-rc.2` when possible.
- Search existing issues for the same symptom.
- Include the DSH version, operating system, installation source, and reproduction steps.
- Do not post credentials, private conversation content, or Session data.

Security vulnerabilities should be reported privately as described in [SECURITY.md](SECURITY.md), not through a public issue.

## Development setup

Requirements: Node.js 22+ and the `pnpm` version declared in `package.json`.

```bash
git clone https://github.com/wheam/dsh-session-groups.git
cd dsh-session-groups
pnpm install
pnpm run check
```

`pnpm run check` builds both Host and Web artifacts, typechecks the client, and runs the test suite. The generated files under `packages/dsh-session-groups/lib` are committed so GitHub installs work without executing a build script; include refreshed artifacts when source changes affect them.

For a local DSH smoke test:

```bash
dsh plugin --profile web add "link:$PWD/packages/dsh-session-groups"
dsh web
```

## Pull requests

1. Keep each change focused and explain the user-visible reason for it.
2. Add or update tests for behavior changes.
3. Run `pnpm run check` and confirm the generated runtime artifacts are current.
4. Update both English and Chinese documentation when installation or behavior changes.
5. Call out compatibility assumptions because DSH is still in developer preview.

By contributing, you agree that your contribution will be licensed under the project's MIT License.
