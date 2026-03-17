# HappyChatKit Architecture

## Overview

HappyChatKit is an **extensible SSE (Server-Sent Events) chat rendering framework** for React. It builds on [Ant Design X](https://www.npmjs.com/package/@ant-design/x) and [react-markdown](https://github.com/remarkjs/react-markdown) with [remark-directive](https://github.com/remarkjs/remark-directive) for custom UI in markdown.

## Goals

1. **Layered**: Core / Protocol / Renderer separation.
2. **Plugin-style**: UIManager for SSE event handling.
3. **Component rendering**: remark-directive for custom components in markdown.
4. **Consistent state**: Unified state and error handling.
5. **Testable**: Clear boundaries for unit and integration tests.

## Two entry points

- **`happy-chat-kit`** — Core only: types, `ChatKit`, `HappyChatProvider`, `useHappyChatCore`, utils. Implement your own protocol and renderer (see `src/protocol` and `src/renderer` in this repo).
- **`happy-chat-kit/preset`** — Core + default protocol + default renderer: `HappyChatProvider`, `useHappyChat`, `HappyChatMessageFlow`, `MarkdownRenderer`.

## Layers

- **Core**: Types, ChatKit, Provider, hooks (useHappyChatCore, useInstances, useComponents), utils, ErrorBoundary.
- **Protocol**: SSE event dispatch, UIManager implementations (Answer, Heartbeat, TOC), useHappyChat.
- **Renderer**: MarkdownRenderer, HappyChatMessageFlow, ActionBar, AutoScrollToBottom.

## Reference implementation

The code in `src/protocol` and `src/renderer` is the reference implementation. Use it as a template when building your own protocol and renderer on top of core.
