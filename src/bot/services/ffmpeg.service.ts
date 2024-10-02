import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import * as path from 'path';

@Injectable()
export class FFmpegService {
  constructor() {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath.path);
  }

  transcodeMp3ToRtmp(inputPath: string, rtmpUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imagePath = path.join(
        process.cwd(),
        '/dist/public/images/ncc8.png',
      );

      ffmpeg()
        .input(imagePath)
        .inputOptions('-re')
        .loop()
        .input(inputPath)
        .audioCodec('aac')
        .videoCodec('libx264')
        .output(rtmpUrl)
        .outputOptions(['-f flv', '-shortest'])
        .on('start', (commandLine) => {
          console.log('transcodeMp3ToRtmp FFmpeg command: ' + commandLine);
        })
        .on('end', () => {
          console.error('transcodeMp3ToRtmp success');
          resolve();
        })
        .on('error', (err) => {
          console.error('transcodeMp3ToRtmp Error:', err);
          reject(err);
        })
        .run();
    });
  }

  async getVideoCodecInfo(inputPath: string): Promise<{ video: string; audio: string }> {
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
  
  async transcodeVideoToRtmp(inputPath: string, rtmpUrl: string): Promise<void> {
    try {
      const codecInfo = await this.getVideoCodecInfo(inputPath);
  
      return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg().input(inputPath).inputOptions('-re');
  
        switch (codecInfo.video) {
          case 'h264':
            ffmpegCommand.videoCodec('copy');
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
            ffmpegCommand.videoCodec('libx264')
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
            ffmpegCommand.audioCodec('aac').audioChannels(2);;
            break;
          case 'mp3':
            ffmpegCommand.audioCodec('aac');
            break;
          default:
            ffmpegCommand.audioCodec('aac');
            break;
        }
  
        ffmpegCommand
          .outputOptions([
            '-preset veryfast',
            '-b:v 1500k',
            '-b:a 128k',
            '-f flv',
          ])
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