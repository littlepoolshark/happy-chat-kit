import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './index.css';

import { preprocessMessage } from '../../core/utils';
import { useComponents } from '../../core/hooks';
import type { HappyReactMarkdownComponentProps } from '../../core/types';
import { AgentRequestContext } from '../../core/components/withMarkdownComponentProps';

interface MarkdownRendererProps extends Pick<HappyReactMarkdownComponentProps, 'isRequesting' | 'request2Agent'> {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isRequesting = () => false, request2Agent }) => {
  const components = useComponents(isRequesting, request2Agent);

  return (
    <div className="markdown">
      <AgentRequestContext.Provider value={{ isRequesting, request2Agent }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath, remarkBreaks, remarkDirective, remarkDirectiveRehype]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={components as any}
        >
          {preprocessMessage(content)}
        </ReactMarkdown>
      </AgentRequestContext.Provider>
    </div>
  );
};

export default MarkdownRenderer;
