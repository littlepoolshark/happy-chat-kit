# HappyChatKit

Extensible SSE (Server-Sent Events) chat rendering framework for React. Use **core** to build your own protocol and renderer, or use **preset** for a ready-made chat UI.

## Two entry points

- **`happy-chat-kit`** — Core only: types, `ChatKit`, `HappyChatProvider`, `useHappyChatCore`, utils. Implement your own protocol and renderer (see `src/protocol` and `src/renderer` in this repo).
- **`happy-chat-kit/preset`** — Core + default protocol + default renderer: `HappyChatProvider`, `useHappyChat`, `HappyChatMessageFlow`, `MarkdownRenderer`. Uses [@ant-design/x](https://www.npmjs.com/package/@ant-design/x), antd, and react-markdown.

## Install

```bash
pnpm add happy-chat-kit
# When using preset, also install:
pnpm add antd @ant-design/icons @ant-design/x react-markdown
```

## Quick start (preset)

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

## Quick start (core only)

```ts
import { ChatKit, useHappyChatCore, HappyMessage } from 'happy-chat-kit';
// Implement your own Provider, SSE handling, and message flow UI.
// See src/protocol and src/renderer in this repo for reference.
```

## Features

- **Layered**: core / protocol / renderer separation.
- **Plugin-style**: UIManager for SSE event handling; remark-directive for custom components in markdown.
- **Preset**: Optional default UI and protocol for fast integration.

## Examples

Clone this repo and run the example app:

```bash
cd examples && pnpm install && pnpm dev
```

## Docs

- [Architecture overview](docs/architecture-overview-v2.md)
- [Features](docs/features.md)

## License

MIT
