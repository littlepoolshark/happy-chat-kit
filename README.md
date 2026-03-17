# HappyChatKit

[![CI](https://github.com/littlepoolshark/happy-chat-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/littlepoolshark/happy-chat-kit/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/happy-chat-kit.svg)](https://www.npmjs.com/package/happy-chat-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Extensible SSE (Server-Sent Events) chat rendering framework for React. Use **core** to build your own protocol and renderer, or use **preset** for a ready-made chat UI.

## Features

- **Layered Architecture**: core / protocol / renderer separation for maximum flexibility
- **Plugin-style**: UIManager for SSE event handling; remark-directive for custom components in markdown
- **Preset UI**: Optional default UI with Ant Design X integration for fast setup
- **TypeScript**: Full TypeScript support with strict mode
- **Streaming**: Built-in support for SSE streaming responses
- **Extensible**: Easy to extend with custom protocols and renderers

## Two Entry Points

| Entry | Description |
|-------|-------------|
| `happy-chat-kit` | Core only: types, `ChatKit`, `HappyChatProvider`, `useHappyChatCore`, utils. Implement your own protocol and renderer. |
| `happy-chat-kit/preset` | Core + default protocol + default renderer: `HappyChatProvider`, `useHappyChat`, `HappyChatMessageFlow`, `MarkdownRenderer`. Uses [@ant-design/x](https://www.npmjs.com/package/@ant-design/x), antd, and react-markdown. |

## Installation

```bash
# Using pnpm (recommended)
pnpm add happy-chat-kit

# Using npm
npm install happy-chat-kit

# Using yarn
yarn add happy-chat-kit
```

When using the preset, also install peer dependencies:

```bash
pnpm add antd @ant-design/icons @ant-design/x react-markdown
```

## Quick Start (Preset)

```tsx
import { HappyChatProvider, useHappyChat, HappyChatMessageFlow } from 'happy-chat-kit/preset';

function App() {
  return (
    <HappyChatProvider>
      <ChatPage />
    </HappyChatProvider>
  );
}

function ChatPage() {
  const { messages, request2Agent, isRequesting } = useHappyChat({
    request: (msg, ctrl) => fetch('/api/chat', { body: msg, signal: ctrl.signal }),
  });
  return (
    <HappyChatMessageFlow
      messages={messages}
      request2Agent={request2Agent}
      isRequesting={isRequesting}
    />
  );
}
```

## Quick Start (Core Only)

```ts
import { ChatKit, useHappyChatCore, HappyMessage } from 'happy-chat-kit';

// Implement your own Provider, SSE handling, and message flow UI.
// See src/protocol and src/renderer in this repo for reference.
```

## Examples

Clone this repo and run the example app:

```bash
pnpm install
cd examples && pnpm install && pnpm dev
```

## Documentation

- [Architecture Overview](docs/architecture-overview-v2.md) - Understanding the core concepts
- [Architecture Deep Dive](docs/architecture-deep-dive.md) - Detailed technical documentation
- [Features](docs/features.md) - Feature descriptions and usage

## Browser Support

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [HappyChatKit Contributors](LICENSE)
