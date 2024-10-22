import { Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { EUserType } from '../constants/configs';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ChannelDMMezon } from '../models/channelDmMezon.entity';
import { ChannelMezon } from '../models';

@Injectable()
export class ExtendersService {
  private client: MezonClient;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clientService: MezonClientService,
    @InjectRepository(ChannelDMMezon)
    private channelDmMezonRepository: Repository<ChannelDMMezon>,
    @InjectRepository(ChannelMezon)
    private mezonChannelRepository: Repository<ChannelMezon>,
  ) {
    this.client = this.clientService.getClient();
    this.initializeChannelDm();
  }

  async initializeChannelDm() {
    try {
      const channels = await this.channelDmMezonRepository.find();
      const privateChannels = await this.mezonChannelRepository.find({
        where: {
          channel_private: 1,
          clan_id: process.env.KOMUBOTREST_CLAN_NCC_ID,
          channel_label: Not(IsNull()) && Not(''),
        },
      });
      await Promise.all([
        ...channels.map((channel) =>
          this.client.joinChat('0', channel.channel_id, 3, false),
        ),
        ...privateChannels.map((channel) =>
          this.client.joinChat(channel.clan_id, channel.channel_id, 1, false),
        ),
      ]);
    } catch (error) {
      console.log('initializeChannelDm error', error);
    }
  }

  async addDBUser(message: ChannelMessage) {
    if (message.sender_id === '1767478432163172999') return; // ignored anonymous user
    const findUser = await this.userRepository.findOne({
      where: { userId: message.sender_id },
    });

    if (findUser) {
      findUser.userId = message.sender_id;
      findUser.username = message.username;
      findUser.discriminator = '0';
      findUser.avatar = message.avatar;
      findUser.bot = false;
      findUser.system = false;
      findUser.email = message.username;
      findUser.display_name = message.display_name ?? '';
      findUser.clan_nick = message.clan_nick ?? '';
      findUser.user_type = EUserType.MEZON;
      findUser.flags = 0;
      findUser.last_message_id = message.message_id;
      findUser.last_message_time = Date.now();
      findUser.deactive = false;
      findUser.botPing = findUser.botPing;
      findUser.scores_workout = 0;
      findUser.not_workout = 0;
      await this.userRepository.save(findUser);
      return;
    }

    const komuUser = {
      userId: message.sender_id,
      username: message.username,
      discriminator: '0',
      avatar: message.avatar,
      bot: false,
      system: false,
      email: message.username,
      display_name: message.display_name ?? '',
      clan_nick: message.clan_nick ?? '',
      flags: 0,
      last_message_id: message.message_id,
      last_message_time: Date.now(),
      scores_quiz: 0,
      deactive: false,
      botPing: false,
      scores_workout: 0,
      not_workout: 0,
      user_type: EUserType.MEZON,
      createdAt: Date.now(),
    };

    await this.userRepository.insert(komuUser);
  }
}
