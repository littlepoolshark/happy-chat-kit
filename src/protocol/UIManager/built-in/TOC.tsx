import React, { CSSProperties, useEffect, useState } from 'react';
import { UpOutlined } from '@ant-design/icons';
import { Collapse } from 'antd';
import type { ParsedHappyReactMarkdownComponentProps } from '../../../core/types';

export interface TOCLocale {
  thinking: string;
  thinkingDone: string;
  aborted: string;
}

const DEFAULT_LOCALE: TOCLocale = {
  thinking: 'Thinking',
  thinkingDone: 'Done',
  aborted: 'Aborted',
};

export interface ThinkingCollapseProps {
  status: 'thinking' | 'finished' | 'abort';
  thinkingTime: string;
  locale?: Partial<TOCLocale>;
}

const BLOCKQUOTE_LABEL_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: '#64737A',
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: '22px',
};

function ThinkingCollapse(props: ParsedHappyReactMarkdownComponentProps<ThinkingCollapseProps>) {
  const { status, thinkingTime, locale: localeOverride } = props.props || {};
  const locale = { ...DEFAULT_LOCALE, ...localeOverride };
  const isAborted = status === 'abort';
  const isCompleted = status === 'finished' || isAborted;
  const [isOpen, setIsOpen] = useState(!isCompleted);

  useEffect(() => {
    setIsOpen(!isCompleted);
  }, [isCompleted]);

  const labelText = !isCompleted
    ? `${locale.thinking}...`
    : isAborted
      ? locale.aborted
      : `${locale.thinkingDone}${thinkingTime ? ` (${thinkingTime})` : ''}`;

  return (
    <Collapse
      className="markdown-blockquote-collapse"
      bordered={false}
      defaultActiveKey={isCompleted ? [] : ['1']}
      expandIcon={({ isActive }) => <UpOutlined style={{ color: '#64737A' }} rotate={isActive ? 180 : 0} />}
      expandIconPosition="end"
      activeKey={isOpen ? ['1'] : []}
      onChange={(key) => setIsOpen(Array.isArray(key) ? key.length > 0 : false)}
      items={[
        {
          key: '1',
          label: <div style={BLOCKQUOTE_LABEL_STYLE}>{labelText}</div>,
          children: props.children,
          style: { marginBottom: 24, border: 'none' },
        },
      ]}
    />
  );
}

export default React.memo(ThinkingCollapse);
