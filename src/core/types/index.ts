import type { FC, ReactNode } from 'react';
import type { Element as HastElement } from 'hast';

export interface Chunk {
  event?: string;
  data?: string;
}

export enum SSEChunkEvent {
  ANSWER = 'answer',
  HEARTBEAT = 'heartbeat',
  CUSTOM_COMPONENT = 'custom_component',
}

export enum CustomComponentType {
  TOC = 'mci_cot',
  AGENT_NAME = 'agent_name',
}

export type UIManagerInstanceType = SSEChunkEvent.ANSWER | SSEChunkEvent.HEARTBEAT | CustomComponentType;

export interface HappyReactMarkdownComponentProps {
  node: HastElement;
  children?: ReactNode;
  props: string;
  isRequesting: () => boolean;
  request2Agent: (userInput: string) => void;
}

export interface ParsedHappyReactMarkdownComponentProps<P = Record<string, any>>
  extends Omit<HappyReactMarkdownComponentProps, 'props'> {
  props: P;
}

export enum ErrorType {
  Network = 'NetworkError',
  Script = 'ScriptError',
  Abort = 'AbortError',
  Unknown = 'UnknownError',
}

export interface HappyMessage {
  content: string;
  error?: {
    type: ErrorType;
    error: Error;
    meta?: { HttpStatus: number };
  };
  isWaiting?: boolean;
  isAborted?: boolean;
}

export type TransformMessageParams = {
  originMessage?: any;
  chunk?: any;
  chunks?: Chunk[];
  status?: string;
};

export interface CoreChatProps {
  firstQuestion?: string;
  request: (message: string, abortController: AbortController) => Promise<Response>;
  onWaiting?: (updater: (message: any) => void) => void;
  onChunksStart?: (updater: (message: any) => void) => void;
  onFirstChunk?: (chunk: Chunk, updater: (message: any) => void) => void;
  onChunk?: (chunk: Chunk, updater: (message: any) => void) => void;
  onChunksEnd?: (chunks: Chunk[], updater: (message: any) => void) => void;
  onError?: (errorType: ErrorType, error: any, updater: (message: any) => void, meta?: { HttpStatus: number }) => void;
  /** When provided, used by useXChat on success to avoid race with setState overwriting accumulated content. */
  transformMessage?: (params: TransformMessageParams) => any;
}

export type ComponentWithMeta<P = any> = FC<P> & {
  directiveName: string;
  displayName: string;
  validator?: (props: P) => boolean;
};

export enum RemarkDirectiveType {
  Text = 'textDirective',
  Leaf = 'leafDirective',
  Container = 'containerDirective',
}

export interface CustomComponentConfig {
  type: RemarkDirectiveType;
  component: ComponentWithMeta;
}
