import { Injectable } from '@nestjs/common';
import { GetUserIdByUsernameDTO } from '../dto/getUserIdByUsername';
import { ClientConfigService } from '../config/client-config.service';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models';
import { SendMessageToUserDTO } from '../dto/sendMessageToUser';
import { EUserType } from '../constants/configs';

@Injectable()
export class KomubotrestService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clientConfig: ClientConfigService,
  ) {}

  async findUserData(_pramams) {
    return await this.userRepository
      .createQueryBuilder()
      .where(
        new Brackets((qb) => {
          qb.where(`"email" = :email and user_type = 'MEZON'`, {
            email: _pramams,
          }).andWhere(`"deactive" IS NOT true`);
        }),
      )
      .orWhere(
        new Brackets((qb) => {
          qb.where(`"username" = :username and user_type = 'MEZON'`, {
            username: _pramams,
          }).andWhere(`"deactive" IS NOT true`);
        }),
      )
      .andWhere('user_type = :userType', { userType: EUserType.MEZON })
      .getOne();
  }

  async getUserIdByUsername(
    getUserIdByUsernameDTO: GetUserIdByUsernameDTO,
    header,
    res,
  ) {
    console.log('getUserIdByUsernameDTO', getUserIdByUsernameDTO)
    if (!header || header !== this.clientConfig.machleoChannelId) {
      res.status(403).send({ message: 'Missing secret key!' });
      return;
    }

    if (!getUserIdByUsernameDTO.username) {
      res.status(400).send({ message: 'username can not be empty!' });
      return;
    }

    const userdb = await this.findUserData(getUserIdByUsernameDTO.username);
    if (!userdb) {
      res.status(400).send({ message: 'User not found!' });
      return;
    }

    res.status(200).send({
      username: getUserIdByUsernameDTO.username,
      userid: userdb.userId,
    });
  }

  sendMessageToUser = async (
    sendMessageToUserDTO: SendMessageToUserDTO,
    header,
    res
  ) => {
    if (!header || header !== this.clientConfig.komubotRestSecretKey) {
      res.status(403).send({ message: "Missing secret key!" });
      return;
    }

    if (!sendMessageToUserDTO.username) {
      res.status(400).send({ message: "username can not be empty!" });
      return;
    }

    if (!sendMessageToUserDTO.message) {
      res.status(400).send({ message: "Message can not be empty!" });
      return;
    }
    const username = sendMessageToUserDTO.username;
    const message = sendMessageToUserDTO.message;

    try {
      // const user = await this.sendMessageKomuToUser(client, message, username);
      // if (!user) {
      //   res.status(400).send({ message: "Error!" });
      //   return;
      // }
      res.status(200).send({ message: "Successfully!" });
    } catch (error) {
      console.log("error", error);
      res.status(400).send({ message: error });
    }
  };
}
