import { Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { TimeSheetService } from '../services/timesheet.services';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ChannelType, MezonClient } from 'mezon-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models';
import { Repository } from 'typeorm';
import { EUserType } from '../constants/configs';
import { QuizService } from '../services/quiz.services';
import { UtilsService } from '../services/utils.services';

@Injectable()
export class WFHSchedulerService {
  private client: MezonClient;
  constructor(
    private timeSheetService: TimeSheetService,
    private utilsService: UtilsService,
    private clientService: MezonClientService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private quizeService: QuizService,
  ) {
    this.client = clientService.getClient();
  }

  // @Cron('*/5 9-11,13-17 * * 1-5')
  @Interval(10000)
  async handlePingWFH() {
    try {
      if (await this.utilsService.checkHoliday()) return;
      if (this.utilsService.checkTime(new Date())) return;
      const { notSendUser: userOff } =
        await this.timeSheetService.getUserOffWork(null);
      const userClans = await this.client.listChannelVoiceUsers(
        process.env.KOMUBOTREST_CLAN_NCC_ID,
        '',
        ChannelType.CHANNEL_TYPE_VOICE,
      );
      const displayNames = new Set();
      if ('voice_channel_users' in userClans) {
        userClans.voice_channel_users.forEach((user) =>
          displayNames.add(user.participant),
        );
      }

      let useridJoining = [];
      if (displayNames.size > 0) {
        const userIds = await this.userRepository
          .createQueryBuilder()
          .where('display_name IN (:...names)', {
            names: Array.from(displayNames),
          })
          .getMany();
        useridJoining = userIds.map((user) => user.userId);
      }
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      console.log(thirtyMinutesAgo);
      const userLastSend = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin(
          'komu_userQuiz',
          'm_bot',
          'user.last_bot_message_id = "m_bot"."message_id"',
        )
        .where(
          userOff && userOff.length > 0
            ? 'user.username NOT IN (:...userOff)'
            : 'true',
          {
            userOff: userOff,
          },
        )
        .andWhere(
          useridJoining && useridJoining.length > 0
            ? 'user.userId NOT IN (:...useridJoining)'
            : 'true',
          {
            useridJoining: useridJoining,
          },
        )
        .andWhere('user.user_type = :userType', {
          userType: EUserType.MEZON.toString(),
        })
        .andWhere('user.deactive IS NOT True')
        .andWhere('user.last_message_id IS Not Null')
        .andWhere(
          '(m_bot.createAt < :thirtyMinutesAgo or m_bot.createAt is null)',
          {
            thirtyMinutesAgo: thirtyMinutesAgo,
          },
        )
        .select('DISTINCT user.userId, user.username')
        .execute();
      const userLastSendIds = userLastSend.map((user) => user.userId);
      const userSend = await this.userRepository
        .createQueryBuilder('user')
        .where(
          userLastSendIds && userLastSendIds.length > 0
            ? '"userId" IN (:...userIds)'
            : 'true',
          {
            userIds: userLastSendIds,
          },
        )
        .andWhere('user.user_type = :userType', {
          userType: EUserType.MEZON.toString(),
        })
        .andWhere(
          '(last_message_time < :thirtyMinutesAgo OR last_message_time is null)',
          { thirtyMinutesAgo },
        )
        .select('*')
        .execute();
      console.log(userSend.map((user) => user.username));
      await Promise.all(
        userSend.map(
          (user) =>
            user.username == 'son.nguyenhoai' &&
            this.quizeService.sendQuizToSingleUser(user),
        ),
      );

      // console.log(userWFHIds);
      // const userWfhWithSomeCodition = await this.quizMsgRepository
      //   .createQueryBuilder()
      //   .where(
      //     userOff && userOff.length > 0
      //       ? '"username" NOT IN (:...userOff)'
      //       : 'true',
      //     {
      //       userOff: userOff,
      //     },
      //   )
      //   .andWhere(
      //     useridJoining && useridJoining.length > 0
      //       ? '"email" NOT IN (:...useridJoining)'
      //       : 'true',
      //     {
      //       useridJoining: useridJoining,
      //     },
      //   )
      //   .andWhere('"deactive" IS NOT True')
      //   .andWhere('("roles_discord" @> :intern OR "roles_discord" @> :staff)', {
      //     intern: ['INTERN'],
      //     staff: ['STAFF'],
      //   })
      //   .andWhere('"last_message_id" IS Not Null')
      //   .andWhere('"last_bot_message_id" IS Not Null')
      //   .select('*')
      //   .execute();
      // const thirtyMinutes = 1800000;

      // const messageBotUserEmail = arrayMessageBotUser.map(
      //   (item) => item.username,
      // );

      // if (messageBotUserEmail.length === 0) return;
      // const message_timestampUser = await this.userRepository
      //   .createQueryBuilder('user')
      //   .innerJoin('komu_msg', 'm', 'user.last_message_id = m.id')
      //   .where('"email" IN (:...messageBotUserEmail)', {
      //     messageBotUserEmail: messageBotUserEmail,
      //   })
      //   .select('*')
      //   .execute();

      // const coditionGetMessageTimeStamp = (user) => {
      //   let result = false;
      //   if (!user.createdTimestamp) {
      //     result = true;
      //   } else {
      //     if (Date.now() - user.createdTimestamp >= thirtyMinutes) {
      //       result = true;
      //     }
      //   }
      //   return result;
      // };
      // const arrayUser = message_timestampUser.filter((user) =>
      //   coditionGetMessageTimeStamp(user),
      // );
      // try {
      //   await Promise.all(
      //     arrayUser.map((userWfh) =>
      //       this.sendQuizToSingleUserService.sendQuizToSingleUser(
      //         client,
      //         userWfh,
      //         true,
      //         null,
      //       ),
      //     ),
      //   );
      // } catch (error) {
      //   console.log(error);
      // }
    } catch (error) {
      console.log(error);
    }
  }
}
