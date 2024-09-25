import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TimeSheetService } from '../services/timesheet.services';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ChannelType, MezonClient } from 'mezon-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { User, WorkFromHome } from '../models';
import { Repository } from 'typeorm';
import { EMessageMode, EUserType } from '../constants/configs';
import { QuizService } from '../services/quiz.services';
import { UtilsService } from '../services/utils.services';
import { getUserNameByEmail } from '../utils/helper';
import moment from 'moment';

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
    @InjectRepository(WorkFromHome)
    private wfhRepository: Repository<WorkFromHome>,
  ) {
    this.client = clientService.getClient();
  }

  @Cron('*/5 9-11,13-17 * * 1-5')
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
          '(m_bot.createAt <= :thirtyMinutesAgo or m_bot.createAt is null)',
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
          '(last_message_time <= :thirtyMinutesAgo OR last_message_time is null)',
          { thirtyMinutesAgo },
        )
        .select('*')
        .execute();
      await Promise.all(
        userSend.map((user) =>
          this.quizeService.sendQuizToSingleUser(user, true),
        ),
      );
    } catch (error) {
      console.log(error);
    }
  }

  @Cron('*/1 9-11,13-17 * * 1-5')
  async punish() {
    if (await this.utilsService.checkHoliday()) return;
    if (this.utilsService.checkTime(new Date())) return;
    const wfhResult = await this.timeSheetService.findWFHUser();

    const wfhUserEmail = wfhResult.map((item) =>
      getUserNameByEmail(item.emailAddress),
    );
    const thirtyMinutes = Date.now() - 30 * 60 * 1000;

    if (wfhUserEmail.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin(
          'komu_userQuiz',
          'm_bot',
          'user.last_bot_message_id = "m_bot"."message_id"',
        )
        .where(
          wfhUserEmail && wfhUserEmail.length > 0
            ? 'user.email IN (:...wfhUserEmail)'
            : 'true',
          {
            wfhUserEmail: wfhUserEmail,
          },
        )
        .andWhere('user.deactive IS NOT True')
        .andWhere('user.user_type = :userType', { userType: EUserType.MEZON })
        .andWhere('user.botPing = :botPing', {
          botPing: true,
        })
        .andWhere('"last_bot_message_id" IS NOT Null')
        .andWhere(
          '(m_bot.createAt <= :thirtyMinutesAgo and m_bot.createAt >= :firstTime and m_bot.createAt <= :lastTime)',
          {
            thirtyMinutesAgo: thirtyMinutes,
            firstTime: this.utilsService.getTimeToDay(null).firstDay.getTime(),
            lastTime: this.utilsService.getTimeToDay(null).lastDay.getTime(),
          },
        )
        .select('*')
        .execute();

      users.foreach(async (user) => {
        const content = `@${user.username} không trả lời tin nhắn WFH lúc ${moment(
          parseInt(user.createAt.toString()),
        )
          .utcOffset(420)
          .format('YYYY-MM-DD HH:mm:ss')} !\n`;
        // await this.wfhRepository.save({
        //   userId: user.userId,
        //   wfhMsg: content,
        //   complain: false,
        //   pmconfirm: false,
        //   status: 'ACTIVE',
        //   type: 'wfh',
        //   createdAt: Date.now(),
        // });

        await this.client.sendMessage(
          process.env.KOMUBOTREST_CLAN_NCC_ID,
          '0',
          process.env.KOMUBOTREST_MACHLEO_CHANNEL_ID,
          EMessageMode.CHANNEL_MESSAGE,
          true,
          true,
          { t: content },
          [
            {
              user_id: user.userId,
              s: 0,
              e: user.userName.length + 1,
            },
          ],
        );

        await this.userRepository
          .createQueryBuilder('user')
          .update(User)
          .set({
            botPing: false,
          })
          .where(`"userId" = :userId`, { userId: user.userId })
          .andWhere(`"deactive" IS NOT TRUE`)
          .execute();
      });
    }
  }
}
