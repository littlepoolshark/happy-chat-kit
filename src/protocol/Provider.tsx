import { ChatKit } from '../core/class';
import { Answer } from './UIManager/implement/Answer';
import { Heartbeat } from './UIManager/implement/Heartbeat';
import { TOC } from './UIManager/implement/TOC';
import RenderErrorAlert from './RenderErrorAlert';

export const happyChatKit = new ChatKit([new Answer(), new Heartbeat(), new TOC()], {
  errorFallbackUI: RenderErrorAlert,
});
