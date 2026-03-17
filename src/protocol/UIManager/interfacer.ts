import type { ChatUIManager } from '../../core/interface';

export interface HeartbeatManager extends ChatUIManager {
  removeHeartbeatDirective: (content: string) => string;
}

export interface TOCManager extends ChatUIManager {
  updateStatusOnError: (content: string, startTime: number, processing: boolean) => string | null;
}
