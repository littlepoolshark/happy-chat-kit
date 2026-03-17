import React from 'react';
import {
  CustomComponentType,
  SSEChunkEvent,
  UIManagerInstanceType,
  ParsedHappyReactMarkdownComponentProps,
  ComponentWithMeta,
  RemarkDirectiveType,
} from '../types';
import type { ChatUIManager } from '../interface';

export const getInstance = (instances: ChatUIManager[], type: UIManagerInstanceType) => {
  return instances.find((instance) => instance.type === type);
};

const IMPORTANT_SPACE = ' ';

/** Use props attribute with single quotes: micromark directive does not support escaped " inside "",
 * so single-quoted value allows JSON with double quotes. Align with mci-agent-universe HappyChatKit. */
export const renderRemarkTextDirective = (name: string, props: Record<string, any>) => {
  return `${IMPORTANT_SPACE}:${name}{props='${JSON.stringify(props)}'}`;
};

export const renderRemarkLeafDirective = (name: string, props: Record<string, any>) => {
  return `${IMPORTANT_SPACE}::${name}{props='${JSON.stringify(props)}'}`;
};

export const renderRemarkContainerDirective = (name: string, props: Record<string, any>, content: string) => {
  return `${IMPORTANT_SPACE}:::${name}{props='${JSON.stringify(props)}'}
  ${content}
:::
`;
};

export function preprocessMessage(message: string): string {
  return message.replace(/(\s*):(\d+)/g, '$1\\:$2').replace(/(\s*)(\d+):(\d+)/g, '$1$2\\:$3');
}

export const UIManagerFactory = (Component: ComponentWithMeta, directiveType: RemarkDirectiveType): ChatUIManager => {
  const directiveName = Component.directiveName;
  if (!directiveName) {
    throw new Error(`UIManagerFactory: directiveName static property of ${Component.displayName} not found`);
  }
  return {
    type: directiveName,
    state: {},
    component: Component,
    render() {
      switch (directiveType) {
        case RemarkDirectiveType.Text:
          return renderRemarkTextDirective(this.type, this.state);
        case RemarkDirectiveType.Leaf:
          return renderRemarkLeafDirective(this.type, this.state);
        case RemarkDirectiveType.Container:
          return renderRemarkContainerDirective(this.type, this.state, this.state.content || '');
        default:
          return renderRemarkTextDirective(this.type, this.state);
      }
    },
    plugins(instances: ChatUIManager[]) {
      return {
        onChunk: (data) => {
          this.state = data;
          return {
            content: this.render!(),
          };
        },
      };
    },
  };
};

export const isReactComponentV2 = (component: any): boolean => {
  try {
    return React.isValidElement(React.createElement(component));
  } catch {
    return false;
  }
};

export const safeJsonParse = <T extends Record<string, any>>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

/** Lightweight mobile detection (for renderer layout). Can be overridden via props/context. */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  return typeof window.innerWidth !== 'undefined' && window.innerWidth < 768;
};
