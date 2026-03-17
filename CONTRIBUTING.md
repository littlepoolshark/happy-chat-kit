# Contributing to HappyChatKit

Thank you for your interest in contributing.

## Development

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Build the package:

   ```bash
   pnpm build
   ```

3. Run the example app (from repo root):

   ```bash
   cd examples && pnpm install && pnpm dev
   ```

## Code style

- TypeScript strict mode.
- Prefer named exports for library code.
- Keep core free of UI framework specifics where possible; protocol and renderer can depend on antd / @ant-design/x.

## Pull requests

- Open an issue first to discuss larger changes.
- Keep PRs focused; link related issues.
- Ensure `pnpm build` passes.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
