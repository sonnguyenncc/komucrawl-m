import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

@Injectable()
export class FFmpegService {
  constructor() {
    ffmpeg.setFfmpegPath(ffmpegPath);
  }

  transcodeMp3ToRtmp(inputPath: string, rtmpUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=c=black:s=1280x720:d=3600')
        .inputFormat('lavfi')
        .inputOptions('-re')
        .input(inputPath)
        .audioCodec('aac')
        .videoCodec('libx264')
        .output(rtmpUrl)
        .outputOptions([
          '-f flv',
          '-shortest',
        ])
        .on('end', () => {
          console.log('Streaming finished!');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .run();
    });
  }
}