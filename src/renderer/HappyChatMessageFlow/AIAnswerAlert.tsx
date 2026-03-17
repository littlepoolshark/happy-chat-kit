import React from 'react';
import styled from '@emotion/styled';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
`;

interface AIAnswerAlertProps {
  title: React.ReactNode;
  type: 'error' | 'success' | 'info';
}

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const AIAnswerAlert: React.FC<AIAnswerAlertProps> = ({ title }) => (
  <Wrapper>
    <InfoIcon />
    {title}
  </Wrapper>
);

export default AIAnswerAlert;
