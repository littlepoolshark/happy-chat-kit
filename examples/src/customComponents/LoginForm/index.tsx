import React from 'react';
import { Card, Form, Input, Button } from 'antd';
import type { ComponentWithMeta, ParsedHappyReactMarkdownComponentProps } from 'happy-chat-kit';

export interface LoginFormProps {
  title?: string;
  submitText?: string;
}

const LoginForm: ComponentWithMeta<ParsedHappyReactMarkdownComponentProps<LoginFormProps>> = ({
  props: { title = 'Login', submitText = 'Sign in' } = {},
}) => {
  const [form] = Form.useForm();

  const onFinish = (values: Record<string, string>) => {
    console.log('LoginForm submit:', values);
  };

  return (
    <Card
      title={title}
      size="small"
      style={{ maxWidth: 360, margin: '8px 0' }}
      styles={{
        header: { padding: '12px 16px', fontSize: 15, fontWeight: 600 },
        body: { padding: '16px' },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ username: '', password: '' }}
        requiredMark={false}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please input your username' }]}
        >
          <Input placeholder="Username" size="middle" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please input your password' }]}
        >
          <Input.Password placeholder="Password" size="middle" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" block size="middle">
            {submitText}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

LoginForm.directiveName = 'login_form';
LoginForm.displayName = 'LoginForm';
export default LoginForm;
