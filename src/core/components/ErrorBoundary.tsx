import React from 'react';
import { Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import RenderErrorAlert from './RenderErrorAlert';

const { Paragraph, Text } = Typography;

const Wrapper = styled('div')`
  width: 100%;
  height: 100%;
  position: relative;
`;

interface ErrorBoundaryProps {
  children: React.ReactElement;
  mode?: 'debug' | 'compact';
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary componentDidCatch', error);
    this.setState({ error, errorInfo });
  }

  render() {
    let fallbackUI: React.ReactElement;
    const { mode, componentName } = this.props;
    const feedbackMode = mode || 'compact';

    if (feedbackMode === 'compact') {
      fallbackUI = <RenderErrorAlert title={`Custom component${componentName ? ` ${componentName} ` : ''} render failed`} />;
    } else {
      fallbackUI = (
        <div className="desc">
          <Paragraph>
            <Text strong style={{ fontSize: 16 }}>
              Error details:
            </Text>
          </Paragraph>
          <Paragraph style={{ maxHeight: 150, overflow: 'auto' }}>
            <CloseCircleOutlined style={{ color: 'red' }} /> {this.state.error?.message}{' '}
            <details style={{ whiteSpace: 'pre-wrap', paddingLeft: 2 }}>{this.state.errorInfo?.componentStack}</details>
          </Paragraph>
        </div>
      );
    }

    return this.state.hasError ? fallbackUI : this.props.children;
  }
}

export default ErrorBoundary;
