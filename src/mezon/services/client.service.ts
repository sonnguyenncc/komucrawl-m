import { Injectable, Logger } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk-test';
import { MezonClientConfig } from '../dtos/MezonClientConfig';

@Injectable()
export class MezonClientService {
  private readonly logger = new Logger(MezonClientService.name);
  private client: MezonClient;

  constructor(clientConfigs: MezonClientConfig) {
    this.client = new MezonClient(clientConfigs.token);
  }

  async initializeClient() {
    try {
      const result = await this.client.authenticate();
      this.logger.log('authenticated.', result);
    } catch (error) {
      this.logger.error('error authenticating.', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }
}
