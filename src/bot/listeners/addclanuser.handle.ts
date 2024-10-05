import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from 'mezon-sdk';
import { BaseHandleEvent } from './base.handle';
import { MezonClientService } from 'src/mezon/services/client.service';
import { MentionSchedulerService } from '../scheduler/mention-scheduler.services';
import { ClientConfigService } from '../config/client-config.service';
import { MessageQueue } from '../services/messageQueue.service';
import { ChannelDMMezon } from '../models/channelDmMezon.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EventAddClanUser extends BaseHandleEvent {
  constructor(
    clientService: MezonClientService,
    @InjectRepository(ChannelDMMezon)
    private channelDmMezonRepository: Repository<ChannelDMMezon>,
  ) {
    super(clientService);
  }

  @OnEvent(Events.AddClanUser)
  async handleAddClanUser(data) {
    try {
      const DMchannel = await this.client.createDMchannel(data?.user?.user_id);
      if (!DMchannel) return;
      const dataInsert = {
        user_id: data?.user?.user_id,
        channel_id: DMchannel.channel_id,
        username: data?.user?.username,
      };
      
      await this.channelDmMezonRepository.insert(dataInsert);
    } catch (error) {
      console.log('give coffee', error);
    }
  }
}
