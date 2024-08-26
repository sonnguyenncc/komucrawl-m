import { DynamicModule, Global, Module } from '@nestjs/common';
import { MezonModuleAsyncOptions } from './dtos/MezonModuleAsyncOptions';
import { ClientService } from './services/client.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MezonClientConfig } from './dtos/MezonClientConfig';

@Global()
@Module({ imports: [ConfigModule] })
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

  static forFeature(): DynamicModule {
    return {
      module: MezonModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: ClientService,
          useFactory: async (configService: ConfigService) => {
            const clientConfig: MezonClientConfig = {
              token: configService.get<string>('MEZON_TOKEN'),
            };

            const client = new ClientService(clientConfig);

            await client.initializeClient();

            client.getClient().onchannelmessage = async (mgs) => {
              console.log(mgs);
            };

            return client;
          },
          inject: [ConfigService],
        },
      ], // Add ClientService here

      exports: [ClientService],
    };
  }
}
