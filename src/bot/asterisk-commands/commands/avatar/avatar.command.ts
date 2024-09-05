import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { UserStatusService } from '../user-status/userStatus.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/bot/models';
import { Repository } from 'typeorm';

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
    let queryUser: string;

    if (args.length) {
      queryUser = message.references.length
        ? message.references[0].message_sender_username
        : args[0];
    } else {
      queryUser = message.sender_id;
    }

    const findUser = await this.userRepository.findOne({
      where: args.length ? { username: queryUser } : { userId: queryUser },
    });

    if (!findUser) return;
    messageContent = findUser.avatar + '';
    return this.replyMessageGenerate({ messageContent }, message);
  }
}
