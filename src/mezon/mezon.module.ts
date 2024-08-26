import { DynamicModule, Global, Module } from '@nestjs/common';
import { MezonModuleAsyncOptions } from './dtos/MezonModuleAsyncOptions';
import { ClientService } from './services/client.service';
import { ConfigService } from '@nestjs/config';
import { MezonClientConfig } from './dtos/MezonClientConfig';

@Global()
@Module({})
export class MezonModule {
  static forRootAsync(options: MezonModuleAsyncOptions): DynamicModule {
    return {
      module: MezonModule,
      imports: [...options.imports],
      providers: [
        {
          provide: ClientService,
          useFactory: async (configService: ConfigService) => {
            const clientConfig: MezonClientConfig = {
              token: configService.get<string>('MEZON_TOKEN'),
            };

            const client = new ClientService(clientConfig);

            await client.initializeClient();

            return client;
          },
          inject: [ConfigService],
        },
      ],
      exports: [ClientService],
    };
  }
}
