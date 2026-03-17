/**
 * HappyChatKit – preset entry.
 * Exports default protocol + renderer (HappyChatProvider, useHappyChat, HappyChatMessageFlow, MarkdownRenderer).
 * Requires: react, react-dom, antd, @ant-design/icons, @ant-design/x, react-markdown, and related deps.
 */

export { happyChatKit } from './protocol/Provider';
export { useHappyChat } from './protocol/hooks/useHappyChat';
export { default as HappyChatMessageFlow } from './renderer/HappyChatMessageFlow';
export { default as MarkdownRenderer } from './renderer/MarkdownRenderer/index';
export { default as AutoScrollToBottom } from './renderer/AutoScrollToBottom';

export type { ThinkingCollapseProps, TOCLocale } from './protocol/UIManager/built-in/TOC';
export { HEARTBEAT_DIRECTIVE } from './protocol/UIManager/implement/Heartbeat';

export type { HappyMessage, CoreChatProps } from './core/types';
export { HappyChatProvider } from './core/components/Provider';
