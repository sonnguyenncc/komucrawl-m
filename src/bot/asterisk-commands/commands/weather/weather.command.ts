import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from '../../abstracts/command.abstract';
import axios from 'axios';

@Command('weather')
export class WeatherCommand extends CommandMessage {
  constructor() {
    super();
  }

  async getWeatherData(location) {
    const { data } = await axios.get(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_KEY}&q=${location}&aqi=yes`,
    );
    return data ? data : null;
  }

  formatWeatherData(data, formatNumber, locationName, noTitle) {
    let title = '-'.repeat(50) + '\n';
    if (!noTitle) {
      title = `Current weather in ${data?.location?.name} - ${data?.location?.country} at ${data?.location?.localtime}\n`;
    }

    return (
      title +
      `${formatNumber}Condition  : ${data?.current?.condition?.text}\n` +
      `${formatNumber}Temperature: ${data?.current?.temp_c}℃ / ${data?.current?.temp_f}℉\n` +
      `${formatNumber}Humidity   : ${data?.current?.humidity} %\n` +
      `   ${locationName}${' '.repeat(12 - locationName?.length)}Cloud cover: ${data?.current?.cloud} %\n` +
      `${formatNumber}Rainfall   : ${data?.current?.precip_mm} mm\n` +
      `${formatNumber}UV         : ${data?.current?.uv}\n` +
      `${formatNumber}PM2.5      : ${data?.current?.air_quality?.pm2_5}µg/m³\n`
    );
  }

  async execute(args: string[], message: ChannelMessage) {
    const location = args.join(' ');
    try {
      const mainWeatherData = await this.getWeatherData(location);
      const formatNumber = ' '.repeat(15);
      let messageContent = '';

      if (args[0] === 'ncc') {
        const nccCorners = ['Ha Noi', 'Vinh', 'Da Nang', 'Quy Nhon', 'Sai Gon'];
        let cornerWeatherData;
        const weatherPromises = nccCorners.map(async (corner) => {
          cornerWeatherData = await this.getWeatherData(corner);
          return this.formatWeatherData(
            cornerWeatherData,
            formatNumber,
            corner,
            true,
          );
        });

        const results = await Promise.all(weatherPromises);
        messageContent =
          `Current weather of all our corners at ${cornerWeatherData?.location?.localtime}\n` +
          results.join('\n') +
          `(Last updated on ${cornerWeatherData?.current?.last_updated})`;
      } else {
        messageContent =
          this.formatWeatherData(
            mainWeatherData,
            formatNumber,
            mainWeatherData?.location?.name,
            false,
          ) + `(Last updated on ${mainWeatherData?.current?.last_updated})`;
      }

      const attachments = [];
      if (args[0] !== 'ncc') {
        attachments.push({
          url: mainWeatherData?.current?.condition?.icon,
          filetype: 'image/jpeg',
        });
      }

      return this.replyMessageGenerate(
        {
          messageContent: '```' + messageContent + '```',
          mk: [{ type: 't', s: 0, e: messageContent.length + 6 }],
          attachments,
        },
        message,
      );
    } catch (error) {
      const messageContent = '```' + `Can't get data from ${location}` + '```';
      return this.replyMessageGenerate(
        {
          messageContent,
          mk: [{ type: 't', s: 0, e: messageContent.length }],
        },
        message,
      );
    }
  }
}
