import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageReaction, ChannelType, Events } from 'mezon-sdk';
import { Mentioned, MentionedPmConfirm, User, WorkFromHome } from '../models';
import { Repository } from 'typeorm';
import { BaseHandleEvent } from './base.handle';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ApiCreateChannelDescRequest } from 'mezon-sdk/dist/cjs/interfaces/client';
import { BOT_ID, EMessageMode, EUserType } from '../constants/configs';
import { ClientConfigService } from '../config/client-config.service';
import { AxiosClientService } from '../services/axiosClient.services';
import { MentionSchedulerService } from '../scheduler/mention-scheduler.services';
import { ReplyMezonMessage } from '../asterisk-commands/dto/replyMessage.dto';
import { MessageQueue } from '../services/messageQueue.service';

@Injectable()
export class EventListenerMessageReaction extends BaseHandleEvent {
  constructor(
    clientService: MezonClientService,
    @InjectRepository(Mentioned)
    private mentionedRepository: Repository<Mentioned>,
    @InjectRepository(WorkFromHome)
    private wfhRepository: Repository<WorkFromHome>,
    private clientConfig: ClientConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(MentionedPmConfirm)
    private mentionPmConfirm: Repository<MentionedPmConfirm>,
    private axiosClientService: AxiosClientService,
    private mentionSchedulerService: MentionSchedulerService,
    private messageQueue: MessageQueue,
  ) {
    super(clientService);
  }

  @OnEvent(Events.MessageReaction)
  async handleReactMessageMention(messageReaction: ApiMessageReaction) {
    // try {
    //   const { message, emoji } = messageReaction;
    //   const chid = message.channel.id;
    //   const messageId = message.id;
    //   const guildId = message.guildId;
    //   const createdTimestamp = message.createdTimestamp;
    //   let channel = message.channel;

    //   if (!message.guildId) return;

    //   const fetchMessage = await message.client.channels.fetch(
    //     message.channelId,
    //   );

    //   const msg = await (fetchMessage as any).messages.fetch(message.id);
    //   // if ((channel as any).type !== ChannelType.GuildCategory) {
    //   //   (channel as any) = await message.client.channels.fetch(
    //   //     (channel as any).parentId
    //   //   );
    //   // }

    //   if (
    //     channel.type === ChannelType.GuildPublicThread ||
    //     channel.type === ChannelType.GuildPrivateThread
    //   ) {
    //     const channelParent = await message.client.channels.fetch(
    //       channel.parentId,
    //     );
    //     channel = (await message.client.channels.fetch(
    //       (channelParent as any).parentId,
    //     )) as any;
    //   } else if (channel.type === ChannelType.GuildText) {
    //     channel = (await message.client.channels.fetch(
    //       channel.parentId,
    //     )) as any;
    //   }

    //   const checkCategories = [
    //     'PROJECTS',
    //     'PROJECTS-EXT',
    //     'PRODUCTS',
    //     'LOREN',
    //     'HRM&IT',
    //     'SAODO',
    //     'MANAGEMENT',
    //   ];

    //   let validCategory;
    //   if ((channel as any).name.slice(0, 4).toUpperCase() === 'PRJ-') {
    //     validCategory = true;
    //   } else {
    //     validCategory = checkCategories.includes(
    //       (channel as any).name.toUpperCase(),
    //     );
    //   }

    //   if (
    //     validCategory &&
    //     message.channelId !== '921339190090797106' &&
    //     msg.author.id != '922003239887581205'
    //   ) {
    //     const userDiscord = await message.client.users.fetch(msg.author.id);
    //     userDiscord
    //       .send(
    //         `${user.username} react ${emoji.name} on your comment ${message.url}`,
    //       )
    //       .catch((err) => console.log(err));
    //   }

    //   const resolveMention = message.mentions.users.find(
    //     (current) => current.id === user.id,
    //   );

    //   if (resolveMention) {

    // this.client.sendMessage()
    // const data: ApiCreateChannelDescRequest = {
    //   clan_id: '0',
    //   channel_id: '0',
    //   category_id: '0',
    //   type: ChannelType.CHANNEL_TYPE_DM,
    //   user_ids: [messageReaction.sender_id, BOT_ID],
    // };
    // try {
    //   const result = await this.client.createChannelDesc(data);
    // } catch (e) {
    //   console.log(e);
    // }

    await this.mentionedRepository
      .createQueryBuilder()
      .update(Mentioned)
      .set({ confirm: true, reactionTimestamp: Date.now() })
      .where(`"messageId" = :messageId`, {
        messageId: messageReaction.message_id,
      })
      .andWhere(`"mentionUserId" = :mentionUserId`, {
        mentionUserId: messageReaction.sender_id,
      })
      .andWhere(`"reactionTimestamp" IS NULL`)
      // .andWhere('"authorId" != :authorId', {
      //   authorId: this.clientConfig.botKomuId,
      // })
      .execute();

    // TODO: apply react confirm
    // await this.handleReactionMentonMessage(messageReaction);
    // await this.handlePmConfirmWfh(messageReaction);

    // const dataBwl = await this.bwlReactionRepository.findOne({
    //   relations: ["bwl", "author", "channel"],
    //   where: {
    //     guildId: guildId,
    //     // bwl: messageId,
    //     bwl: {
    //       messageId: messageId,
    //     },
    //     author: {
    //       userId: user.id,
    //     },
    //     channel: { id: chid },
    //   },
    // });

    // if (dataBwl != null) {
    //   await this.bwlReactionRepository
    //     .createQueryBuilder()
    //     .update(BwlReaction)
    //     .set({ count: dataBwl.count + 1 })
    //     .where("id = :id", { id: dataBwl.id })
    //     .execute();
    //   return;
    // }

    //   const bwl = await this.bwlRepository.findOne({
    //     where: {
    //       messageId: messageId,
    //     },
    //   });
    //   const userInsert = await this.userRepository.findOne({
    //     where: {
    //       userId: user.id,
    //     },
    //   });
    //   const channelInsert = await this.channelRepository.findOne({
    //     where: {
    //       id: chid,
    //     },
    //   });

    //   await this.bwlReactionRepository.insert({
    //     channel: channelInsert,
    //     guildId: guildId,
    //     bwl: bwl,
    //     author: userInsert,
    //     emoji: emoji.name,
    //     count: 1,
    //     createdTimestamp: createdTimestamp,
    //   });
    // } catch (error) {}
  }

