import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentioned } from 'src/bot/models/mentioned.entity';
import moment from 'moment';
import { WorkFromHome } from 'src/bot/models/wfh.entity';
import { User } from 'src/bot/models/user.entity';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { UtilsService } from 'src/bot/services/utils.services';
import { MezonClientService } from 'src/mezon/services/client.service';
import { EMarkdownType, MezonClient } from 'mezon-sdk';
import { EMessageMode, EUserType } from '../constants/configs';

@Injectable()
export class MentionSchedulerService {
  private client: MezonClient;
  constructor(
    private utilsService: UtilsService,
    @InjectRepository(Mentioned)
    private mentionRepository: Repository<Mentioned>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WorkFromHome)
    private wfhRepository: Repository<WorkFromHome>,
    private schedulerRegistry: SchedulerRegistry,
    private clientConfig: ClientConfigService,
    private clientService: MezonClientService,
  ) {
    this.client = this.clientService.getClient();
  }

  private readonly logger = new Logger(MentionSchedulerService.name);

  addCronJob(name: string, time: string, callback: () => void): void {
    const job = new CronJob(
      time,
      () => {
        this.logger.warn(`time (${time}) for job ${name} to run!`);
        callback();
      },
      null,
      true,
      'Asia/Ho_Chi_Minh',
    );

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.warn(`job ${name} added for each minute at ${time} seconds!`);
  }

  // Start cron job
  startCronJobs(): void {
    this.addCronJob('checkMention', '*/1 9-11,13-17 * * 1-5', () =>
      this.checkMention(),
    );
  }

  async notifyUser(user) {
    try {
      const authorName = (await this.getUserData(user.authorId)).userName;
      const threadNoti = false;
      const textContent = `Hãy trả lời ${authorName} tại ${
        threadNoti ? 'thread' : 'channel'
      } `;
      await this.client.sendMessageUser(
        user.mentionUserId,
        textContent + `#` + ` nhé!`,
        {
          hg: [
            {
              channelid: user.channelId,
              s: textContent.length,
              e: textContent.length + 1,
            },
          ],
        },
      );
      await this.mentionRepository.update({ id: user.id }, { noti: true });
    } catch (error) {
      console.log(error);
    }
  }

  async processNotiUsers(mentionedUsers) {
    const millisecondsOfTwentyfiveMinutes = 1500000;
    const millisecondsOfThirtyMinutes = 1800000;
    const dateNow = Date.now();

    const notiUser = mentionedUsers.filter((item) => {
      return (
        dateNow - item.createdTimestamp >= millisecondsOfTwentyfiveMinutes &&
        dateNow - item.createdTimestamp < millisecondsOfThirtyMinutes &&
        !item.noti
      );
    });
    await Promise.all(notiUser.map((user) => this.notifyUser(user)));

    const filteredMentionedUsers = mentionedUsers.filter(
      (item) => dateNow - item.createdTimestamp >= millisecondsOfThirtyMinutes,
    );

    return filteredMentionedUsers;
  }

  async getUserData(userId: string) {
    try {
      const userData = await this.userRepository.findOne({
        where: { userId, user_type: EUserType.MEZON },
      });
      return {
        userData,
        userName:
          userData?.clan_nick || userData?.display_name || userData?.username,
      };
    } catch (error) {
      console.log('error', error);
    }
  }

  async createWFHWarning(user, thread) {
    try {
      const { userData, userName } = await this.getUserData(user.mentionUserId);
      const authorName = (await this.getUserData(user.authorId)).userName;

      const timestamp = moment(parseInt(user.createdTimestamp.toString()))
        .utcOffset(420)
        .format('YYYY-MM-DD HH:mm:ss');

      const content = `${userName} không trả lời tin nhắn mention của ${authorName} lúc ${timestamp} tại ${thread ? 'thread' : 'channel'} `;
      const textConfirm = '`React ❌ to Complain or ✅ to Accept`';

      const data = await this.wfhRepository.save({
        user: userData,
        wfhMsg: content,
        complain: false,
        pmconfirm: false,
        status: 'ACTIVE',
        type: 'mention',
        createdAt: Date.now(),
      });

      // send message to channel machleo
      await this.client.sendMessage(
        this.clientConfig.clandNccId,
        '0',
        this.clientConfig.machleoChannelId,
        EMessageMode.CHANNEL_MESSAGE,
        true,
        true,
        {
          t: content + '#!\n' + textConfirm,
          mk: [
            {
              type: EMarkdownType.SINGLE,
              s: content.length + 3,
              e: content.length + 3 + textConfirm.length,
            },
          ],
          hg: [
            {
              channelid: user.channelId,
              s: content.length,
              e: content.length + 1,
            },
          ],
        },
        [
          { user_id: user.mentionUserId, s: 0, e: userName.length },
          {
            user_id: user.authorId,
            s: userName.length + 36,
            e: userName.length + 36 + authorName.length,
          },
        ],
      );

      // update user punish
      await this.mentionRepository.update(
        { id: user.id },
        { confirm: true, punish: true },
      );
    } catch (error) {
      console.log(error);
    }
  }

  async processMentionedUsers(mentionedUsers) {
    try {
      await Promise.all(
        mentionedUsers.map(async (user) => {
          let thread = false;
          await this.createWFHWarning(user, thread);
        }),
      );
    } catch (error) {
      console.log('error', error);
    }
  }

  async checkMention() {
    if (await this.utilsService.checkHoliday()) return;
    if (this.utilsService.checkTime(new Date())) return;
    try {
      let mentionedUsers = await this.mentionRepository.find({
        where: { confirm: false },
      });

      // send noti for user mentioned
      const filteredMentionedUsers =
        await this.processNotiUsers(mentionedUsers);

      await this.processMentionedUsers(filteredMentionedUsers);
    } catch (error) {
      console.log(error);
    }
  }
}
