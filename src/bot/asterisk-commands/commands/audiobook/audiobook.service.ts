import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { FFmpegImagePath, FileType } from 'src/bot/constants/configs';
import { Uploadfile } from 'src/bot/models';
import { FFmpegService } from 'src/bot/services/ffmpeg.service';
import { MezonClientService } from 'src/mezon/services/client.service';
import { Repository } from 'typeorm';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AudiobookService {
  private playQueue = [];
  private client: MezonClient;
  private clanId: string;
  // private isPlaying = false;
  constructor(
    @InjectRepository(Uploadfile)
    private uploadFileData: Repository<Uploadfile>,
    private clientService: MezonClientService,
    private clientConfigService: ClientConfigService,
    @Inject(forwardRef(() => FFmpegService))
    private ffmpegService: FFmpegService,
  ) {
    this.client = this.clientService.getClient();
  }

  async addQueue(episode: string) {
    try {
      const res = await this.uploadFileData.findOne({
        where: {
          episode: +episode,
          file_type: FileType.AUDIOBOOK,
        },
      });
      if (!res) return;
      const url = res.filePath + res.fileName;
      if (this.playQueue.includes(url)) {
        return `Audio book ${res.fileName} already exists in the queue. `;
      }
      this.playQueue.push(url);
      return `Audio book ${res.fileName} has been added to the queue. `;
    } catch (error) {
      console.log('Error add queue', error);
    }
  }

  async processQueue(message: ChannelMessage) {
    if (this.ffmpegService.getPlayingStatus()) {
      return;
    }
    this.clanId = message.clan_id;
    if (this.playQueue.length > 0) {
      const channel_id = this.clientConfigService.audiobookChannelId;
      const channel = await this.client.registerStreamingChannel({
        clan_id: this.clanId,
        channel_id: channel_id,
      });

      if (!channel) return;
      // check channel is not streaming
      // ffmpeg mp3 to streaming url
      try {
        if (channel?.streaming_url !== '') {
          const resultFfmpeg = await this.ffmpegService
            .transcodeMp3ToRtmp(
              FFmpegImagePath.AUDIOBOOK,
              this.playQueue.shift(),
              channel?.streaming_url,
              FileType.AUDIOBOOK,
            )
            .catch((error) => console.log('error mp3', error));
          return resultFfmpeg;
        }
        await sleep(1000);
      } catch (error) {
        console.log('error process queue: ', error);
      }
    }
  }
}
