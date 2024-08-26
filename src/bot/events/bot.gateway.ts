import { Injectable, Logger } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk';
import { ClientService } from 'src/mezon/services/client.service';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private client: MezonClient;
  private eventAndHandles = [
    'messagereaction',
    'channelcreated',
    'userclanremoved',
    'userchanneladded',
    'channelcreated',
    'channeldeleted',
    'channelupdated',
    'channelmessage',
  ];
  constructor(private clientService: ClientService) {
    this.client = clientService.getClient();
  }

  initEvent() {
    this.eventAndHandles.forEach((item) => {
      console.log(item);
      this.client[`on${item}`] = this[`handle${item}`];
    });
    console.log(this.client);
  }

  private async handlemessagereaction(msg) {
    console.log('onmessagereaction', msg);
  }

  private async handlechannelcreated(user, add) {
    console.log('onchannelcreated', user, add);
  }

  private async handleuserclanremoved(user) {
    console.log('onuserclanremoved', user);
  }

  private async handleuserchanneladded(user) {
    console.log('onuserchanneladded', user);
  }

  private async handlechanneldeleted(channel) {
    console.log('onchanneldeleted', channel);
  }

  private async handlechannelupdated(channel) {
    console.log('onchannelupdated', channel);
  }

  private async handleuserchannelremoved(msg) {
    console.log('onuserchannelremoved', msg);
  }

  private async handlechannelmessage(msg) {
    console.log(msg);
  }
}
