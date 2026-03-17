import React from "react";
import type {
  HappyMessage,
  HappyReactMarkdownComponentProps,
} from "../../core/types";
import { ErrorType } from "../../core/types";
import { isMobile } from "../../core/utils";
import MarkdownRenderer from "../MarkdownRenderer";
import { Bubble } from "@ant-design/x";
import type { MessageInfo } from "@ant-design/x/es/use-x-chat";
import { Flex, GetProp } from "antd";
import ActionBar from "./ActionBar";
import AnswerBubbleFooter from "./AnswerBubbleFooter";
import { HEARTBEAT_DIRECTIVE } from "../../protocol/UIManager/implement/Heartbeat";

const defaultAvatarStyle = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  backgroundColor: "#e8e8e8",
};

interface HappyChatMessageFlowProps extends Pick<
  HappyReactMarkdownComponentProps,
  "isRequesting" | "request2Agent"
> {
  messages: MessageInfo<HappyMessage | string>[];
  userAvatar?: string;
  botAvatar?: string;
  hiddenMessages?: string[];
  /** Optional agent title above AI bubble */
  agentTitle?: React.ReactNode;
}

function HappyChatMessageFlow({
  messages,
  userAvatar,
  botAvatar,
  hiddenMessages = [],
  isRequesting,
  request2Agent,
  agentTitle,
}: HappyChatMessageFlowProps) {
  const visibleMessages = messages.filter((item) => {
    if (typeof item.message === "string")
      return !hiddenMessages.includes(item.message);
    return true;
  });

  const roles: GetProp<typeof Bubble.List, "roles"> = {
    ai: {
      placement: "start",
      typing: { step: 5, interval: 20 },
      avatar: botAvatar
        ? { src: botAvatar, style: defaultAvatarStyle }
        : { style: defaultAvatarStyle, children: "Bot" },
      styles: {
        content: {
          paddingTop: 0,
          color: "#333",
          background: "#fff",
          overflowX: "auto",
        },
      },
    },
    user: {
      placement: "end",
      avatar: userAvatar
        ? { src: userAvatar, style: defaultAvatarStyle }
        : { style: defaultAvatarStyle, children: "User" },
      styles: {
        content: {
          color: "#333",
          background: "transparent",
          overflowX: "auto",
        },
      },
    },
  };

  const bubbleItems: GetProp<typeof Bubble.List, "items"> = visibleMessages.map(
    ({ id, message, status }, index) => {
      let footer: React.ReactElement | null = null;
      const isAnswer = status !== "local";
      const isQuestion = status === "local";
      let content = "";

      if (isAnswer) {
        content = (message as HappyMessage).content || "";
        const question = (visibleMessages[index - 1]?.message as string) || "";
        let footerMessage = "";
        if (status === "success") {
          footerMessage = "This answer is AI-generated. Please verify.";
        } else if (status === "error") {
          const error = (message as HappyMessage).error!;
          switch (error.type) {
            case ErrorType.Network:
              footerMessage = "Network error. Please try again.";
              break;
            case ErrorType.Abort:
              footerMessage = "Output aborted.";
              break;
            case ErrorType.Script:
              footerMessage = "Script error. Please try again.";
              break;
            default:
              footerMessage = error.error?.message || "Unknown error.";
          }
        }
        if (footerMessage) {
          footer = (
            <AnswerBubbleFooter
              message={footerMessage}
              type={status === "success" ? "success" : "error"}
              text2Copy={content || ""}
              onRetry={() => request2Agent?.(question)}
            />
          );
        }
      } else {
        content = (message as string) || "";
        footer = (
          <ActionBar
            position="question"
            text2Copy={content || ""}
            onEdit={() => {}}
          />
        );
      }

      const isLoading =
        status === "loading" &&
        (content === "" || content.startsWith(HEARTBEAT_DIRECTIVE));

      return {
        key: id,
        loading: isLoading,
        role: status === "local" ? "user" : "ai",
        content: isQuestion ? (
          <Flex vertical gap={4}>
            <div className="user-message">{content || ""}</div>
            <div
              className="user-message-footer"
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              {footer}
            </div>
          </Flex>
        ) : (
          <Flex vertical gap={0}>
            {agentTitle != null && (
              <div
                style={{
                  color: "rgba(0,0,0,0.88)",
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {agentTitle}
              </div>
            )}
            <MarkdownRenderer
              content={content || ""}
              isRequesting={isRequesting}
              request2Agent={request2Agent}
            />
            {footer}
          </Flex>
        ),
      };
    },
  );

  const paddingBottom = isMobile() ? "16px" : "60px";

  return (
    <div
      className="happy-chat-message-flow"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "0 0 20px 20px",
        display: "flex",
        flexDirection: "column",
        paddingTop: 2,
        paddingBottom,
      }}
    >
      <Bubble.List items={bubbleItems} roles={roles} />
    </div>
  );
}

export default HappyChatMessageFlow;
