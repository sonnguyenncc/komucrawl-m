import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { AxiosClientService } from 'src/bot/services/axiosClient.services';

@Command('ncc8')
export class Ncc8Command extends CommandMessage {
  constructor(
    private clientConfigService: ClientConfigService,
    private axiosClientService: AxiosClientService,
  ) {
    super();
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
        const url = await this.axiosClientService.get(
          `http://172.16.100.114:3000/ncc8/episode/${args[1]}`,
        );
        if (!url) return;

        return this.replyMessageGenerate(
          {
            messageContent: textContent + `# ${url?.data?.url}` ?? '',
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
