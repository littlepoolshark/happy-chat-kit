import React, { createContext, useMemo } from 'react';
import type { CustomComponentConfig } from '../types';
import { UIManagerFactory } from '../utils';
import type { ChatUIManager } from '../interface';

export const UIManagerContext = createContext<ChatUIManager[]>([]);
export const ErrorFallbackUIContext = createContext<React.FC<{ componentName?: string }> | undefined>(undefined);

export interface HappyChatProviderProps {
  config: CustomComponentConfig[];
  children: React.ReactNode;
  builtInUIManagers?: ChatUIManager[];
  errorFallbackUI?: React.FC<{ componentName?: string }>;
}

export const HappyChatProvider: React.FC<HappyChatProviderProps> = ({
  config,
  children,
  builtInUIManagers = [],
  errorFallbackUI,
}) => {
  const instances = useMemo(() => {
    return config.map(({ type, component }) => UIManagerFactory(component, type));
  }, [config]);

  return (
    <ErrorFallbackUIContext.Provider value={errorFallbackUI}>
      <UIManagerContext.Provider value={[...instances, ...builtInUIManagers]}>{children}</UIManagerContext.Provider>
    </ErrorFallbackUIContext.Provider>
  );
};
