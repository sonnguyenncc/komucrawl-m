export abstract class CommandMessage {
  constructor() {}
  commandName: string;
  execute(message, args, client, ref?): any {
    throw new Error('Method not implemented.');
  }
}
