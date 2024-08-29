import { AsteriskInterface } from './interfaces/asterisk.interface';
import { CommandMessage } from './abstracts/command.abstract';

export class Asterisk implements AsteriskInterface {
  private commandClass: Array<{ new (): CommandMessage }>;

  private commandList: { [key: string]: CommandMessage };

  constructor(commands: Array<{ new (): CommandMessage }>) {
    this.commandClass = commands;
    this.commandList = {};
    for (const cl of this.commandClass) {
      const instance = new cl();
      console.log(instance);
      this.commandList[instance.commandName] = instance;
    }
  }

  process(msg, client) {
    if (!msg.content.t.startsWith('*')) return;
    const contentMessageArray = msg.content.t
      .replace('\n', ' ')
      .slice('*'.length)
      .trim()
      .split(/ +/);
    // console.log('msg', msg, contentMessageArray);
    const contentMessage = contentMessageArray.shift().toLowerCase();
    const ref = {
      message_id: '',
      message_ref_id: msg.message_id,
      ref_type: 0,
      message_sender_id: msg.sender_id,
      message_sender_username: msg.username,
      mesages_sender_avatar: msg.avatar,
      message_sender_clan_nick: msg.clan_nick,
      message_sender_display_name: msg.display_name,
      content: JSON.stringify(msg.content),
      has_attachment: false,
    };

    if (contentMessage in this.commandList) {
      this.commandList[contentMessage].execute(
        msg,
        contentMessageArray,
        client,
        ref,
      );
    }
  }
}
