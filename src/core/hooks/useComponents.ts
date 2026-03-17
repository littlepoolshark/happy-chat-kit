import React from 'react';
import { useMemo } from 'react';
import { useInstances } from './useInstances';
import { isReactComponentV2 } from '../utils';
import type { HappyReactMarkdownComponentProps } from '../types';
import { withMarkdownComponentProps } from '../components/withMarkdownComponentProps';

export const useComponents = (isRequesting: () => boolean, request2Agent?: (userInput: string) => void) => {
  const instances = useInstances();
  return useMemo(() => {
    const comps = instances
      .filter((instance) => !!instance.component)
      .filter((instance) => isReactComponentV2(instance.component))
      .reduce<Record<string, React.FC<HappyReactMarkdownComponentProps>>>(
        (acc, instance) => {
          if (instance.component) {
            acc[instance.type] = withMarkdownComponentProps(instance.component);
          }
          return acc;
        },
        {},
      );
    return comps;
  }, [instances]);
};
