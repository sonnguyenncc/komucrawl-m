import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonClient } from 'mezon-sdk';
import { ClientConfigService } from 'src/bot/config/client-config.service';
import { FileType } from 'src/bot/constants/configs';
import { Uploadfile } from 'src/bot/models';
import { FFmpegService } from 'src/bot/services/ffmpeg.service';
import { MezonClientService } from 'src/mezon/services/client.service';
import { Repository } from 'typeorm';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class MovieService {
  private playQueue = [];
  private client: MezonClient;
  private clanId: string;
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

  generateFileSubtitlePath(filePath: string) {
    const lastDotIndex = filePath.lastIndexOf('.');
    const fileSubtitlePath = filePath.substring(0, lastDotIndex);
    return fileSubtitlePath.replace('film_', '');
  }

  async getQueue() {
    return await Promise.all(
      this.playQueue.map(async (file) => {
        const nameWithExt = file.split('/').pop();
        return await this.uploadFileData.findOne({
          where: { fileName: nameWithExt },
        });
      }),
    );
  }

  async addQueue(episode: string) {
    try {
      const res = await this.uploadFileData.findOne({
        where: {
          episode: +episode,
          file_type: FileType.FILM,
        },
      });
      if (!res) return;
      const url = res.filePath + res.fileName;
      if (this.playQueue.includes(url)) {
        return `Video ${res.fileName} already exists in the queue. `;
      }
      this.playQueue.push(url);
      return `Video ${res.fileName} has been added to the queue. `;
    } catch (error) {
      console.log('Error add queue', error);
    }
  }

  async processQueue(clanId: string) {
    try {
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
        const url = this.playQueue.shift();
        // check channel is not streaming
        // ffmpeg mp3 to streaming url
        if (channel?.streaming_url !== '') {
          const resultFfmpeg = await this.ffmpegService
            .transcodeVideoToRtmp(
              url,
              channel?.streaming_url,
              this.generateFileSubtitlePath(url),
            )
            .catch((error) => console.log('error video', error));
          await sleep(1000);

          return resultFfmpeg;
        }
      }
    } catch (error) {
      console.log('error process queue: ', error);
    }
  }
}
