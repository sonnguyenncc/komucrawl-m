import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonClient } from 'mezon-sdk';
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
    private ffmpegService: FFmpegService,
  ) {
    this.client = this.clientService.getClient();
  }

  addQueue(episode: string) {
    console.log('episode: ', episode);
    this.playQueue.push(episode);
  }

  @OnEvent('audiobook.playing')
  async processQueue(clanId: string) {
    if (this.ffmpegService.getPlayingStatus()) {
      return;
    }
    this.clanId = clanId;
    if (this.playQueue.length > 0) {
      const channel_id = this.clientConfigService.audiobookChannelId;
      const channel = await this.client.registerStreamingChannel({
        clan_id: this.clanId,
        channel_id: channel_id,
      });

      if (!channel) return;

      const res = await this.uploadFileData.findOne({
        where: {
          episode: this.playQueue.shift(),
          file_type: FileType.AUDIOBOOK,
        },
      });
      if (!res) return;
      const url = res.filePath + res.fileName;
      // check channel is not streaming
      // ffmpeg mp3 to streaming url
      if (channel?.streaming_url !== '') {
        this.ffmpegService
          .transcodeMp3ToRtmp(
            FFmpegImagePath.AUDIOBOOK,
            url,
            channel?.streaming_url,
          )
          .catch((error) => console.log('error mp3', error));
      }
      await sleep(1000);
    }
  }
}
