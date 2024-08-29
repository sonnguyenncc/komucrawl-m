import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import { UserStatusService } from './userStatus.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { EUserStatusCommand } from './userStatus.constants';

@Command('userstatus')
export class UserStatusCommand extends CommandMessage {
  constructor(
    private userStatusService: UserStatusService,
    private readonly http: HttpService,
    private readonly clientConfig: ClientConfigService,
  ) {
    super();
  }

  async execute(args: string[], message: ChannelMessage) {
    let messageContent: EUserStatusCommand;
    try {
      if (args[0] === 'help' || !args[0]) {
        messageContent = EUserStatusCommand.HELP;
      } else {
        const userEmail = args[0];
        const user = await this.userStatusService.getUserByEmail(userEmail);

        if (user.length === 0) {
          messageContent = EUserStatusCommand.WRONG_EMAIL;
        } else {
          const response = await lastValueFrom(
            this.http.get(
              `${this.clientConfig.user_status.api_url_userstatus}?emailAddress=${userEmail}@ncc.asia`,
              {
                httpsAgent: this.clientConfig.https,
              },
            ),
          );

          const getUserStatus = response.data;
          if (!getUserStatus) return;

          messageContent = getUserStatus.result
            ? getUserStatus.result.message
            : EUserStatusCommand.WORK_AT_HOME;
        }
      }
      return this.replyMessageGenerate({ messageContent }, message);
    } catch (error) {}
  }
}
