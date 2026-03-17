/**
 * HappyChatKit – core entry.
 * Use this when you implement your own protocol and renderer.
 * For a ready-made chat UI, use `happy-chat-kit/preset`.
 */

export { ChatKit } from './core/class';
export {
  HappyChatProvider,
  HappyChatProviderProps,
  UIManagerContext,
  ErrorFallbackUIContext,
} from './core/components/Provider';
export { default as ErrorBoundary } from './core/components/ErrorBoundary';
export { AgentRequestContext, withMarkdownComponentProps } from './core/components/withMarkdownComponentProps';
export { useHappyChatCore, useInstances, useComponents } from './core/hooks';
export type { ChatUIManager } from './core/interface';
export {
  getInstance,
  preprocessMessage,
  UIManagerFactory,
  isReactComponentV2,
  safeJsonParse,
  isMobile,
  renderRemarkTextDirective,
  renderRemarkLeafDirective,
  renderRemarkContainerDirective,
} from './core/utils';
export {
  type Chunk,
  type HappyMessage,
  type CoreChatProps,
  type HappyReactMarkdownComponentProps,
  type ParsedHappyReactMarkdownComponentProps,
  type ComponentWithMeta,
  type CustomComponentConfig,
  SSEChunkEvent,
  CustomComponentType,
  ErrorType,
  RemarkDirectiveType,
  UIManagerInstanceType,
} from './core/types';
export { CustomComponentChunkSchema } from './core/types/schemas';
