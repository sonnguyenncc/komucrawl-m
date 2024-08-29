import { ChannelMessage } from 'mezon-sdk';
import { CommandMessage } from '../../abstracts/command.abstract';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/bot/models';
import { dailyHelp } from './daily.constants';
import { Command } from 'src/bot/base/commandRegister.decorator';

@Command('daily')
export class DailyCommand extends CommandMessage {
  constructor(
    // private readonly dailyService: DailyService,
    // private readonly utilsService: UtilsService,
    // private komubotrestService: KomubotrestService,
    // private readonly http: HttpService,
    // private configService: ClientConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super();
  }

  async execute(args: string[], message: ChannelMessage) {
    const senderId = message.sender_id;
    const findUser = await this.userRepository
      .createQueryBuilder()
      .where(`"userId" = :userId`, { userId: senderId })
      .andWhere(`"deactive" IS NOT true`)
      .select('*')
      .getRawOne();

    if (!findUser) {
      const newUser = new User();
      newUser.userId = senderId; // Thay đổi thuộc tính tùy thuộc vào cấu trúc của User entity
      newUser.username = message.username;
      newUser.discriminator = '0'; // Cập nhật thuộc tính khác nếu cần
      newUser.avatar = message.avatar;
      newUser.bot = false;
      newUser.system = false;
      newUser.email = message.username;
      newUser.flags = 0;
      newUser.last_message_id = message.message_id;
      newUser.scores_quiz = 0;
      newUser.deactive = false;
      newUser.botPing = false;
      newUser.scores_workout = 0;
      newUser.not_workout = 0;
      // Chèn dữ liệu vào bảng
      await this.userRepository.save(newUser);
    }

    if (args[0] === 'help') {
      return this.helpRequired(message);
    } else {
    }
  }

  helpRequired(message: ChannelMessage) {
    return this.replyMessageGenerate({ messageContent: dailyHelp }, message);
  }
}
