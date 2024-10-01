import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { AxiosClientService } from 'src/bot/services/axiosClient.services';
import { MezonClientService } from 'src/mezon/services/client.service';
import { FFmpegService } from 'src/bot/services/ffmpeg.service';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Command('ncc8')
export class Ncc8Command extends CommandMessage {
  private client: MezonClient;
  constructor(
    private clientConfigService: ClientConfigService,
    private axiosClientService: AxiosClientService,
    private clientService: MezonClientService,
    private ffmpegService: FFmpegService,
  ) {
    super();
    this.client = this.clientService.getClient();
  }

  async execute(args: string[], message: ChannelMessage) {
    const messageContent =
      '```' +
      'Command: *ncc8 play ID' +
      '\n' +
      'Example: *ncc8 play 180' +
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

      const textContent = `Go to `;
      try {
        // call api in sdk
        const channel = await this.client.registerStreamingChannel({
          clan_id: message.clan_id,
          channel_id: this.clientConfigService.ncc8ChannelId,
        });

        if (!channel) return;

        const res = await this.axiosClientService.get(
          `${process.env.NCC8_API}/ncc8/episode/${args[1]}`,
        );
        if (!res) return;

        // check channel is not streaming
        // ffmpeg mp3 to streaming url
        if (channel?.streaming_url !== '') {
          // /home/mjnk9xw/Downloads/test.mp3
          if (args[2]) {
            this.ffmpegService.transcodeVideoToRtmp(
              res?.data?.url,
              channel?.streaming_url,
            );
          } else {
            this.ffmpegService.transcodeMp3ToRtmp(
              res?.data?.url,
              channel?.streaming_url,
            );
          }
        }

        await sleep(1000);

        return this.replyMessageGenerate(
          {
            messageContent: textContent,
            hg: [
              {
                channelid: this.clientConfigService.ncc8ChannelId,
                s: textContent.length,
                e: textContent.length + 1,
              },
            ],
          },
          message,
        );
      } catch (error) {
        console.log(
          'error',
          message.clan_id,
          this.clientConfigService.ncc8ChannelId,
          error,
        );
        return this.replyMessageGenerate(
          {
            messageContent: 'Ncc8 not found',
          },
          message,
        );
      }
    }
    return this.replyMessageGenerate(
      {
        messageContent: messageContent,
        mk: [{ type: 't', s: 0, e: messageContent.length }],
      },
      message,
    );
  }
}
