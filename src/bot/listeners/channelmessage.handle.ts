import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Events,
  ChannelMessage,
  MezonClient,
  ChannelStreamMode,
} from 'mezon-sdk';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ReplyMezonMessage } from '../asterisk-commands/dto/replyMessage.dto';
import { Asterisk } from '../asterisk-commands/asterisk';
import { Repository } from 'typeorm';
import { checkTimeMention } from '../utils/helper';
import {
  Channel,
  Mentioned,
  MentionedPmConfirm,
  Msg,
  Quiz,
  User,
  UserQuiz,
} from '../models';
import { InjectRepository } from '@nestjs/typeorm';
import { BOT_ID, EMessageMode } from '../constants/configs';
import { AxiosClientService } from '../services/axiosClient.services';
import { ApiUrl } from '../constants/api_url';
import {
  refGenerate,
  replyMessageGenerate,
} from '../utils/generateReplyMessage';
import { ClientConfigService } from '../config/client-config.service';
import { checkAnswerFormat } from '../utils/helper';
import { QuizService } from '../services/quiz.services';

@Injectable()
export class EventListenerChannelMessage {
  private client: MezonClient;
  constructor(
    private clientService: MezonClientService,
    private asteriskCommand: Asterisk,
    @InjectRepository(Mentioned)
    private mentionedRepository: Repository<Mentioned>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Msg) private msgRepository: Repository<Msg>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(MentionedPmConfirm)
    private mentionPmConfirm: Repository<MentionedPmConfirm>,
    @InjectRepository(UserQuiz)
    private userQuizRepository: Repository<UserQuiz>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    private readonly axiosClientService: AxiosClientService,
    private clientConfigService: ClientConfigService,
    private quizService: QuizService,
  ) {
    this.client = clientService.getClient();
  }

  @OnEvent(Events.ChannelMessage)
  async handleMentioned(message: ChannelMessage) {
    try {
      if (
        message.is_public ||
        message.sender_id === this.clientConfigService.botKomuId ||
        message.sender_id === '0'
      )
        return;
      await Promise.all([
        this.userRepository
          .createQueryBuilder()
          .update(User)
          .set({ last_message_id: message.message_id })
          .where('"userId" = :userId', { userId: message.sender_id })
          .andWhere(`deactive IS NOT True`)
          .execute(),
        this.mentionedRepository
          .createQueryBuilder()
          .update(Mentioned)
          .set({ confirm: true, reactionTimestamp: Date.now() })
          .where(`"channelId" = :channelId`, { channelId: message.channel_id })
          .andWhere(`"mentionUserId" = :mentionUserId`, {
            mentionUserId: message.sender_id,
          })
          .andWhere(`"confirm" = :confirm`, { confirm: false })
          .andWhere(`"reactionTimestamp" IS NULL`)
          .execute(),
      ]);
      if (message.mode === 4 || message.content.t.split(' ').includes('@here'))
        return;
      // const checkCategories: string[] = [
      //   'PROJECTS',
      //   'PROJECTS-EXT',
      //   'PRODUCTS',
      //   'LOREN',
      //   'HRM&IT',
      //   'SAODO',
      //   'MANAGEMENT',
      // ];

      const validCategory: boolean = true;
      // if (channel.name.slice(0, 4).toUpperCase() === 'PRJ-') {
      //   validCategory = true;
      // } else {
      //   validCategory = checkCategories.includes(channel.name.toUpperCase());
      // }

      if (!checkTimeMention(new Date())) return;
      if (
        Array.isArray(message.mentions) &&
        message.mentions.length &&
        validCategory
      ) {
        message.mentions.forEach(async (user) => {
          if (
            user?.user_id === this.clientConfigService.botKomuId ||
            user?.role_id
          )
            return;
          const data = {
            messageId: message.message_id,
            authorId: message.sender_id,
            channelId: message.channel_id,
            mentionUserId: user.user_id,
            createdTimestamp: new Date(message.create_time).getTime(),
            noti: false,
            confirm: false,
            punish: false,
            reactionTimestamp: null,
          };
          await this.mentionedRepository.insert(data);
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  @OnEvent(Events.ChannelMessage)
  async handleCommand(msg: ChannelMessage) {
    try {
      const content = msg.content.t;
      let replyMessage: ReplyMezonMessage;
      // const client = this.clientService.getClient();
      // if (msg.sender_id != BOT_ID) {
      //   client.sendMessageUser(
      //     msg.sender_id,
      //     `Bot rep lại tin nhắn ${content}`,
      //   );
      // }
      if (typeof content == 'string' && content.trim()) {
        const firstLetter = content.trim()[0];
        switch (firstLetter) {
          case '*':
            replyMessage = await this.asteriskCommand.execute(content, msg);
            break;
          default:
            return;
          // console.log(msg);
        }

        if (replyMessage) {
          const replyMessageArray = Array.isArray(replyMessage)
            ? replyMessage
            : [replyMessage];
          for (const mess of replyMessageArray) {
            await this.clientService.sendMessage(mess);
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  @OnEvent(Events.ChannelMessage)
  async handleAIforbot(msg: ChannelMessage) {
    if (msg.channel_id === this.clientConfigService.machleoChannelId) return;
    try {
      const mentions = Array.isArray(msg.mentions) ? msg.mentions : [];
      const message = msg.content.t;
      const refs = Array.isArray(msg.references) ? msg.references : [];
      if (
        (msg.mode === ChannelStreamMode.STREAM_MODE_DM ||
          mentions?.some((obj) => obj.user_id === BOT_ID) ||
          refs?.some((obj) => obj.message_sender_id === BOT_ID)) &&
        typeof message == 'string' &&
        msg.sender_id !== BOT_ID &&
        message.length > 10
      ) {
        const url = ApiUrl.AIApi;
        let AIReplyMessage;
        AIReplyMessage = `Very busy, too much work today. I'm so tired. BRB.`;

        try {
          const response = await this.axiosClientService.post(
            url,
            {
              text: message,
            },
            { timeout: 5000 },
          );
          if (response.status == 200) {
            AIReplyMessage = response.data.Response;
          } else {
            throw Error('swtich AI API');
          }
        } catch (e) {
          const baseUrl = 'https://api.aimlapi.com/v1';
          const apiKey = process.env.FREE_API_KEY;
          const systemPrompt =
            'bạn là một công cụ ảo được hỗ trợ của công ty công nghệ có hơn 200 nhân viên tên là KOMU. hãy trả lời bằng tiếng việt nhé. Hiện tại trợ lý ảo của công ty đang ra ngoài có chút việc nên bạn sẽ giúp bạn ấy trả lời các câu hỏi khi bạn ấy vắng mặt';

          const headers = {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          };
          const response = await this.axiosClientService.post(
            `${baseUrl}/chat/completions`,
            {
              model: 'mistralai/Mistral-7B-Instruct-v0.2',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
              ],
            },
            { headers },
          );

          const completion = response.data;
          AIReplyMessage = completion.choices[0].message.content;
        }

        const replyMessage = replyMessageGenerate(
          { messageContent: AIReplyMessage, mentions: [] },
          msg,
        );

        await this.clientService.sendMessage(replyMessage);
      }
    } catch (e) {
      console.log(e);
    }
  }

  @OnEvent(Events.ChannelMessage)
  async insertPmConfirmWFT(message: ChannelMessage) {
    if (!message.content || typeof message.content.t !== 'string') return;
    if (
      message.content.t.includes('[CONFIRM WFH]') &&
      message.mode === EMessageMode.DM_MESSAGE &&
      message.sender_id === this.clientConfigService.botKomuId
    ) {
      const wfhId = +message.content.t.match(/ID:(\d+)/)[1];
      const dataMentionPmConfirm = {
        messageId: message.message_id,
        wfhId,
        confirm: false,
        value: '',
      };
      await this.mentionPmConfirm.insert(dataMentionPmConfirm);
    }
  }

  @OnEvent(Events.ChannelMessage)
  async handleAnswerBotQuiz(msg: ChannelMessage) {
    if (
      msg.mode == EMessageMode.DM_MESSAGE &&
      msg.references &&
      Array.isArray(msg.references) &&
      msg.references.length > 0
    ) {
      const userQuiz = await this.userQuizRepository
        .createQueryBuilder()
        .where('"message_id" = :mess_id', {
          mess_id: msg.references[0].message_ref_id,
        })
        .select('*')
        .getRawOne();

      if (userQuiz) {
        let mess = '';
        const messOptions = {};
        if (userQuiz['answer']) {
          mess = `Bạn đã trả lời câu hỏi này rồi`;
        } else {
          const question = await this.quizRepository
            .createQueryBuilder()
            .where('id = :quizId', { quizId: userQuiz['quizId'] })
            .select('*')
            .getRawOne();
          if (question) {
            const answer = msg.content.t;
            if (!checkAnswerFormat(answer, question['options'].length)) {
              mess = `Bạn vui lòng trả lời đúng số thứ tự các đáp án câu hỏi`;
            } else {
              if (Number(answer) === Number(question['correct'])) {
                const newUser = await this.quizService.addScores(
                  userQuiz['userId'],
                );
                if (!newUser) return;
                mess = `Correct!!!, you have ${newUser[0].scores_quiz} points`;
                await this.quizService.saveQuestionCorrect(
                  userQuiz['userId'],
                  userQuiz['quizId'],
                  Number(answer),
                );
              } else {
                mess = `Incorrect!!!, The correct answer is ${question['correct']}`;
                await this.quizService.saveQuestionInCorrect(
                  userQuiz['userId'],
                  userQuiz['quizId'],
                  Number(answer),
                );
              }

              mess = `${mess}\nClick on the following link if you want to complain `;
              const link = `https://quiz.nccsoft.vn/question/update/${userQuiz['quizId']}`;
              messOptions['lk'] = [
                {
                  s: mess.length,
                  e: mess.length + link.length,
                },
              ];
              mess = mess + link;
            }
          }
        }

        return await this.client.sendMessageUser(
          userQuiz.userId,
          mess,
          messOptions,
          [],
          refGenerate(msg),
        );
      }
    }
  }
}
