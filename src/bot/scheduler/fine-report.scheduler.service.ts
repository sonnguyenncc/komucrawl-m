import { Injectable } from '@nestjs/common';
import { KomubotrestService } from '../komubot-rest/komubot-rest.service';
import { Uploadfile } from '../models';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonClientService } from 'src/mezon/services/client.service';
import { MezonClient } from 'mezon-sdk';
import { ClientConfigService } from '../config/client-config.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { ReportDailyService } from 'src/bot/asterisk-commands/commands/report/reportDaily.service';
import { ReportWFHService } from 'src/bot/utils/report-wfh.serivce';
import { ReportTrackerService } from 'src/bot/services/reportTracker.sevicer';
import { google } from 'googleapis';
import { ExcelProcessor } from '../utils/excel-processor';
import {
  getPreviousWorkingDay,
  handleDailyFine,
  handleMentionFine,
  handleTrackerFine,
  handleWFHFine,
} from '../utils/daily-fine-report';

@Injectable()
export class FineReportSchedulerService {
  private client: MezonClient;
  constructor(
    @InjectRepository(Uploadfile)
    private clientService: MezonClientService,
    private reportDailyService: ReportDailyService,
    private reportWFHService: ReportWFHService,
    private reportTrackerService: ReportTrackerService,
    private clientConfigService: ClientConfigService,
  ) {
    // this.client = this.clientService.getClient();
  }

  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_8AM, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async dailyReportScheduler(reportDate?: moment.Moment, sheetId?: string) {
    const now = moment();

    if (!reportDate) {
      reportDate = getPreviousWorkingDay(now);
    }

    if (!sheetId) {
      sheetId = this.clientConfigService.sheetFineId;
    }

    const parsedDate = reportDate.startOf('day').toDate();
    const formatedDate = reportDate.format('DD/MM/YYYY');

    const [daily, mention, wfh, tracker] = await Promise.all([
      this.reportDailyService.getUserNotDaily(parsedDate),
      this.reportWFHService.reportMachleo(parsedDate),
      this.reportWFHService.reportWfh([formatedDate], false),
      this.reportTrackerService.reportTrackerNot([formatedDate]),
    ]);
    const notDaily = daily?.notDaily;

    const oauth2Client = new google.auth.OAuth2(
      this.clientConfigService.driverClientId,
      this.clientConfigService.driverClientSecret,
    );
    oauth2Client.setCredentials({
      refresh_token: this.clientConfigService.sheetRefreshToken,
    });

    const sheets = google.sheets({
      version: 'v4',
      auth: oauth2Client,
    });

    const excelProcessor = new ExcelProcessor(reportDate, sheetId, sheets);
    await excelProcessor.initSheetData();

    handleDailyFine(notDaily, excelProcessor);
    handleMentionFine(mention, excelProcessor);
    handleWFHFine(wfh, excelProcessor);
    handleTrackerFine(tracker, excelProcessor);

    await excelProcessor.saveChange();

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
  }
}
