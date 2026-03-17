import React from "react";
import { Flex } from "antd";
import ActionBar from "./ActionBar";
import AIAnswerAlert from "./AIAnswerAlert";

const dividerStyle: React.CSSProperties = {
  width: 1,
  minHeight: 16,
  alignSelf: "stretch",
  borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
  marginLeft: 12,
  marginRight: 12,
  flexShrink: 0,
};

interface AnswerBubbleFooterProps {
  message: string;
  type: "error" | "success" | "info";
  text2Copy: string;
  onRetry?: () => void;
}

function AnswerBubbleFooter({
  message,
  type,
  text2Copy,
  onRetry,
}: AnswerBubbleFooterProps) {
  return (
    <Flex vertical gap={8}>
      <AIAnswerAlert title={message} type={type} />
      <ActionBar position="answer" text2Copy={text2Copy} onRetry={onRetry} />
    </Flex>
  );
}

export default React.memo(AnswerBubbleFooter);
