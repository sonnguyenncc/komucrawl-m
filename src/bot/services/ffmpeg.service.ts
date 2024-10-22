import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { FFmpegImagePath, FileType } from 'src/bot/constants/configs';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class FFmpegService {
  private streamNcc8;
  private streamAudioBook;
  private streamFilm;
  private isPlaying = false;
  private clanId;
  constructor(private eventEmitter: EventEmitter2) {
    // ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
    ffmpeg.setFfprobePath(ffprobePath.path);
  }

  killCurrentStream(type: FileType) {
    if (!this.streamNcc8) return;
    switch (type) {
      case FileType.NCC8:
        this.streamNcc8.kill('SIGKILL');
        break;
      case FileType.AUDIOBOOK:
        // this.streamAudioBook.kill('SIGKILL');
        break;
      case FileType.FILM:
        // this.streamFilm.kill('SIGKILL');
        break;
      default:
        break;
    }
  }

  getPlayingStatus() {
    return this.isPlaying;
  }

  setClanId(clanId: string) {
    this.clanId = clanId;
  }

  transcodeMp3ToRtmp(
    imagePath: string,
    inputPath: string,
    rtmpUrl: string,
    type: FileType,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (imagePath === '') {
        imagePath = FFmpegImagePath.NCC8;
      }
      const imagePathJoined = path.join(process.cwd(), imagePath);
      const ffmpegStream = ffmpeg();
      ffmpeg()
        .input(imagePathJoined)
        .inputOptions('-re')
        .loop()
        .input(inputPath)
        .audioCodec('aac')
        .videoCodec('libx264')
        .output(rtmpUrl)
        .outputOptions(['-f flv', '-shortest'])
        .on('start', (commandLine) => {
          this.isPlaying = true;
          console.log('transcodeMp3ToRtmp FFmpeg command: ' + commandLine);
        })
        .on('end', async () => {
          this.isPlaying = false;
          await sleep(1000);
          this.eventEmitter.emit('audiobook.playing', this.clanId);
          // this.audiobookService.processQueue(this.clanId);
          console.error('transcodeMp3ToRtmp success');
          resolve();
        })
        .on('error', (err) => {
          console.error('transcodeMp3ToRtmp Error:', err);
          reject(err);
        })
        .run();

      switch (type) {
        case FileType.NCC8:
          this.streamNcc8 = ffmpegStream;
          break;
        case FileType.AUDIOBOOK:
          this.streamAudioBook = ffmpegStream;
          break;
        default:
          break;
      }
    });
  }

  async getVideoCodecInfo(
    inputPath: string,
  ): Promise<{ video: string; audio: string }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          let videoCodec = '';
          let audioCodec = '';
          for (const stream of metadata.streams) {
            if (stream.codec_type === 'video' && stream.codec_name) {
              videoCodec = stream.codec_name;
            }
            if (stream.codec_type === 'audio' && stream.codec_name) {
              audioCodec = stream.codec_name;
            }
          }

          resolve({
            video: videoCodec,
            audio: audioCodec,
          });
        }
      });
    });
  }

  escapeFilePath(filePath: string): string {
    return filePath.replace(/:/g, '\\:');
  }

  async transcodeVideoToRtmp(
    inputPath: string,
    rtmpUrl: string,
    subTitlePath?: string,
  ): Promise<void> {
    try {
      const codecInfo = await this.getVideoCodecInfo(inputPath);
      const outputOptions = [
        '-preset veryfast',
        '-b:v 1500k',
        '-b:a 128k',
        '-f flv',
      ];

      const extensions = ['.srt', '.ass', '.vtt'];
      let subTitlePathFull = '';
      const existingSubtitle = extensions.find((ext) =>
        fs.existsSync(subTitlePath + ext),
      );
      if (existingSubtitle) {
        subTitlePathFull = subTitlePath + existingSubtitle;
        const subTitlePathFullValid = this.escapeFilePath(subTitlePathFull);
        outputOptions.push(`-vf subtitles='${subTitlePathFullValid}'`);
      }

      return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg().input(inputPath).inputOptions('-re');

        switch (codecInfo.video) {
          case 'h264':
            ffmpegCommand.videoCodec('libx264');
            break;
          case 'mjpeg':
            ffmpegCommand.videoCodec('copy');
            break;
          case 'hevc':
          case 'h265':
            ffmpegCommand.videoCodec('libx264');
            break;
          case 'flv1':
            ffmpegCommand.videoCodec('libx264');
            break;
          case 'vp9':
            ffmpegCommand.videoCodec('libx264');
            break;
          default:
            ffmpegCommand.videoCodec('libx264');
            break;
        }

        switch (codecInfo.audio) {
          case 'aac':
            ffmpegCommand.audioCodec('copy');
            break;
          case 'e-ac-3':
            ffmpegCommand.audioCodec('aac').audioChannels(2);
            break;
          case 'eac3':
            ffmpegCommand.audioCodec('aac').audioChannels(2);
            break;
          case 'mp3':
            ffmpegCommand.audioCodec('aac');
            break;
          default:
            ffmpegCommand.audioCodec('aac');
            break;
        }

        this.streamFilm = ffmpegCommand
          .outputOptions(outputOptions)
          .output(rtmpUrl)
          .on('start', (commandLine) => {
            console.log('FFmpeg command: ' + commandLine);
          })
          .on('end', () => {
            console.log('transcodeVideoToRtmp success');
            resolve();
          })
          .on('error', (err) => {
            console.error('transcodeVideoToRtmp Error:', err);
            reject(err);
          })
          .run();
      });
    } catch (err) {
      console.error('Error processing video:', err);
      throw err;
    }
  }
}
