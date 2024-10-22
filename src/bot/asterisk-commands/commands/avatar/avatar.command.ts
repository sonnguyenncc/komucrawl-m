import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { UserStatusService } from '../user-status/userStatus.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/bot/models';
import { Repository } from 'typeorm';
import { EUserType } from 'src/bot/constants/configs';
import { EUserError } from 'src/bot/constants/error';
import { MezonClientService } from 'src/mezon/services/client.service';

@Command('avatar')
export class AvatarCommand extends CommandMessage {
  private client: MezonClient;
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clientService: MezonClientService,
  ) {
    super();
    this.client = this.clientService.getClient();
  }

  async execute(args: string[], message: ChannelMessage) {
    if (args[0] === 'test') {
      const array = [
        '1833315823393968128',
        '1841671940910092288',
        '1833316598400684032',
        '1831543728112668672',
        '1840934248442236928',
        '1831558245743857664',
        '1838399152342437888',
        '1833152700116635648',
        '1834122395858767872',
      ];
      array.map(async (channelId) => {
        console.log('channelId', channelId);
        try {
          await this.client.joinChat(
            process.env.KOMUBOTREST_CLAN_NCC_ID,
            channelId,
            1,
            false,
          );
        } catch (error) {
          console.log('error privateChannelArrayTemp', channelId);
        }
      });
      return [];
    }
    let messageContent: string;
    let userQuery: string;

    if (Array.isArray(message.references) && message.references.length) {
      userQuery = message.references[0].message_sender_username;
    } else {
      if (
        Array.isArray(message.mentions) &&
        message.mentions.length &&
        args[0]?.startsWith('@')
      ) {
        const findUser = await this.userRepository.findOne({
          where: {
            userId: message.mentions[0].user_id,
            user_type: EUserType.MEZON,
          },
        });
        userQuery = findUser.username;
      } else {
        userQuery = args.length ? args[0] : message.username;
      }

      //check fist arg
      const findUserArg = await this.userRepository
        .createQueryBuilder('user')
        .where(
          '(user.email = :query OR user.username = :query OR user.userId = :query)',
          { query: args[0] },
        )
        .andWhere('user.user_type = :userType', { userType: EUserType.MEZON })
        .getOne();
      if (findUserArg) {
        userQuery = findUserArg.username;
      }
    }

    const findUser = await this.userRepository.findOne({
      where: { username: userQuery, user_type: EUserType.MEZON },
    });

    if (!findUser)
      return this.replyMessageGenerate(
        {
          messageContent: EUserError.INVALID_USER,
          mk: [{ type: 't', s: 0, e: EUserError.INVALID_USER.length }],
        },
        message,
      );
    messageContent = findUser.avatar + '';
    return this.replyMessageGenerate(
      {
        attachments: [
          {
            url: findUser.avatar + '',
            filetype: 'image/jpeg',
          },
        ],
      },
      message,
    );
  }
}
