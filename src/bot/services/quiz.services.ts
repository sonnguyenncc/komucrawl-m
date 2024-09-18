import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonClient } from 'mezon-sdk';
import { Quiz } from 'src/bot/models/quiz.entity';
import { User } from 'src/bot/models/user.entity';
import { UserQuiz } from 'src/bot/models/userQuiz';
import { MezonClientService } from 'src/mezon/services/client.service';
import { Repository } from 'typeorm';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserQuiz)
    private userQuizRepository: Repository<UserQuiz>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    private clientService: MezonClientService,
  ) {}

  async randomQuiz(userInput, roleSelect) {
    // context is message or client
    // message if this is commands
    // client if this is scheduler
    // type is commands or scheduler

    let roles;
    let roleRandom;
    if (!roleSelect) {
      if (userInput.roles && userInput.roles.length > 0) {
        roles = [...userInput.roles, 'policy', 'english'];
        roleRandom =
          roles[Math.floor(Math.random() * roles.length)].toLowerCase();
      } else {
        roleRandom = 'policy';
      }
    } else {
      roleRandom = roleSelect;
    }

    const questionAnswered = await this.userQuizRepository.find({
      where: {
        userId: userInput.userId,
      },
    });

    const questionAnsweredId = questionAnswered.map((item) => item.id);

    const questions = await this.quizRepository
      .createQueryBuilder('questions')
      .where(
        questionAnsweredId && questionAnsweredId.length > 0
          ? '"id" NOT IN (:...questionAnsweredId)'
          : 'true',
        {
          questionAnsweredId: questionAnsweredId,
        },
      )
      .andWhere('"role" = :roleRandom', { roleRandom: roleRandom })
      .andWhere('"isVerify" = True')
      .andWhere('"accept" = True')
      .andWhere('"title" IS NOT NULL')
      .andWhere('length("title") < :strLenCp', { strLenCp: 236 })
      .select('*')
      .orderBy('RANDOM()')
      .limit(1)
      .execute();

    if (Array.isArray(questions) && questions.length === 0) {
      return false;
      //   const mess = 'You have answered all the questions!!!';
      //   if (type === 'commands') {
      //     await context.channel.send(mess).catch(console.error);
      //   } else {
      //     return;
      //   }
    } else {
      return questions[0];
    }
  }

  // async sendQuizToSingleUser(
  //   client,
  //   userInput,
  //   botPing = false,
  //   roleSelect = null,
  // ) {
  //   if (!userInput) return;
  //   const userid = userInput.userId;
  //   const username = userInput.username;

  //   const q = await this.randomQuiz(userInput, roleSelect);

  //   if (!q) return;
  //   // const btn = new MessageEmbed()
  //   //   .setColor('#e11919')
  //   //   .setTitle('Complain')
  //   //   .setURL(`http://quiz.nccsoft.vn/question/update/${q._id}`);

  //   const mess = this.generateQuestion(q);

  //   await this.komubotrestService.sendMessageKomuToUser(
  //     client,
  //     { embeds: [Embed], components: [row1, row2] },
  //     username,
  //     botPing,
  //   );
  //   try {
  //     const userdb = await this.userRepository
  //       .createQueryBuilder()
  //       .where('"email" = :username and deactive IS NOT True ', {
  //         username: username,
  //       })
  //       .orWhere('"username" = :username and deactive IS NOT True ', {
  //         username: username,
  //       })
  //       .select('*')
  //       .getRawOne()
  //       .catch(console.error);
  //     if (!userdb) {
  //       return null;
  //     }
  //     let user = await client.users.fetch(userdb.userId).catch(console.error);
  //     if (msg == null) {
  //       return user;
  //     }
  //     if (!user) {
  //       // notify to machleo channel
  //       const message = `<@${this.clientConfig.komubotrestAdminId}> ơi, đồng chí ${username} không đúng format rồi!!!`;
  //       await (client.channels.cache as any)
  //         .get(this.clientConfig.machleoChannelId)
  //         .send(message)
  //         .catch(console.error);
  //       return null;
  //     }
  //     const sent = await user.send(msg);

  //     const channelInsert = await this.channelRepository.findOne({
  //       where: {
  //         id: this.clientConfig.machleoChannelId,
  //       },
  //     });

  //     try {
  //       await this.messageRepository.insert({
  //         id: sent.id,
  //         author: userdb,
  //         guildId: sent.guildId,
  //         type: sent.type.toString(),
  //         createdTimestamp: sent.createdTimestamp,
  //         system: sent.system,
  //         content: sent.content,
  //         pinned: sent.pinned,
  //         tts: sent.tts,
  //         channel: channelInsert,
  //         nonce: sent.nonce as any,
  //         editedTimestamp: sent.editedTimestamp,
  //         deleted: false,
  //         webhookId: sent.webhookId ?? '',
  //         applicationId: sent.applicationId,
  //         flags: sent.flags as any,
  //       });
  //     } catch (error) {
  //       console.log('Error : ', error);
  //     }
  //     // botPing : work when bot send quiz wfh user
  //     //* isSendQuiz : work when bot send quiz
  //     if (botPing && isSendQuiz) {
  //       userdb.last_bot_message_id = sent.id;
  //       userdb.botPing = true;
  //     }
  //     if (!botPing && isSendQuiz) {
  //       userdb.last_bot_message_id = sent.id;
  //     }

  //     await this.replaceDataUser(userdb);
  //     return user;
  //   } catch (error) {
  //     console.log('error', error);
  //     const userDb = await this.userRepository
  //       .createQueryBuilder()
  //       .where('"email" = :username and deactive IS NOT True ', {
  //         username: username,
  //       })
  //       .orWhere('"username" = :username and deactive IS NOT True ', {
  //         username: username,
  //       })
  //       .select('*')
  //       .getRawOne()
  //       .catch(console.error);

  //     const message = `KOMU không gửi được tin nhắn cho <@${userDb.userId}>(${userDb.email}). Hãy ping <@${this.clientConfig.komubotrestAdminId}> để được hỗ trợ nhé!!!`;
  //     await (client.channels.cache as any)
  //       .get(this.clientConfig.machleoChannelId)
  //       .send(message)
  //       .catch(console.error);
  //     const messageItAdmin = `KOMU không gửi được tin nhắn cho <@${userDb.userId}(${userDb.email})>. <@${this.clientConfig.komubotrestAdminId}> hỗ trợ nhé!!!`;
  //     await (client.channels.cache as any)
  //       .get(this.clientConfig.itAdminChannelId)
  //       .send(messageItAdmin)
  //       .catch(console.error);
  //     return null;
  //   }
  //   await this.saveQuestion(userid, q.id);
  // }

  generateQuestion(question) {
    const title = question.topic
      ? `[${question.topic.toUpperCase()}] ${question.title}`
      : question.title;
    const mess = `${title}\n ${question.options
      .map((otp, index) => `${index + 1} - ${otp}`)
      .join('\n')}`;
    return mess;
  }
  //   async addScores(userId) {
  //     try {
  //       const user = await this.userRepository
  //         .createQueryBuilder()
  //         .where('"userId" = :userId', { userId: userId })
  //         .andWhere('"deactive" IS NOT True')
  //         .select("*")
  //         .execute();

  //       if (user[0].scores_quiz) {
  //         await this.userRepository
  //           .createQueryBuilder()
  //           .update(User)
  //           .set({ scores_quiz: user[0].scores_quiz + 5 })
  //           .where('"userId" = :userId', { userId: user[0].userId })
  //           .execute()
  //           .catch(console.error);
  //       } else {
  //         await this.userRepository
  //           .createQueryBuilder()
  //           .update(User)
  //           .set({ scores_quiz: 5 })
  //           .where('"userId" = :userId', { userId: user[0].userId })
  //           .execute()
  //           .catch(console.error);
  //       }
  //       const newUser = await this.userRepository
  //         .createQueryBuilder()
  //         .where('"userId" = :userId', { userId: user[0].userId })
  //         .select("*")
  //         .execute()
  //         .catch(console.error);
  //       return newUser;
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }

  //   async saveQuestionCorrect(userId, questionid, answerkey) {
  //     try {
  //       await this.userQuizRepository
  //         .createQueryBuilder()
  //         .update(UserQuiz)
  //         .set({ correct: true, answer: answerkey, updateAt: Date.now() })
  //         .where(`"userId" = :userId`, { userId: userId })
  //         .andWhere(`"quizId" = :quizId`, {
  //           quizId: questionid,
  //         })
  //         .execute();
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }

  //   async saveQuestionInCorrect(userId, questionid, answerkey) {
  //     try {
  //       await this.userQuizRepository
  //         .createQueryBuilder()
  //         .update(UserQuiz)
  //         .set({ correct: false, answer: answerkey, updateAt: Date.now() })
  //         .where(`"userId" = :userId`, { userId: userId })
  //         .andWhere(`"quizId" = :quizId`, {
  //           quizId: questionid,
  //         })
  //         .execute();
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  saveQuestion(userId, questionid) {
    return this.userQuizRepository.insert({
      userId,
      quizId: questionid,
    });
  }
}
