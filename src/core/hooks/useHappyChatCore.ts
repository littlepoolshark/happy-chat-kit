import type { Chunk, CoreChatProps, HappyMessage } from '../types';
import { ErrorType } from '../types';
import { useXAgent, useXChat, XStream } from '@ant-design/x';
import { useCallback, useRef, useState } from 'react';

export const useHappyChatCore = ({
  request,
  onChunksStart,
  onChunksEnd,
  onChunk,
  onFirstChunk,
  onError,
  onWaiting,
  transformMessage,
}: CoreChatProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const abortControllerRef = useRef<AbortController>();

  const [agent] = useXAgent<HappyMessage | string>({
    request: async ({ message }, callbacks) => {
      const { onSuccess, onUpdate, onError: _onError } = callbacks;

      if (message) {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        setIsRequesting(true);
        onWaiting?.(onUpdate);
        let response: Response;
        try {
          response = await request(message as string, abortControllerRef.current);
          if (!response.ok) {
            const errObj = new Error(response.statusText);
            onError?.(ErrorType.Network, errObj, onUpdate, { HttpStatus: response.status });
            return;
          }
        } catch (error: any) {
          setIsRequesting(false);
          if (error.name === 'AbortError') {
            onError?.(ErrorType.Abort, error, onUpdate);
            return;
          }
          onError?.(ErrorType.Network, error, onUpdate);
          return;
        }
        if (response) {
          try {
            let isFirstChunk = true;
            const chunks: Chunk[] = [];
            onChunksStart?.(onUpdate);
            for await (const chunk of XStream({
              readableStream: response.body as ReadableStream,
            })) {
              chunks.push(chunk);
              if (isFirstChunk) {
                isFirstChunk = false;
                onFirstChunk?.(chunk, onUpdate);
              }
              onChunk?.(chunk, onUpdate);
            }
            onChunksEnd?.(chunks, onUpdate);
            onSuccess(chunks);
          } catch (error: any) {
            setIsRequesting(false);
            if (error.name === 'AbortError') {
              onError?.(ErrorType.Abort, error, onUpdate);
              return;
            }
            if (error?.message?.includes('network error')) {
              onError?.(ErrorType.Network, error, onUpdate);
            } else {
              onError?.(ErrorType.Script, error, onUpdate);
            }
          }
          setIsRequesting(false);
        }
      }
    },
  });

  const { onRequest, messages, setMessages } = useXChat({
    agent,
    transformMessage,
  });

  const _isRequesting = useCallback(() => isRequesting, [isRequesting]);

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
  };

  const request2Agent = useCallback(
    (userInput: string) => {
      if (!_isRequesting()) {
        onRequest(userInput);
      }
    },
    [onRequest, _isRequesting],
  );

  return {
    request2Agent,
    messages,
    setMessages,
    isRequesting: _isRequesting,
    abort,
  };
};
