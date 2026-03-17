import { useEffect, useMemo, useRef } from 'react';
import { getInstance } from '../../core/utils';
import { CustomComponentType, ErrorType, SSEChunkEvent } from '../../core/types';
import { useInstances, useHappyChatCore } from '../../core/hooks';
import type { CoreChatProps } from '../../core/types';
import { CustomComponentChunkSchema } from '../../core/types/schemas';
import type { Chunk } from '../../core/types';
import type { ChatUIManager } from '../../core/interface';

/** Reconstruct content from chunks (merge in order: answer + custom_component + answer). Used by transformMessage to avoid onSuccess overwriting. */
function buildContentFromChunks(chunks: Chunk[], instances: ChatUIManager[]): { content: string } {
  let content = '';
  for (const chunk of chunks) {
    const eventType = (chunk.event ?? '').trim();
    const dataStr = (chunk.data ?? '{}').trim();
    let parsedData: Record<string, string>;
    try {
      parsedData = JSON.parse(dataStr);
    } catch {
      continue;
    }
    if (eventType === SSEChunkEvent.CUSTOM_COMPONENT) {
      const result = CustomComponentChunkSchema.safeParse(parsedData);
      if (!result.success) continue;
      const { type, props } = result.data;
      const parsedProps = JSON.parse(props);
      const manager = getInstance(instances, type as CustomComponentType);
      if (manager) {
        const customContent = manager.plugins?.(instances)?.onChunk?.(parsedProps) ?? null;
        if (customContent) content += customContent.content;
      }
    } else if (eventType === SSEChunkEvent.ANSWER) {
      content += parsedData?.content ?? '';
    }
  }
  return { content };
}

export const useHappyChat = ({ firstQuestion, request }: Pick<CoreChatProps, 'firstQuestion' | 'request'>) => {
  const currentContentRef = useRef('');
  const instances = useInstances();
  const instancesRef = useRef([...instances]);

  const { request2Agent, messages, setMessages, isRequesting, abort } = useHappyChatCore({
    request,
    transformMessage: ({ originMessage, chunk, chunks, status }) => {
      if (status === 'success' && Array.isArray(chunks) && chunks.length > 0) {
        const built = buildContentFromChunks(chunks, instancesRef.current);
        if (built.content) return built;
      }
      if (chunk) return chunk;
      return originMessage ?? (Array.isArray(chunks) && chunks.length > 0 ? chunks[chunks.length - 1] : chunks);
    },
    onWaiting: (updater) => {
      updater({ content: '', isWaiting: true });
    },
    onChunksStart: (updater) => {
      updater({ content: '', isWaiting: false });
    },
    onChunksEnd: () => {
      instancesRef.current.forEach((manager) => {
        if (manager.reset) manager.reset();
      });
      currentContentRef.current = '';
    },
    onChunk: (chunk, updater) => {
      // XStream parses SSE with value after colon unchanged; SSE spec allows leading space (e.g. "event: answer" -> event " answer")
      const eventType = (chunk.event ?? '').trim();
      const dataStr = (chunk.data ?? '{}').trim();
      let parsedData: Record<string, string>;
      try {
        parsedData = JSON.parse(dataStr);
      } catch (error) {
        console.error('JSON parse error:', error);
        return;
      }

      let contentToBeUpdated: { content: string } | null = null;

      if (eventType === SSEChunkEvent.CUSTOM_COMPONENT) {
        const result = CustomComponentChunkSchema.safeParse(parsedData);
        if (!result.success) {
          throw new Error(`SSE custom_component payload validation failed: ${result.error.message}`);
        }
        const { type, props } = result.data;
        const parsedProps = JSON.parse(props);
        const manager = getInstance(instancesRef.current, type as CustomComponentType);
        if (manager) {
          const plugins = manager.plugins(instancesRef.current);
          const customComponentContent = plugins?.onChunk?.(parsedProps) ?? null;
          if (customComponentContent) {
            contentToBeUpdated = { content: currentContentRef.current + customComponentContent.content };
          }
        }
      } else {
        const manager = getInstance(instancesRef.current, eventType as SSEChunkEvent.ANSWER | SSEChunkEvent.HEARTBEAT);
        if (manager) {
          const plugins = manager.plugins(instancesRef.current);
          if (plugins?.onChunk) {
            plugins.onChunk(parsedData?.content);
          }
          // Answer manager only accumulates answer chunks; use our merged content to preserve custom_component
          contentToBeUpdated = {
            content: currentContentRef.current + (parsedData?.content ?? ''),
          };
        }
      }

      if (contentToBeUpdated) {
        currentContentRef.current = contentToBeUpdated.content || '';
        updater(contentToBeUpdated);
      }
    },
    onError(errorType, error, updater, meta) {
      console.error(`${errorType}:`, error, meta);
      let nextContent = currentContentRef.current;
      instancesRef.current.forEach((manager) => {
        const plugins = manager.plugins(instancesRef.current);
        if (plugins?.onError) {
          const content = plugins.onError(nextContent, errorType, error, meta);
          if (content !== null) nextContent = content;
        }
      });
      updater({
        content: nextContent,
        error: {
          type: errorType,
          error,
          meta: errorType === ErrorType.Network ? meta : undefined,
        },
      });
      currentContentRef.current = '';
    },
  });

  const normalizeMessage = useMemo(() => {
    return messages.map((item) => {
      const { id, message } = item;
      const isObject = typeof message === 'object' && message !== null;
      if (isObject && message && typeof message === 'object') {
        if ('error' in message && message.error) {
          return {
            id,
            message: {
              ...message,
              isAborted: message.error.type === ErrorType.Abort,
            },
            status: 'error',
          };
        }
        if (item.status === 'loading') {
          return {
            ...item,
            message: { ...message, isWaiting: (message as any).content === '' },
          };
        }
      }
      return item;
    });
  }, [messages]);

  useEffect(() => {
    if (firstQuestion) request2Agent(firstQuestion);
  }, [firstQuestion]);

  return {
    messages: normalizeMessage,
    setMessages,
    isRequesting,
    request2Agent,
    abort,
  };
};