  async handleReactionMentonMessage(messageReaction: ApiMessageReaction) {
    try {
      const data = await this.mentionedRepository
        .createQueryBuilder('mention')
        .where('mention.messageId = :messageId', {
          messageId: messageReaction.message_id,
        })
        .andWhere('mention.authorId = :authorId', {
          authorId: this.clientConfig.botKomuId,
        })
        .andWhere('mention.channelId = :channelId', {
          channelId: this.clientConfig.machleoChannelId,
        })
        .andWhere('mention.mentionUserId = :mentionUserId', {
          mentionUserId: messageReaction.sender_id,
        })
        .andWhere('mention.reactionTimestamp IS NULL')
        .getOne();
      console.log('data', data);

      if (!data || !['checked', 'x'].includes(messageReaction.emoji)) return;
      this.mentionedRepository.update(
        { messageId: messageReaction.message_id },
        { reactionTimestamp: new Date().getTime() },
      );
      if (messageReaction.emoji === 'checked') {
        await this.wfhRepository
          .createQueryBuilder()
          .update(WorkFromHome)
          .set({
            pmconfirm: false,
            data: 'komu_wfh_accept',
            status: 'ACCEPT',
          })
          .where(`"userId" = :userId`, { userId: data.mentionUserId })
          .execute();
        const messageToUser: ReplyMezonMessage = {
          userId: data.mentionUserId,
          textContent: 'You just accepted the machleo punishment. Thanks!!!',
        };
        this.messageQueue.addMessage(messageToUser);
        // await this.client.sendMessageUser(
        //   data.mentionUserId,
        //   'You just accepted the machleo punishment. Thanks!!!',
        // );
      } else {
        const wfhdata = await this.wfhRepository.findOne({
          where: {
            createdAt: data.createdTimestamp,
          },
        });
        if (!wfhdata) {
          const messageToUser: ReplyMezonMessage = {
            userId: data.mentionUserId,
            textContent: 'No WFH found',
          };
          this.messageQueue.addMessage(messageToUser);
          // await this.client.sendMessageUser(data.mentionUserId, 'No WFH found');
          return;
        }
        const msec = (new Date() as any) - (new Date(wfhdata.createdAt) as any);
        if (msec > 3600000) {
          const messageToUser: ReplyMezonMessage = {
            userId: data.mentionUserId,
            textContent:
              'WFH complain is expired. You have an hour to request.',
          };
          this.messageQueue.addMessage(messageToUser);
          // await this.client.sendMessageUser(
          //   data.mentionUserId,
          //   'WFH complain is expired. You have an hour to request.',
          // );
          return;
        }

        if (wfhdata.complain) {
          const messageToUser: ReplyMezonMessage = {
            userId: data.mentionUserId,
            textContent: 'You have already complained.',
          };
          this.messageQueue.addMessage(messageToUser);
          // await this.client.sendMessageUser(
          //   data.mentionUserId,
          //   'You have already complained.',
          // );
          return;
        }

        const userdb = await this.userRepository
          .createQueryBuilder()
          .where(`"userId" = :userId`, { userId: data.mentionUserId })
          .andWhere('"deactive" IS NOT True')
          .andWhere(`"user_type" = :user_type`, { user_type: EUserType.MEZON })
          .select('*')
          .getRawOne();
        if (!userdb) {
          const messageToUser: ReplyMezonMessage = {
            userId: data.mentionUserId,
            textContent: 'User is not valid',
          };
          this.messageQueue.addMessage(messageToUser);
          // await this.client.sendMessageUser(
          //   data.mentionUserId,
          //   'User is not valid',
          // );
          return;
        }
        const url = encodeURI(
          `${this.clientConfig.wiki.api_url}${userdb.email}@ncc.asia`,
        );
        const response = await this.axiosClientService.get(url, {
          httpsAgent: this.clientConfig.https,
          headers: {
            'X-Secret-Key': this.clientConfig.wikiApiKeySecret,
          },
        });
        if (
          response.data == null ||
          response.data == undefined ||
          response.data.result == null ||
          response.data.result == undefined ||
          response.data.result.projectDtos == undefined ||
          response.data.result.projectDtos.length == 0
        ) {
          let msg = `There is no PM to confirm for **${userdb.email}**. Please contact to your PM`;
          const messageToUser: ReplyMezonMessage = {
            userId: data.mentionUserId,
            textContent: msg,
          };
          this.messageQueue.addMessage(messageToUser);
          return;
          // return await this.client.sendMessageUser(data.mentionUserId, msg);
        }

        const pmdb = await this.userRepository
          .createQueryBuilder()
          .where(`("username" = :username or "email" = :email)`, {
            username: response.data.result.projectDtos[0].pmUsername,
            email: response.data.result.projectDtos[0].pmUsername,
          })
          .andWhere(`"deactive" IS NOT true`)
          .andWhere(`"user_type" = :user_type`, { user_type: EUserType.MEZON })
          .select('*')
          .getRawOne();

        // to test
        // const pmdb = await this.userRepository
        //   .createQueryBuilder()
        //   .where(`"userId" = :userId`, { userId: '1827994776956309504' })
        //   .andWhere('"deactive" IS NOT True')
        //   .andWhere(`"user_type" = :user_type`, { user_type: EUserType.MEZON })
        //   .select('*')
        //   .getRawOne();

        if (!pmdb) {
          const messageToUser: ReplyMezonMessage = {
            userId: data.mentionUserId,
            textContent: `Cannot fetch data for PM ${response.data.result.projectDtos[0].pmUsername}`,
          };
          this.messageQueue.addMessage(messageToUser);
          return;
          // return await this.client.sendMessageUser(
          //   data.mentionUserId,
          //   `Cannot fetch data for PM ${response.data.result.projectDtos[0].pmUsername}`,
          // );
        }
        const contentMessage =
          '```' +
          `[CONFIRM WFH] [ID:${wfhdata.id}]` +
          `\n` +
          `<@${userdb.username}> just sent WFH complain. Please check?\n`;
        const confirmText = 'React ❌ to Reject or ✅ to Confirm```';
        const messageToUser: ReplyMezonMessage = {
          userId: pmdb.userId,
          textContent: contentMessage + confirmText,
          messOptions: {
            mk: [
              {
                type: 't',
                s: 0,
                e: contentMessage.length + confirmText.length,
              },
            ],
          },
        };
        this.messageQueue.addMessage(messageToUser);
        // const dataMess = await this.client.sendMessageUser(
        //   pmdb.userId,
        //   contentMessage + confirmText,
        //   {
        //     mk: [
        //       {
        //         type: 't',
        //         s: 0,
        //         e: contentMessage.length + confirmText.length,
        //       },
        //     ],
        //   },
        // );

        await this.wfhRepository.update({ id: wfhdata.id }, { complain: true });
        // await this.client.sendMessageUser(
        //   userdb.userId,
        //   `${userdb.username} your WFH complain is sent to ${pmdb.username}.`,
        // );
        const messageToUserError: ReplyMezonMessage = {
          userId: userdb.userId,
          textContent: `${userdb.username} your WFH complain is sent to ${pmdb.username}.`,
        };
        this.messageQueue.addMessage(messageToUserError);
      }
    } catch (error) {
      console.log('handleReactionMentonMessage', error);
    }
  }

