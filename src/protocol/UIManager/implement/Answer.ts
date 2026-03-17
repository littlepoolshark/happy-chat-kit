import type { ChatUIManager } from '../../../core/interface';
import { CustomComponentType, SSEChunkEvent } from '../../../core/types';
import { getInstance } from '../../../core/utils';

export class Answer implements ChatUIManager {
  type = SSEChunkEvent.ANSWER;
  state = { content: '' };
  component = null;
  plugins = (instances: ChatUIManager[]) => ({
    onChunk: (data: string | Record<string, any>) => {
      const tocInstance = getInstance(instances, CustomComponentType.TOC);
      const heartbeatInstance = getInstance(instances, SSEChunkEvent.HEARTBEAT);
      const heartbeatDirectiveMark = heartbeatInstance!.render!();

      if (heartbeatInstance?.state.timer) {
        heartbeatInstance.reset?.();
      }

      if (tocInstance && tocInstance.state?.processing) {
        if (tocInstance.state.content.includes(heartbeatDirectiveMark)) {
          tocInstance.state.content = tocInstance.state.content.replace(heartbeatDirectiveMark, '');
        }
        tocInstance.state.content += data as string;
        return { content: tocInstance.render!() };
      }
      if (this.state.content.includes(heartbeatDirectiveMark)) {
        this.state.content = this.state.content.replace(heartbeatDirectiveMark, '');
      }
      this.state.content += data as string;
      return { content: this.state.content };
    },
    onError: () => {
      this.reset();
      return null;
    },
  });
  reset = () => {
    this.state.content = '';
  };
}
