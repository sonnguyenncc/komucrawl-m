import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonClientService } from 'src/mezon/services/client.service';

@Injectable()
export class QuizService {
  // constructor(
  //   private clientService: MezonClientService,
  //   @InjectRepository(User)
  //   private userRepository: Repository<User>,
  // ) {}
  // sendMessageKomuToUser = async (
  //   msg,
  //   username,
  //   botPing = false,
  //   isSendQuiz = false,
  // ) => {
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
  // };
}
