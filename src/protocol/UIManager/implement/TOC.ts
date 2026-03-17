import type { ChatUIManager } from '../../../core/interface';
import { CustomComponentType, SSEChunkEvent } from '../../../core/types';
import { getInstance, renderRemarkContainerDirective } from '../../../core/utils';
import TOComponent from '../built-in/TOC';
import type { TOCManager } from '../interfacer';

export interface TOCState {
  processing: boolean;
  startTime: number;
  endTime: number;
  content: string;
}

export class TOC implements TOCManager {
  type = CustomComponentType.TOC;
  state: TOCState = {
    processing: false,
    startTime: 0,
    endTime: 0,
    content: '',
  };
  component = TOComponent;
  plugins = (instances: ChatUIManager[]) => ({
    onChunk: (data: string | Record<string, any>) => {
      const { status } = data as { status: 'start' | 'end' };
      if (status === 'start') {
        this.state = { processing: true, startTime: Date.now(), endTime: 0, content: '' };
        return { content: this.render!() };
      }
      if (status === 'end') {
        this.state.processing = false;
        this.state.endTime = Date.now();
        const tocContent = this.render!();
        const answerInstance = getInstance(instances, SSEChunkEvent.ANSWER);
        if (answerInstance) answerInstance.state.content = tocContent;
      }
      return undefined;
    },
    onError: (currentContent: string, _errorType: string, _error: any, _meta: any) => {
      const { startTime, processing } = this.state;
      this.reset();
      return this.updateStatusOnError(currentContent, startTime, processing);
    },
  });
  render = () => {
    const { processing, startTime, endTime, content } = this.state;
    return renderRemarkContainerDirective(
      this.type,
      {
        status: processing ? 'thinking' : 'finished',
        thinkingTime: processing ? '' : `${(endTime - startTime) / 1000}s`,
      },
      content,
    );
  };
  reset = () => {
    this.state = { processing: false, startTime: 0, endTime: 0, content: '' };
  };
  updateStatusOnError = (currentContent: string, startTime: number, processing: boolean) => {
    if (!processing) return null;
    const directiveRegex = /:::mci_cot\{props='([^']+)'\}([\s\S]*?):::/g;
    return currentContent.replace(directiveRegex, (match, propsStr, content) => {
      try {
        const currentProps = JSON.parse(propsStr);
        const thinkingTime = startTime > 0 ? `${((Date.now() - startTime) / 1000).toFixed(2)}s` : '0s';
        const updatedProps = { ...currentProps, status: 'abort', thinkingTime };
        return `:::mci_cot{props='${JSON.stringify(updatedProps)}'}${content}:::`;
      } catch {
        return match;
      }
    });
  };
}
