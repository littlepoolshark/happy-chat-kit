import React from 'react';
import './index.css';
import { message, Tooltip } from 'antd';

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

interface ActionBarProps {
  position?: 'answer' | 'question';
  text2Copy: string;
  onCopy?: () => void;
  onRetry?: () => void;
  onEdit?: () => void;
  className?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({
  position = 'answer',
  text2Copy,
  onCopy,
  onRetry,
  onEdit,
  className = '',
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text2Copy);
      (onCopy || (() => message.success('Copied')))();
    } catch {
      message.error('Copy failed');
    }
  };
  return (
    <div className={`action-bar ${className} action-bar--${position}`}>
      <Tooltip title={position === 'answer' ? 'Copy answer' : 'Copy question'}>
        <div className="action-bar__button" onClick={handleCopy} role="button">
          <CopyIcon />
        </div>
      </Tooltip>
      {position === 'answer' && (
        <Tooltip title="Retry">
          <div className="action-bar__button" onClick={onRetry}>
            <RefreshIcon />
          </div>
        </Tooltip>
      )}
      {position === 'question' && (
        <Tooltip title="Edit">
          <div className="action-bar__button" onClick={onEdit}>
            <EditIcon />
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default ActionBar;
