import React from 'react';
import { Flex } from 'antd';
import ActionBar from './ActionBar';
import AIAnswerAlert from './AIAnswerAlert';

interface AnswerBubbleFooterProps {
  message: string;
  type: 'error' | 'success' | 'info';
  text2Copy: string;
  onRetry?: () => void;
}

function AnswerBubbleFooter({ message, type, text2Copy, onRetry }: AnswerBubbleFooterProps) {
  return (
    <Flex align="center" justify="space-between" gap={12} style={{ marginTop: 8 }}>
      <AIAnswerAlert title={message} type={type} />
      <ActionBar position="answer" text2Copy={text2Copy} onRetry={onRetry} />
    </Flex>
  );
}

export default React.memo(AnswerBubbleFooter, () => true);
