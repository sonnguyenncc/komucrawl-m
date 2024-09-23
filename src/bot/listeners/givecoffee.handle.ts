import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from 'mezon-sdk';
import { BaseHandleEvent } from './base.handle';
import { MezonClientService } from 'src/mezon/services/client.service';
import { MentionSchedulerService } from '../scheduler/mention-scheduler.services';
import { ClientConfigService } from '../config/client-config.service';
import { EMessageMode } from '../constants/configs';

@Injectable()
export class EventGiveCoffee extends BaseHandleEvent {
  constructor(
    clientService: MezonClientService,
    private mentionSchedulerService: MentionSchedulerService,
    private clientConfig: ClientConfigService,
  ) {
    super(clientService);
  }

  @OnEvent(Events.GiveCoffee)
  async handleGiveCoffee(data) {
    try {
      const authorName = (
        await this.mentionSchedulerService.getUserData(data.sender_id)
      )?.userName;
      const userName = (
        await this.mentionSchedulerService.getUserData(data.receiver_id)
      )?.userName;

      if (!userName || !authorName) return;

      const firstText = `${authorName} just sent a coffee to `;
      const messageContent = firstText + `${userName}`;
      await this.client.sendMessage(
        data.clan_id,
        '0',
        this.clientConfig.welcomeChannelId,
        EMessageMode.CHANNEL_MESSAGE,
        true,
        true,
        {
          t: messageContent,
        },
        [
          { user_id: data.sender_id, s: 0, e: authorName.length },
          {
            user_id: data.receiver_id,
            s: firstText.length,
            e: firstText.length + userName.length,
          },
        ],
        [],
      );
    } catch (error) {
      console.log('give coffee', error);
    }
  }
}
