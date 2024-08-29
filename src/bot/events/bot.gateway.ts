import { Injectable, Logger } from '@nestjs/common';
import {
  ApiMessageReaction,
  MezonClient,
  ChannelMessage,
  Events,
} from 'mezon-sdk-test';
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
import { DailyCommand } from '../asterisk-commands/commands/daily/daily.command';
import { HelloCommand } from '../asterisk-commands/commands/hello/hello.command';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private client: MezonClient;
  private asteriskCommand: Asterisk;

  constructor(private clientService: MezonClientService) {
    this.client = clientService.getClient();
  }

  initEvent() {
    console.log(this.client);
    for (const event in Events) {
      const eventValue = Events[event];
      this.logger.log(`Init event ${eventValue}`);
      const key = `handle${eventValue}`;
      if (key in this) {
        this.client.on(eventValue, this[key]);
      }
    }

    const commands = [DailyCommand, HelloCommand];

    this.asteriskCommand = new Asterisk(commands);
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

  private handlechannelmessage = async (msg) => {
    this.asteriskCommand.process(msg, this.client);
  };
}
