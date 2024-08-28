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

  excute(message: string) {
    console.log(message);
  }
}
