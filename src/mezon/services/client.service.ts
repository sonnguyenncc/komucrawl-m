import { Injectable } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk';
import { MezonClientConfig } from '../dtos/MezonClientConfig';

@Injectable()
export class ClientService {
  private client: MezonClient;

  constructor(clientConfigs: MezonClientConfig) {
    this.client = new MezonClient(clientConfigs.token);
  }

  async initializeClient() {
    try {
      const result = await this.client.authenticate();
      console.log('authenticated.', result);
    } catch (error) {
      console.error('error authenticating.', error);
    }
  }

  getClient() {
    return this.client;
  }
}
