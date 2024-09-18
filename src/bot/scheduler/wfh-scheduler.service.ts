import { Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { UtilsService } from '../services/utils.services';
import { TimeSheetService } from '../services/timesheet.services';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ChannelType, MezonClient } from 'mezon-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMezon, QuizMsg, User } from '../models';
import { Repository } from 'typeorm';
import { getUserNameByEmail } from '../utils/helper';
import { EUserType } from '../constants/configs';

@Injectable()
export class WFHSchedulerService {
  private client: MezonClient;
  constructor(
    private utilsService: UtilsService,
    private timeSheetService: TimeSheetService,
    private clientService: MezonClientService,
    @InjectRepository(ChannelMezon)
    private channelRepository: Repository<ChannelMezon>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(QuizMsg)
    private quizMsgRepository: Repository<QuizMsg>,
  ) {
    this.client = clientService.getClient();
  }

  // @Cron('*/5 9-11,13-17 * * 1-5')
  @Interval(3000)
  async handlePingWFH() {
    try {
      // if (await this.utilsService.checkHoliday()) return;
      // if (this.utilsService.checkTime(new Date())) return;
      const { notSendUser: userOff } =
        await this.timeSheetService.getUserOffWork(null);
      // const clanIds = await this.channelRepository
      //   .createQueryBuilder('')
      //   .select('DISTINCT(clan_id)', 'clan_id')
      //   .getRawMany();
      const clanIds = ['1829369833536360448'];
      const userClans = await Promise.all(
        clanIds.map((clan) =>
          this.client.listChannelVoiceUsers(
            clan,
            '',
            ChannelType.CHANNEL_TYPE_VOICE,
          ),
        ),
      );

      const displayNames = new Set();
      userClans.forEach((users) =>
        users.voice_channel_users.map((user) =>
          displayNames.add(user.participant),
        ),
      );
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

      // const wfhResult = await this.timeSheetService.findWFHUser();

      // const wfhUserEmail = wfhResult.map((item) =>
      //   getUserNameByEmail(item.emailAddress),
      // );

      // if (
      //   (Array.isArray(wfhUserEmail) && wfhUserEmail.length === 0) ||
      //   !wfhUserEmail
      // ) {
      //   return;
      // }
      // console.log(wfhUserEmail, userOff);
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const userLastSend = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin(
          'komu_quizmsg',
          'm_bot',
          'user.last_bot_message_id = CAST("m_bot"."id" AS text)',
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
        // .andWhere('("roles_discord" @> :intern OR "roles_discord" @> :staff)', {
        //   intern: ['INTERN'],
        //   staff: ['STAFF'],
        // })
        .andWhere('user.last_message_id IS Not Null')
        .andWhere('user.last_bot_message_id IS Not Null')
        .andWhere('m_bot.created_at < :thirtyMinutesAgo', {
          thirtyMinutesAgo: new Date(thirtyMinutesAgo),
        })
        .select('*')
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
        .andWhere('last_message_time < :thirtyMinutesAgo', { thirtyMinutesAgo })
        .select('*')
        .execute();
      const userSendIds = userSend.map((user) => user.userId);
      console.log(userSendIds);
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
