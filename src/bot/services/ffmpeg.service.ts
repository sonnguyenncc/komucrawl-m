import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as path from 'path';

@Injectable()
export class FFmpegService {
  constructor() {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffmpegPath.replace('ffmpeg', 'ffprobe'));
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
          console.log('FFmpeg command: ' + commandLine);
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

  getVideoCodec(inputPath: string) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );
        resolve(videoStream.codec_name); // e.g., 'h264', 'vp9'
      });
    });
  }

  async transcodeVideoToRtmp(
    inputPath: string,
    rtmpUrl: string,
  ): Promise<void> {
    const codec = await this.getVideoCodec(inputPath);
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .inputOptions('-re')
        .videoCodec(codec)
        .audioCodec('aac')
        .output(rtmpUrl)
        .outputOptions([
          '-f flv', // RTMP protocol uses FLV container format
          '-preset veryfast', // Faster encoding preset (adjust if needed)
          '-tune zerolatency', // Low latency tuning for streaming
        ])
        .on('start', (commandLine) => {
          console.log('FFmpeg command: ' + commandLine);
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
}
