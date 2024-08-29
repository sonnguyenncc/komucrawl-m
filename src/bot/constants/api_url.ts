export class ApiUrl {
  static TimeSheetApi = process.env.TIMESHEET_API;

  static WFHApi = {
    api_url: `${ApiUrl.TimeSheetApi}Public/GetUserWorkFromHome`,
  };
}
