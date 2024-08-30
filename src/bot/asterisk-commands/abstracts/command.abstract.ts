import { ApiMessageRef, ChannelMessage } from 'mezon-sdk';
import { ReplyMezonMessage } from '../dto/replyMessage.dto';

export abstract class CommandMessage {
  abstract execute(args: string[], message: ChannelMessage): any;

  replyMessageGenerate(
    replayConent: { [x: string]: any },
    message: ChannelMessage,
  ): ReplyMezonMessage {
    const replayMessage: ReplyMezonMessage = {} as ReplyMezonMessage;
    [
      'clan_id',
      'channel_id',
      'mode',
      'mentions',
      'attachments',
      'is_public',
    ].forEach(
      (field) =>
        (replayMessage[field] = this.fieldGenerate(
          field,
          replayConent,
          message,
        )),
    );
    replayMessage['is_public'] = !!replayMessage['is_public'];
    replayMessage['msg'] =
      'messageContent' in replayConent
        ? { t: replayConent['messageContent'] }
        : { t: '' };
    replayMessage['ref'] = this.refGenerate(message);

    return replayMessage;
  }

  fieldGenerate(field: string, replayConent, message: ChannelMessage) {
    return field in replayConent ? replayConent[field] : message[field];
  }

  refGenerate(msg: ChannelMessage): Array<ApiMessageRef> {
    return [
      {
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
      },
    ];
  }
}
