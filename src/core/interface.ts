import type { HappyMessage } from './types';

export interface ChatUIManager {
  type: string;
  state: any;
  component: React.FC<any> | null;
  plugins: (instances: ChatUIManager[]) => {
    onChunksStart?: () => HappyMessage;
    onChunksEnd?: () => HappyMessage | undefined;
    onChunk?: (data: string | Record<string, any>) => HappyMessage | undefined;
    onError?: (currentContent: string, errorType: string, error: any, meta: any) => null | string;
  };
  reset?: () => void;
  render?: () => string;
}
