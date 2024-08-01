import { DynamicModule, Module } from '@nestjs/common';

import { IConfigCatClient } from 'configcat-node';

import { FeaturesService } from './features.service';

@Module({})
export class FeaturesModule {
  private static client: IConfigCatClient | undefined;

  static forFeature(): DynamicModule {
    return {
      module: FeaturesModule,
      providers: [
        {
          provide: FeaturesService,
          useFactory: () => {
            if (!FeaturesModule.client) {
              throw new Error(
                'FeaturesModule must be initialized with a ConfigCat client. Have you called FeaturesModule.forRoot()?',
              );
            }

            return new FeaturesService(FeaturesModule.client);
          },
        },
      ],
      exports: [FeaturesService],
    };
  }

  static forRoot(client: IConfigCatClient): DynamicModule {
    FeaturesModule.client = client;
    return FeaturesModule.forFeature();
  }
}
