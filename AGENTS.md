# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a bootstrap repository: it contains no application source, test suite, package manifest, or build configuration. Keep the root reserved for repository-level files such as `README.md`, configuration, and this guide. When implementation begins, use a clear, conventional layout:

- `src/` for production code, organized by feature or domain.
- `tests/` for automated tests, mirroring the relevant `src/` paths.
- `assets/` for static, non-generated resources.
- `docs/` for architecture notes and operational documentation.

Do not commit generated output, local caches, secrets, or dependency directories. Add appropriate ignore rules with the selected toolchain.

## Build, Test, and Development Commands

No build, run, lint, or test command is configured yet. Do not invent scripts or document commands until their configuration is committed. Once a toolchain is chosen, expose the normal workflow through its manifest or build file and document it in `README.md`. For example, a Node project should provide `npm run dev`, `npm test`, and `npm run lint`; a Python project should provide equivalent documented commands.

Run the relevant formatter, linter, and test suite before opening a pull request. Keep command definitions reproducible and avoid machine-specific paths.

## Coding Style & Naming Conventions

Follow the formatter and linter configured for the chosen language; do not hand-format against them. Use 2 spaces for JSON, YAML, and Markdown indentation unless a language formatter establishes another rule. Name files and directories consistently within a module: use `kebab-case` for web-facing files and the language's conventional casing for source symbols. Prefer descriptive names over abbreviations.

## Testing Guidelines

Add tests with every behavior change. Place test files under `tests/` or beside source only if the selected framework makes that the project convention. Name tests after the unit and expected behavior, for example `auth-service.test.ts` or `test_login_rejects_expired_token`. Cover happy paths, validation failures, and regressions.

## Commit & Pull Request Guidelines

There is no commit history yet, so no established message convention exists. Use concise, imperative commits such as `Add login validation` or `Fix empty-state rendering`. Keep each commit focused. Pull requests should explain the change, list validation performed, link related issues, and include screenshots for visible UI changes.
