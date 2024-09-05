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
import { ExtendersService } from '../services/extenders.services';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private client: MezonClient;

  constructor(
    private clientService: MezonClientService,

    private extendersService: ExtendersService,
    private eventEmitter: EventEmitter2,
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

      this.eventEmitter.emit(Events.ChannelMessage, msg);
    } catch (e) {
      console.log(e);
    }
  };
}
