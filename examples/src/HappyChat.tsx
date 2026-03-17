import React, { useEffect } from 'react';
import { useHappyChat, HappyChatMessageFlow } from 'happy-chat-kit/preset';
import { Button, Input } from 'antd';

export default function HappyChat({
  request,
  firstQuestion,
  quickTryMessage,
  onQuickTryDone,
}: {
  request: (message: string, abortController: AbortController) => Promise<Response>;
  firstQuestion?: string;
  /** When set, send this message once (e.g. "markdown" or "component" for mock cases). */
  quickTryMessage?: string | null;
  onQuickTryDone?: () => void;
}) {
  const { messages, isRequesting, request2Agent, abort } = useHappyChat({ firstQuestion, request });
  const [input, setInput] = React.useState('');

  useEffect(() => {
    if (quickTryMessage) {
      request2Agent(quickTryMessage);
      onQuickTryDone?.();
    }
  }, [quickTryMessage, request2Agent, onQuickTryDone]);

  return (
    <>
      <HappyChatMessageFlow
        messages={messages as any}
        isRequesting={isRequesting}
        request2Agent={request2Agent}
      />
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => abort()}>Abort</Button>
        <Input
          placeholder="Type and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              request2Agent(input.trim());
              setInput('');
            }
          }}
          style={{ width: 240 }}
        />
        <Button type="primary" onClick={() => input.trim() && request2Agent(input.trim())}>
          Send
        </Button>
      </div>
    </>
  );
}
