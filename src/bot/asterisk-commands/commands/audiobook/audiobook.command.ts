import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { AxiosClientService } from 'src/bot/services/axiosClient.services';
import { MezonClientService } from 'src/mezon/services/client.service';
import { FFmpegService } from 'src/bot/services/ffmpeg.service';
import { FileType } from 'src/bot/constants/configs';
import { Uploadfile } from 'src/bot/models';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FFmpegImagePath } from 'src/bot/constants/configs';
import { isThisSecond } from 'date-fns';
import { AudiobookService } from './audiobook.service';

@Command('audiobook')
export class AudiobookCommand extends CommandMessage {
  private client: MezonClient;
  constructor(
    private clientConfigService: ClientConfigService,
    private axiosClientService: AxiosClientService,
    private clientService: MezonClientService,
    private ffmpegService: FFmpegService,
    private audiobookService: AudiobookService,
    @InjectRepository(Uploadfile)
    private uploadFileData: Repository<Uploadfile>,
  ) {
    super();
    this.client = this.clientService.getClient();
  }

  removeFileNameExtension(fileName: string, isSubtitle?: boolean) {
    const withoutFirstFiveChars = fileName.substring(isSubtitle ? 0 : 5);
    const lastDotIndex = withoutFirstFiveChars.lastIndexOf('.');
    const finalFileName = withoutFirstFiveChars.substring(0, lastDotIndex);
    return finalFileName;
  }

  generateFileSubtitlePath(filePath: string) {
    const lastDotIndex = filePath.lastIndexOf('.');
    const fileSubtitlePath = filePath.substring(0, lastDotIndex);
    return fileSubtitlePath.replace('audiobook_', '');
  }

  async execute(args: string[], message: ChannelMessage) {
    const messageContent =
      '```' +
      'Command: *audiobook play ID' +
      '\n' +
      'Example: *audiobook play 1' +
      '```';
    if (args[0] === 'play') {
      if (!args[1])
        return this.replyMessageGenerate(
          {
            messageContent: messageContent,
            mk: [{ type: 't', s: 0, e: messageContent.length }],
          },
          message,
        );
      this.audiobookService.addQueue(args[1]);
      const textContent = `Go to `;
      const channel_id = this.clientConfigService.audiobookChannelId;
      try {
        if (!this.ffmpegService.getPlayingStatus()) {
          this.ffmpegService.setClanId(message.clan_id);
          this.audiobookService.processQueue(message.clan_id);
        }
        return this.replyMessageGenerate(
          {
            messageContent: textContent,
            hg: [
              {
                channelid: channel_id,
                s: textContent.length,
                e: textContent.length + 1,
              },
            ],
          },
          message,
        );
      } catch (error) {
        console.log('error', message.clan_id, channel_id, error);
        return this.replyMessageGenerate(
          {
            messageContent: 'Audiobook not found',
          },
          message,
        );
      }
    }

    if (args[0] === 'playlist') {
      const dataMp3 = await this.uploadFileData.find({
        where: {
          file_type: FileType.AUDIOBOOK,
        },
        order: {
          episode: 'DESC',
        },
      });
      if (!dataMp3) {
        return;
      } else if (Array.isArray(dataMp3) && dataMp3.length === 0) {
        const mess = '```' + 'Không có audiobook nào' + '```';
        return this.replyMessageGenerate(
          {
            messageContent: mess,
            mk: [{ type: 't', s: 0, e: mess.length }],
          },
          message,
        );
      } else {
        const listReplyMessage = [];
        for (let i = 0; i <= Math.ceil(dataMp3.length / 50); i += 1) {
          if (dataMp3.slice(i * 50, (i + 1) * 50).length === 0) break;
          const mess =
            '```Danh sách audiobook\n' +
            dataMp3
              .slice(i * 50, (i + 1) * 50)
              .filter((item) => item.episode)
              .map(
                (list) =>
                  `Id: ${list.episode}, name: ${this.removeFileNameExtension(list.fileName)}`,
              )
              .join('\n') +
            '```';
          listReplyMessage.push(mess);
        }
        return listReplyMessage.map((mess) => {
          return this.replyMessageGenerate(
            {
              messageContent: mess,
              mk: [{ type: 't', s: 0, e: mess.length }],
            },
            message,
          );
        });
      }
    }

    // TODO: stop stream
    // if (args[0] === 'stop') {
    //   this.ffmpegService.killCurrentStream(FileType.AUDIOBOOK);
    //   await sleep(1000);
    //   const messageEply = '```Stop audio book successful!```';
    //   return this.replyMessageGenerate(
    //     {
    //       messageContent: messageEply,
    //       mk: [{ type: 't', s: 0, e: messageEply.length }],
    //     },
    //     message,
    //   );
    // }

    return this.replyMessageGenerate(
      {
        messageContent: messageContent,
        mk: [{ type: 't', s: 0, e: messageContent.length }],
      },
      message,
    );
  }
}
