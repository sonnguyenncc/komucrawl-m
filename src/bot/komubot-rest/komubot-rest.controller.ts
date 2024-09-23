import {
  Body,
  Controller,
  Injectable,
  Post,
  Headers,
  Res,
} from '@nestjs/common';
import { GetUserIdByUsernameDTO } from '../dto/getUserIdByUsername';
import { KomubotrestService } from './komubot-rest.service';
import { SendMessageToUserDTO } from '../dto/sendMessageToUser';

@Controller()
@Injectable()
export class KomubotrestController {
  constructor(private komubotrestService: KomubotrestService) {}

  @Post('/getUserIdByUsername')
  async getUserIdByUsername(
    @Body() getUserIdByUsernameDTO: GetUserIdByUsernameDTO,
    @Headers('X-Secret-Key') header,
    @Res() res: Response,
  ) {
    return this.komubotrestService.getUserIdByUsername(
      getUserIdByUsernameDTO,
      header,
      res,
    );
  }

  @Post("/sendMessageToUser")
  async sendMessageToUser(
    @Body() sendMessageToUserDTO: SendMessageToUserDTO,
    @Headers("X-Secret-Key") header,
    @Res() res: Response
  ) {
    return this.komubotrestService.sendMessageToUser(
      sendMessageToUserDTO,
      header,
      res
    );
  }
}
