import { useState } from 'react';
import { Button } from 'antd';
import { provider } from './provider';
import HappyChat from './HappyChat';
import { createMockRequest } from './mockApi';

const Provider = provider;
const mockRequest = createMockRequest();

export default function App() {
  const [quickTry, setQuickTry] = useState<string | null>(null);

  return (
    <Provider>
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <h1>HappyChatKit Example</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Mock mode: no backend. Use the buttons below to run the two cases.
        </p>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>Quick try:</span>
          <Button type="primary" ghost onClick={() => setQuickTry('markdown')}>
            1. Pure Markdown
          </Button>
          <Button type="primary" ghost onClick={() => setQuickTry('component')}>
            2. Custom Component
          </Button>
        </div>
        <HappyChat
          request={mockRequest}
          quickTryMessage={quickTry}
          onQuickTryDone={() => setQuickTry(null)}
        />
      </div>
    </Provider>
  );
}
