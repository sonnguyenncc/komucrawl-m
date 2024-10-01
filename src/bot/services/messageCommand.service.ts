import { Injectable } from '@nestjs/common';
import { MessageQueue } from './messageQueue.service';
import { MezonClientService } from 'src/mezon/services/client.service';

@Injectable()
export class MessageCommand {
  constructor(
    private readonly messageQueue: MessageQueue,
    private clientService: MezonClientService,
  ) {
    this.handleCommandMessage();
  }

  private handleCommandMessage() {
    setInterval(async () => {
      if (this.messageQueue.hasMessages()) {
        const message = this.messageQueue.getNextMessage();
        if (message) {
          if (message.userId) {
            await this.clientService.sendMessageToUser(message);
          } else {
            await this.clientService.sendMessage(message);
          }
        }
      }
    }, 400);
  }
}
