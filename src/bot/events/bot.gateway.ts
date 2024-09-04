import { Injectable, Logger } from '@nestjs/common';
import {
  ApiMessageReaction,
  MezonClient,
  Events,
  ChannelMessage,
} from 'mezon-sdk';

import {
  ChannelCreatedEvent,
  ChannelDeletedEvent,
  ChannelUpdatedEvent,
  UserChannelAddedEvent,
  UserChannelRemovedEvent,
  UserClanRemovedEvent,
} from 'mezon-sdk/dist/cjs/socket';
import { MezonClientService } from 'src/mezon/services/client.service';
import { Asterisk } from '../asterisk-commands/asterisk';
import { ReplyMezonMessage } from '../asterisk-commands/dto/replyMessage.dto';
import { ExtendersService } from '../services/extenders.services';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private client: MezonClient;

  constructor(
    private clientService: MezonClientService,
    private asteriskCommand: Asterisk,
    private extendersService: ExtendersService,
  ) {
    this.client = clientService.getClient();
  }

  initEvent() {
    for (const event in Events) {
      const eventValue = Events[event];
      this.logger.log(`Init event ${eventValue}`);
      const key = `handle${eventValue}`;
      if (key in this) {
        this.client.on(eventValue, this[key], this);
      }
    }
  }

  // processMessage(msg: ChannelMessage) {}

  private async handlemessagereaction(msg: ApiMessageReaction) {
    console.log('onmessagereaction', msg);
  }

  private async handlechannelcreated(user: ChannelCreatedEvent, add) {
    console.log('onchannelcreated', user, add);
  }

  private async handleuserclanremoved(user: UserClanRemovedEvent) {
    console.log('onuserclanremoved', user);
  }

  private async handleuserchanneladded(user: UserChannelAddedEvent) {
    console.log('onuserchanneladded', user);
  }

  private async handlechanneldeleted(channel: ChannelDeletedEvent) {
    console.log('onchanneldeleted', channel);
  }

  private async handlechannelupdated(channel: ChannelUpdatedEvent) {
    console.log('onchannelupdated', channel);
  }

  private async handleuserchannelremoved(msg: UserChannelRemovedEvent) {
    console.log('onuserchannelremoved', msg);
  }

  handlechannelmessage = async (msg: ChannelMessage) => {
    try {
      if (msg.sender_id) {
        await this.extendersService.addDBUser(msg);
      }
      const content = msg.content.t;
      let replyMessage: ReplyMezonMessage;

      if (typeof content == 'string' && content.trim()) {
        const firstLetter = content.trim()[0];
        switch (firstLetter) {
          case '*':
            replyMessage = await this.asteriskCommand.execute(content, msg);
            break;
          default:
            // console.log(msg);
        }

        if (replyMessage) {
          const replyMessageArray = Array.isArray(replyMessage)
            ? replyMessage
            : [replyMessage];
          for (const mess of replyMessageArray) {
            await this.client.sendMessage(
              mess.clan_id,
              mess.channel_id,
              mess.mode,
              mess.is_public,
              mess.msg,
              mess.mentions,
              mess.attachments,
              mess.ref,
            );
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  };
}
