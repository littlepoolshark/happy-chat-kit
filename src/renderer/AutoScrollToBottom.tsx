import React, { useRef, useEffect, ReactNode } from 'react';

declare global {
  interface HTMLDivElement {
    _lastScrollWasProgrammatic?: boolean;
  }
}

interface AutoScrollToBottomProps {
  children: ReactNode;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  messages?: any[];
  scrollThreshold?: number;
  scrollDelay?: number;
  disabled?: boolean;
}

const AutoScrollToBottom: React.FC<AutoScrollToBottomProps> = ({
  children,
  containerStyle = { height: '200px', overflow: 'scroll' },
  containerClassName = 'chat-container',
  messages = [],
  scrollThreshold = 10,
  scrollDelay = 100,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollToBottomModeRef = useRef(true);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget as HTMLDivElement;
    if (container._lastScrollWasProgrammatic) {
      delete container._lastScrollWasProgrammatic;
    } else {
      const isAlmostAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;
      isAutoScrollToBottomModeRef.current = isAlmostAtBottom;
    }
  };

  const scrollToBottom = (container: HTMLDivElement) => {
    if (container) {
      Object.defineProperty(container, '_lastScrollWasProgrammatic', {
        value: true,
        configurable: true,
        writable: true,
      });
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  };

  useEffect(() => {
    if (disabled) isAutoScrollToBottomModeRef.current = false;
  }, [disabled]);

  useEffect(() => {
    if (messages.length > 0 && containerRef.current && isAutoScrollToBottomModeRef.current) {
      const t = setTimeout(() => scrollToBottom(containerRef.current!), scrollDelay);
      return () => clearTimeout(t);
    }
  }, [messages, scrollDelay]);

  return (
    <div style={containerStyle} onScroll={handleScroll} className={containerClassName} ref={containerRef}>
      {children}
    </div>
  );
};

export default AutoScrollToBottom;
