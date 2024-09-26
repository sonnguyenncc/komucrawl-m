import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { UserStatusService } from '../user-status/userStatus.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/bot/models';
import { Repository } from 'typeorm';
import { EUserType } from 'src/bot/constants/configs';
import { EUserError } from 'src/bot/constants/error';

@Command('avatar')
export class AvatarCommand extends CommandMessage {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super();
  }

  async execute(args: string[], message: ChannelMessage) {
    let messageContent: string;
    let userQuery: string;

    if (Array.isArray(message.references) && message.references.length) {
      userQuery = message.references[0].message_sender_username;
    } else {
      userQuery = args.length ? args[0] : message.username;
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
