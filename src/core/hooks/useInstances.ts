import { useContext } from 'react';
import { UIManagerContext } from '../components/Provider';

export const useInstances = () => {
  const instances = useContext(UIManagerContext);
  if (!instances || instances.length === 0) {
    throw new Error('useInstances must be used within a HappyChatProvider');
  }
  return instances;
};
