import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';

// TODO: canot get user, channel data from MEZON
@Command('meeting')
export class MeetingCommand extends CommandMessage {
  constructor() {
    super();
  }

  execute(args: string[], message: ChannelMessage) {
    let messageContent = '// TODO: canot get user, channel data from MEZON'
    return this.replyMessageGenerate({ messageContent }, message);
  }
}
