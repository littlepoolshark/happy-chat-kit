import type { ChatUIManager } from '../../../core/interface';
import { CustomComponentType, SSEChunkEvent } from '../../../core/types';
import { getInstance, renderRemarkTextDirective } from '../../../core/utils';
import HeartbeatLoading from '../built-in/HeartbeatLoading';
import type { HeartbeatManager } from '../interfacer';

export class Heartbeat implements HeartbeatManager {
  type = SSEChunkEvent.HEARTBEAT;
  state = {
    content: '',
    timer: null as ReturnType<typeof setTimeout> | null,
  };
  component = HeartbeatLoading;
  plugins = (instances: ChatUIManager[]) => ({
    onChunk: (data: string | Record<string, any>) => {
      const tocInstance = getInstance(instances, CustomComponentType.TOC);
      const answerInstance = getInstance(instances, SSEChunkEvent.ANSWER);
      if (!this.state.timer) {
        this.state.timer = setTimeout(() => {
          this.state.content = this.render!();
        }, 3000);
      }
      if (this.state.content) {
        let newContent = '';
        if (tocInstance?.state?.processing) {
          tocInstance.state.content += this.state.content;
          newContent = tocInstance.render!();
        } else {
          newContent = `${answerInstance?.state.content}${this.render!()}`;
        }
        return { content: newContent };
      }
      return undefined;
    },
    onError: (currentContent: string) => {
      this.reset();
      return this.removeHeartbeatDirective(currentContent);
    },
  });
  reset = () => {
    if (this.state.timer) clearTimeout(this.state.timer);
    this.state = { content: '', timer: null };
  };
  render = () => renderRemarkTextDirective(this.type, {});
  removeHeartbeatDirective(content: string) {
    return content.replace(this.render!(), '');
  }
}

const heartbeatInstance = new Heartbeat();
export const HEARTBEAT_DIRECTIVE = heartbeatInstance.render!();