  async handlePmConfirmWfh(messageReaction: ApiMessageReaction) {
    try {
      const data = await this.mentionPmConfirm.findOne({
        where: { messageId: messageReaction.message_id, confirm: false },
      });
      if (!data || !['checked', 'x'].includes(messageReaction.emoji)) return;
      this.mentionPmConfirm.update(
        { messageId: messageReaction.message_id },
        {
          confirm: true,
          confirmAt: new Date().getTime(),
          value: messageReaction.emoji === 'checked' ? 'CONFIRM' : 'REJECT',
        },
      );
      const dataWfh = await this.wfhRepository.findOne({
        where: { id: data.wfhId },
      });
      const dataMention = await this.mentionedRepository.findOne({
        where: { createdTimestamp: dataWfh.createdAt },
      });

      const userId = dataMention.mentionUserId;
      const pmId = messageReaction.sender_id;
      const typeConfirm =
        messageReaction.emoji === 'checked' ? 'Confirmed' : 'Rejected';

      const dataBot = await this.userRepository.findOne({
        where: {
          userId: this.clientConfig.botKomuId,
        },
      });

      const pmUsername = (await this.mentionSchedulerService.getUserData(pmId))
        ?.userName;
      const username = (await this.mentionSchedulerService.getUserData(userId))
        ?.userName;
      if (!username || !pmUsername) return;

      const text = `${pmUsername} just ${typeConfirm} WFH complain from `;
      const messageContent = text + `${username}`;

      const replyMessage: ReplyMezonMessage = {
        clan_id: this.clientConfig.clandNccId,
        channel_id: this.clientConfig.machleoChannelId,
        is_public: true,
        is_parent_public: true,
        parent_id: '0',
        mode: EMessageMode.CHANNEL_MESSAGE,
        msg: {
          t: messageContent,
        },
        mentions: [
          { user_id: pmId, s: 0, e: pmUsername.length },
          {
            user_id: userId,
            s: text.length,
            e: text.length + username.length,
          },
        ],
        attachments: [],
        ref: [
          {
            message_ref_id: dataMention.messageId,
            message_sender_id: this.clientConfig.botKomuId,
            content: dataWfh.wfhMsg,
            ref_type: 0,
            message_sender_username: dataBot.username,
            mesages_sender_avatar: dataBot.avatar,
            message_sender_clan_nick: dataBot.clan_nick,
            message_sender_display_name: dataBot.display_name,
            has_attachment: false,
          },
        ],
      };
      this.messageQueue.addMessage(replyMessage);

      // await this.client.sendMessage(
      //   this.clientConfig.clandNccId,
      //   '0',
      //   this.clientConfig.machleoChannelId,
      //   EMessageMode.CHANNEL_MESSAGE,
      //   true,
      //   true,
      //   {
      //     t: messageContent,
      //   },
      //   [
      //     { user_id: pmId, s: 0, e: pmUsername.length },
      //     {
      //       user_id: userId,
      //       s: text.length,
      //       e: text.length + username.length,
      //     },
      //   ],
      //   [],
      //   [
      //     {
      //       message_ref_id: dataMention.messageId,
      //       message_sender_id: this.clientConfig.botKomuId,
      //       content: dataWfh.wfhMsg,
      //       ref_type: 0,
      //       message_sender_username: dataBot.username,
      //       mesages_sender_avatar: dataBot.avatar,
      //       message_sender_clan_nick: dataBot.clan_nick,
      //       message_sender_display_name: dataBot.display_name,
      //       has_attachment: false,
      //     },
      //   ],
      // );

      await this.wfhRepository
        .createQueryBuilder()
        .update(WorkFromHome)
        .set({
          pmconfirm: typeConfirm === 'Confirmed',
          data: messageContent,
          status: 'APPROVED',
        })
        .where(`"id" = :id`, {
          id: data.wfhId,
        })
        .execute();
      const messageToUser: ReplyMezonMessage = {
        userId: pmId,
        textContent: `You just ${typeConfirm} WFH complain for ${username}`,
      };
      this.messageQueue.addMessage(messageToUser);
      // await this.client.sendMessageUser(
      //   pmId,
      //   `You just ${typeConfirm} WFH complain for ${username}`,
      // );
    } catch (error) {
      console.log('handlePmConfirmWfh', error);
    }
  }
}
