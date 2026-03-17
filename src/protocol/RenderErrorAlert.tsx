import React from 'react';
import styled from '@emotion/styled';
import { CloseCircleOutlined } from '@ant-design/icons';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #868c9c;
  font-size: 12px;
  font-weight: 400;
  border-radius: 8px;
  line-height: 20px;
  border: 1px solid #dfe3e9;
  padding: 6px;
  margin: 8px 0;
`;

interface RenderErrorAlertProps {
  componentName?: string;
}

const RenderErrorAlert: React.FC<RenderErrorAlertProps> = ({ componentName }) => (
  <Wrapper>
    <CloseCircleOutlined />
    {componentName ? `${componentName} failed to load` : 'Component failed to load'}
  </Wrapper>
);

export default RenderErrorAlert;
