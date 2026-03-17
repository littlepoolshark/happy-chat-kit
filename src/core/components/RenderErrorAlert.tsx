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
  margin-top: 8px;
`;

interface RenderErrorAlertProps {
  title: React.ReactNode;
}

const RenderErrorAlert: React.FC<RenderErrorAlertProps> = ({ title }) => (
  <Wrapper>
    <CloseCircleOutlined />
    {title}
  </Wrapper>
);

export default RenderErrorAlert;
