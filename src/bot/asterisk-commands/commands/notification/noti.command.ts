import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { AxiosClientService } from 'src/bot/services/axiosClient.services';

@Command('thongbao')
export class NotificationCommand extends CommandMessage {
  constructor(
    private clientConfigService: ClientConfigService,
    private axiosClientService: AxiosClientService,
  ) {
    super();
  }

  adjustPositionsObject(obj, decrementValue) {
    const fields = ['hg', 'ej', 'lk', 'mk'];
    fields.forEach((field) => {
      if (Array.isArray(obj[field])) {
        obj[field].forEach((item) => {
          if (typeof item.s === 'number' && typeof item.e === 'number') {
            item.s -= decrementValue;
            item.e -= decrementValue;
          }
        });
      }
    });
    return obj;
  }

  adjustPositionsArray(arr, decrementValue) {
    arr.forEach((item) => {
      if (typeof item.s === 'number' && typeof item.e === 'number') {
        console.log('item', item.s);
        item.s -= decrementValue;
        console.log('item 2', item.s);
        item.e -= decrementValue;
      }
    });
    return arr;
  }

  async execute(args: string[], message: ChannelMessage) {
    const authorId = message.sender_id;
    const { t, ...option } = message.content;
    const optionNoti = this.adjustPositionsObject(option, 10);
    const messageContent = t.slice(10, t.length);
    if (!messageContent) {
      return this.replyMessageGenerate(
        {
          messageContent: '```Please add your text```',
          mk: [{ type: 't', s: 0, e: '```Please add your text```'.length }],
        },
        message,
      );
    }

    const devId = '1827994776956309504';
    const validUserId = ['1800396411926220800'];
    if (!validUserId.includes(authorId) && authorId !== devId) return;
    if (validUserId.includes(authorId)) {
      await this.axiosClientService.post(
        this.clientConfigService.noti.api_url_quickNews,
        {
          content: messageContent,
        },
        {
          httpsAgent: this.clientConfigService.https,
          headers: {
            securityCode: this.clientConfigService.imsKeySecret,
          },
        },
      );
    }
    const fetchChannel = [
      message.channel_id,
      this.clientConfigService.hanoicorner,
      this.clientConfigService.hanoi2corner,
      this.clientConfigService.vinhcorner,
      this.clientConfigService.danangcorner,
      this.clientConfigService.saigoncorner,
      this.clientConfigService.mezonNhaCuaChungChannelId,
      this.clientConfigService.quynhoncorner,
      this.clientConfigService.hanoi3corner,
    ];
    const newMentions =
      Array.isArray(message.mentions) && message.mentions.length
        ? this.adjustPositionsArray(message.mentions, 10)
        : [];
    const data = fetchChannel.map((channelId) => {
      if (channelId === message.channel_id) {
        return this.replyMessageGenerate(
          {
            messageContent: '```✅ Notification saved.```',
            mk: [{ type: 't', s: 0, e: '```✅ Notification saved.```'.length }],
          },
          message,
        );
      }
      return this.replyMessageGenerate(
        {
          messageContent,
          ...optionNoti,
          attachments:
            Array.isArray(message.attachments) && message.attachments.length
              ? message.attachments
              : [],
          mentions: newMentions,
          channel_id: channelId,
        },
        message,
        false,
      );
    });
    return data;
  }
}
