import React from 'react';
import type { HappyReactMarkdownComponentProps, ComponentWithMeta } from '../types';
import { safeJsonParse } from '../utils';
import ErrorBoundary from './ErrorBoundary';

export const AgentRequestContext = React.createContext<{
  isRequesting: () => boolean;
  request2Agent?: (userInput: string) => void;
}>({
  isRequesting: () => false,
  request2Agent: undefined,
});

function ValidationGate({
  Component,
  parsedProps,
  componentProps,
  isRequesting,
  request2Agent,
  keyVal,
}: {
  Component: React.ComponentType<any> & Partial<ComponentWithMeta<any>>;
  parsedProps: Record<string, any>;
  componentProps: Record<string, any>;
  isRequesting: () => boolean;
  request2Agent?: (userInput: string) => void;
  keyVal?: number;
}) {
  const ComponentMeta = Component as ComponentWithMeta<any>;
  if (typeof ComponentMeta.validator === 'function') {
    const ok = ComponentMeta.validator(parsedProps);
    if (!ok) {
      throw new Error(
        `Custom component '${ComponentMeta.displayName || ComponentMeta.name || 'Component'}' props validation failed`,
      );
    }
  }
  return React.createElement(Component, {
    ...componentProps,
    isRequesting,
    request2Agent,
    key: keyVal,
  });
}

export const withMarkdownComponentProps = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
): React.FC<HappyReactMarkdownComponentProps> => {
  const WrappedComponent: React.FC<HappyReactMarkdownComponentProps> = ({
    node,
    children,
    props: propsString,
    ...rest
  }) => {
    // props from directive {props='...'}; fallback to dataProps/node.properties for compat
    const rawProps =
      propsString ??
      (rest as any).dataProps ??
      (node && typeof node === 'object' && 'properties' in node && ((node as any).properties?.props ?? (node as any).properties?.['data-props']));
    const parsedProps = safeJsonParse<Record<string, any>>(
      typeof rawProps === 'string' ? rawProps : '{}',
      {},
    );
    const { isRequesting, request2Agent } = React.useContext(AgentRequestContext);
    const componentProps = {
      props: parsedProps,
      node,
      children,
      ...rest,
    } as unknown as P;

    return (
      <ErrorBoundary componentName={Component.displayName || (Component as any).name || ''}>
        {React.createElement(ValidationGate, {
          Component: Component as React.ComponentType<any> & Partial<ComponentWithMeta<any>>,
          parsedProps: parsedProps as Record<string, any>,
          componentProps: componentProps as unknown as Record<string, any>,
          isRequesting,
          request2Agent,
          keyVal: node?.position?.start?.offset,
        })}
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withMarkdownComponentProps(${Component.displayName || (Component as any).name || 'Component'})`;
  return React.memo(WrappedComponent);
};
