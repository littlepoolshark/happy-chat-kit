import { happyChatKit } from 'happy-chat-kit/preset';
import { RemarkDirectiveType } from 'happy-chat-kit';
import AgentName from './customComponents/AgentName';
import LoginForm from './customComponents/LoginForm';

happyChatKit.registerBatch([
  AgentName,
  { component: LoginForm, type: RemarkDirectiveType.Leaf },
]);

export const provider = happyChatKit.createProvider();
