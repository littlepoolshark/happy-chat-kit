import { ComponentWithMeta, CustomComponentConfig, RemarkDirectiveType } from '../types';
import { createElement } from 'react';
import { HappyChatProvider, type HappyChatProviderProps } from '../components/Provider';
import type { ChatUIManager } from '../interface';

interface ChatKitOptions {
  errorFallbackUI?: React.FC<{ componentName?: string }>;
}

export class ChatKit {
  private customComponents: CustomComponentConfig[] = [];
  private builtInUIManagers: ChatUIManager[] = [];
  private errorFallbackUI?: React.FC<{ componentName?: string }>;

  constructor(builtInUIManagers?: ChatUIManager[], options?: ChatKitOptions) {
    this.customComponents = [];
    this.builtInUIManagers = builtInUIManagers || [];
    this.errorFallbackUI = options?.errorFallbackUI;
  }

  register(component: ComponentWithMeta, type: RemarkDirectiveType = RemarkDirectiveType.Text) {
    this.customComponents.push({ type, component });
    return this;
  }

  registerBatch(components: (ComponentWithMeta | { component: ComponentWithMeta; type: RemarkDirectiveType })[]) {
    components.forEach((component) => {
      if ('type' in component) {
        this.customComponents.push({ type: component.type, component: component.component });
      } else {
        this.customComponents.push({ type: RemarkDirectiveType.Text, component });
      }
    });
    return this;
  }

  createProvider(): React.FC<{ children: React.ReactNode }> {
    const Provider = ({ children }: { children: React.ReactNode }) => {
      return createElement(HappyChatProvider, {
        config: this.customComponents,
        children,
        builtInUIManagers: this.builtInUIManagers,
        errorFallbackUI: this.errorFallbackUI,
      } as HappyChatProviderProps);
    };
    return Provider;
  }
}
