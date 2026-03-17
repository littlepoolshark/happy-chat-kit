import React from 'react';
import './index.css';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import type { ComponentWithMeta, ParsedHappyReactMarkdownComponentProps } from 'happy-chat-kit';

export interface AgentNameProps {
  name: string | React.ReactNode;
  description?: string;
}

const AgentName: ComponentWithMeta<ParsedHappyReactMarkdownComponentProps<AgentNameProps>> = ({
  props: { name, description } = {},
}) => (
  <Tooltip title={description} placement="topLeft">
    <div className={clsx('agent-name', { 'agent-name-hover': !!description })}>
      <span className="agent-tip">
        <span className="title">@{name}</span>
      </span>
      <span className="agent-name-colon">: </span>
    </div>
  </Tooltip>
);

AgentName.directiveName = 'agent_name';
AgentName.displayName = 'AgentName';
export default AgentName;
