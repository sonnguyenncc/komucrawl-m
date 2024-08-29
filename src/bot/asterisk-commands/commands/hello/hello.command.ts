import { CommandMessage } from '../../abstracts/command.abstract';

export class HelloCommand extends CommandMessage {
  commandName: string = 'hello';
  constructor() {
    super();
  }

  execute = async (msg, args, client, ref?) => {
    let references = { ...ref };
    if (msg.references.length && ref) {
      references = { ...references, ...msg.references[0] };
    }
    return await client.sendMessage(
      msg.clan_id,
      msg.channel_id,
      msg.mode,
      { t: 'Hello' },
      undefined,
      undefined,
      ref ? Array(references) : undefined,
    );
  };
}
